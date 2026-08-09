import type { Command } from "commander";
import { getGlobalFlags, logVerbose } from "../global-flags.js";
import { promptFolderName } from "../init/prompt-folder-name.js";
import { resolveInitTarget } from "../init/resolve-target.js";

/**
 * Phase 1+: shadcn-style folder prompt + detection.
 * Full wizard/structureizer arrives in Phase 2.
 */
export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description(
      "Structureize a backend (asks for folder name; Escape = current folder — like shadcn)",
    )
    .argument("[project-name]", "Folder name to create under the current directory (skips prompt)")
    .action(async (projectName: string | undefined, _options: unknown, command: Command) => {
      const flags = getGlobalFlags(command);
      const cwd = process.cwd();
      logVerbose(flags, `init cwd=${cwd} dryRun=${flags.dryRun} yes=${flags.yes}`);

      const resolved = await resolveInitTarget({
        cwd,
        projectNameArg: projectName,
        flags,
        promptFolderName,
        dryRun: flags.dryRun,
      });

      if (!resolved.ok) {
        console.error(resolved.message);
        process.exitCode = 1;
        return;
      }

      const { targetDir, projectName: name, createdFolder, detected } = resolved;
      logVerbose(
        flags,
        `targetDir=${targetDir} createdFolder=${createdFolder} entries=${detected.entries.length}`,
      );

      if (flags.dryRun) {
        console.log(
          [
            "root init — dry-run (no files written)",
            `Target: ${targetDir}`,
            createdFolder ? "Would create folder: yes" : "Would create folder: no",
            `Detected: empty-safe (${detected.entries.length} safe entries)`,
            `Project name: ${name}`,
            "",
            "Would run interactive wizard + structureizer (Phase 2).",
          ].join("\n"),
        );
        return;
      }

      console.log(
        [
          "root init — ready for structureizer",
          `Target: ${targetDir}`,
          createdFolder ? "Created folder: yes" : "Created folder: no",
          "Detected: empty-safe directory",
          `Project name: ${name}`,
          flags.verbose ? `Safe entries: ${detected.entries.join(", ") || "(none)"}` : undefined,
          "",
          "Wizard + Express TypeScript generation arrives in Phase 2.",
          "This directory is safe to initialize.",
          "",
          "Primary UX: pnpm dlx root@latest init",
          "  → enter a folder name to create it here, or press Escape to use the current folder",
        ]
          .filter((line): line is string => line !== undefined)
          .join("\n"),
      );
    });
}
