import type { Operation } from "../../engine/operations.js";
import type { Recipe } from "../types.js";
import { schemaExportName, toCamelCase } from "../types.js";

/** Registers a CRUD-ish resource: schema + route file + server mount. */
export const resourceRecipe: Recipe = {
  id: "resource",
  description: "Named API resource with Zod schema and Express route mount",
  registryDependencies: ["schema", "validate"],
  plan(ctx) {
    const resourceName = ctx.resourceName;
    if (!resourceName) {
      throw new Error("resource recipe requires resourceName");
    }

    const fields = ctx.fields ?? [{ name: "title", zodType: "z.string().min(1)" }];
    const camel = toCamelCase(resourceName);
    const exportName = schemaExportName(resourceName);
    const mountPath = ctx.mountPath ?? `/api/${camel}`;
    const routesDir = ctx.graph.config.aliases.routes;
    const routeFile = `${routesDir}/${camel}.routes.ts`;
    const routerExport = `${camel}Router`;
    const serverRel = ctx.graph.config.aliases.server;
    const anchor = ctx.graph.config.inject.routesAnchor;
    const mountLine = `app.use("${mountPath}", ${routerExport});`;

    if (ctx.graph.config.modules[resourceName]) {
      return [];
    }

    const ops: Operation[] = [
      {
        type: "createFile",
        path: routeFile,
        content: `import { Router } from "express";
import { ${exportName} } from "../schema.js";
import { validate } from "../middleware/validate.js";

export const ${routerExport} = Router();

${routerExport}.post("/", validate(${exportName}), (_req, res) => {
  res.status(201).json({ ok: true, resource: "${camel}" });
});
`,
      },
      {
        type: "patchFile",
        path: serverRel,
        kind: "ast-import",
        source: `./routes/${camel}.routes.js`,
        specifiers: [routerExport],
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
        resourceName,
        fields,
      },
      {
        type: "updateManifest",
        moduleName: resourceName,
        entry: {
          type: "resource",
          addedAt: "1970-01-01T00:00:00.000Z",
        },
      },
    ];

    return ops;
  },
};
