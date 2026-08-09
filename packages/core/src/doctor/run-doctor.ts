import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { type RootJson, loadRootJson } from "../config/root-json.js";
import { AUTH_BANNER, EXPORTS_BANNER, RESOURCE_BANNER } from "../mutators/schema-registry.js";
import { sourceExtension } from "../providers/language.js";
import { toCamelCase } from "../registry/types.js";

export type DoctorIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type DoctorResult = {
  ok: boolean;
  projectName: string;
  issues: DoctorIssue[];
  checksPassed: number;
  checksFailed: number;
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function issue(
  code: string,
  message: string,
  severity: "error" | "warning" = "error",
): DoctorIssue {
  return { code, message, severity };
}

async function expectedModuleFiles(
  config: RootJson,
  name: string,
  type: RootJson["modules"][string]["type"],
): Promise<string[]> {
  const { aliases } = config;
  const ext = sourceExtension(config);
  switch (type) {
    case "auth":
      return [
        path.join(aliases.middleware, `auth.${ext}`),
        path.join(aliases.routes, `auth.routes.${ext}`),
        path.join(aliases.controllers, `auth.controller.${ext}`),
        path.join(aliases.services, `auth.service.${ext}`),
      ];
    case "resource":
      return [
        path.join(aliases.routes, `${name}.routes.${ext}`),
        path.join(aliases.controllers, `${name}.controller.${ext}`),
        path.join(aliases.services, `${name}.service.${ext}`),
      ];
    case "model":
      if (config.orm === "mongoose") {
        return [`src/models/${name}.model.${ext}`];
      }
      if (config.orm === "prisma") {
        return ["prisma/schema.prisma"];
      }
      if (config.orm === "drizzle") {
        return [`src/db/schema.${ext}`];
      }
      return [aliases.schema];
    case "service":
      return [path.join(aliases.services, `${name}.service.${ext}`)];
    case "middleware":
      return [path.join(aliases.middleware, `${name}.${ext}`)];
    case "controller":
      return [path.join(aliases.controllers, `${name}.controller.${ext}`)];
    default:
      return [];
  }
}

export type RunDoctorOptions = {
  projectRoot: string;
  /** When true, auth config/module/middleware mismatches are errors. */
  strict?: boolean;
};

/**
 * Full project integrity checks (Phase 8 / PRD doctor).
 */
export async function runDoctor(options: RunDoctorOptions): Promise<DoctorResult> {
  const issues: DoctorIssue[] = [];
  let checksPassed = 0;
  const bump = (ok: boolean) => {
    if (ok) checksPassed += 1;
  };

  let config: RootJson;
  try {
    config = await loadRootJson(options.projectRoot);
    bump(true);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      projectName: "(unknown)",
      issues: [issue("root-json", message)],
      checksPassed: 0,
      checksFailed: 1,
    };
  }

  // 2. Alias paths
  const dirAliases = ["routes", "controllers", "services", "middleware", "db"] as const;
  for (const key of dirAliases) {
    const rel = config.aliases[key];
    const abs = path.join(options.projectRoot, rel);
    const ok = await exists(abs);
    bump(ok);
    if (!ok) {
      issues.push(issue("alias-missing", `Alias path missing: ${rel} (${key})`));
    }
  }
  for (const key of ["schema", "server"] as const) {
    const rel = config.aliases[key];
    const abs = path.join(options.projectRoot, rel);
    const ok = await exists(abs);
    bump(ok);
    if (!ok) {
      issues.push(issue("alias-missing", `Alias file missing: ${rel} (${key})`));
    }
  }

  // 3. Inject anchor
  const serverRel = config.aliases.server;
  const serverAbs = path.join(options.projectRoot, serverRel);
  if (await exists(serverAbs)) {
    const server = await readFile(serverAbs, "utf8");
    const hasAnchor = server.includes(config.inject.routesAnchor);
    bump(hasAnchor);
    if (!hasAnchor) {
      issues.push(
        issue(
          "anchor-missing",
          `Inject anchor "${config.inject.routesAnchor}" not found in ${serverRel}. Re-add the Root inject comment so \`add resource\` can mount routers.`,
        ),
      );
    }

    // 6. Resource mounts (checked with server content)
    for (const [name, entry] of Object.entries(config.modules)) {
      if (entry.type !== "resource") continue;
      const camel = toCamelCase(name);
      const mountNeedle = `"/api/${name}"`;
      const routerNeedle = `${camel}Router`;
      const mounted =
        server.includes(mountNeedle) ||
        (server.includes(routerNeedle) && server.includes("app.use("));
      bump(mounted);
      if (!mounted) {
        issues.push(
          issue(
            "mount-missing",
            `Resource "${name}" has no server mount for ${mountNeedle} in ${serverRel}.`,
          ),
        );
      }
    }
  }

  // 4. Schema banners ordered
  const schemaAbs = path.join(options.projectRoot, config.aliases.schema);
  if (await exists(schemaAbs)) {
    const schema = await readFile(schemaAbs, "utf8");
    const authIdx = schema.indexOf(AUTH_BANNER);
    const resIdx = schema.indexOf(RESOURCE_BANNER);
    const expIdx = schema.indexOf(EXPORTS_BANNER);
    const ordered =
      authIdx !== -1 && resIdx !== -1 && expIdx !== -1 && authIdx < resIdx && resIdx < expIdx;
    bump(ordered);
    if (!ordered) {
      issues.push(
        issue(
          "schema-banners",
          `Schema banners missing or out of order in ${config.aliases.schema} (expected Auth → Resource → Exports).`,
        ),
      );
    }
  }

  // 5. Module files on disk
  for (const [name, entry] of Object.entries(config.modules)) {
    const rels = await expectedModuleFiles(config, name, entry.type);
    for (const rel of rels) {
      const abs = path.join(options.projectRoot, rel);
      const ok = await exists(abs);
      bump(ok);
      if (!ok) {
        issues.push(
          issue(
            "manifest-drift",
            `Module "${name}" (${entry.type}) is in root.json but missing file: ${rel}`,
          ),
        );
      }
    }

    if (
      entry.type === "model" &&
      config.orm === "prisma" &&
      (await exists(path.join(options.projectRoot, "prisma/schema.prisma")))
    ) {
      const prisma = await readFile(path.join(options.projectRoot, "prisma/schema.prisma"), "utf8");
      const pascal = name
        .split("-")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join("");
      const hasModel = new RegExp(`\\bmodel\\s+${pascal}\\b`).test(prisma);
      bump(hasModel);
      if (!hasModel) {
        issues.push(
          issue(
            "manifest-drift",
            `Model "${name}" missing Prisma model ${pascal} in prisma/schema.prisma`,
          ),
        );
      }
    }

    if (entry.type === "resource" || entry.type === "model") {
      if (await exists(schemaAbs)) {
        const schema = await readFile(schemaAbs, "utf8");
        const exportName = `${toCamelCase(name)}Schema`;
        const hasSchema = schema.includes(exportName);
        bump(hasSchema);
        if (!hasSchema) {
          issues.push(
            issue(
              "schema-drift",
              `Module "${name}" missing ${exportName} in ${config.aliases.schema}`,
            ),
          );
        }
      }
    }
  }

  // 7. Auth consistency
  const ext = sourceExtension(config);
  const authModule = Boolean(config.modules.auth);
  const authJwt = config.auth === "jwt";
  const authMw = await exists(
    path.join(options.projectRoot, config.aliases.middleware, `auth.${ext}`),
  );
  if (authJwt && !authModule) {
    const msg =
      'root.json has auth: "jwt" but modules.auth is missing. Run: pnpm dlx root@latest add auth';
    issues.push(issue("auth-consistency", msg, options.strict ? "error" : "warning"));
    if (options.strict) bump(false);
    else bump(true);
  } else if (authModule && !authJwt) {
    const msg = 'modules.auth is present but root.json auth is not "jwt".';
    issues.push(issue("auth-consistency", msg, options.strict ? "error" : "warning"));
    if (options.strict) bump(false);
    else bump(true);
  } else if (authModule && !authMw) {
    issues.push(
      issue(
        "auth-consistency",
        `modules.auth is present but middleware/auth.${ext} is missing.`,
        options.strict ? "error" : "warning",
      ),
    );
    if (options.strict) bump(false);
    else bump(true);
  } else {
    bump(true);
  }

  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    projectName: config.projectName,
    issues,
    checksPassed,
    checksFailed: errors.length,
  };
}

export function formatDoctorReport(result: DoctorResult): string {
  if (result.ok && result.issues.length === 0) {
    return [
      "root doctor — OK",
      `Project: ${result.projectName}`,
      `Checks passed: ${result.checksPassed}`,
      "",
      "All integrity checks passed.",
    ].join("\n");
  }

  if (result.ok) {
    return [
      "root doctor — OK (with warnings)",
      `Project: ${result.projectName}`,
      `Checks passed: ${result.checksPassed}`,
      "",
      ...result.issues.map((i) => `  warning [${i.code}] ${i.message}`),
    ].join("\n");
  }

  return [
    "root doctor — FAILED",
    `Project: ${result.projectName}`,
    `Errors: ${result.checksFailed}`,
    "",
    ...result.issues.map(
      (i) => `  ${i.severity === "error" ? "error" : "warning"} [${i.code}] ${i.message}`,
    ),
  ].join("\n");
}
