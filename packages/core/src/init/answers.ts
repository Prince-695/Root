import { type RootJson, createRootJsonFixture } from "../config/root-json.js";
import { defaultSourceAliases } from "../providers/language.js";
import { invalidComboMessage, isValidCombo } from "./stack-matrix.js";

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

/** Default path (`root init --yes`): Postgres + Prisma. */
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

export function createInitAnswers(
  projectName: string,
  overrides: Partial<InitAnswers> = {},
): InitAnswers {
  return { ...createGoldenInitAnswers(projectName), ...overrides, projectName };
}

function isExpressLayeredZod(answers: InitAnswers): boolean {
  return (
    answers.framework === "express" &&
    answers.architecture === "layered-mvc" &&
    answers.validation === "zod" &&
    isValidCombo(answers.database, answers.orm)
  );
}

/** Express TS layered stack with a valid DB×ORM combo. */
export function isSupportedExpressTsStack(answers: InitAnswers): boolean {
  return answers.language === "typescript" && isExpressLayeredZod(answers);
}

/** Express JS layered stack with a valid DB×ORM combo. */
export function isSupportedExpressJsStack(answers: InitAnswers): boolean {
  return answers.language === "javascript" && isExpressLayeredZod(answers);
}

export function isSupportedExpressStack(answers: InitAnswers): boolean {
  return isSupportedExpressTsStack(answers) || isSupportedExpressJsStack(answers);
}

/** @deprecated Use isSupportedExpressTsStack */
export const isPhase2SupportedStack = isSupportedExpressTsStack;

export function unsupportedStackMessage(answers: InitAnswers): string {
  if (
    (answers.language !== "typescript" && answers.language !== "javascript") ||
    answers.framework !== "express" ||
    answers.architecture !== "layered-mvc"
  ) {
    return [
      "This language/framework/architecture is not generated yet.",
      "",
      `Requested: ${answers.language} / ${answers.framework} / ${answers.architecture}`,
      "Supported now: typescript|javascript / express / layered-mvc",
    ].join("\n");
  }

  if (!isValidCombo(answers.database, answers.orm)) {
    return invalidComboMessage(answers.database, answers.orm);
  }

  return [
    "Unsupported stack combination.",
    "",
    `Requested: ${answers.language} / ${answers.framework} / ${answers.database} / ${answers.orm}`,
  ].join("\n");
}

export function answersToRootJson(answers: InitAnswers): RootJson {
  const sourceAliases = defaultSourceAliases(answers.language);
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
    aliases: {
      schema: sourceAliases.schema,
      server: sourceAliases.server,
    },
    modules: {},
  });
}
