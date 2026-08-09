import type { Operation } from "../../engine/operations.js";
import {
  buildResourceFiles,
  defaultResourceZodFields,
  resolveResourceNames,
  serverRouteImportSource,
} from "../codegen/resource-files.js";
import type { Recipe } from "../types.js";

/** Registers a layered resource: schema + MVC files + server mount + ORM model. */
export const resourceRecipe: Recipe = {
  id: "resource",
  description: "Named API resource with Zod schema, MVC files, and Express route mount",
  registryDependencies: ["schema", "validate"],
  plan(ctx) {
    const resourceName = ctx.resourceName;
    if (!resourceName) {
      throw new Error("resource recipe requires resourceName");
    }

    const names = resolveResourceNames(resourceName, ctx.mountPath);
    if (ctx.graph.config.modules[names.slug]) {
      return [];
    }

    const fields = ctx.fields ?? defaultResourceZodFields();
    const files = buildResourceFiles({
      config: ctx.graph.config,
      names,
      fields,
    });
    const serverRel = ctx.graph.config.aliases.server;
    const anchor = ctx.graph.config.inject.routesAnchor;
    const mountLine = `app.use("${names.mountPath}", ${names.routerExport});`;
    const addedAt = ctx.addedAt ?? "1970-01-01T00:00:00.000Z";

    const ops: Operation[] = [
      {
        type: "createFile",
        path: files.routePath,
        content: files.routeContent,
      },
      {
        type: "createFile",
        path: files.controllerPath,
        content: files.controllerContent,
      },
      {
        type: "createFile",
        path: files.servicePath,
        content: files.serviceContent,
      },
      {
        type: "patchFile",
        path: serverRel,
        kind: "ast-import",
        source: serverRouteImportSource(ctx.graph.config, names.slug),
        specifiers: [names.routerExport],
      },
      {
        type: "patchFile",
        path: serverRel,
        kind: "anchor",
        anchor,
        insertion: `  ${mountLine}`,
        skipIfContains: mountLine,
      },
      {
        type: "updateSchema",
        kind: "resource",
        resourceName: names.slug,
        fields,
      },
    ];

    const orm = ctx.graph.config.orm;
    if (orm === "prisma") {
      ops.push({
        type: "updateOrm",
        kind: "prisma-model",
        resourceName: names.slug,
        fields,
      });
      ops.push({
        type: "runCommand",
        command: "pnpm",
        args: ["exec", "prisma", "generate"],
      });
    } else if (orm === "drizzle") {
      ops.push({
        type: "updateOrm",
        kind: "drizzle-table",
        resourceName: names.slug,
        fields,
      });
    } else if (orm === "mongoose") {
      ops.push({
        type: "updateOrm",
        kind: "mongoose-model",
        resourceName: names.slug,
        fields,
      });
    }

    ops.push({
      type: "updateManifest",
      moduleName: names.slug,
      entry: {
        type: "resource",
        addedAt,
      },
    });

    return ops;
  },
};
