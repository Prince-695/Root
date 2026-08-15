import {
  AddAtomicError,
  AddAuthError,
  AddCapabilityError,
  AddInfraError,
  AddMonorepoError,
  AddRouteError,
  type CapabilityKind,
  ERRORS,
  type InfraKind,
  addAtomic,
  addAuth,
  addCapability,
  addInfra,
  addMonorepo,
  addRoute,
  formatOperationPlan,
  rootInvoke,
  rootInvokeAll,
} from "@root/core";
import type { Command } from "commander";
import { getGlobalFlags, logVerbose } from "../global-flags.js";
import { requireRootProject } from "../lib/require-root-project.js";

/** Public capability surface (backend capabilities, not MVC file kinds). */
const READY_CAPABILITIES = new Set([
  "resource",
  "auth",
  "middleware",
  "service",
  "cache",
  "queue",
  "storage",
  "websocket",
  "logging",
  "health",
  "rate-limit",
  "docker",
  "github-actions",
  "kubernetes",
  "monorepo",
]);

const INFRA_CAPABILITIES = new Set<InfraKind>(["docker", "github-actions", "kubernetes"]);

const LIB_CAPABILITIES = new Set<CapabilityKind>([
  "cache",
  "queue",
  "storage",
  "websocket",
  "logging",
  "health",
  "rate-limit",
]);

const PLANNED_CAPABILITIES = new Set(["database", "job", "event", "module"]);

/** Hidden aliases → public capability (kept for one release). */
const ALIASES: Record<string, string> = {
  route: "resource",
  "github-action": "github-actions",
  gha: "github-actions",
  k8s: "kubernetes",
};

/**
 * `root add <capability> [name]` — capability-oriented interconnection.
 */
export function registerAddCommand(program: Command): void {
  program
    .command("add")
    .description("Add a backend capability with full interconnection")
    .argument(
      "<capability>",
      "resource | auth | cache | queue | storage | websocket | logging | docker | …",
    )
    .argument("[name]", "Name or type argument (required except for auth / infra)")
    .option("--skip-generate", "Skip prisma generate after ORM updates", false)
    .addHelpText(
      "after",
      [
        "",
        "Examples:",
        "  $ root add auth",
        "  $ root add resource post",
        "  $ root add cache redis",
        "  $ root add docker",
        "  $ root add github-actions",
        "  $ root add kubernetes",
        "",
        "Runners:",
        `  ${rootInvoke("add resource post")}`,
        `  ${rootInvokeAll("add auth")[1]}`,
      ].join("\n"),
    )
    .action(
      async (
        capabilityArg: string,
        name: string | undefined,
        _options: unknown,
        command: Command,
      ) => {
        const flags = getGlobalFlags(command);
        const local = command.opts() as { skipGenerate?: boolean };
        const cwd = process.cwd();

        let capability = capabilityArg.toLowerCase();
        const aliasTarget = ALIASES[capability];
        if (aliasTarget) {
          console.error(
            `Note: "add ${capability}" is now "add ${aliasTarget}". Using ${aliasTarget}.`,
          );
          capability = aliasTarget;
        }

        logVerbose(flags, `add cwd=${cwd} capability=${capability} name=${name ?? ""}`);

        const project = await requireRootProject(cwd, "add");
        if (!project) return;

        if (PLANNED_CAPABILITIES.has(capability)) {
          console.error(ERRORS.addCapabilityNotImplemented(capability));
          process.exitCode = 1;
          return;
        }

        if (!READY_CAPABILITIES.has(capability)) {
          console.error(ERRORS.addUnknownCapability(capability));
          process.exitCode = 1;
          return;
        }

        if (capability === "monorepo") {
          try {
            const result = await addMonorepo({
              projectRoot: cwd,
              dryRun: flags.dryRun,
              tool: "pnpm",
            });
            if (result.alreadyPresent) {
              console.log("✓ monorepo already configured.");
              return;
            }
            if (flags.dryRun) {
              console.log(
                [
                  "root add monorepo — dry-run",
                  ...formatOperationPlan(result.ops).map((line) => `  ${line}`),
                ].join("\n"),
              );
              return;
            }
            console.log(`root add monorepo — configured (${result.ops.length} ops)`);
          } catch (error) {
            if (error instanceof AddMonorepoError) {
              console.error(error.message);
              process.exitCode = 1;
              return;
            }
            throw error;
          }
          return;
        }

        if (INFRA_CAPABILITIES.has(capability as InfraKind)) {
          await runAddInfra(project.config.projectName, cwd, capability as InfraKind, flags.dryRun);
          return;
        }

        if (LIB_CAPABILITIES.has(capability as CapabilityKind)) {
          await runAddCapability(
            project.config.projectName,
            cwd,
            capability as CapabilityKind,
            name,
            flags.dryRun,
          );
          return;
        }

        if (capability === "auth") {
          await runAddAuth(project.config.projectName, cwd, flags.dryRun, local.skipGenerate);
          return;
        }

        if (capability === "resource") {
          if (!name) {
            console.error(ERRORS.addResourceRequiresName());
            process.exitCode = 1;
            return;
          }
          await runAddResource(
            project.config.projectName,
            cwd,
            name,
            flags.dryRun,
            local.skipGenerate,
          );
          return;
        }

        if (capability === "middleware" || capability === "service") {
          if (!name) {
            console.error(ERRORS.addRequiresName(capability));
            process.exitCode = 1;
            return;
          }
          await runAddAtomic(
            project.config.projectName,
            cwd,
            capability,
            name,
            flags.dryRun,
            local.skipGenerate,
          );
        }
      },
    );
}

