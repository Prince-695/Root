import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadRootJson, writeRootJson } from "../config/root-json.js";
import type { Operation } from "../engine/operations.js";
import { type TransactionOptions, applyOperations } from "../engine/transaction.js";
import { withProjectWriteLock } from "../engine/write-lock.js";

export class AddMonorepoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AddMonorepoError";
  }
}

export type AddMonorepoOptions = {
  projectRoot: string;
  tool?: "pnpm" | "npm" | "turborepo";
  dryRun?: boolean;
} & TransactionOptions;

export type AddMonorepoResult = {
  ops: Operation[];
  alreadyPresent: boolean;
};

/**
 * Convert / annotate a Root project as a workspace monorepo (Phase 19).
 * Keeps the existing app under packages/api when scaffolding is empty of workspaces.
 */
export async function addMonorepo(options: AddMonorepoOptions): Promise<AddMonorepoResult> {
  const { projectRoot, dryRun = false } = options;
  const tool = options.tool ?? "pnpm";
  const config = await loadRootJson(projectRoot);

  if (config.repository?.type === "monorepo" || config.modules.monorepo) {
    return { ops: [], alreadyPresent: true };
  }

  const addedAt = new Date().toISOString();
  const ops: Operation[] = [];

  if (tool === "pnpm" || tool === "turborepo") {
    ops.push({
      type: "createFile",
      path: "pnpm-workspace.yaml",
      content: `packages:\n  - "packages/*"\n`,
    });
  }

  if (tool === "turborepo") {
    ops.push({
      type: "createFile",
      path: "turbo.json",
      content: `${JSON.stringify(
        {
          $schema: "https://turbo.build/schema.json",
          tasks: {
            build: { dependsOn: ["^build"] },
            dev: { cache: false, persistent: true },
            test: {},
          },
        },
        null,
        2,
      )}\n`,
    });
  }

  ops.push({
    type: "createFile",
    path: "packages/.gitkeep",
    content: "",
  });

  ops.push({
    type: "updateManifest",
    moduleName: "monorepo",
    entry: { type: "monorepo", addedAt },
  });

  if (dryRun) {
    return { ops, alreadyPresent: false };
  }

  await withProjectWriteLock(projectRoot, async () => {
    await applyOperations(projectRoot, ops, options);
    const next = await loadRootJson(projectRoot);
    next.repository = { type: "monorepo" };
    await writeRootJson(projectRoot, next);
  });

  return { ops, alreadyPresent: false };
}

/** Ensure packages dir exists (tests / dry helpers). */
export async function ensurePackagesDir(projectRoot: string): Promise<void> {
  await mkdir(path.join(projectRoot, "packages"), { recursive: true });
  await writeFile(path.join(projectRoot, "packages/.gitkeep"), "", "utf8");
}
