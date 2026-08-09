import { spawn } from "node:child_process";
import { planInterconnect } from "../engine/interconnect-planner.js";
import { hasModule, loadModuleGraph } from "../engine/module-graph.js";
import type { Operation } from "../engine/operations.js";
import { type TransactionOptions, applyOperations } from "../engine/transaction.js";
import { WriteLockError, withProjectWriteLock } from "../engine/write-lock.js";
import {
  defaultResourceZodFields,
  resolveResourceNames,
} from "../registry/codegen/resource-files.js";
import { invalidModuleNameMessage, isValidModuleName, normalizeModuleName } from "./names.js";

export class AddRouteError extends Error {
  constructor(
    message: string,
    readonly code: "duplicate" | "invalid-name" | "apply-failed" | "locked",
  ) {
    super(message);
    this.name = "AddRouteError";
  }
}

export type AddRouteOptions = {
  projectRoot: string;
  name: string;
  dryRun?: boolean;
  /** Skip prisma generate runCommand (default false). */
  skipGenerate?: boolean;
  failAtIndex?: number;
  runCommand?: TransactionOptions["runCommand"];
  addedAt?: string;
};

async function defaultRunCommand(command: string, args: string[], cwd: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "null"}`));
      }
    });
  });
}

export type AddRouteResult = {
  ops: Operation[];
  slug: string;
  mountPath: string;
  dryRun: boolean;
};

/**
 * Plan and apply a resource route into an existing Root project.
 */
export async function addRoute(options: AddRouteOptions): Promise<AddRouteResult> {
  if (!isValidModuleName(options.name)) {
    throw new AddRouteError(invalidModuleNameMessage(options.name, "route"), "invalid-name");
  }

  const names = resolveResourceNames(normalizeModuleName(options.name));
  const graph = await loadModuleGraph(options.projectRoot);

  if (hasModule(graph, names.slug)) {
    throw new AddRouteError(
      `Module "${names.slug}" is already registered in root.json. Refusing duplicate add.`,
      "duplicate",
    );
  }

  const allowRunCommand = !options.skipGenerate && !options.dryRun;
  const ops = planInterconnect({
    recipeId: "resource",
    graph,
    resourceName: names.slug,
    fields: defaultResourceZodFields(),
    allowRunCommand,
    addedAt: options.addedAt ?? new Date().toISOString(),
  });

  if (options.dryRun) {
    return { ops, slug: names.slug, mountPath: names.mountPath, dryRun: true };
  }

  const runCommand =
    options.runCommand ??
    (async (command, args) => {
      await defaultRunCommand(command, args, options.projectRoot);
    });

  try {
    const applyOpts: Parameters<typeof applyOperations>[2] = { runCommand };
    if (options.failAtIndex !== undefined) {
      applyOpts.failAtIndex = options.failAtIndex;
    }
    await withProjectWriteLock(options.projectRoot, async () => {
      await applyOperations(options.projectRoot, ops, applyOpts);
    });
  } catch (error) {
    if (error instanceof WriteLockError) {
      throw new AddRouteError(error.message, "locked");
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new AddRouteError(`add resource failed and was rolled back: ${message}`, "apply-failed");
  }

  return { ops, slug: names.slug, mountPath: names.mountPath, dryRun: false };
}
