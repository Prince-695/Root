import { formatDoctorReport, runDoctor } from "@root/core";
import type { Command } from "commander";
import { getGlobalFlags, logVerbose } from "../global-flags.js";
import { requireRootProject } from "../lib/require-root-project.js";

/**
 * Sync: verify project health; future versions may rewrite drift automatically.
 */
export function registerSyncCommand(program: Command): void {
  program
    .command("sync")
    .description("Verify project wiring (auto-repair planned; runs doctor today)")
    .option("--strict", "Treat auth consistency warnings as errors", false)
    .action(async (_options: unknown, command: Command) => {
      const flags = getGlobalFlags(command);
      const local = command.opts() as { strict?: boolean };
      const cwd = process.cwd();
      logVerbose(flags, `sync cwd=${cwd}`);

      const project = await requireRootProject(cwd, "sync");
      if (!project) return;

      if (flags.dryRun) {
        console.log(
          [
            "root sync — dry-run",
            `Project: ${project.config.projectName}`,
            "",
            "Would run integrity checks (no auto-repair yet).",
          ].join("\n"),
        );
        return;
      }

      const result = await runDoctor({
        projectRoot: cwd,
        strict: Boolean(local.strict),
      });

      console.log(
        [
          "root sync",
          `Project: ${project.config.projectName}`,
          "",
          "Auto-repair is not implemented yet — reporting integrity status:",
          "",
          formatDoctorReport(result),
        ].join("\n"),
      );

      if (!result.ok) {
        process.exitCode = 1;
      }
    });
}
