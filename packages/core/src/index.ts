/**
 * @root/core — shared engine surface for the Root CLI.
 */

export const ROOT_ENGINE_NAME = "root" as const;

export const ROOT_ENGINE_VERSION = "0.0.0" as const;

export type RootCommandName = "init" | "add" | "doctor";

export const ROOT_COMMANDS: readonly RootCommandName[] = ["init", "add", "doctor"] as const;

/** Human-readable one-liner used by the CLI welcome/help path. */
export function getEngineBanner(): string {
  return `${ROOT_ENGINE_NAME} v${ROOT_ENGINE_VERSION} — pure-engineering backend scaffolding CLI`;
}

/** Returns true when the value is a known top-level Root command. */
export function isRootCommand(value: string): value is RootCommandName {
  return (ROOT_COMMANDS as readonly string[]).includes(value);
}

export {
  ROOT_JSON_FILENAME,
  RootJsonValidationError,
  createRootJsonFixture,
  loadRootJson,
  parseRootJson,
  rootJsonSchema,
  serializeRootJson,
  writeRootJson,
  type RootJson,
} from "./config/root-json.js";

export {
  SAFE_EMPTY_ENTRIES,
  detectProject,
  isRootJsonValidationError,
  readRootJsonRaw,
  type DetectedProject,
  type ProjectKind,
} from "./engine/detector.js";

export { ERRORS } from "./errors/messages.js";

export {
  answersToRootJson,
  createGoldenInitAnswers,
  isPhase2SupportedStack,
  unsupportedStackMessage,
  type InitAnswers,
} from "./init/answers.js";

export {
  getExpressTsTemplatesRoot,
  structureizeExpressTs,
  type StructureizeResult,
} from "./init/structureizer.js";

export {
  renderTemplateFile,
  renderTemplateString,
  type TemplateContext,
} from "./templates/renderer.js";
