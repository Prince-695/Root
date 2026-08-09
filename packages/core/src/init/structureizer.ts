import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { writeRootJson } from "../config/root-json.js";
import { resolveTemplatesRoot } from "../providers/templates-root.js";
import { renderTemplateFile } from "../templates/renderer.js";
import {
  type InitAnswers,
  answersToRootJson,
  isSupportedExpressJsStack,
  isSupportedExpressTsStack,
  unsupportedStackMessage,
} from "./answers.js";
import { buildStackTemplateContext } from "./stack-matrix.js";

export type StructureizeResult = {
  filesWritten: string[];
  rootJsonPath: string;
};

type TemplateSpec = {
  template: string;
  output: string;
  when?: (answers: InitAnswers) => boolean;
};

const EXPRESS_TS_TEMPLATES: TemplateSpec[] = [
  { template: "package.json.hbs", output: "package.json" },
  { template: "tsconfig.json.hbs", output: "tsconfig.json" },
  { template: "gitignore.hbs", output: ".gitignore" },
  { template: "env.example.hbs", output: ".env.example" },
  { template: "README.md.hbs", output: "README.md" },
  { template: "src/index.ts.hbs", output: "src/index.ts" },
  { template: "src/server.ts.hbs", output: "src/server.ts" },
  { template: "src/config/env.ts.hbs", output: "src/config/env.ts" },
  { template: "src/schema.ts.hbs", output: "src/schema.ts" },
  { template: "src/utils/logger.ts.hbs", output: "src/utils/logger.ts" },
  { template: "src/middleware/errorHandler.ts.hbs", output: "src/middleware/errorHandler.ts" },
  { template: "src/middleware/logger.ts.hbs", output: "src/middleware/logger.ts" },
  { template: "src/middleware/validate.ts.hbs", output: "src/middleware/validate.ts" },
  {
    template: "src/controllers/health.controller.ts.hbs",
    output: "src/controllers/health.controller.ts",
  },
  { template: "src/routes/health.routes.ts.hbs", output: "src/routes/health.routes.ts" },
  { template: "src/routes/index.ts.hbs", output: "src/routes/index.ts" },
  {
    template: "src/db/prisma.ts.hbs",
    output: "src/db/client.ts",
    when: (a) => a.orm === "prisma",
  },
  {
    template: "src/db/drizzle.ts.hbs",
    output: "src/db/client.ts",
    when: (a) => a.orm === "drizzle",
  },
  {
    template: "src/db/mongoose.ts.hbs",
    output: "src/db/client.ts",
    when: (a) => a.orm === "mongoose",
  },
  {
    template: "src/db/none.ts.hbs",
    output: "src/db/client.ts",
    when: (a) => a.orm === "none",
  },
  {
    template: "prisma/schema.prisma.hbs",
    output: "prisma/schema.prisma",
    when: (a) => a.orm === "prisma",
  },
  {
    template: "drizzle/schema.ts.hbs",
    output: "src/db/schema.ts",
    when: (a) => a.orm === "drizzle",
  },
  {
    template: "drizzle.config.ts.hbs",
    output: "drizzle.config.ts",
    when: (a) => a.orm === "drizzle",
  },
  {
    template: "src/models/.gitkeep.hbs",
    output: "src/models/.gitkeep",
    when: (a) => a.orm === "mongoose",
  },
  {
    template: "docker-compose.yml.hbs",
    output: "docker-compose.yml",
    when: (a) => a.docker && a.database !== "none",
  },
  {
    template: "github/workflows/ci.yml.hbs",
    output: ".github/workflows/ci.yml",
    when: (a) => a.githubActions,
  },
  {
    template: "vitest.config.ts.hbs",
    output: "vitest.config.ts",
    when: (a) => a.testing === "vitest",
  },
  {
    template: "tests/health.test.ts.hbs",
    output: "tests/health.test.ts",
    when: (a) => a.testing === "vitest",
  },
];

