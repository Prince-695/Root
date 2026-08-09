import type { RootJson } from "../../config/root-json.js";
import type { ZodField } from "../../engine/operations.js";
import { isTypeScript, sourceExtension } from "../../providers/language.js";
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

/** Fields persisted in ORM (may include authorId when auth-aware). */
export function resourceOrmFields(hasAuth: boolean, fields?: ZodField[]): ZodField[] {
  const base = createBodyFields(fields ?? defaultResourceZodFields()).filter(
    (f) => f.name !== "authorId",
  );
  if (hasAuth) {
    return [...base, { name: "authorId", zodType: "z.string().min(1)" }];
  }
  return base;
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
  hasAuth: boolean;
}): ResourceFileBundle {
  const { config, names, hasAuth } = options;
  const fields = createBodyFields(options.fields).filter((f) => f.name !== "authorId");
  const { pascal, schemaExport, routerExport, slug } = names;
  const ext = sourceExtension(config);
  const routesDir = config.aliases.routes;
  const controllersDir = config.aliases.controllers;
  const servicesDir = config.aliases.services;

  const routePath = `${routesDir}/${slug}.routes.${ext}`;
  const controllerPath = `${controllersDir}/${slug}.controller.${ext}`;
  const servicePath = `${servicesDir}/${slug}.service.${ext}`;

  const authImport = hasAuth ? `import { authenticate } from "../middleware/auth.js";\n` : "";
  const postHandlers = hasAuth
    ? `authenticate, validate(${schemaExport}), create${pascal}`
    : `validate(${schemaExport}), create${pascal}`;

  const routeContent = `import { Router } from "express";
${authImport}import {
  create${pascal},
  get${pascal}ById,
  list${pascal},
} from "../controllers/${slug}.controller.js";
import { ${schemaExport} } from "../schema.js";
import { validate } from "../middleware/validate.js";

export const ${routerExport} = Router();

${routerExport}.get("/", list${pascal});
${routerExport}.get("/:id", get${pascal}ById);
${routerExport}.post("/", ${postHandlers});
`;

  const controllerContent = isTypeScript(config)
    ? buildTsController(slug, pascal, hasAuth)
    : buildJsController(slug, pascal, hasAuth);

  return {
    routePath,
    controllerPath,
    servicePath,
    routeContent,
    controllerContent,
    serviceContent: buildServiceContent(config, names, fields, hasAuth),
  };
}