async function runAddInfra(
  projectName: string,
  cwd: string,
  kind: InfraKind,
  dryRun: boolean,
): Promise<void> {
  try {
    const result = await addInfra({ projectRoot: cwd, kind, dryRun });
    if (result.alreadyPresent) {
      console.log(`✓ ${kind} already configured.`);
      return;
    }
    if (dryRun) {
      console.log(
        [
          `root add ${kind} — dry-run`,
          `Project: ${projectName}`,
          `Operations: ${result.ops.length}`,
          "",
          ...formatOperationPlan(result.ops).map((line) => `  ${line}`),
        ].join("\n"),
      );
      return;
    }
    console.log(`root add ${kind} — configured (${result.ops.length} ops)`);
  } catch (error) {
    if (error instanceof AddInfraError) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

async function runAddCapability(
  projectName: string,
  cwd: string,
  kind: CapabilityKind,
  name: string | undefined,
  dryRun: boolean,
): Promise<void> {
  try {
    const result = await addCapability({
      projectRoot: cwd,
      kind,
      dryRun,
      ...(name ? { name } : {}),
    });
    if (result.alreadyPresent) {
      console.log(`✓ ${kind} already exists.`);
      return;
    }
    if (dryRun) {
      console.log(
        [
          `root add ${kind} — dry-run`,
          `Project: ${projectName}`,
          `Variant: ${result.slug}`,
          `Operations: ${result.ops.length}`,
          "",
          ...formatOperationPlan(result.ops).map((line) => `  ${line}`),
        ].join("\n"),
      );
      return;
    }
    console.log(`root add ${kind} — interconnected (${result.slug}, ${result.ops.length} ops)`);
  } catch (error) {
    if (error instanceof AddCapabilityError) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

async function runAddAuth(
  projectName: string,
  cwd: string,
  dryRun: boolean,
  skipGenerate?: boolean,
): Promise<void> {
  try {
    const result = await addAuth({
      projectRoot: cwd,
      dryRun,
      skipGenerate: Boolean(skipGenerate) || dryRun,
    });

    if (result.warnings.length > 0) {
      console.error(result.warnings.map((w) => `Warning: ${w}`).join("\n"));
    }

    if (dryRun) {
      console.log(
        [
          "root add auth — dry-run (no files written)",
          `Project: ${projectName}`,
          `Operations: ${result.ops.length}`,
          "",
          ...formatOperationPlan(result.ops).map((line) => `  ${line}`),
        ].join("\n"),
      );
      return;
    }

    console.log(
      [
        "root add auth — interconnected",
        `Project: ${projectName}`,
        "Mount: /auth (signup | signin | signout)",
        `Files/ops: ${result.ops.length}`,
        "",
        "Set ACCESS_TOKEN_SECRET in .env, then:",
        '  POST /auth/signup  { "email", "password" }',
        '  POST /auth/signin  { "email", "password" }',
        "  Authorization: Bearer <token> on mutating resources",
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
}

async function runAddResource(
  projectName: string,
  cwd: string,
  name: string,
  dryRun: boolean,
  skipGenerate?: boolean,
): Promise<void> {
  try {
    const result = await addRoute({
      projectRoot: cwd,
      name,
      dryRun,
      skipGenerate: Boolean(skipGenerate) || dryRun,
    });

    if (dryRun) {
      console.log(
        [
          "root add resource — dry-run (no files written)",
          `Project: ${projectName}`,
          `Resource: ${result.slug}`,
          `Mount: ${result.mountPath}`,
          `Operations: ${result.ops.length}`,
          "",
          ...formatOperationPlan(result.ops).map((line) => `  ${line}`),
        ].join("\n"),
      );
      return;
    }

    console.log(
      [
        "root add resource — interconnected",
        `Project: ${projectName}`,
        `Resource: ${result.slug}`,
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
}

async function runAddAtomic(
  projectName: string,
  cwd: string,
  kind: "middleware" | "service",
  name: string,
  dryRun: boolean,
  skipGenerate?: boolean,
): Promise<void> {
  try {
    const result = await addAtomic({
      projectRoot: cwd,
      kind,
      name,
      dryRun,
      skipGenerate: Boolean(skipGenerate) || dryRun,
    });

    if (result.warnings.length > 0) {
      console.error(result.warnings.map((w) => `Warning: ${w}`).join("\n"));
    }

    if (dryRun) {
      console.log(
        [
          `root add ${kind} — dry-run (no files written)`,
          `Project: ${projectName}`,
          `Name: ${result.slug}`,
          `Operations: ${result.ops.length}`,
          "",
          ...formatOperationPlan(result.ops).map((line) => `  ${line}`),
        ].join("\n"),
      );
      return;
    }

    console.log(
      [
        `root add ${kind} — registered`,
        `Project: ${projectName}`,
        `Name: ${result.slug}`,
        `Files/ops: ${result.ops.length}`,
      ].join("\n"),
    );
  } catch (error) {
    if (error instanceof AddAtomicError) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}
