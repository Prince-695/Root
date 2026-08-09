import { ERRORS, detectProject, formatDoctorReport, runDoctor } from "@root/core";
import type { Command } from "commander";
import { getGlobalFlags, logVerbose } from "../global-flags.js";

/**
 * Phase 8: full integrity checks (manifest, aliases, anchors, schema, mounts, auth).
 */
export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Verify Root project integrity (manifest, anchors, schema, mounts)")
    .option("--strict", "Treat auth consistency warnings as errors", false)
    .action(async (_options: unknown, command: Command) => {
      const flags = getGlobalFlags(command);
      const local = command.opts() as { strict?: boolean };
      const cwd = process.cwd();
      logVerbose(flags, `doctor cwd=${cwd} strict=${Boolean(local.strict)}`);

      const detected = await detectProject(cwd);

      if (detected.kind === "empty-safe" || detected.kind === "foreign") {
        console.error(ERRORS.doctorNotRootProject(detected.cwd));
        process.exitCode = 1;
        return;
      }

      if (detected.kind === "root-project-invalid") {
        console.error("root doctor — FAILED\n");
        console.error(detected.error.message);
        process.exitCode = 1;
        return;
      }

      const result = await runDoctor({
        projectRoot: cwd,
        strict: Boolean(local.strict),
      });

      if (flags.verbose) {
        console.error(
          `[verbose] doctor checksPassed=${result.checksPassed} issues=${result.issues.length}`,
        );
      }

      const report = formatDoctorReport(result);
      if (result.ok) {
        console.log(report);
      } else {
        console.error(report);
        process.exitCode = 1;
      }
    });
}
