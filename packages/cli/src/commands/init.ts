import type { Command } from "commander";

/**
 * Phase 0 stub — full wizard + structureizer arrives in Phase 2.
 */
export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Structureize a backend from an empty folder (interactive wizard)")
    .argument("[project-name]", "Optional project name (defaults to folder name)")
    .action(async (projectName: string | undefined) => {
      const target = projectName ?? "(current directory)";
      console.log(
        [
          "root init — Phase 0 stub",
          `Target: ${target}`,
          "",
          "Not implemented yet. Coming in Phase 2:",
          "  • Interactive wizard (stack, DB, ORM, auth, testing, Docker)",
          "  • Empty-folder structureizer for Express + TypeScript",
          "",
          "Primary UX when ready: pnpm dlx root@latest init",
        ].join("\n"),
      );
    });
}
