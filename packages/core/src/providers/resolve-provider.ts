import type { RootJson } from "../config/root-json.js";
import {
  type InitAnswers,
  isSupportedExpressJsStack,
  isSupportedExpressTsStack,
  unsupportedStackMessage,
} from "../init/answers.js";
import { isValidCombo } from "../init/stack-matrix.js";
import { structureizeExpressJs, structureizeExpressTs } from "../init/structureizer.js";
import { fastapiModuleFiles, planFastapiAuth, planFastapiResource } from "./fastapi-recipes.js";
import { flaskModuleFiles, planFlaskAuth, planFlaskResource } from "./flask-recipes.js";
import { goModuleFiles, planGoAuth, planGoResource } from "./go-recipes.js";
import { structureizeGrpcTs, structureizeHonoTs, structureizeNestjsTs } from "./node-extra.js";
import { structureizeFastapi, structureizeFlask, structureizeGoHttp } from "./non-node.js";
import type { StackProvider, StackProviderId } from "./types.js";

const expressTsProvider: StackProvider = {
  id: "express-ts",
  label: "Express + TypeScript",
  status: "ready",
  language: "typescript",
  framework: "express",
  supportsStructureize: true,
  forbidsNodeProjectFiles: false,
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
  forbidsNodeProjectFiles: false,
  isSupported: isSupportedExpressJsStack,
  unsupportedMessage: unsupportedStackMessage,
  structureize: structureizeExpressJs,
};

function nodeExtraProvider(
  id: StackProviderId,
  label: string,
  framework: StackProvider["framework"],
  structureize: NonNullable<StackProvider["structureize"]>,
): StackProvider {
  return {
    id,
    label,
    status: "ready",
    language: "typescript",
    framework,
    supportsStructureize: true,
    forbidsNodeProjectFiles: false,
    structureize,
    isSupported: (a) =>
      a.language === "typescript" && a.framework === framework && isValidCombo(a.database, a.orm),
    unsupportedMessage: (a) =>
      `${label} requires TypeScript + valid DB/ORM. Requested: ${a.language}/${a.framework}/${a.database}/${a.orm}`,
  };
}

function nonNodeProvider(
  id: StackProviderId,
  label: string,
  language: StackProvider["language"],
  framework: StackProvider["framework"],
  structureize: NonNullable<StackProvider["structureize"]>,
  ormOk: (orm: InitAnswers["orm"]) => boolean,
  extras: Pick<StackProvider, "planAuth" | "planResource" | "moduleFiles">,
): StackProvider {
  const provider: StackProvider = {
    id,
    label,
    status: "ready",
    language,
    framework,
    supportsStructureize: true,
    forbidsNodeProjectFiles: true,
    structureize,
    isSupported: (a) => a.language === language && a.framework === framework && ormOk(a.orm),
    unsupportedMessage: (a) =>
      `${label} stack mismatch. Requested: ${a.language}/${a.framework}/${a.orm}`,
  };
  if (extras.planAuth) provider.planAuth = extras.planAuth;
  if (extras.planResource) provider.planResource = extras.planResource;
  if (extras.moduleFiles) provider.moduleFiles = extras.moduleFiles;
  return provider;
}

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
    forbidsNodeProjectFiles: language !== "typescript" && language !== "javascript",
    isSupported: () => false,
    unsupportedMessage: () =>
      [
        `${label} is not available yet.`,
        "",
        "Supported now: Express, Hono, NestJS, gRPC (TS), FastAPI, Flask, Go net/http.",
      ].join("\n"),
  };
}

const PROVIDERS: StackProvider[] = [
  expressTsProvider,
  expressJsProvider,
  nodeExtraProvider("hono-ts", "Hono + TypeScript", "hono", structureizeHonoTs),
  nodeExtraProvider("nestjs-ts", "NestJS + TypeScript", "nestjs", structureizeNestjsTs),
  nodeExtraProvider("grpc-ts", "gRPC + TypeScript", "grpc", structureizeGrpcTs),
  nonNodeProvider(
    "fastapi",
    "Python FastAPI",
    "python",
    "fastapi",
    structureizeFastapi,
    (orm) => ["sqlalchemy", "none"].includes(orm),
    {
      planAuth: planFastapiAuth,
      planResource: planFastapiResource,
      moduleFiles: fastapiModuleFiles,
    },
  ),
  nonNodeProvider(
    "flask",
    "Python Flask",
    "python",
    "flask",
    structureizeFlask,
    (orm) => ["sqlalchemy", "none"].includes(orm),
    {
      planAuth: planFlaskAuth,
      planResource: planFlaskResource,
      moduleFiles: flaskModuleFiles,
    },
  ),
  nonNodeProvider(
    "go-http",
    "Go net/http",
    "go",
    "go-http",
    structureizeGoHttp,
    (orm) => ["gorm", "none"].includes(orm),
    {
      planAuth: planGoAuth,
      planResource: planGoResource,
      moduleFiles: goModuleFiles,
    },
  ),
  plannedProvider("fastify-ts", "Fastify + TypeScript", "typescript", "fastify"),
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

/** Resolve provider from an existing project's root.json. */
export function getStackProviderForConfig(
  config: Pick<RootJson, "language" | "framework">,
): StackProvider {
  if (config.language === "javascript" && config.framework === "express") {
    return expressJsProvider;
  }
  if (config.language === "typescript" && config.framework === "express") {
    return expressTsProvider;
  }
  if (config.framework === "hono") return getStackProvider("hono-ts");
  if (config.framework === "nestjs") return getStackProvider("nestjs-ts");
  if (config.framework === "grpc") return getStackProvider("grpc-ts");
  if (config.framework === "fastapi") return getStackProvider("fastapi");
  if (config.framework === "flask") return getStackProvider("flask");
  if (config.framework === "go-http") return getStackProvider("go-http");
  if (config.framework === "fastify") return getStackProvider("fastify-ts");
  if (config.framework === "spring") return getStackProvider("spring-boot");
  return expressTsProvider;
}

/** Pick the provider that should structureize these init answers. */
export function resolveStackProvider(answers: InitAnswers): StackProvider {
  if (answers.language === "javascript" && answers.framework === "express") {
    return expressJsProvider;
  }
  if (answers.language === "typescript" && answers.framework === "express") {
    return expressTsProvider;
  }
  if (answers.framework === "hono") return getStackProvider("hono-ts");
  if (answers.framework === "nestjs") return getStackProvider("nestjs-ts");
  if (answers.framework === "grpc") return getStackProvider("grpc-ts");
  if (answers.framework === "fastapi") return getStackProvider("fastapi");
  if (answers.framework === "flask") return getStackProvider("flask");
  if (answers.framework === "go-http") return getStackProvider("go-http");
  if (answers.framework === "fastify") return getStackProvider("fastify-ts");
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
