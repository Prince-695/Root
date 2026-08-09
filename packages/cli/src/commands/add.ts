import { AddAuthError, AddRouteError, ERRORS, addAuth, addRoute, detectProject } from "@root/core";
import type { Command } from "commander";
import { getGlobalFlags, logVerbose } from "../global-flags.js";

/**
 * Modify-mode entry. Phase 5–6: `add route` / `add auth` with full interconnection.
 */
export function registerAddCommand(program: Command): void {
  program
    .command("add")
    .description("Register a module into an existing Root project (full interconnection)")
    .argument(
      "<component>",
      "Component type: route | auth | model | service | middleware | controller",
    )
    .argument("[name]", "Component name (required for route)")
    .option("--skip-generate", "Skip prisma generate after ORM model updates", false)
    .action(
      async (component: string, name: string | undefined, _options: unknown, command: Command) => {
        const flags = getGlobalFlags(command);
        const local = command.opts() as { skipGenerate?: boolean };
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

        if (component === "auth") {
          try {
            const result = await addAuth({
              projectRoot: cwd,
              dryRun: flags.dryRun,
              skipGenerate: Boolean(local.skipGenerate) || flags.dryRun,
            });

            if (result.warnings.length > 0) {
              console.error(result.warnings.map((w) => `Warning: ${w}`).join("\n"));
            }

            if (flags.dryRun) {
              console.log(
                [
                  "root add auth — dry-run (no files written)",
                  `Project: ${detected.config.projectName}`,
                  `Operations: ${result.ops.length}`,
                  "",
                  ...result.ops.map((op, i) => `  ${i + 1}. ${op.type}`),
                ].join("\n"),
              );
              return;
            }

            console.log(
              [
                "root add auth — interconnected",
                `Project: ${detected.config.projectName}`,
                "Mount: /auth (signup | signin | signout)",
                `Files/ops: ${result.ops.length}`,
                "",
                "Set ACCESS_TOKEN_SECRET in .env, then:",
                '  POST /auth/signup  { "email", "password" }',
                '  POST /auth/signin  { "email", "password" }',
                "  Authorization: Bearer <token> on mutating routes",
              ].join("\n"),
            );
          } catch (error) {
            if (error instanceof AddAuthError) {
              console.error(error.message);
              process.exitCode = 1;
              return;
            }
            throw error;
          }
          return;
        }

        if (component !== "route") {
          console.error(ERRORS.addComponentNotImplemented(component));
          process.exitCode = 1;
          return;
        }

        if (!name) {
          console.error(ERRORS.addRouteRequiresName());
          process.exitCode = 1;
          return;
        }

        try {
          const result = await addRoute({
            projectRoot: cwd,
            name,
            dryRun: flags.dryRun,
            skipGenerate: Boolean(local.skipGenerate) || flags.dryRun,
          });

          if (flags.dryRun) {
            console.log(
              [
                "root add route — dry-run (no files written)",
                `Project: ${detected.config.projectName}`,
                `Route: ${result.slug}`,
                `Mount: ${result.mountPath}`,
                `Operations: ${result.ops.length}`,
                "",
                ...result.ops.map((op, i) => `  ${i + 1}. ${op.type}`),
              ].join("\n"),
            );
            return;
          }

          console.log(
            [
              "root add route — interconnected",
              `Project: ${detected.config.projectName}`,
              `Route: ${result.slug}`,
              `Mount: ${result.mountPath}`,
              `Files/ops: ${result.ops.length}`,
              "",
              `Try: GET ${result.mountPath}`,
              `     POST ${result.mountPath}  { "title": "hello" }`,
            ].join("\n"),
          );
        } catch (error) {
          if (error instanceof AddRouteError) {
            console.error(error.message);
            process.exitCode = 1;
            return;
          }
          throw error;
        }
      },
    );
}
