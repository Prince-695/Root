import {
  type InitAnswers,
  isSupportedExpressJsStack,
  isSupportedExpressTsStack,
  unsupportedStackMessage,
} from "../init/answers.js";
import { structureizeExpressJs, structureizeExpressTs } from "../init/structureizer.js";
import type { StackProvider, StackProviderId } from "./types.js";

const expressTsProvider: StackProvider = {
  id: "express-ts",
  label: "Express + TypeScript",
  status: "ready",
  language: "typescript",
  framework: "express",
  supportsStructureize: true,
  isSupported: isSupportedExpressTsStack,
  unsupportedMessage: unsupportedStackMessage,
  structureize: structureizeExpressTs,
};

const expressJsProvider: StackProvider = {
  id: "express-js",
  label: "Express + JavaScript",
  status: "ready",
  language: "javascript",
  framework: "express",
  supportsStructureize: true,
  isSupported: isSupportedExpressJsStack,
  unsupportedMessage: unsupportedStackMessage,
  structureize: structureizeExpressJs,
};

function plannedProvider(
  id: StackProviderId,
  label: string,
  language: StackProvider["language"],
  framework: StackProvider["framework"],
): StackProvider {
  return {
    id,
    label,
    status: "planned",
    language,
    framework,
    supportsStructureize: false,
    isSupported: () => false,
    unsupportedMessage: () =>
      [
        `${label} is not available yet.`,
        "",
        "Supported now: Express + TypeScript, Express + JavaScript.",
        "Fastify, FastAPI, and Spring Boot are planned stack providers.",
      ].join("\n"),
  };
}

const PROVIDERS: StackProvider[] = [
  expressTsProvider,
  expressJsProvider,
  plannedProvider("fastify-ts", "Fastify + TypeScript", "typescript", "fastify"),
  plannedProvider("fastapi", "Python FastAPI", "python", "fastapi"),
  plannedProvider("spring-boot", "Java Spring Boot", "java", "spring"),
];

export function listStackProviders(): StackProvider[] {
  return [...PROVIDERS];
}

export function getStackProvider(id: StackProviderId): StackProvider {
  const found = PROVIDERS.find((p) => p.id === id);
  if (!found) {
    throw new Error(`Unknown stack provider: ${id}`);
  }
  return found;
}

/** Pick the provider that should structureize these init answers. */
export function resolveStackProvider(answers: InitAnswers): StackProvider {
  if (answers.language === "javascript" && answers.framework === "express") {
    return expressJsProvider;
  }
  if (answers.language === "typescript" && answers.framework === "express") {
    return expressTsProvider;
  }
  if (answers.framework === "fastify") {
    return getStackProvider("fastify-ts");
  }
  return expressTsProvider;
}

export function isSupportedStack(answers: InitAnswers): boolean {
  return resolveStackProvider(answers).isSupported(answers);
}

export async function structureizeProject(options: {
  targetDir: string;
  answers: InitAnswers;
}): Promise<Awaited<ReturnType<NonNullable<StackProvider["structureize"]>>>> {
  const provider = resolveStackProvider(options.answers);
  if (!provider.supportsStructureize || !provider.structureize) {
    throw new Error(provider.unsupportedMessage(options.answers));
  }
  if (!provider.isSupported(options.answers)) {
    throw new Error(provider.unsupportedMessage(options.answers));
  }
  return provider.structureize(options);
}
