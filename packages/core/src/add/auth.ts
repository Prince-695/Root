import { spawn } from "node:child_process";
import { planInterconnect } from "../engine/interconnect-planner.js";
import { hasModule, loadModuleGraph } from "../engine/module-graph.js";
import type { Operation } from "../engine/operations.js";
import { type TransactionOptions, applyOperations } from "../engine/transaction.js";
import { WriteLockError, withProjectWriteLock } from "../engine/write-lock.js";
import { planAuthRetrofit } from "../mutators/auth-retrofit.js";

export class AddAuthError extends Error {
  constructor(
    message: string,
    readonly code: "duplicate" | "apply-failed" | "locked",
  ) {
    super(message);
    this.name = "AddAuthError";
  }
}

export type AddAuthOptions = {
  projectRoot: string;
  dryRun?: boolean;
  skipGenerate?: boolean;
  failAtIndex?: number;
  runCommand?: TransactionOptions["runCommand"];
  addedAt?: string;
  /** When false, skip retrofit of pre-existing resources (default true). */
  retrofit?: boolean;
};

export type AddAuthResult = {
  ops: Operation[];
  dryRun: boolean;
  warnings: string[];
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

/**
 * Plan and apply JWT auth into an existing Root project.
 * If resources already exist, retrofit them (order-independence B).
 */
export async function addAuth(options: AddAuthOptions): Promise<AddAuthResult> {
  const graph = await loadModuleGraph(options.projectRoot);

  if (hasModule(graph, "auth")) {
    throw new AddAuthError(
      `Module "auth" is already registered in root.json. Refusing duplicate add.`,
      "duplicate",
    );
  }

  const allowRunCommand = !options.skipGenerate && !options.dryRun;
  const ops = planInterconnect({
    recipeId: "auth",
    graph,
    allowRunCommand,
    addedAt: options.addedAt ?? new Date().toISOString(),
  });

  let warnings: string[] = [];
  if (options.retrofit !== false) {
    const retrofit = await planAuthRetrofit(options.projectRoot, graph.config);
    warnings = retrofit.warnings;
    ops.push(...retrofit.ops);
    if (allowRunCommand && retrofit.ops.some((op) => op.type === "updateOrm")) {
      // prisma generate may already be in auth ops; ensure one run after retrofit models
      if (!ops.some((op) => op.type === "runCommand")) {
        ops.push({
          type: "runCommand",
          command: "pnpm",
          args: ["exec", "prisma", "generate"],
        });
      }
    }
  }

  if (options.dryRun) {
    return { ops, dryRun: true, warnings };
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
      throw new AddAuthError(error.message, "locked");
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new AddAuthError(`add auth failed and was rolled back: ${message}`, "apply-failed");
  }

  return { ops, dryRun: false, warnings };
}
