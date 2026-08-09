import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export const ROOT_JSON_FILENAME = "root.json" as const;

const aliasesSchema = z.object({
  routes: z.string().min(1),
  controllers: z.string().min(1),
  services: z.string().min(1),
  middleware: z.string().min(1),
  schema: z.string().min(1),
  server: z.string().min(1),
  db: z.string().min(1),
});

const moduleEntrySchema = z.object({
  type: z.enum(["auth", "resource", "model", "service", "middleware", "controller"]),
  addedAt: z.string().min(1),
});

export const rootJsonSchema = z.object({
  $schema: z.string().optional(),
  projectName: z.string().min(1),
  language: z.enum(["typescript", "javascript"]),
  framework: z.enum(["express", "fastify"]),
  architecture: z.enum(["layered-mvc", "minimal"]),
  database: z.enum(["postgresql", "mysql", "mongodb", "none"]),
  orm: z.enum(["prisma", "drizzle", "mongoose", "none"]),
  auth: z.enum(["jwt", "none"]),
  validation: z.enum(["zod"]),
  testing: z.enum(["vitest", "none"]),
  aliases: aliasesSchema,
  features: z.object({
    docker: z.boolean(),
    githubActions: z.boolean(),
  }),
  modules: z.record(z.string(), moduleEntrySchema).default({}),
  inject: z.object({
    routesAnchor: z.string().min(1),
  }),
});

export type RootJson = z.infer<typeof rootJsonSchema>;

export class RootJsonValidationError extends Error {
  readonly issues: z.ZodIssue[];
  readonly filePath: string;

  constructor(filePath: string, issues: z.ZodIssue[]) {
    const details = issues
      .map((issue) => {
        const field = issue.path.length > 0 ? issue.path.join(".") : "(root)";
        return `  - ${field}: ${issue.message}`;
      })
      .join("\n");
    super(`Invalid root.json at ${filePath}:\n${details}`);
    this.name = "RootJsonValidationError";
    this.filePath = filePath;
    this.issues = issues;
  }
}

export function parseRootJson(data: unknown, filePath: string = ROOT_JSON_FILENAME): RootJson {
  const result = rootJsonSchema.safeParse(data);
  if (!result.success) {
    throw new RootJsonValidationError(filePath, result.error.issues);
  }
  return result.data;
}

export function serializeRootJson(config: RootJson): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}

export async function loadRootJson(projectRoot: string): Promise<RootJson> {
  const filePath = path.join(projectRoot, ROOT_JSON_FILENAME);
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    throw new Error(
      `No ${ROOT_JSON_FILENAME} found in ${projectRoot}.\nRun: pnpm dlx root@latest init`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse ${filePath} as JSON: ${message}`);
  }

  return parseRootJson(parsed, filePath);
}

export async function writeRootJson(projectRoot: string, config: RootJson): Promise<string> {
  const filePath = path.join(projectRoot, ROOT_JSON_FILENAME);
  await writeFile(filePath, serializeRootJson(config), "utf8");
  return filePath;
}

/** Fixture helper for tests and future generators. */
export function createRootJsonFixture(overrides: Partial<RootJson> = {}): RootJson {
  const {
    aliases: aliasOverrides,
    features: featureOverrides,
    inject: injectOverrides,
    modules: moduleOverrides,
    ...topLevel
  } = overrides;

  return parseRootJson({
    $schema: "https://root.dev/schema.json",
    projectName: "my-api",
    language: "typescript",
    framework: "express",
    architecture: "layered-mvc",
    database: "postgresql",
    orm: "prisma",
    auth: "none",
    validation: "zod",
    testing: "vitest",
    ...topLevel,
    aliases: {
      routes: "src/routes",
      controllers: "src/controllers",
      services: "src/services",
      middleware: "src/middleware",
      schema: "src/schema.ts",
      server: "src/server.ts",
      db: "src/db",
      ...aliasOverrides,
    },
    features: {
      docker: false,
      githubActions: false,
      ...featureOverrides,
    },
    modules: moduleOverrides ?? {},
    inject: {
      routesAnchor: "[ROOT-INJECT:ROUTES]",
      ...injectOverrides,
    },
  });
}