const EXPRESS_JS_TEMPLATES: TemplateSpec[] = [
  { template: "package.json.hbs", output: "package.json" },
  { template: "gitignore.hbs", output: ".gitignore" },
  { template: "env.example.hbs", output: ".env.example" },
  { template: "README.md.hbs", output: "README.md" },
  { template: "src/index.js.hbs", output: "src/index.js" },
  { template: "src/server.js.hbs", output: "src/server.js" },
  { template: "src/config/env.js.hbs", output: "src/config/env.js" },
  { template: "src/schema.js.hbs", output: "src/schema.js" },
  { template: "src/utils/logger.js.hbs", output: "src/utils/logger.js" },
  { template: "src/middleware/errorHandler.js.hbs", output: "src/middleware/errorHandler.js" },
  { template: "src/middleware/logger.js.hbs", output: "src/middleware/logger.js" },
  { template: "src/middleware/validate.js.hbs", output: "src/middleware/validate.js" },
  {
    template: "src/controllers/health.controller.js.hbs",
    output: "src/controllers/health.controller.js",
  },
  { template: "src/routes/health.routes.js.hbs", output: "src/routes/health.routes.js" },
  { template: "src/routes/index.js.hbs", output: "src/routes/index.js" },
  {
    template: "src/db/prisma.js.hbs",
    output: "src/db/client.js",
    when: (a) => a.orm === "prisma",
  },
  {
    template: "src/db/drizzle.js.hbs",
    output: "src/db/client.js",
    when: (a) => a.orm === "drizzle",
  },
  {
    template: "src/db/mongoose.js.hbs",
    output: "src/db/client.js",
    when: (a) => a.orm === "mongoose",
  },
  {
    template: "src/db/none.js.hbs",
    output: "src/db/client.js",
    when: (a) => a.orm === "none",
  },
  {
    template: "prisma/schema.prisma.hbs",
    output: "prisma/schema.prisma",
    when: (a) => a.orm === "prisma",
  },
  {
    template: "drizzle/schema.js.hbs",
    output: "src/db/schema.js",
    when: (a) => a.orm === "drizzle",
  },
  {
    template: "drizzle.config.js.hbs",
    output: "drizzle.config.js",
    when: (a) => a.orm === "drizzle",
  },
  {
    template: "src/models/.gitkeep.hbs",
    output: "src/models/.gitkeep",
    when: (a) => a.orm === "mongoose",
  },
  {
    template: "docker-compose.yml.hbs",
    output: "docker-compose.yml",
    when: (a) => a.docker && a.database !== "none",
  },
  {
    template: "github/workflows/ci.yml.hbs",
    output: ".github/workflows/ci.yml",
    when: (a) => a.githubActions,
  },
  {
    template: "vitest.config.js.hbs",
    output: "vitest.config.js",
    when: (a) => a.testing === "vitest",
  },
  {
    template: "tests/health.test.js.hbs",
    output: "tests/health.test.js",
    when: (a) => a.testing === "vitest",
  },
];

async function structureizeFromTemplates(options: {
  targetDir: string;
  answers: InitAnswers;
  templatesRoot: string;
  templates: TemplateSpec[];
}): Promise<StructureizeResult> {
  const { targetDir, answers, templatesRoot, templates } = options;
  const context = buildStackTemplateContext({
    projectName: answers.projectName,
    database: answers.database,
    orm: answers.orm,
    auth: answers.auth,
    testing: answers.testing,
    docker: answers.docker,
    githubActions: answers.githubActions,
  });

  const filesWritten: string[] = [];

  for (const spec of templates) {
    if (spec.when && !spec.when(answers)) continue;

    const templatePath = path.join(templatesRoot, spec.template);
    const outputPath = path.join(targetDir, spec.output);
    await mkdir(path.dirname(outputPath), { recursive: true });
    const rendered = await renderTemplateFile(templatePath, context);
    await writeFile(outputPath, rendered, "utf8");
    filesWritten.push(spec.output);
  }

  const rootJson = answersToRootJson(answers);
  const rootJsonPath = await writeRootJson(targetDir, rootJson);
  filesWritten.push("root.json");

  for (const key of ["routes", "controllers", "services", "middleware", "db"] as const) {
    await mkdir(path.join(targetDir, rootJson.aliases[key]), { recursive: true });
  }

  return { filesWritten, rootJsonPath };
}

export function getExpressTsTemplatesRoot(): string {
  return resolveTemplatesRoot("express-ts");
}

export function getExpressJsTemplatesRoot(): string {
  return resolveTemplatesRoot("express-js");
}

export async function structureizeExpressTs(options: {
  targetDir: string;
  answers: InitAnswers;
}): Promise<StructureizeResult> {
  const { targetDir, answers } = options;

  if (!isSupportedExpressTsStack(answers)) {
    throw new Error(unsupportedStackMessage(answers));
  }

  return structureizeFromTemplates({
    targetDir,
    answers,
    templatesRoot: getExpressTsTemplatesRoot(),
    templates: EXPRESS_TS_TEMPLATES,
  });
}

export async function structureizeExpressJs(options: {
  targetDir: string;
  answers: InitAnswers;
}): Promise<StructureizeResult> {
  const { targetDir, answers } = options;

  if (!isSupportedExpressJsStack(answers)) {
    throw new Error(unsupportedStackMessage(answers));
  }

  return structureizeFromTemplates({
    targetDir,
    answers,
    templatesRoot: getExpressJsTemplatesRoot(),
    templates: EXPRESS_JS_TEMPLATES,
  });
}
