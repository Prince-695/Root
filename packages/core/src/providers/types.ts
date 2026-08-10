import type { RootJson } from "../config/root-json.js";
import type { ModuleGraph } from "../engine/module-graph.js";
import type { Operation } from "../engine/operations.js";
import type { InitAnswers } from "../init/answers.js";
import type { StructureizeResult } from "../init/structureizer.js";

/** Stable provider ids used by templates and docs. */
export type StackProviderId =
  | "express-ts"
  | "express-js"
  | "hono-ts"
  | "nestjs-ts"
  | "grpc-ts"
  | "fastify-ts"
  | "fastapi"
  | "flask"
  | "go-http"
  | "spring-boot";

export type StackProviderStatus = "ready" | "planned";

export type PlanAuthContext = {
  graph: ModuleGraph;
  addedAt: string;
};

export type PlanResourceContext = {
  graph: ModuleGraph;
  resourceName: string;
  addedAt: string;
  mountPath?: string;
};

export type StackProvider = {
  id: StackProviderId;
  label: string;
  status: StackProviderStatus;
  language: InitAnswers["language"];
  framework: InitAnswers["framework"];
  /** True when init + add interconnection is implemented. */
  supportsStructureize: boolean;
  /** True when generated projects must never include Node package files. */
  forbidsNodeProjectFiles: boolean;
  /** Native JWT auth recipes (Python/Go). Express uses registry recipes instead. */
  planAuth?(ctx: PlanAuthContext): Operation[];
  /** Native resource recipes (Python/Go). Express uses registry recipes instead. */
  planResource?(ctx: PlanResourceContext): Operation[];
  /** Expected on-disk paths for a module (doctor). Null/omit → Node defaults. */
  moduleFiles?(
    config: RootJson,
    name: string,
    type: RootJson["modules"][string]["type"],
  ): string[] | null;
  structureize?(options: {
    targetDir: string;
    answers: InitAnswers;
  }): Promise<StructureizeResult>;
  isSupported(answers: InitAnswers): boolean;
  unsupportedMessage(answers: InitAnswers): string;
};
