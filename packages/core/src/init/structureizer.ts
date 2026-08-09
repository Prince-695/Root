import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeRootJson } from "../config/root-json.js";
import { renderTemplateFile } from "../templates/renderer.js";
import {
  type InitAnswers,
  answersToRootJson,
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

  // DB clients
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

  // Prisma schema
  {
    template: "prisma/schema.prisma.hbs",
    output: "prisma/schema.prisma",
    when: (a) => a.orm === "prisma",
  },

  // Drizzle
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

  // Mongoose model placeholder
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

export function getExpressTsTemplatesRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, "..", "..", "templates", "express-ts");
}

export async function structureizeExpressTs(options: {
  targetDir: string;
  answers: InitAnswers;
}): Promise<StructureizeResult> {
  const { targetDir, answers } = options;

  if (!isSupportedExpressTsStack(answers)) {
    throw new Error(unsupportedStackMessage(answers));
  }

  const templatesRoot = getExpressTsTemplatesRoot();
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

  for (const spec of EXPRESS_TS_TEMPLATES) {
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

  return { filesWritten, rootJsonPath };
}
