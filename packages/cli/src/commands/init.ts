import * as p from "@clack/prompts";
import { addAuth, structureizeProject } from "@root/core";
import type { Command } from "commander";
import { getGlobalFlags, logVerbose } from "../global-flags.js";
import { detectPackageManager, installDependencies } from "../init/install.js";
import { promptFolderName } from "../init/prompt-folder-name.js";
import { resolveInitTarget } from "../init/resolve-target.js";
import { resolveInitAnswers } from "../init/wizard.js";

/**
 * Phase 2: folder resolve → wizard → structureize Express TS golden path.
 */
export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description(
      "Structureize a backend (asks for folder name; Escape = current folder — like shadcn)",
    )
    .argument("[project-name]", "Folder name to create under the current directory (skips prompt)")
    .option("--skip-install", "Skip dependency installation", false)
    .action(
      async (
        projectName: string | undefined,
        options: { skipInstall?: boolean },
        command: Command,
      ) => {
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

        const answers = await resolveInitAnswers(name, flags.yes);
        if (!answers) {
          process.exitCode = 1;
          return;
        }

        if (flags.dryRun) {
          console.log(
            [
              "root init — dry-run (no files written)",
              `Target: ${targetDir}`,
              createdFolder ? "Would create folder: yes" : "Would create folder: no",
              `Stack: ${answers.language} / ${answers.framework} / ${answers.database} / ${answers.orm}`,
              "Files: Express layered template (~20 files) + root.json",
              "",
              "Re-run without --dry-run to generate.",
            ].join("\n"),
          );
          return;
        }

        const spinner = p.spinner();
        spinner.start("Generating project structure...");
        const started = Date.now();

        try {
          const result = await structureizeProject({ targetDir, answers });
          let authOps = 0;
          if (answers.auth === "jwt") {
            const authResult = await addAuth({
              projectRoot: targetDir,
              skipGenerate: true,
              runCommand: async () => {},
            });
            authOps = authResult.ops.length;
            for (const warning of authResult.warnings) {
              console.error(`Warning: ${warning}`);
            }
          }
          const elapsedMs = Date.now() - started;
          spinner.stop(
            `Generated ${result.filesWritten.length} files${authOps > 0 ? ` + auth (${authOps} ops)` : ""} in ${elapsedMs}ms`,
          );

          if (!options.skipInstall) {
            const pm = await detectPackageManager(cwd);
            const installSpinner = p.spinner();
            installSpinner.start(`Installing dependencies with ${pm}...`);
            try {
              await installDependencies(targetDir, pm, { orm: answers.orm });
              installSpinner.stop("Dependencies installed");
            } catch (error) {
              installSpinner.stop("Dependency install failed");
              const message = error instanceof Error ? error.message : String(error);
              console.error(message);
              console.error("You can install manually inside the project folder.");
            }
          }

          p.outro(
            [
              `Project ready at ${targetDir}`,
              "",
              "Next steps:",
              `  cd ${targetDir}`,
              "  cp .env.example .env",
              answers.docker ? "  docker compose up -d" : undefined,
              options.skipInstall ? "  pnpm install && pnpm prisma:generate" : undefined,
              "  pnpm dev",
              "",
              "Then:",
              answers.auth === "jwt" ? undefined : "  npx root@latest add auth",
              "  npx root@latest add resource post",
            ]
              .filter((line): line is string => line !== undefined)
              .join("\n"),
          );
        } catch (error) {
          spinner.stop("Generation failed");
          const message = error instanceof Error ? error.message : String(error);
          console.error(message);
          process.exitCode = 1;
        }
      },
    );
}
