import type { Command } from "commander";

/**
 * Phase 0 stub — integrity checks arrive in Phase 8.
 */
export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Verify Root project integrity (manifest, anchors, schema, mounts)")
    .action(async () => {
      console.log(
        [
          "root doctor — Phase 0 stub",
          "",
          "Not implemented yet. Coming in Phase 8:",
          "  • Validate root.json",
          "  • Check inject anchors, schema banners, manifest ↔ disk",
          "",
          "Primary UX when ready: pnpm dlx root@latest doctor",
        ].join("\n"),
      );
    });
}
