import type { RootJson } from "../../config/root-json.js";
import type { ZodField } from "../../engine/operations.js";
import { schemaExportName, toCamelCase, toPascalCase } from "../types.js";

export type ResourceNames = {
  /** Manifest / CLI name, e.g. post */
  resourceName: string;
  slug: string;
  camel: string;
  pascal: string;
  schemaExport: string;
  routerExport: string;
  mountPath: string;
};

export function resolveResourceNames(resourceName: string, mountPath?: string): ResourceNames {
  const slug = resourceName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const camel = toCamelCase(slug);
  const pascal = toPascalCase(slug);
  return {
    resourceName: slug,
    slug,
    camel,
    pascal,
    schemaExport: schemaExportName(slug),
    routerExport: `${camel}Router`,
    mountPath: mountPath ?? `/api/${slug}`,
  };
}

export function defaultResourceZodFields(): ZodField[] {
  return [{ name: "title", zodType: "z.string().min(1)" }];
}

function createBodyFields(fields: ZodField[]): ZodField[] {
  return fields.filter((f) => f.name !== "id" && f.name !== "createdAt" && f.name !== "updatedAt");
}

export type ResourceFileBundle = {
  routePath: string;
  controllerPath: string;
  servicePath: string;
  routeContent: string;
  controllerContent: string;
  serviceContent: string;
};

export function buildResourceFiles(options: {
  config: RootJson;
  names: ResourceNames;
  fields: ZodField[];
}): ResourceFileBundle {
  const { config, names } = options;
  const fields = createBodyFields(options.fields);
  const { camel, pascal, schemaExport, routerExport, slug } = names;
  const routesDir = config.aliases.routes;
  const controllersDir = config.aliases.controllers;
  const servicesDir = config.aliases.services;

  const routePath = `${routesDir}/${slug}.routes.ts`;
  const controllerPath = `${controllersDir}/${slug}.controller.ts`;
  const servicePath = `${servicesDir}/${slug}.service.ts`;

  const routeContent = `import { Router } from "express";
import {
  create${pascal},
  get${pascal}ById,
  list${pascal},
} from "../controllers/${slug}.controller.js";
import { ${schemaExport} } from "../schema.js";
import { validate } from "../middleware/validate.js";

export const ${routerExport} = Router();

${routerExport}.get("/", list${pascal});
${routerExport}.get("/:id", get${pascal}ById);
${routerExport}.post("/", validate(${schemaExport}), create${pascal});
`;

  const controllerContent = `import type { Request, Response, NextFunction } from "express";
import {
  create${pascal}Record,
  get${pascal}Record,
  list${pascal}Records,
} from "../services/${slug}.service.js";

export async function list${pascal}(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await list${pascal}Records();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function get${pascal}ById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const data = await get${pascal}Record(id);
    if (!data) {
      res.status(404).json({ success: false, error: { message: "${pascal} not found" } });
      return;
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function create${pascal}(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await create${pascal}Record(req.body as { title: string });
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
`;

  return {
    routePath,
    controllerPath,
    servicePath,
    routeContent,
    controllerContent,
    serviceContent: buildServiceContent(config, names, fields),
  };
}

function buildServiceContent(config: RootJson, names: ResourceNames, fields: ZodField[]): string {
  const orm = config.orm;
  const { camel, pascal, slug } = names;
  const titleField = fields.find((f) => f.name === "title")?.name ?? fields[0]?.name ?? "title";

  if (orm === "prisma") {
    return `import { db } from "../db/client.js";

export async function list${pascal}Records() {
  return db.${camel}.findMany({ orderBy: { createdAt: "desc" } });
}

export async function get${pascal}Record(id: string) {
  return db.${camel}.findUnique({ where: { id } });
}

export async function create${pascal}Record(input: { ${titleField}: string }) {
  return db.${camel}.create({ data: { ${titleField}: input.${titleField} } });
}
`;
  }

  if (orm === "drizzle") {
    if (config.database === "mysql") {
      return `import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { ${camel} } from "../db/schema.js";

export async function list${pascal}Records() {
  return db.select().from(${camel});
}

export async function get${pascal}Record(id: string) {
  const rows = await db.select().from(${camel}).where(eq(${camel}.id, Number(id))).limit(1);
  return rows[0] ?? null;
}

export async function create${pascal}Record(input: { ${titleField}: string }) {
  const result = await db.insert(${camel}).values({ ${titleField}: input.${titleField} });
  const id = Number((result as unknown as [{ insertId: number }])[0]?.insertId);
  return get${pascal}Record(String(id));
}
`;
    }
    return `import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { ${camel} } from "../db/schema.js";

export async function list${pascal}Records() {
  return db.select().from(${camel});
}

export async function get${pascal}Record(id: string) {
  const rows = await db.select().from(${camel}).where(eq(${camel}.id, Number(id))).limit(1);
  return rows[0] ?? null;
}

export async function create${pascal}Record(input: { ${titleField}: string }) {
  const rows = await db
    .insert(${camel})
    .values({ ${titleField}: input.${titleField} })
    .returning();
  return rows[0] ?? null;
}
`;
  }

  if (orm === "mongoose") {
    return `import { ${pascal}Model } from "../models/${slug}.model.js";

export async function list${pascal}Records() {
  return ${pascal}Model.find().sort({ createdAt: -1 }).lean();
}

export async function get${pascal}Record(id: string) {
  return ${pascal}Model.findById(id).lean();
}

export async function create${pascal}Record(input: { ${titleField}: string }) {
  const created = await ${pascal}Model.create({ ${titleField}: input.${titleField} });
  return created.toObject();
}
`;
  }

  // orm === "none" — deterministic in-memory store for scaffolding without a DB
  return `type ${pascal}Record = {
  id: string;
  ${titleField}: string;
  createdAt: string;
};

const store: ${pascal}Record[] = [];

export async function list${pascal}Records() {
  return [...store];
}

export async function get${pascal}Record(id: string) {
  return store.find((row) => row.id === id) ?? null;
}

export async function create${pascal}Record(input: { ${titleField}: string }) {
  const row: ${pascal}Record = {
    id: crypto.randomUUID(),
    ${titleField}: input.${titleField},
    createdAt: new Date().toISOString(),
  };
  store.unshift(row);
  return row;
}
`;
}

/** Relative ESM import from server.ts into a routes file. */
export function serverRouteImportSource(config: RootJson, slug: string): string {
  const serverDir = config.aliases.server.replace(/\/[^/]+$/, "") || "src";
  const routesFile = `${config.aliases.routes}/${slug}.routes.ts`;
  // Prefer stable ./routes/<slug>.routes.js when both live under src/
  if (serverDir === "src" && config.aliases.routes.startsWith("src/")) {
    return `./routes/${slug}.routes.js`;
  }
  void routesFile;
  return `./routes/${slug}.routes.js`;
}
