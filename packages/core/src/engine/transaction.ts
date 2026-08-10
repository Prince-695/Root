import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  type RootJson,
  loadRootJson,
  serializeRootJson,
  writeRootJson,
} from "../config/root-json.js";
import {
  ensureAccessTokenEnv,
  ensureAccessTokenInEnvTs,
  ensureAuthReadmeSection,
} from "../mutators/env-config.js";
import {
  InjectSyntaxError,
  addImport,
  applyAnchorPatch,
  validateSyntax,
} from "../mutators/file-injector.js";
import {
  appendDrizzleTable,
  appendPrismaModel,
  buildMongooseModelFile,
} from "../mutators/orm-registry.js";
import { appendResourceSchema, writeAuthSchemas } from "../mutators/schema-registry.js";
import { sourceExtension } from "../providers/language.js";
import type { Operation } from "./operations.js";

type JournalEntry =
  | { kind: "write"; path: string; previous: string | null }
  | { kind: "manifest"; previous: string };

export type TransactionOptions = {
  projectRoot: string;
  /** When set, throws before applying this 0-based operation index (tests). */
  failAtIndex?: number;
  /** Optional handler for runCommand ops (default: no-op success). */
  runCommand?: (command: string, args: string[]) => Promise<void>;
  dryRun?: boolean;
};

export class TransactionError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "TransactionError";
  }
}

