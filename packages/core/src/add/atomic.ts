import { spawn } from "node:child_process";
import { planInterconnect } from "../engine/interconnect-planner.js";
import { hasModule, loadModuleGraph } from "../engine/module-graph.js";
import type { Operation } from "../engine/operations.js";
import { type TransactionOptions, applyOperations } from "../engine/transaction.js";
import { resolveResourceNames } from "../registry/codegen/resource-files.js";
import type { RecipeId } from "../registry/index.js";
import { invalidModuleNameMessage, isValidModuleName, normalizeModuleName } from "./names.js";

export type AtomicKind = "model" | "service" | "middleware" | "controller";

export class AddAtomicError extends Error {
  constructor(
    message: string,
    readonly code: "duplicate" | "invalid-name" | "apply-failed",
  ) {
    super(message);
    this.name = "AddAtomicError";
  }
}

export type AddAtomicOptions = {
  projectRoot: string;
  kind: AtomicKind;
  name: string;
  dryRun?: boolean;
  skipGenerate?: boolean;
  failAtIndex?: number;
  runCommand?: TransactionOptions["runCommand"];
  addedAt?: string;
};

export type AddAtomicResult = {
  ops: Operation[];
  slug: string;
  kind: AtomicKind;
  dryRun: boolean;
  warnings: string[];
};

const RECIPE_BY_KIND: Record<AtomicKind, RecipeId> = {
  model: "model",
  service: "service",
  middleware: "middleware",
  controller: "controller",
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
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "null"}`));
    });
  });
}

function warningsFor(
  kind: AtomicKind,
  slug: string,
  graphModules: Record<string, { type: string }>,
): string[] {
  const warnings: string[] = [];
  if (kind === "service") {
    warnings.push(
      `Service "${slug}" is not wired to HTTP yet. Add a controller/route (or use \`add route ${slug}\`) to expose it.`,
    );
  }
  if (kind === "controller") {
    const hasRoute = Object.entries(graphModules).some(
      ([name, mod]) => name === slug && mod.type === "resource",
    );
    if (!hasRoute) {
      warnings.push(
        `Controller "${slug}" has no matching route module. Create \`add route ${slug}\` (or a route file) to mount handlers.`,
      );
    }
  }
  if (kind === "middleware") {
    warnings.push(
      `Middleware "${slug}" is not mounted yet. Import and use it on a router or in server.ts.`,
    );
  }
  if (kind === "model") {
    warnings.push(
      `Model "${slug}" updates schema/ORM only — no HTTP surface. Use \`add route ${slug}\` for a full resource.`,
    );
  }
  return warnings;
}

/**
 * Plan and apply an atomic component (model / service / middleware / controller).
 */
export async function addAtomic(options: AddAtomicOptions): Promise<AddAtomicResult> {
  if (!isValidModuleName(options.name)) {
    throw new AddAtomicError(invalidModuleNameMessage(options.name, options.kind), "invalid-name");
  }

  const slug = normalizeModuleName(options.name);
  const names = resolveResourceNames(slug);
  const graph = await loadModuleGraph(options.projectRoot);

  if (hasModule(graph, names.slug)) {
    throw new AddAtomicError(
      `Module "${names.slug}" is already registered in root.json. Refusing duplicate add.`,
      "duplicate",
    );
  }

  const allowRunCommand = !options.skipGenerate && !options.dryRun;
  const ops = planInterconnect({
    recipeId: RECIPE_BY_KIND[options.kind],
    graph,
    resourceName: names.slug,
    allowRunCommand,
    addedAt: options.addedAt ?? new Date().toISOString(),
  });

  const warnings = warningsFor(options.kind, names.slug, graph.config.modules);

  if (options.dryRun) {
    return { ops, slug: names.slug, kind: options.kind, dryRun: true, warnings };
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
    await applyOperations(options.projectRoot, ops, applyOpts);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AddAtomicError(
      `add ${options.kind} failed and was rolled back: ${message}`,
      "apply-failed",
    );
  }

  return { ops, slug: names.slug, kind: options.kind, dryRun: false, warnings };
}

export const addModel = (opts: Omit<AddAtomicOptions, "kind">) =>
  addAtomic({ ...opts, kind: "model" });
export const addService = (opts: Omit<AddAtomicOptions, "kind">) =>
  addAtomic({ ...opts, kind: "service" });
export const addMiddleware = (opts: Omit<AddAtomicOptions, "kind">) =>
  addAtomic({ ...opts, kind: "middleware" });
export const addController = (opts: Omit<AddAtomicOptions, "kind">) =>
  addAtomic({ ...opts, kind: "controller" });
