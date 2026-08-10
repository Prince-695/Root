import type { RootJson } from "../config/root-json.js";

export type Database = RootJson["database"];
export type Orm = RootJson["orm"];

export type StackCombo = {
  database: Database;
  orm: Orm;
};

/** Valid Express Node combinations (language-agnostic ORMs for other stacks use provider matrices). */
export const SUPPORTED_COMBOS: readonly StackCombo[] = [
  { database: "postgresql", orm: "prisma" },
  { database: "postgresql", orm: "drizzle" },
  { database: "postgresql", orm: "none" },
  { database: "mysql", orm: "prisma" },
  { database: "mysql", orm: "drizzle" },
  { database: "mysql", orm: "none" },
  { database: "mongodb", orm: "mongoose" },
  { database: "mongodb", orm: "prisma" },
  { database: "mongodb", orm: "none" },
  { database: "sqlite", orm: "prisma" },
  { database: "sqlite", orm: "drizzle" },
  { database: "sqlite", orm: "none" },
  { database: "none", orm: "none" },
] as const;

export function isValidCombo(database: Database, orm: Orm): boolean {
  return SUPPORTED_COMBOS.some((c) => c.database === database && c.orm === orm);
}

export function ormOptionsForDatabase(database: Database): Orm[] {
  return SUPPORTED_COMBOS.filter((c) => c.database === database).map((c) => c.orm);
}

export function defaultDatabaseUrl(projectName: string, database: Database): string {
  switch (database) {
    case "postgresql":
      return `postgresql://postgres:postgres@localhost:5432/${projectName}?schema=public`;
    case "mysql":
      return `mysql://root:root@localhost:3306/${projectName}`;
    case "mongodb":
      return `mongodb://root:root@localhost:27017/${projectName}?authSource=admin`;
    case "sqlite":
      return "file:./prisma/dev.db";
    default:
      return "";
  }
}

export type StackTemplateContext = {
  projectName: string;
  authJwt: boolean;
  testingVitest: boolean;
  docker: boolean;
  githubActions: boolean;
  routesAnchor: string;
  database: Database;
  orm: Orm;
  isPrisma: boolean;
  isDrizzle: boolean;
  isMongoose: boolean;
  isNoOrm: boolean;
  isPostgres: boolean;
  isMysql: boolean;
  isMongo: boolean;
  isSqlite: boolean;
  isNoDb: boolean;
  databaseUrlDefault: string;
  prismaProvider: "postgresql" | "mysql" | "mongodb" | "sqlite" | null;
  dockerEngine: "postgres" | "mysql" | "mongo" | null;
  hasDatabaseUrl: boolean;
};

export function buildStackTemplateContext(input: {
  projectName: string;
  database: Database;
  orm: Orm;
  auth: RootJson["auth"];
  testing: RootJson["testing"];
  docker: boolean;
  githubActions: boolean;
}): StackTemplateContext {
  const { projectName, database, orm } = input;
  const isPrisma = orm === "prisma";
  const isDrizzle = orm === "drizzle";
  const isMongoose = orm === "mongoose";
  const isNoOrm = orm === "none";
  const isPostgres = database === "postgresql";
  const isMysql = database === "mysql";
  const isMongo = database === "mongodb";
  const isSqlite = database === "sqlite";
  const isNoDb = database === "none";

  let prismaProvider: StackTemplateContext["prismaProvider"] = null;
  if (isPrisma) {
    if (isPostgres) prismaProvider = "postgresql";
    else if (isMysql) prismaProvider = "mysql";
    else if (isMongo) prismaProvider = "mongodb";
    else if (isSqlite) prismaProvider = "sqlite";
  }

  let dockerEngine: StackTemplateContext["dockerEngine"] = null;
  if (input.docker && !isNoDb && !isSqlite) {
    if (isPostgres) dockerEngine = "postgres";
    else if (isMysql) dockerEngine = "mysql";
    else if (isMongo) dockerEngine = "mongo";
  }

  return {
    projectName,
    authJwt: input.auth === "jwt",
    testingVitest: input.testing === "vitest",
    docker: input.docker && !isSqlite,
    githubActions: input.githubActions,
    routesAnchor: "[ROOT-INJECT:ROUTES]",
    database,
    orm,
    isPrisma,
    isDrizzle,
    isMongoose,
    isNoOrm,
    isPostgres,
    isMysql,
    isMongo,
    isSqlite,
    isNoDb,
    databaseUrlDefault: defaultDatabaseUrl(projectName, database),
    prismaProvider,
    dockerEngine,
    hasDatabaseUrl: !isNoDb,
  };
}

export function invalidComboMessage(database: Database, orm: Orm): string {
  const allowed = ormOptionsForDatabase(database);
  return [
    `Invalid database/ORM combination: ${database} + ${orm}`,
    "",
    allowed.length > 0
      ? `For ${database}, supported ORMs: ${allowed.join(", ")}`
      : "No ORM options for this database.",
    "",
    "See stack matrix (PostgreSQL/MySQL/MongoDB/SQLite × Prisma/Drizzle/Mongoose).",
  ].join("\n");
}

/**
 * Path aliases for Express generators.
 * Code-architecture preference is stored in root.json `architectureDetail`;
 * folder remaps for feature-based/clean ship with dedicated templates later —
 * until then all Express stacks use the layered path contract so add/doctor work.
 */
export function aliasesForCodeArchitecture(
  _code: RootJson["architecture"],
  language: "typescript" | "javascript",
): Partial<RootJson["aliases"]> {
  const ext = language === "javascript" ? "js" : "ts";
  return {
    routes: "src/routes",
    controllers: "src/controllers",
    services: "src/services",
    middleware: "src/middleware",
    schema: `src/schema.${ext}`,
    server: `src/server.${ext}`,
    db: "src/db",
  };
}
