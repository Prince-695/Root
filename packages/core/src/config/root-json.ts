import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { rootInvoke } from "../constants.js";

export const ROOT_JSON_FILENAME = "root.json" as const;
export const ROOT_JSON_VERSION = 2 as const;

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
  type: z.enum([
    "auth",
    "resource",
    "model",
    "service",
    "middleware",
    "controller",
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
  ]),
  addedAt: z.string().min(1),
});

export const applicationArchitectureSchema = z.enum([
  "monolithic",
  "modular-monolith",
  "microservices",
]);

export const codeArchitectureSchema = z.enum([
  "layered-mvc",
  "mvc",
  "feature-based",
  "clean",
  "hexagonal",
  "ddd",
  "minimal",
]);

/** v1 stored architecture as a single string; v2 splits application vs code. */
const architectureObjectSchema = z.object({
  application: applicationArchitectureSchema.default("monolithic"),
  code: codeArchitectureSchema.default("minimal"),
});

export const packageManagerSchema = z.enum(["npm", "pnpm", "yarn", "bun", "uv", "pip", "go-mod"]);

const featuresSchema = z.object({
  docker: z.boolean(),
  githubActions: z.boolean(),
  kubernetes: z.boolean().default(false),
});

const rootJsonShape = z.object({
  $schema: z.string().optional(),
  version: z.number().int().positive().default(ROOT_JSON_VERSION),
  projectName: z.string().min(1),
  language: z.enum(["typescript", "javascript", "python", "go", "java"]),
  framework: z.enum([
    "express",
    "fastify",
    "hono",
    "nestjs",
    "grpc",
    "fastapi",
    "flask",
    "go-http",
    "spring",
  ]),
  /** Flat code-architecture string kept for compatibility with existing generators. */
  architecture: codeArchitectureSchema,
  architectureDetail: architectureObjectSchema.optional(),
  database: z.enum(["postgresql", "mysql", "mongodb", "sqlite", "none"]),
  orm: z.enum(["prisma", "drizzle", "mongoose", "sqlalchemy", "gorm", "none"]),
  auth: z.enum(["jwt", "none"]),
  validation: z.enum(["zod", "pydantic", "none"]),
  testing: z.enum(["vitest", "pytest", "none"]),
  packageManager: packageManagerSchema.default("pnpm"),
  repository: z
    .object({
      type: z.enum(["single", "monorepo"]).default("single"),
    })
    .default({ type: "single" }),
  aliases: aliasesSchema,
  features: featuresSchema,
  modules: z.record(z.string(), moduleEntrySchema).default({}),
  inject: z.object({
    routesAnchor: z.string().min(1),
  }),
});

export const rootJsonSchema = rootJsonShape;

export type RootJson = z.infer<typeof rootJsonSchema>;
export type ApplicationArchitecture = z.infer<typeof applicationArchitectureSchema>;
export type CodeArchitecture = z.infer<typeof codeArchitectureSchema>;
export type PackageManagerName = z.infer<typeof packageManagerSchema>;

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

/** Normalize v1 manifests (flat architecture, missing version) into v2 shape. */
export function migrateRootJsonInput(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return data;
  }
  const raw = { ...(data as Record<string, unknown>) };

  // v1: architecture was a string only
  if (typeof raw.architecture === "string") {
    const code = raw.architecture;
    raw.architectureDetail = {
      application:
        typeof raw.architectureDetail === "object" &&
        raw.architectureDetail !== null &&
        "application" in (raw.architectureDetail as object)
          ? (raw.architectureDetail as { application?: string }).application
          : "monolithic",
      code,
    };
  } else if (
    raw.architecture &&
    typeof raw.architecture === "object" &&
    !Array.isArray(raw.architecture)
  ) {
    const detail = raw.architecture as { application?: string; code?: string };
    raw.architectureDetail = {
      application: detail.application ?? "monolithic",
      code: detail.code ?? "minimal",
    };
    raw.architecture = detail.code ?? "minimal";
  }

  if (raw.version === undefined) {
    raw.version = ROOT_JSON_VERSION;
  }

  if (raw.packageManager === undefined) {
    raw.packageManager = "pnpm";
  }

  if (raw.repository === undefined) {
    raw.repository = { type: "single" };
  }

  if (raw.features && typeof raw.features === "object" && !Array.isArray(raw.features)) {
    const features = { ...(raw.features as Record<string, unknown>) };
    if (features.kubernetes === undefined) {
      features.kubernetes = false;
    }
    raw.features = features;
  }

  if (raw.validation === undefined) {
    raw.validation = "zod";
  }

  return raw;
}

export function parseRootJson(data: unknown, filePath: string = ROOT_JSON_FILENAME): RootJson {
  const migrated = migrateRootJsonInput(data);
  const result = rootJsonSchema.safeParse(migrated);
  if (!result.success) {
    throw new RootJsonValidationError(filePath, result.error.issues);
  }
  const parsed = result.data;
  if (!parsed.architectureDetail) {
    parsed.architectureDetail = {
      application: "monolithic",
      code: parsed.architecture,
    };
  }
  return parsed;
}

export function serializeRootJson(config: RootJson): string {
  const detail = config.architectureDetail ?? {
    application: "monolithic" as const,
    code: config.architecture,
  };
  const out = {
    ...config,
    version: config.version ?? ROOT_JSON_VERSION,
    architecture: detail.code,
    architectureDetail: detail,
  };
  return `${JSON.stringify(out, null, 2)}\n`;
}

export async function loadRootJson(projectRoot: string): Promise<RootJson> {
  const filePath = path.join(projectRoot, ROOT_JSON_FILENAME);
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    throw new Error(
      `No ${ROOT_JSON_FILENAME} found in ${projectRoot}.\nRun: ${rootInvoke("init")}`,
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
export function createRootJsonFixture(
  overrides: Omit<Partial<RootJson>, "aliases" | "features" | "inject" | "repository"> & {
    aliases?: Partial<RootJson["aliases"]>;
    features?: Partial<RootJson["features"]>;
    inject?: Partial<RootJson["inject"]>;
    repository?: Partial<RootJson["repository"]>;
    architectureDetail?: Partial<NonNullable<RootJson["architectureDetail"]>>;
  } = {},
): RootJson {
  const {
    aliases: aliasOverrides,
    features: featureOverrides,
    inject: injectOverrides,
    modules: moduleOverrides,
    repository: repositoryOverrides,
    architectureDetail: architectureDetailOverrides,
    ...topLevel
  } = overrides;

  const codeArch =
    (topLevel.architecture as RootJson["architecture"] | undefined) ??
    architectureDetailOverrides?.code ??
    "minimal";

  return parseRootJson({
    $schema: "https://root.dev/schema.json",
    version: ROOT_JSON_VERSION,
    projectName: "my-api",
    language: "typescript",
    framework: "express",
    architecture: codeArch,
    architectureDetail: {
      application: "monolithic",
      code: codeArch,
      ...architectureDetailOverrides,
    },
    database: "postgresql",
    orm: "prisma",
    auth: "none",
    validation: "zod",
    testing: "vitest",
    packageManager: "pnpm",
    repository: {
      type: "single",
      ...repositoryOverrides,
    },
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
      kubernetes: false,
      ...featureOverrides,
    },
    modules: moduleOverrides ?? {},
    inject: {
      routesAnchor: "[ROOT-INJECT:ROUTES]",
      ...injectOverrides,
    },
  });
}
