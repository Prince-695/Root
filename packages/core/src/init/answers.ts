import { type RootJson, createRootJsonFixture } from "../config/root-json.js";

export type InitAnswers = {
  projectName: string;
  language: RootJson["language"];
  framework: RootJson["framework"];
  architecture: RootJson["architecture"];
  database: RootJson["database"];
  orm: RootJson["orm"];
  auth: RootJson["auth"];
  validation: RootJson["validation"];
  testing: RootJson["testing"];
  docker: boolean;
  githubActions: boolean;
};

/** Phase 2 golden path defaults (`root init --yes`). */
export function createGoldenInitAnswers(projectName: string): InitAnswers {
  return {
    projectName,
    language: "typescript",
    framework: "express",
    architecture: "layered-mvc",
    database: "postgresql",
    orm: "prisma",
    auth: "none",
    validation: "zod",
    testing: "vitest",
    docker: true,
    githubActions: false,
  };
}

export function isPhase2SupportedStack(answers: InitAnswers): boolean {
  return (
    answers.language === "typescript" &&
    answers.framework === "express" &&
    answers.architecture === "layered-mvc" &&
    answers.database === "postgresql" &&
    answers.orm === "prisma" &&
    answers.validation === "zod"
  );
}

export function unsupportedStackMessage(answers: InitAnswers): string {
  return [
    "This stack combination is not generated yet (Phase 2 golden path only).",
    "",
    `Requested: ${answers.language} / ${answers.framework} / ${answers.database} / ${answers.orm}`,
    "Supported now: typescript / express / postgresql / prisma / layered-mvc",
    "",
    "Other databases and ORMs arrive in Phase 3.",
  ].join("\n");
}

export function answersToRootJson(answers: InitAnswers): RootJson {
  return createRootJsonFixture({
    projectName: answers.projectName,
    language: answers.language,
    framework: answers.framework,
    architecture: answers.architecture,
    database: answers.database,
    orm: answers.orm,
    auth: answers.auth,
    validation: answers.validation,
    testing: answers.testing,
    features: {
      docker: answers.docker,
      githubActions: answers.githubActions,
    },
    modules: answers.auth === "jwt" ? {} : {},
  });
}
