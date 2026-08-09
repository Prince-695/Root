import { formatDoctorReport, runDoctor } from "@root/core";
import type { Command } from "commander";
import { getGlobalFlags, logVerbose } from "../global-flags.js";
import { requireRootProject } from "../lib/require-root-project.js";

/**
 * Show drift between root.json expectations and the filesystem.
 * Uses doctor checks under a capability-oriented name.
 */
export function registerDiffCommand(program: Command): void {
  program
    .command("diff")
    .description("Show drift between root.json and files on disk")
    .option("--strict", "Treat auth consistency warnings as errors", false)
    .action(async (_options: unknown, command: Command) => {
      const flags = getGlobalFlags(command);
      const local = command.opts() as { strict?: boolean };
      const cwd = process.cwd();
      logVerbose(flags, `diff cwd=${cwd}`);

      const project = await requireRootProject(cwd, "diff");
      if (!project) return;

      const result = await runDoctor({
        projectRoot: cwd,
        strict: Boolean(local.strict),
      });

      if (result.issues.length === 0) {
        console.log(
          [
            "root diff",
            `Project: ${project.config.projectName}`,
            "",
            "No drift detected. Manifest and files look aligned.",
          ].join("\n"),
        );
        return;
      }

      const header = [
        "root diff",
        `Project: ${project.config.projectName}`,
        `Issues: ${result.issues.length}`,
        "",
      ];
      const body = formatDoctorReport(result)
        .split("\n")
        .filter((line) => line.startsWith("  "));
      console.log([...header, ...body].join("\n"));
      if (!result.ok) {
        process.exitCode = 1;
      }
    });
}