function buildTsController(slug: string, pascal: string, hasAuth: boolean): string {
  if (hasAuth) {
    return `import type { Request, Response, NextFunction } from "express";
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
    const userId = req.authenticatedUser?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: "Unauthorized" } });
      return;
    }
    // Ignore client-supplied ownership fields — identity comes from the token.
    const { authorId: _ignoredAuthorId, ...body } = req.body as {
      title: string;
      authorId?: string;
    };
    void _ignoredAuthorId;
    const data = await create${pascal}Record({ title: body.title, authorId: userId });
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
`;
  }

  return `import type { Request, Response, NextFunction } from "express";
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
}

function buildJsController(slug: string, pascal: string, hasAuth: boolean): string {
  if (hasAuth) {
    return `import {
  create${pascal}Record,
  get${pascal}Record,
  list${pascal}Records,
} from "../services/${slug}.service.js";

export async function list${pascal}(_req, res, next) {
  try {
    const data = await list${pascal}Records();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function get${pascal}ById(req, res, next) {
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

export async function create${pascal}(req, res, next) {
  try {
    const userId = req.authenticatedUser?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: "Unauthorized" } });
      return;
    }
    // Ignore client-supplied ownership fields — identity comes from the token.
    const { authorId: _ignoredAuthorId, ...body } = req.body;
    void _ignoredAuthorId;
    const data = await create${pascal}Record({ title: body.title, authorId: userId });
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
`;
  }

  return `import {
  create${pascal}Record,
  get${pascal}Record,
  list${pascal}Records,
} from "../services/${slug}.service.js";

export async function list${pascal}(_req, res, next) {
  try {
    const data = await list${pascal}Records();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function get${pascal}ById(req, res, next) {
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

export async function create${pascal}(req, res, next) {
  try {
    const data = await create${pascal}Record(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
`;
}

function buildServiceContent(
  config: RootJson,
  names: ResourceNames,
  fields: ZodField[],
  hasAuth: boolean,
): string {
  const ts = isTypeScript(config);
  const orm = config.orm;
  const { camel, pascal, slug } = names;
  const titleField = fields.find((f) => f.name === "title")?.name ?? fields[0]?.name ?? "title";
  const createInput = hasAuth
    ? `{ ${titleField}: string; authorId: string }`
    : `{ ${titleField}: string }`;
  const createParam = ts ? `input: ${createInput}` : "input";
  const createData = hasAuth
    ? `{ ${titleField}: input.${titleField}, authorId: input.authorId }`
    : `{ ${titleField}: input.${titleField} }`;
  const idParam = ts ? "id: string" : "id";

  if (orm === "prisma") {
    return `import { db } from "../db/client.js";

export async function list${pascal}Records() {
  return db.${camel}.findMany({ orderBy: { createdAt: "desc" } });
}

export async function get${pascal}Record(${idParam}) {
  return db.${camel}.findUnique({ where: { id } });
}

export async function create${pascal}Record(${createParam}) {
  return db.${camel}.create({ data: ${createData} });
}
`;
  }

  if (orm === "drizzle") {
    const insertIdLine = ts
      ? "const id = Number((result as unknown as [{ insertId: number }])[0]?.insertId);"
      : "const id = Number(result[0]?.insertId);";
    if (config.database === "mysql") {
      return `import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { ${camel} } from "../db/schema.js";

export async function list${pascal}Records() {
  return db.select().from(${camel});
}

export async function get${pascal}Record(${idParam}) {
  const rows = await db.select().from(${camel}).where(eq(${camel}.id, Number(id))).limit(1);
  return rows[0] ?? null;
}

export async function create${pascal}Record(${createParam}) {
  const result = await db.insert(${camel}).values(${createData});
  ${insertIdLine}
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

export async function get${pascal}Record(${idParam}) {
  const rows = await db.select().from(${camel}).where(eq(${camel}.id, Number(id))).limit(1);
  return rows[0] ?? null;
}

export async function create${pascal}Record(${createParam}) {
  const rows = await db.insert(${camel}).values(${createData}).returning();
  return rows[0] ?? null;
}
`;
  }

  if (orm === "mongoose") {
    return `import { ${pascal}Model } from "../models/${slug}.model.js";

export async function list${pascal}Records() {
  return ${pascal}Model.find().sort({ createdAt: -1 }).lean();
}

export async function get${pascal}Record(${idParam}) {
  return ${pascal}Model.findById(id).lean();
}

export async function create${pascal}Record(${createParam}) {
  const created = await ${pascal}Model.create(${createData});
  return created.toObject();
}
`;
  }

  const authorField = hasAuth ? "\n  authorId: string;" : "";
  const authorAssign = hasAuth ? "\n    authorId: input.authorId," : "";

  if (ts) {
    return `type ${pascal}Record = {
  id: string;
  ${titleField}: string;${authorField}
  createdAt: string;
};

const store: ${pascal}Record[] = [];

export async function list${pascal}Records() {
  return [...store];
}

export async function get${pascal}Record(${idParam}) {
  return store.find((row) => row.id === id) ?? null;
}

export async function create${pascal}Record(${createParam}) {
  const row: ${pascal}Record = {
    id: crypto.randomUUID(),
    ${titleField}: input.${titleField},${authorAssign}
    createdAt: new Date().toISOString(),
  };
  store.unshift(row);
  return row;
}
`;
  }

  return `const store = [];

export async function list${pascal}Records() {
  return [...store];
}

export async function get${pascal}Record(${idParam}) {
  return store.find((row) => row.id === id) ?? null;
}

export async function create${pascal}Record(${createParam}) {
  const row = {
    id: crypto.randomUUID(),
    ${titleField}: input.${titleField},${authorAssign}
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
  const ext = sourceExtension(config);
  const routesFile = `${config.aliases.routes}/${slug}.routes.${ext}`;
  if (serverDir === "src" && config.aliases.routes.startsWith("src/")) {
    return `./routes/${slug}.routes.js`;
  }
  void routesFile;
  return `./routes/${slug}.routes.js`;
}
