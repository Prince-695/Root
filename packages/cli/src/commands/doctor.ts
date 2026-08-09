import { ERRORS, detectProject } from "@root/core";
import type { Command } from "commander";
import { getGlobalFlags, logVerbose } from "../global-flags.js";

/**
 * Phase 1: validate root.json presence/shape. Full integrity checks arrive in Phase 8.
 */
export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Verify Root project integrity (manifest, anchors, schema, mounts)")
    .action(async (_options: unknown, command: Command) => {
      const flags = getGlobalFlags(command);
      const cwd = process.cwd();
      logVerbose(flags, `doctor cwd=${cwd}`);

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

      console.log(
        [
          "root doctor — OK (Phase 1 checks)",
          `Project: ${detected.config.projectName}`,
          `Language: ${detected.config.language}`,
          `Framework: ${detected.config.framework}`,
          `Database: ${detected.config.database}`,
          `ORM: ${detected.config.orm}`,
          `Modules: ${Object.keys(detected.config.modules).length}`,
          "",
          "root.json is valid.",
          "Deeper anchor/schema/mount checks arrive in Phase 8.",
        ].join("\n"),
      );
    });
}
