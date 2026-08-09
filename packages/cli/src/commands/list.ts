import { listModules, loadModuleGraph, loadRootJson } from "@root/core";
import type { Command } from "commander";
import { getGlobalFlags, logVerbose } from "../global-flags.js";
import { requireRootProject } from "../lib/require-root-project.js";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List modules registered in root.json")
    .action(async (_options: unknown, command: Command) => {
      const flags = getGlobalFlags(command);
      const cwd = process.cwd();
      logVerbose(flags, `list cwd=${cwd}`);

      const project = await requireRootProject(cwd, "list");
      if (!project) return;

      const config = await loadRootJson(cwd);
      const graph = await loadModuleGraph(cwd);
      const names = listModules(graph);

      if (names.length === 0) {
        console.log(
          [
            "root list",
            `Project: ${config.projectName}`,
            "",
            "No modules registered yet.",
            "Try: npx root@latest add resource post",
            "     npx root@latest add auth",
          ].join("\n"),
        );
        return;
      }

      const rows = names.map((name) => {
        const entry = config.modules[name];
        const type = entry?.type ?? "unknown";
        const added = entry?.addedAt ?? "—";
        return `  ${name.padEnd(20)} ${type.padEnd(12)} ${added}`;
      });

      console.log(
        [
          "root list",
          `Project: ${config.projectName}`,
          `Modules: ${names.length}`,
          "",
          `  ${"NAME".padEnd(20)} ${"TYPE".padEnd(12)} ADDED`,
          ...rows,
        ].join("\n"),
      );
    });
}
