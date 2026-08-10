import { mkdir } from "node:fs/promises";
import path from "node:path";
import * as p from "@clack/prompts";
import { type DetectedProject, ERRORS, detectProject } from "@root/core";
import type { GlobalFlags } from "../global-flags.js";
import { isValidFolderName } from "./folder-name.js";
import type { FolderNamePrompt } from "./prompt-folder-name.js";

export type ResolveInitTargetResult =
  | {
      ok: true;
      targetDir: string;
      projectName: string;
      createdFolder: boolean;
      adoptExisting: boolean;
      detected: Extract<DetectedProject, { kind: "empty-safe" | "adoptable-node" }>;
    }
  | {
      ok: false;
      message: string;
    };

export type ResolveInitTargetOptions = {
  cwd: string;
  /** CLI argument: `root init <name>` */
  projectNameArg?: string | undefined;
  flags: GlobalFlags;
  promptFolderName: FolderNamePrompt;
  /** When true, do not create directories on disk (still resolves paths). */
  dryRun?: boolean;
};

async function tryDetect(dir: string): Promise<DetectedProject | null> {
  try {
    return await detectProject(dir);
  } catch {
    // Directory does not exist yet.
    return null;
  }
}

/**
 * shadcn-style target resolution:
 * - prompt for folder name (unless arg / --yes)
 * - Escape / cancel → use current folder
 * - name provided → create `<cwd>/<name>` and init there
 * - existing package.json → opt-in adopt (no blind overwrite of app sources)
 */
export async function resolveInitTarget(
  options: ResolveInitTargetOptions,
): Promise<ResolveInitTargetResult> {
  const { cwd, projectNameArg, flags, promptFolderName, dryRun = false } = options;

  let folderName: string | null;

  if (projectNameArg !== undefined && projectNameArg.trim() !== "") {
    folderName = projectNameArg.trim();
  } else if (flags.yes) {
    folderName = null;
  } else {
    folderName = await promptFolderName(cwd);
  }

  if (folderName !== null && !isValidFolderName(folderName)) {
    return { ok: false, message: ERRORS.initInvalidFolderName(folderName) };
  }

  let targetDir = path.resolve(cwd);
  let createdFolder = false;

  if (folderName !== null) {
    targetDir = path.resolve(cwd, folderName);
    const existing = await tryDetect(targetDir);

    if (existing === null) {
      createdFolder = true;
      if (dryRun) {
        return {
          ok: true,
          targetDir,
          projectName: folderName,
          createdFolder: true,
          adoptExisting: false,
          detected: { kind: "empty-safe", cwd: targetDir, entries: [] },
        };
      }
      await mkdir(targetDir, { recursive: true });
    } else if (existing.kind === "adoptable-node") {
      return { ok: false, message: ERRORS.initTargetNotEmpty(targetDir) };
    } else if (existing.kind === "foreign") {
      return { ok: false, message: ERRORS.initTargetNotEmpty(targetDir) };
    } else if (existing.kind === "root-project") {
      return { ok: false, message: ERRORS.initAlreadyRootProject(targetDir) };
    } else if (existing.kind === "root-project-invalid") {
      return { ok: false, message: ERRORS.initInvalidRootJson(existing.error.message) };
    }
  }

  const detected = await detectProject(targetDir);

  if (detected.kind === "adoptable-node") {
    if (flags.yes) {
      return {
        ok: true,
        targetDir: detected.cwd,
        projectName: folderName ?? detected.cwd.split(/[\\/]/).filter(Boolean).at(-1) ?? "my-api",
        createdFolder: false,
        adoptExisting: true,
        detected,
      };
    }

    const useExisting = await p.confirm({
      message:
        "Existing package.json detected. Adopt this directory with Root (root.json only; no overwrite)?",
      initialValue: true,
    });
    if (p.isCancel(useExisting) || !useExisting) {
      return { ok: false, message: ERRORS.initForeignDirectory(detected.cwd) };
    }

    return {
      ok: true,
      targetDir: detected.cwd,
      projectName: folderName ?? detected.cwd.split(/[\\/]/).filter(Boolean).at(-1) ?? "my-api",
      createdFolder: false,
      adoptExisting: true,
      detected,
    };
  }

  if (detected.kind === "foreign") {
    return { ok: false, message: ERRORS.initForeignDirectory(detected.cwd) };
  }
  if (detected.kind === "root-project") {
    return { ok: false, message: ERRORS.initAlreadyRootProject(detected.cwd) };
  }
  if (detected.kind === "root-project-invalid") {
    return { ok: false, message: ERRORS.initInvalidRootJson(detected.error.message) };
  }

  const projectName = folderName ?? detected.cwd.split(/[\\/]/).filter(Boolean).at(-1) ?? "my-api";

  return {
    ok: true,
    targetDir: detected.cwd,
    projectName,
    createdFolder,
    adoptExisting: false,
    detected,
  };
}
