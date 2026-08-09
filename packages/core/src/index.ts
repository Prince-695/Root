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

export {
  hasAuth,
  hasModule,
  listModules,
  loadModuleGraph,
  resolveAliasPath,
  type ModuleGraph,
  type ModuleGraphProbe,
} from "./engine/module-graph.js";

export {
  planInterconnect,
  planSnapshot,
  type PlanRequest,
} from "./engine/interconnect-planner.js";

export {
  stableStringifyOperations,
  type CreateFileOp,
  type EnsureDependencyOp,
  type ModuleEntry,
  type Operation,
  type PatchAnchorOp,
  type PatchAstImportOp,
  type RunCommandOp,
  type UpdateManifestOp,
  type UpdateSchemaAuthOp,
  type UpdateSchemaResourceOp,
  type ZodField,
} from "./engine/operations.js";

export {
  Transaction,
  TransactionError,
  applyOperations,
  type TransactionOptions,
} from "./engine/transaction.js";

export {
  InjectSyntaxError,
  addImport,
  applyAnchorPatch,
  insertAfterAnchor,
  validateSyntax,
} from "./mutators/file-injector.js";

export {
  AUTH_BANNER,
  EXPORTS_BANNER,
  RESOURCE_BANNER,
  appendResourceSchema,
  applySchemaUpdates,
  collectExportNames,
  defaultResourceFields,
  ensureBanners,
  loadSchemaRegistry,
  rewriteExports,
  saveSchemaRegistry,
  writeAuthSchemas,
  type SchemaRegistry,
} from "./mutators/schema-registry.js";

export {
  getRecipe,
  listRecipeIds,
  schemaExportName,
  toCamelCase,
  toPascalCase,
  type Recipe,
  type RecipeContext,
  type RecipeId,
} from "./registry/index.js";

export { ERRORS } from "./errors/messages.js";

export {
  answersToRootJson,
  createGoldenInitAnswers,
  createInitAnswers,
  isPhase2SupportedStack,
  isSupportedExpressTsStack,
  unsupportedStackMessage,
  type InitAnswers,
} from "./init/answers.js";

export {
  SUPPORTED_COMBOS,
  buildStackTemplateContext,
  defaultDatabaseUrl,
  invalidComboMessage,
  isValidCombo,
  ormOptionsForDatabase,
  type Database,
  type Orm,
  type StackCombo,
  type StackTemplateContext,
} from "./init/stack-matrix.js";

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
