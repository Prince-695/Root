import { ERRORS } from "@root/core";
import type { Command } from "commander";
import { getGlobalFlags, logVerbose } from "../global-flags.js";
import { requireRootProject } from "../lib/require-root-project.js";

/**
 * Planned: safely remove a capability / module with interconnection unwind.
 */
export function registerRemoveCommand(program: Command): void {
  program
    .command("remove")
    .description("Remove a capability or module (planned)")
    .argument("<type>", "Capability or module type (e.g. resource)")
    .argument("<name>", "Name to remove")
    .addHelpText(
      "after",
      [
        "",
        "Example (planned):",
        "  $ root remove resource post",
        "",
        "Today: edit or delete files carefully, then run `root doctor` / `root diff`.",
      ].join("\n"),
    )
    .action(async (type: string, name: string, _options: unknown, command: Command) => {
      const flags = getGlobalFlags(command);
      const cwd = process.cwd();
      logVerbose(flags, `remove cwd=${cwd} type=${type} name=${name}`);

      if (!type?.trim() || !name?.trim()) {
        console.error(ERRORS.removeRequiresArgs());
        process.exitCode = 1;
        return;
      }

      const project = await requireRootProject(cwd, "remove");
      if (!project) return;

      if (flags.dryRun) {
        console.log(
          [
            "root remove — dry-run",
            `Project: ${project.config.projectName}`,
            `Would remove: ${type} ${name}`,
            "",
            "Safe interconnected remove is not implemented yet.",
          ].join("\n"),
        );
        return;
      }

      console.error(
        [
          `root remove ${type} ${name} is not implemented yet.`,
          "",
          "Interconnected remove (unwind mounts, schema, manifest) is planned.",
          "Until then, remove files carefully and run:",
          "  npx root@latest doctor",
          "  npx root@latest diff",
        ].join("\n"),
      );
      process.exitCode = 1;
    });
}
