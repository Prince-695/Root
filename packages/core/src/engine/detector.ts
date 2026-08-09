import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  ROOT_JSON_FILENAME,
  type RootJson,
  RootJsonValidationError,
  loadRootJson,
} from "../config/root-json.js";

export type ProjectKind = "empty-safe" | "root-project" | "root-project-invalid" | "foreign";

export type DetectedProject =
  | {
      kind: "empty-safe";
      cwd: string;
      entries: string[];
    }
  | {
      kind: "root-project";
      cwd: string;
      config: RootJson;
      rootJsonPath: string;
    }
  | {
      kind: "root-project-invalid";
      cwd: string;
      rootJsonPath: string;
      error: Error;
    }
  | {
      kind: "foreign";
      cwd: string;
      entries: string[];
    };

/** Files/dirs allowed in an otherwise empty folder during create-mode init. */
export const SAFE_EMPTY_ENTRIES = new Set([
  ".git",
  ".gitignore",
  ".gitattributes",
  ".hg",
  ".svn",
  "README",
  "README.md",
  "README.txt",
  "LICENSE",
  "LICENSE.md",
  "LICENCE",
  "CHANGELOG.md",
  ".DS_Store",
  "Thumbs.db",
]);

async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export async function detectProject(cwd: string = process.cwd()): Promise<DetectedProject> {
  const absoluteCwd = path.resolve(cwd);
  const rootJsonPath = path.join(absoluteCwd, ROOT_JSON_FILENAME);
  const hasRootJson = await pathExists(rootJsonPath);

  if (hasRootJson) {
    try {
      const config = await loadRootJson(absoluteCwd);
      return {
        kind: "root-project",
        cwd: absoluteCwd,
        config,
        rootJsonPath,
      };
    } catch (error) {
      return {
        kind: "root-project-invalid",
        cwd: absoluteCwd,
        rootJsonPath,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  const entries = await readdir(absoluteCwd);
  const unsafe = entries.filter((entry) => !SAFE_EMPTY_ENTRIES.has(entry));

  if (unsafe.length === 0) {
    return {
      kind: "empty-safe",
      cwd: absoluteCwd,
      entries,
    };
  }

  return {
    kind: "foreign",
    cwd: absoluteCwd,
    entries,
  };
}

/** Read raw root.json text if present (for doctor diagnostics). */
export async function readRootJsonRaw(cwd: string): Promise<string | null> {
  const filePath = path.join(path.resolve(cwd), ROOT_JSON_FILENAME);
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export function isRootJsonValidationError(error: unknown): error is RootJsonValidationError {
  return error instanceof RootJsonValidationError;
}
