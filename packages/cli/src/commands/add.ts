import type { Command } from "commander";

/**
 * Phase 0 stub — interconnection engine + recipes arrive in Phases 4–7.
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
    .action(async (component: string, name: string | undefined) => {
      console.log(
        [
          "root add — Phase 0 stub",
          `Component: ${component}${name ? ` (${name})` : ""}`,
          "",
          "Not implemented yet. Coming in Phases 5–7:",
          "  • Module Graph + Interconnect Planner",
          "  • Schema / server / DB / auth wiring in one transaction",
          "",
          "Primary UX when ready: pnpm dlx root@latest add route post",
        ].join("\n"),
      );
    });
}
