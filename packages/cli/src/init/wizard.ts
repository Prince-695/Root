import * as p from "@clack/prompts";
import {
  type InitAnswers,
  createGoldenInitAnswers,
  isPhase2SupportedStack,
  unsupportedStackMessage,
} from "@root/core";

export async function runInitWizard(projectName: string): Promise<InitAnswers | null> {
  p.intro("Root — project setup");

  const language = await p.select({
    message: "Select your language / runtime:",
    options: [
      { value: "typescript", label: "Node.js (TypeScript)", hint: "Recommended" },
      { value: "javascript", label: "Node.js (JavaScript)", hint: "Coming soon", disabled: true },
      { value: "python", label: "Python (FastAPI)", hint: "Coming soon", disabled: true },
      { value: "java", label: "Java (Spring Boot)", hint: "Coming soon", disabled: true },
    ],
  });
  if (p.isCancel(language)) {
    p.cancel("Init cancelled.");
    return null;
  }

  const framework = await p.select({
    message: "Select your framework:",
    options: [
      { value: "express", label: "Express", hint: "Phase 2 golden path" },
      { value: "fastify", label: "Fastify", hint: "Coming later", disabled: true },
    ],
  });
  if (p.isCancel(framework)) {
    p.cancel("Init cancelled.");
    return null;
  }

  const architecture = await p.select({
    message: "Select architecture style:",
    options: [
      { value: "layered-mvc", label: "Layered MVC", hint: "routes → controllers → services → db" },
      { value: "minimal", label: "Minimal", hint: "Coming in a later phase", disabled: true },
    ],
  });
  if (p.isCancel(architecture)) {
    p.cancel("Init cancelled.");
    return null;
  }

  const database = await p.select({
    message: "Select database:",
    options: [
      { value: "postgresql", label: "PostgreSQL", hint: "Supported now" },
      { value: "mysql", label: "MySQL", hint: "Phase 3", disabled: true },
      { value: "mongodb", label: "MongoDB", hint: "Phase 3", disabled: true },
      { value: "none", label: "None", hint: "Phase 3", disabled: true },
    ],
  });
  if (p.isCancel(database)) {
    p.cancel("Init cancelled.");
    return null;
  }

  const orm = await p.select({
    message: "Select ORM / ODM:",
    options: [
      { value: "prisma", label: "Prisma", hint: "Supported now" },
      { value: "drizzle", label: "Drizzle", hint: "Phase 3", disabled: true },
      { value: "mongoose", label: "Mongoose", hint: "Phase 3", disabled: true },
      { value: "none", label: "None", hint: "Phase 3", disabled: true },
    ],
  });
  if (p.isCancel(orm)) {
    p.cancel("Init cancelled.");
    return null;
  }

  const auth = await p.select({
    message: "Authentication:",
    options: [
      { value: "none", label: "None", hint: "Add later with root add auth" },
      { value: "jwt", label: "JWT", hint: "Recorded in root.json; full module in Phase 6" },
    ],
  });
  if (p.isCancel(auth)) {
    p.cancel("Init cancelled.");
    return null;
  }

  const testing = await p.select({
    message: "Testing setup:",
    options: [
      { value: "vitest", label: "Vitest" },
      { value: "none", label: "None" },
    ],
  });
  if (p.isCancel(testing)) {
    p.cancel("Init cancelled.");
    return null;
  }

  const extras = await p.multiselect({
    message: "Extras (Space to select, Enter to confirm):",
    options: [
      { value: "docker", label: "Docker Compose (Postgres)", hint: "Recommended" },
      { value: "githubActions", label: "GitHub Actions CI" },
    ],
    required: false,
  });
  if (p.isCancel(extras)) {
    p.cancel("Init cancelled.");
    return null;
  }

  const answers: InitAnswers = {
    projectName,
    language: language as InitAnswers["language"],
    framework: framework as InitAnswers["framework"],
    architecture: architecture as InitAnswers["architecture"],
    database: database as InitAnswers["database"],
    orm: orm as InitAnswers["orm"],
    auth: auth as InitAnswers["auth"],
    validation: "zod",
    testing: testing as InitAnswers["testing"],
    docker: extras.includes("docker"),
    githubActions: extras.includes("githubActions"),
  };

  if (!isPhase2SupportedStack(answers)) {
    p.log.error(unsupportedStackMessage(answers));
    return null;
  }

  p.note(
    [
      `Name: ${answers.projectName}`,
      `Stack: ${answers.language} / ${answers.framework}`,
      `Data: ${answers.database} / ${answers.orm}`,
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
