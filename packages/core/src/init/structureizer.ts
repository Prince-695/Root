import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeRootJson } from "../config/root-json.js";
import { renderTemplateFile } from "../templates/renderer.js";
import {
  type InitAnswers,
  answersToRootJson,
  isPhase2SupportedStack,
  unsupportedStackMessage,
} from "./answers.js";

export type StructureizeResult = {
  filesWritten: string[];
  rootJsonPath: string;
};

type TemplateSpec = {
  /** Path relative to templates/express-ts */
  template: string;
  /** Output path relative to project root */
  output: string;
  /** If false, skip when answers.docker is false, etc. */
  when?: (answers: InitAnswers) => boolean;
};

const EXPRESS_TS_TEMPLATES: TemplateSpec[] = [
  { template: "package.json.hbs", output: "package.json" },
  { template: "tsconfig.json.hbs", output: "tsconfig.json" },
  { template: "gitignore.hbs", output: ".gitignore" },
  { template: "env.example.hbs", output: ".env.example" },
  { template: "README.md.hbs", output: "README.md" },
  { template: "prisma/schema.prisma.hbs", output: "prisma/schema.prisma" },
  { template: "src/index.ts.hbs", output: "src/index.ts" },
  { template: "src/server.ts.hbs", output: "src/server.ts" },
  { template: "src/config/env.ts.hbs", output: "src/config/env.ts" },
  { template: "src/db/prisma.ts.hbs", output: "src/db/prisma.ts" },
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
    template: "docker-compose.yml.hbs",
    output: "docker-compose.yml",
    when: (a) => a.docker,
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
  // dist/init → package root
  return path.join(here, "..", "..", "templates", "express-ts");
}

export async function structureizeExpressTs(options: {
  targetDir: string;
  answers: InitAnswers;
}): Promise<StructureizeResult> {
  const { targetDir, answers } = options;

  if (!isPhase2SupportedStack(answers)) {
    throw new Error(unsupportedStackMessage(answers));
  }

  const templatesRoot = getExpressTsTemplatesRoot();
  const context = {
    projectName: answers.projectName,
    authJwt: answers.auth === "jwt",
    testingVitest: answers.testing === "vitest",
    docker: answers.docker,
    githubActions: answers.githubActions,
    routesAnchor: "[ROOT-INJECT:ROUTES]",
  };

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
