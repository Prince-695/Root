import * as p from "@clack/prompts";
import { addAuth, adoptExistingProject, structureizeProject } from "@root/core";
import type { Command } from "commander";
import { getGlobalFlags, logVerbose } from "../global-flags.js";
import {
  type PackageManager,
  installDependencies,
  installNativeDependencies,
} from "../init/install.js";
import { buildInitNextSteps } from "../init/next-steps.js";
import { promptFolderName } from "../init/prompt-folder-name.js";
import { resolveInitTarget } from "../init/resolve-target.js";
import { resolveInitAnswers } from "../init/wizard.js";

/**
 * Init: folder resolve → wizard → structureize (or adopt existing package.json).
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

        const { targetDir, projectName: name, createdFolder, detected, adoptExisting } = resolved;
        logVerbose(
          flags,
          `targetDir=${targetDir} createdFolder=${createdFolder} adopt=${adoptExisting} entries=${detected.entries.length}`,
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
              adoptExisting
                ? "Mode: adopt existing package.json (root.json only)"
                : "Mode: full structureize",
              `Stack: ${answers.language} / ${answers.framework} / ${answers.database} / ${answers.orm}`,
              `Package manager: ${answers.packageManager}`,
              "",
              "Re-run without --dry-run to generate.",
            ].join("\n"),
          );
          return;
        }

        const spinner = p.spinner();
        spinner.start(
          adoptExisting
            ? "Adopting project (writing root.json)..."
            : "Generating project structure...",
        );
        const started = Date.now();

        try {
          const result = adoptExisting
            ? await adoptExistingProject({ targetDir, answers })
            : await structureizeProject({ targetDir, answers });

          let authOps = 0;
          if (!adoptExisting && answers.auth === "jwt" && isNodeLanguage(answers.language)) {
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
            `${adoptExisting ? "Adopted" : "Generated"} ${result.filesWritten.length} files${authOps > 0 ? ` + auth (${authOps} ops)` : ""} in ${elapsedMs}ms`,
          );

          let installed = false;
          if (!options.skipInstall && !adoptExisting) {
            if (isNodeLanguage(answers.language)) {
              const pm = answers.packageManager as PackageManager;
              const installSpinner = p.spinner();
              installSpinner.start(`Installing dependencies with ${pm}...`);
              try {
                await installDependencies(targetDir, pm, { orm: answers.orm });
                installSpinner.stop("Dependencies installed");
                installed = true;
              } catch (error) {
                installSpinner.stop("Dependency install failed");
                const message = error instanceof Error ? error.message : String(error);
                console.error(message);
                console.error("You can install manually inside the project folder.");
              }
            } else if (answers.language === "python" || answers.language === "go") {
              const tool =
                answers.language === "go"
                  ? "go mod"
                  : answers.packageManager === "uv"
                    ? "uv"
                    : "pip";
              const installSpinner = p.spinner();
              installSpinner.start(`Installing dependencies with ${tool}...`);
              try {
                await installNativeDependencies(targetDir, answers);
                installSpinner.stop("Dependencies installed");
                installed = true;
              } catch (error) {
                installSpinner.stop("Dependency install failed (install manually)");
                const message = error instanceof Error ? error.message : String(error);
                console.error(message);
              }
            }
          }

          p.outro(
            buildInitNextSteps({
              targetDir,
              answers,
              adoptExisting,
              skipInstall: Boolean(options.skipInstall),
              installed,
            }),
          );
        } catch (error) {
          spinner.stop(adoptExisting ? "Adopt failed" : "Generation failed");
          const message = error instanceof Error ? error.message : String(error);
          console.error(message);
          process.exitCode = 1;
        }
      },
    );
}

function isNodeLanguage(language: string): boolean {
  return language === "typescript" || language === "javascript";
}
