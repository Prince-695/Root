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
  structureize?(options: {
    targetDir: string;
    answers: InitAnswers;
  }): Promise<StructureizeResult>;
  isSupported(answers: InitAnswers): boolean;
  unsupportedMessage(answers: InitAnswers): string;
};