async function readMaybe(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export class Transaction {
  private readonly journal: JournalEntry[] = [];
  private readonly projectRoot: string;
  private readonly failAtIndex: number | undefined;
  private readonly runCommand: TransactionOptions["runCommand"];
  private readonly dryRun: boolean;
  private committed = false;

  constructor(options: TransactionOptions) {
    this.projectRoot = options.projectRoot;
    this.failAtIndex = options.failAtIndex;
    this.runCommand = options.runCommand;
    this.dryRun = options.dryRun ?? false;
  }

  private abs(rel: string): string {
    return path.join(this.projectRoot, rel);
  }

  private async backupWrite(rel: string): Promise<void> {
    const abs = this.abs(rel);
    const previous = await readMaybe(abs);
    this.journal.push({ kind: "write", path: rel, previous });
  }

  private async writeTracked(rel: string, content: string): Promise<void> {
    if (/\.(?:[cm]?[jt]s|tsx)$/.test(rel)) {
      validateSyntax(content, rel);
    }
    await this.backupWrite(rel);
    if (this.dryRun) {
      return;
    }
    await mkdir(path.dirname(this.abs(rel)), { recursive: true });
    await writeFile(this.abs(rel), content, "utf8");
  }

  private async applyOne(op: Operation): Promise<void> {
    switch (op.type) {
      case "createFile": {
        await this.writeTracked(op.path, op.content);
        return;
      }
      case "patchFile": {
        const abs = this.abs(op.path);
        const current = await readFile(abs, "utf8");
        let next: string;
        if (op.kind === "anchor") {
          next = applyAnchorPatch(current, op.anchor, op.insertion, op.skipIfContains, op.path);
        } else {
          const importOpts: Parameters<typeof addImport>[1] = {
            source: op.source,
            specifiers: op.specifiers,
          };
          if (op.isDefault !== undefined) {
            importOpts.isDefault = op.isDefault;
          }
          const result = addImport(current, importOpts);
          next = result.content;
        }
        if (next === current) {
          return;
        }
        await this.writeTracked(op.path, next);
        return;
      }
      case "updateSchema": {
        const config = await loadRootJson(this.projectRoot);
        const schemaRel = config.aliases.schema;
        const current = await readFile(this.abs(schemaRel), "utf8");
        const next =
          op.kind === "auth"
            ? writeAuthSchemas(current)
            : appendResourceSchema(current, op.resourceName, op.fields);
        if (next === current) {
          return;
        }
        await this.writeTracked(schemaRel, next);
        return;
      }
      case "updateManifest": {
        const config = await loadRootJson(this.projectRoot);
        const previous = serializeRootJson(config);
        this.journal.push({ kind: "manifest", previous });
        const next: RootJson = {
          ...config,
          auth: op.moduleName === "auth" ? "jwt" : config.auth,
          modules: {
            ...config.modules,
            [op.moduleName]: op.entry,
          },
        };
        if (!this.dryRun) {
          await writeRootJson(this.projectRoot, next);
        }
        return;
      }
      case "ensureText": {
        const current = (await readMaybe(this.abs(op.path))) ?? "";
        if (current.includes(op.skipIfContains)) {
          return;
        }
        let next: string;
        switch (op.transform) {
          case "access-token-env":
            next = ensureAccessTokenEnv(current);
            break;
          case "access-token-env-ts":
            next = ensureAccessTokenInEnvTs(
              current.length > 0 ? current : "const envSchema = z.object({\n});\n",
            );
            break;
          case "auth-readme":
            next = ensureAuthReadmeSection(current.length > 0 ? current : "# App\n");
            break;
          default: {
            const _exhaustive: never = op.transform;
            throw new TransactionError(`Unknown ensureText transform: ${_exhaustive}`);
          }
        }
        if (next === current) {
          return;
        }
        await this.writeTracked(op.path, next);
        return;
      }
      case "ensureDependency": {
        const pkgRel = "package.json";
        const abs = this.abs(pkgRel);
        const raw = await readFile(abs, "utf8");
        const pkg = JSON.parse(raw) as {
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        };
        const bucket = op.dev ? "devDependencies" : "dependencies";
        const current = pkg[bucket] ?? {};
        if (current[op.name] === op.version) {
          return;
        }
        pkg[bucket] = { ...current, [op.name]: op.version };
        const next = `${JSON.stringify(pkg, null, 2)}\n`;
        await this.writeTracked(pkgRel, next);
        return;
      }
      case "ensurePythonDependency": {
        const reqRel = "requirements.txt";
        const reqCurrent = (await readMaybe(this.abs(reqRel))) ?? "";
        if (!reqCurrent.includes(op.name)) {
          const nextReq = `${reqCurrent.replace(/\s*$/, "")}\n${op.spec}\n`;
          await this.writeTracked(reqRel, nextReq.startsWith("\n") ? nextReq.slice(1) : nextReq);
        }
        const pyRel = "pyproject.toml";
        const pyCurrent = await readMaybe(this.abs(pyRel));
        if (pyCurrent && !pyCurrent.includes(`"${op.name}`) && !pyCurrent.includes(`"${op.spec}`)) {
          // Insert into dependencies = [ ... ] list before closing ]
          const marker = "dependencies = [";
          const idx = pyCurrent.indexOf(marker);
          if (idx !== -1) {
            const after = pyCurrent.indexOf("]", idx);
            if (after !== -1) {
              const insert = `\n  "${op.spec}",`;
              const nextPy = `${pyCurrent.slice(0, after)}${insert}\n${pyCurrent.slice(after)}`;
              await this.writeTracked(pyRel, nextPy);
            }
          }
        }
        return;
      }
      case "ensureGoModule": {
        const modRel = "go.mod";
        const current = (await readMaybe(this.abs(modRel))) ?? "";
        if (current.includes(op.path)) {
          return;
        }
        const requireBlock = `\nrequire ${op.path} ${op.version}\n`;
        const next = current.endsWith("\n")
          ? `${current}${requireBlock.trimStart()}`
          : `${current}\n${requireBlock.trimStart()}`;
        await this.writeTracked(modRel, next);
        return;
      }
      case "runCommand": {
        if (this.dryRun) {
          return;
        }
        if (this.runCommand) {
          await this.runCommand(op.command, op.args);
        }
        return;
      }
      case "updateOrm": {
        const config = await loadRootJson(this.projectRoot);
        const ext = sourceExtension(config);
        if (op.kind === "prisma-model") {
          const rel = "prisma/schema.prisma";
          const current = await readFile(this.abs(rel), "utf8");
          const next = appendPrismaModel(current, op.resourceName, op.fields);
          if (next !== current) {
            await this.writeTracked(rel, next);
          }
          return;
        }
        if (op.kind === "drizzle-table") {
          const rel = `src/db/schema.${ext}`;
          const current = await readFile(this.abs(rel), "utf8");
          const next = appendDrizzleTable(current, op.resourceName, op.fields, config.database);
          if (next !== current) {
            await this.writeTracked(rel, next);
          }
          return;
        }
        // mongoose-model
        const rel = `src/models/${op.resourceName}.model.${ext}`;
        const existing = await readMaybe(this.abs(rel));
        if (existing) {
          return;
        }
        await this.writeTracked(rel, buildMongooseModelFile(op.resourceName, op.fields));
        return;
      }
      default: {
        const _exhaustive: never = op;
        throw new TransactionError(`Unknown operation: ${JSON.stringify(_exhaustive)}`);
      }
    }
  }

  async apply(ops: Operation[]): Promise<void> {
    try {
      for (let i = 0; i < ops.length; i += 1) {
        if (this.failAtIndex === i) {
          throw new TransactionError(`Injected failure at operation index ${i}`);
        }
        const op = ops[i];
        if (!op) {
          continue;
        }
        await this.applyOne(op);
      }
      this.committed = true;
    } catch (error) {
      await this.rollback();
      if (error instanceof InjectSyntaxError || error instanceof TransactionError) {
        throw error;
      }
      throw new TransactionError(error instanceof Error ? error.message : String(error), error);
    }
  }

  async rollback(): Promise<void> {
    if (this.committed || this.dryRun) {
      return;
    }

    for (const entry of [...this.journal].reverse()) {
      if (entry.kind === "manifest") {
        await writeFile(this.abs("root.json"), entry.previous, "utf8");
        continue;
      }
      const abs = this.abs(entry.path);
      if (entry.previous === null) {
        await rm(abs, { force: true });
      } else {
        await mkdir(path.dirname(abs), { recursive: true });
        await writeFile(abs, entry.previous, "utf8");
      }
    }
    this.journal.length = 0;
  }
}

export async function applyOperations(
  projectRoot: string,
  ops: Operation[],
  options: Omit<TransactionOptions, "projectRoot"> = {},
): Promise<void> {
  const tx = new Transaction({ projectRoot, ...options });
  await tx.apply(ops);
}
