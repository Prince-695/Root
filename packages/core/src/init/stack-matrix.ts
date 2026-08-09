import type { RootJson } from "../config/root-json.js";

export type Database = RootJson["database"];
export type Orm = RootJson["orm"];

export type StackCombo = {
  database: Database;
  orm: Orm;
};

/** PRD §15.2 — valid Express TS combinations. */
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
  isNoDb: boolean;
  databaseUrlDefault: string;
  prismaProvider: "postgresql" | "mysql" | "mongodb" | null;
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
  const isNoDb = database === "none";

  let prismaProvider: StackTemplateContext["prismaProvider"] = null;
  if (isPrisma) {
    if (isPostgres) prismaProvider = "postgresql";
    else if (isMysql) prismaProvider = "mysql";
    else if (isMongo) prismaProvider = "mongodb";
  }

  let dockerEngine: StackTemplateContext["dockerEngine"] = null;
  if (input.docker && !isNoDb) {
    if (isPostgres) dockerEngine = "postgres";
    else if (isMysql) dockerEngine = "mysql";
    else if (isMongo) dockerEngine = "mongo";
  }

  return {
    projectName,
    authJwt: input.auth === "jwt",
    testingVitest: input.testing === "vitest",
    docker: input.docker,
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
    "See PRD stack matrix (PostgreSQL/MySQL/MongoDB × Prisma/Drizzle/Mongoose).",
  ].join("\n");
}
