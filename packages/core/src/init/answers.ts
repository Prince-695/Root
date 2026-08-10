import {
  type ApplicationArchitecture,
  type CodeArchitecture,
  type PackageManagerName,
  type RootJson,
  createRootJsonFixture,
} from "../config/root-json.js";
import { aliasesForCodeArchitecture, invalidComboMessage, isValidCombo } from "./stack-matrix.js";

export type InitAnswers = {
  projectName: string;
  language: RootJson["language"];
  framework: RootJson["framework"];
  architecture: CodeArchitecture;
  applicationArchitecture: ApplicationArchitecture;
  database: RootJson["database"];
  orm: RootJson["orm"];
  auth: RootJson["auth"];
  validation: RootJson["validation"];
  testing: RootJson["testing"];
  packageManager: PackageManagerName;
  docker: boolean;
  githubActions: boolean;
  /** When true, only write root.json + missing safe files (existing package.json). */
  adoptExisting?: boolean;
};

const GENERATABLE_CODE_ARCH = new Set<CodeArchitecture>([
  "minimal",
  "layered-mvc",
  "mvc",
  "feature-based",
  "clean",
]);

/** Default path (`root init --yes`): monolithic + minimal code layout. */
export function createGoldenInitAnswers(projectName: string): InitAnswers {
  return {
    projectName,
    language: "typescript",
    framework: "express",
    architecture: "minimal",
    applicationArchitecture: "monolithic",
    database: "postgresql",
    orm: "prisma",
    auth: "none",
    validation: "zod",
    testing: "vitest",
    packageManager: "pnpm",
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

function isExpressNodeStack(answers: InitAnswers): boolean {
  return (
    (answers.language === "typescript" || answers.language === "javascript") &&
    answers.framework === "express" &&
    GENERATABLE_CODE_ARCH.has(answers.architecture) &&
    answers.validation === "zod" &&
    isValidCombo(answers.database, answers.orm)
  );
}

/** Express TS layered stack with a valid DB×ORM combo. */
export function isSupportedExpressTsStack(answers: InitAnswers): boolean {
  return answers.language === "typescript" && isExpressNodeStack(answers);
}

/** Express JS layered stack with a valid DB×ORM combo. */
export function isSupportedExpressJsStack(answers: InitAnswers): boolean {
  return answers.language === "javascript" && isExpressNodeStack(answers);
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
    !GENERATABLE_CODE_ARCH.has(answers.architecture)
  ) {
    return [
      "This language/framework/architecture is not generated yet.",
      "",
      `Requested: ${answers.language} / ${answers.framework} / ${answers.architecture}`,
      "Supported now: typescript|javascript / express / minimal|layered-mvc|mvc|feature-based|clean",
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
  const lang =
    answers.language === "javascript" || answers.language === "typescript"
      ? answers.language
      : "typescript";
  const archAliases = aliasesForCodeArchitecture(answers.architecture, lang);
  return createRootJsonFixture({
    projectName: answers.projectName,
    language: answers.language,
    framework: answers.framework,
    architecture: answers.architecture,
    architectureDetail: {
      application: answers.applicationArchitecture,
      code: answers.architecture,
    },
    database: answers.database,
    orm: answers.orm,
    auth: answers.auth,
    validation: answers.validation,
    testing: answers.testing,
    packageManager: answers.packageManager,
    features: {
      docker: answers.docker,
      githubActions: answers.githubActions,
      kubernetes: false,
    },
    aliases: archAliases,
    modules: {},
  });
}
