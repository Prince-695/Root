import { access } from "node:fs/promises";
import path from "node:path";
import { ERRORS, loadModuleGraph, loadRootJson } from "@root/core";
import type { Command } from "commander";
import { getGlobalFlags, logVerbose } from "../global-flags.js";
import { requireRootProject } from "../lib/require-root-project.js";

export function registerInspectCommand(program: Command): void {
  program
    .command("inspect")
    .description("Inspect a registered module and related files")
    .argument("<name>", "Module name (e.g. post, auth)")
    .action(async (name: string, _options: unknown, command: Command) => {
      const flags = getGlobalFlags(command);
      const cwd = process.cwd();
      logVerbose(flags, `inspect cwd=${cwd} name=${name}`);

      if (!name?.trim()) {
        console.error(ERRORS.inspectRequiresName());
        process.exitCode = 1;
        return;
      }

      const project = await requireRootProject(cwd, "inspect");
      if (!project) return;

      const slug = name.trim().toLowerCase();
      const config = await loadRootJson(cwd);
      await loadModuleGraph(cwd);
      const entry = config.modules[slug];

      if (!entry) {
        const registered = Object.keys(config.modules).sort();
        console.error(
          [
            `Module "${slug}" is not registered in root.json.`,
            "",
            "Registered:",
            ...(registered.length > 0 ? registered.map((n) => `  - ${n}`) : ["  (none)"]),
          ].join("\n"),
        );
        process.exitCode = 1;
        return;
      }

      const candidates = candidateFiles(config, slug, entry.type);
      const lines = [
        "root inspect",
        `Project: ${config.projectName}`,
        `Module: ${slug}`,
        `Type: ${entry.type}`,
        `Added: ${entry.addedAt}`,
        "",
        "Files:",
      ];

      for (const rel of candidates) {
        const abs = path.join(cwd, rel);
        let status = "missing";
        try {
          await access(abs);
          status = "ok";
        } catch {
          /* missing */
        }
        lines.push(`  [${status}] ${rel}`);
      }

      if (entry.type === "resource") {
        lines.push("", `HTTP mount (expected): /api/${slug}`);
      }
      if (entry.type === "auth") {
        lines.push("", "HTTP mount (expected): /auth");
      }

      console.log(lines.join("\n"));
    });
}

function candidateFiles(
  config: Awaited<ReturnType<typeof loadRootJson>>,
  slug: string,
  type: string,
): string[] {
  const ext = config.language === "javascript" ? "js" : "ts";
  const { routes, controllers, services, middleware, schema } = config.aliases;

  switch (type) {
    case "auth":
      return [
        `${middleware}/auth.${ext}`,
        `${routes}/auth.routes.${ext}`,
        `${controllers}/auth.controller.${ext}`,
        `${services}/auth.service.${ext}`,
      ];
    case "resource":
      return [
        `${routes}/${slug}.routes.${ext}`,
        `${controllers}/${slug}.controller.${ext}`,
        `${services}/${slug}.service.${ext}`,
      ];
    case "service":
      return [`${services}/${slug}.service.${ext}`];
    case "middleware":
      return [`${middleware}/${slug}.${ext}`];
    case "controller":
      return [`${controllers}/${slug}.controller.${ext}`];
    case "model":
      if (config.orm === "mongoose") return [`src/models/${slug}.model.${ext}`];
      if (config.orm === "prisma") return ["prisma/schema.prisma"];
      if (config.orm === "drizzle") return [`src/db/schema.${ext}`];
      return [schema];
    default:
      return [];
  }
}
