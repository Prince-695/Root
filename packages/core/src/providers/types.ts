import type { InitAnswers } from "../init/answers.js";
import type { StructureizeResult } from "../init/structureizer.js";

/** Stable provider ids used by templates and docs. */
export type StackProviderId =
  | "express-ts"
  | "express-js"
  | "fastify-ts"
  | "fastapi"
  | "spring-boot";

export type StackProviderStatus = "ready" | "planned";

export type StackProvider = {
  id: StackProviderId;
  label: string;
  status: StackProviderStatus;
  language: InitAnswers["language"] | "python" | "java";
  framework: InitAnswers["framework"] | "fastapi" | "spring";
  /** True when init + add interconnection is implemented. */
  supportsStructureize: boolean;
  structureize?(options: {
    targetDir: string;
    answers: InitAnswers;
  }): Promise<StructureizeResult>;
  isSupported(answers: InitAnswers): boolean;
  unsupportedMessage(answers: InitAnswers): string;
};
