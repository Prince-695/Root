import * as p from "@clack/prompts";
import {
  type Database,
  type InitAnswers,
  type Orm,
  createGoldenInitAnswers,
  isSupportedStack,
  ormOptionsForDatabase,
  unsupportedStackMessage,
} from "@root/core";

function ormLabel(orm: Orm): string {
  switch (orm) {
    case "prisma":
      return "Prisma";
    case "drizzle":
      return "Drizzle";
    case "mongoose":
      return "Mongoose";
    case "sqlalchemy":
      return "SQLAlchemy";
    case "gorm":
      return "GORM";
    default:
      return "None";
  }
}

function dockerHint(database: Database): string {
  switch (database) {
    case "postgresql":
      return "Docker Compose (Postgres)";
    case "mysql":
      return "Docker Compose (MySQL)";
    case "mongodb":
      return "Docker Compose (MongoDB)";
    default:
      return "Docker Compose";
  }
}

function ormChoicesFor(language: string, database: Database): Orm[] {
  if (language === "python") {
    return database === "none" ? ["none"] : ["sqlalchemy", "none"];
  }
  if (language === "go") {
    return database === "none" || database === "mongodb" ? ["none"] : ["gorm", "none"];
  }
  return ormOptionsForDatabase(database);
}

export async function runInitWizard(projectName: string): Promise<InitAnswers | null> {
  p.intro("Root — project setup");

  const language = await p.select({
    message: "Select your language / runtime:",
    options: [
      { value: "typescript", label: "Node.js (TypeScript)", hint: "Recommended" },
      { value: "javascript", label: "Node.js (JavaScript)", hint: "ESM Express" },
      { value: "python", label: "Python", hint: "FastAPI / Flask — no Node project files" },
      { value: "go", label: "Go", hint: "net/http — no Node project files" },
    ],
  });
  if (p.isCancel(language)) {
    p.cancel("Init cancelled.");
    return null;
  }

  const frameworkOptions =
    language === "python"
      ? [
          { value: "fastapi", label: "FastAPI" },
          { value: "flask", label: "Flask" },
        ]
      : language === "go"
        ? [{ value: "go-http", label: "net/http (stdlib)" }]
        : [
            { value: "express", label: "Express" },
            { value: "hono", label: "Hono" },
            { value: "nestjs", label: "NestJS" },
            { value: "grpc", label: "gRPC (JS/TS)" },
            { value: "fastify", label: "Fastify", hint: "Coming later", disabled: true },
          ];

  const framework = await p.select({
    message: "Select your framework:",
    options: frameworkOptions,
  });
  if (p.isCancel(framework)) {
    p.cancel("Init cancelled.");
    return null;
  }

  const applicationArchitecture = await p.select({
    message: "Application architecture:",
    options: [
      { value: "monolithic", label: "Monolithic", hint: "Single deployable" },
      {
        value: "modular-monolith",
        label: "Modular monolith",
        hint: "Coming soon",
        disabled: true,
      },
      { value: "microservices", label: "Microservices", hint: "Needs monorepo", disabled: true },
    ],
  });
  if (p.isCancel(applicationArchitecture)) {
    p.cancel("Init cancelled.");
    return null;
  }

  const architecture = await p.select({
    message: "Code architecture:",
    options: [
      { value: "minimal", label: "Minimal", hint: "Recommended — flat app, health inline" },
      { value: "layered-mvc", label: "Layered MVC", hint: "routes → controllers → services" },
      { value: "mvc", label: "MVC", hint: "Same layered contract" },
      {
        value: "feature-based",
        label: "Feature-based",
        hint: "Preference stored; layered paths for now",
      },
      {
        value: "clean",
        label: "Clean Architecture",
        hint: "Preference stored; layered paths for now",
      },
      { value: "hexagonal", label: "Hexagonal", hint: "Coming soon", disabled: true },
      { value: "ddd", label: "DDD", hint: "Coming soon", disabled: true },
    ],
    initialValue: "minimal",
  });
  if (p.isCancel(architecture)) {
    p.cancel("Init cancelled.");
    return null;
  }

  const database = await p.select({
    message: "Select database:",
    options: [
      { value: "postgresql", label: "PostgreSQL" },
      { value: "mysql", label: "MySQL" },
      { value: "mongodb", label: "MongoDB" },
      { value: "sqlite", label: "SQLite", hint: "File DB — no Docker service" },
      { value: "none", label: "None" },
    ],
  });
  if (p.isCancel(database)) {
    p.cancel("Init cancelled.");
    return null;
  }

  const db = database as Database;
  const ormChoices = ormChoicesFor(language as string, db);
  const orm = await p.select({
    message: "Select ORM / data layer:",
    options: ormChoices.map((value) => {
      const option: { value: Orm; label: string; hint?: string } = {
        value,
        label: ormLabel(value),
      };
      if (value === "none") option.hint = "No ORM";
      return option;
    }) as { value: Orm; label: string; hint?: string }[],
  });
  if (p.isCancel(orm)) {
    p.cancel("Init cancelled.");
    return null;
  }

  const isNode = language === "typescript" || language === "javascript";
  const packageManager = await p.select({
    message: "Package / dependency manager:",
    options: isNode
      ? [
          { value: "pnpm", label: "pnpm", hint: "Recommended" },
          { value: "npm", label: "npm" },
          { value: "yarn", label: "yarn" },
          { value: "bun", label: "bun" },
        ]
      : language === "python"
        ? [
            { value: "pip", label: "pip" },
            { value: "uv", label: "uv" },
          ]
        : [{ value: "go-mod", label: "go mod" }],
  });
  if (p.isCancel(packageManager)) {
    p.cancel("Init cancelled.");
    return null;
  }

  let auth: InitAnswers["auth"] = "none";
  let testing: InitAnswers["testing"] = isNode
    ? "vitest"
    : language === "python"
      ? "pytest"
      : "none";

  if (isNode) {
    const authSel = await p.select({
      message: "Authentication:",
      options: [
        { value: "none", label: "None", hint: "Add later with root add auth" },
        { value: "jwt", label: "JWT", hint: "Express path" },
      ],
    });
    if (p.isCancel(authSel)) {
      p.cancel("Init cancelled.");
      return null;
    }
    auth = authSel as InitAnswers["auth"];

    const testingSel = await p.select({
      message: "Testing setup:",
      options: [
        { value: "vitest", label: "Vitest" },
        { value: "none", label: "None" },
      ],
    });
    if (p.isCancel(testingSel)) {
      p.cancel("Init cancelled.");
      return null;
    }
    testing = testingSel as InitAnswers["testing"];
  }

  const extraOptions = [
    ...(isNode && db !== "none" && db !== "sqlite"
      ? [{ value: "docker", label: dockerHint(db), hint: "Recommended" }]
      : []),
    ...(isNode ? [{ value: "githubActions", label: "GitHub Actions CI" }] : []),
  ];

  let docker = false;
  let githubActions = false;
  if (extraOptions.length > 0) {
    const extras = await p.multiselect({
      message: "Extras (Space to select, Enter to confirm):",
      options: extraOptions,
      required: false,
    });
    if (p.isCancel(extras)) {
      p.cancel("Init cancelled.");
      return null;
    }
    docker = extras.includes("docker");
    githubActions = extras.includes("githubActions");
  }

  const answers: InitAnswers = {
    projectName,
    language: language as InitAnswers["language"],
    framework: framework as InitAnswers["framework"],
    architecture: architecture as InitAnswers["architecture"],
    applicationArchitecture: applicationArchitecture as InitAnswers["applicationArchitecture"],
    database: db,
    orm: orm as Orm,
    auth,
    validation: language === "python" ? "pydantic" : isNode ? "zod" : "none",
    testing,
    packageManager: packageManager as InitAnswers["packageManager"],
    docker,
    githubActions,
  };

  if (!isSupportedStack(answers)) {
    p.log.error(
      answers.framework === "express"
        ? unsupportedStackMessage(answers)
        : `Unsupported stack: ${answers.language}/${answers.framework}/${answers.database}/${answers.orm}`,
    );
    return null;
  }

  p.note(
    [
      `Name: ${answers.projectName}`,
      `Stack: ${answers.language} / ${answers.framework}`,
      `Architecture: ${answers.applicationArchitecture} + ${answers.architecture}`,
      `Data: ${answers.database} / ${answers.orm}`,
      `Package manager: ${answers.packageManager}`,
      `Auth: ${answers.auth}`,
      `Testing: ${answers.testing}`,
      `Docker: ${answers.docker ? "yes" : "no"}`,
      `GitHub Actions: ${answers.githubActions ? "yes" : "no"}`,
    ].join("\n"),
    "Summary",
  );

  const confirmed = await p.confirm({
    message: "Generate this project?",
    initialValue: true,
  });
  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel("Init cancelled.");
    return null;
  }

  return answers;
}

export function resolveInitAnswers(projectName: string, yes: boolean): Promise<InitAnswers | null> {
  if (yes) {
    return Promise.resolve(createGoldenInitAnswers(projectName));
  }
  return runInitWizard(projectName);
}
