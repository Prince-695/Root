import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RootJson } from "../config/root-json.js";
import type { Operation } from "../engine/operations.js";
import {
  buildResourceFiles,
  defaultResourceZodFields,
  resolveResourceNames,
  resourceOrmFields,
} from "../registry/codegen/resource-files.js";
import { buildMongooseModelFile } from "./orm-registry.js";

/**
 * Policy (Phase 6.8): when auth is added after resources exist, retrofit mutating
 * routes with `authenticate` and rewrite MVC files for token-based authorId.
 */
export async function planAuthRetrofit(
  projectRoot: string,
  config: RootJson,
): Promise<{ ops: Operation[]; warnings: string[] }> {
  const warnings: string[] = [];
  const ops: Operation[] = [];
  const resourceModules = Object.entries(config.modules).filter(([, m]) => m.type === "resource");

  if (resourceModules.length === 0) {
    return { ops, warnings };
  }

  warnings.push(
    `Auth retrofit: protecting ${resourceModules.length} existing resource(s) with authenticate on POST and authorId ownership.`,
  );

  for (const [name] of resourceModules) {
    const names = resolveResourceNames(name);
    const routeRel = `${config.aliases.routes}/${names.slug}.routes.ts`;
    const routeAbs = path.join(projectRoot, routeRel);

    try {
      await readFile(routeAbs, "utf8");
    } catch {
      warnings.push(`Skipped missing route file for resource "${names.slug}".`);
      continue;
    }

    const files = buildResourceFiles({
      config,
      names,
      fields: defaultResourceZodFields(),
      hasAuth: true,
    });

    ops.push(
      { type: "createFile", path: files.routePath, content: files.routeContent },
      { type: "createFile", path: files.controllerPath, content: files.controllerContent },
      { type: "createFile", path: files.servicePath, content: files.serviceContent },
    );

    const ormFields = resourceOrmFields(true);
    if (config.orm === "prisma") {
      ops.push({
        type: "updateOrm",
        kind: "prisma-model",
        resourceName: names.slug,
        fields: ormFields,
      });
    } else if (config.orm === "drizzle") {
      ops.push({
        type: "updateOrm",
        kind: "drizzle-table",
        resourceName: names.slug,
        fields: ormFields,
      });
    } else if (config.orm === "mongoose") {
      ops.push({
        type: "createFile",
        path: `src/models/${names.slug}.model.ts`,
        content: buildMongooseModelFile(names.slug, ormFields),
      });
    }
  }

  return { ops, warnings };
}
