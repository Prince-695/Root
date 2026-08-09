import { ERRORS, detectProject } from "@root/core";
import type { Command } from "commander";
import { getGlobalFlags, logVerbose } from "../global-flags.js";

/**
 * Phase 1: require Root project. Interconnection recipes arrive in Phases 5–7.
 */
export function registerAddCommand(program: Command): void {
  program
    .command("add")
    .description("Register a module into an existing Root project (full interconnection)")
    .argument(
      "<component>",
      "Component type: route | auth | model | service | middleware | controller",
    )
    .argument("[name]", "Component name (required for most types)")
    .action(
      async (component: string, name: string | undefined, _options: unknown, command: Command) => {
        const flags = getGlobalFlags(command);
        const cwd = process.cwd();
        logVerbose(flags, `add cwd=${cwd} component=${component} name=${name ?? ""}`);

        const detected = await detectProject(cwd);

        if (detected.kind === "empty-safe" || detected.kind === "foreign") {
          console.error(ERRORS.addRequiresRootProject(detected.cwd));
          process.exitCode = 1;
          return;
        }

        if (detected.kind === "root-project-invalid") {
          console.error(ERRORS.addInvalidRootJson(detected.error.message));
          process.exitCode = 1;
          return;
        }

        if (flags.dryRun) {
          console.log(
            [
              "root add — dry-run (no files written)",
              `Project: ${detected.config.projectName}`,
              `Component: ${component}${name ? ` (${name})` : ""}`,
              "",
              "Would run Interconnect Planner (Phases 4–7).",
            ].join("\n"),
          );
          return;
        }

        console.log(
          [
            "root add — Root project detected",
            `Project: ${detected.config.projectName}`,
            `Stack: ${detected.config.language} / ${detected.config.framework} / ${detected.config.orm}`,
            `Component: ${component}${name ? ` (${name})` : ""}`,
            "",
            "Module Graph interconnection arrives in Phases 4–7.",
            "Contract is valid; modify-mode is allowed.",
          ].join("\n"),
        );
      },
    );
}
