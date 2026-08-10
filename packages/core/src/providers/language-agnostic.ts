import { access, readdir } from "node:fs/promises";
import path from "node:path";

/** Files that must NEVER appear in Python/Go (or other non-Node) generated projects. */
export const FORBIDDEN_NODE_PROJECT_FILES = [
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "tsconfig.json",
  "node_modules",
] as const;

async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * Assert a generated non-Node project has no Node package/toolchain files.
 * Throws if the language-agnostic invariant is violated.
 */
export async function assertNoNodeProjectFiles(projectRoot: string): Promise<void> {
  const found: string[] = [];
  for (const name of FORBIDDEN_NODE_PROJECT_FILES) {
    if (await pathExists(path.join(projectRoot, name))) {
      found.push(name);
    }
  }
  if (found.length > 0) {
    throw new Error(
      [
        "Language-agnostic invariant violated: Node project files found in a non-Node project.",
        `Found: ${found.join(", ")}`,
        "Python/Go (and other non-Node) stacks must not receive package.json or node_modules.",
      ].join("\n"),
    );
  }
}

/** Shallow listing helper for tests. */
export async function listTopLevelNames(projectRoot: string): Promise<string[]> {
  return readdir(projectRoot);
}
