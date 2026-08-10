/**
 * @root/core — shared engine surface for the Root CLI.
 */

import { ROOT_ENGINE_NAME, ROOT_ENGINE_VERSION } from "./constants.js";

export {
  ROOT_ENGINE_NAME,
  ROOT_ENGINE_VERSION,
  ROOT_NPM_PACKAGE,
  rootInvoke,
  rootInvokeAll,
} from "./constants.js";

export type RootCommandName =
  | "init"
  | "add"
  | "remove"
  | "list"
  | "inspect"
  | "diff"
  | "doctor"
  | "sync";

export const ROOT_COMMANDS: readonly RootCommandName[] = [
  "init",
  "add",
  "remove",
  "list",
  "inspect",
  "diff",
  "doctor",
  "sync",
] as const;

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
  ROOT_JSON_VERSION,
  RootJsonValidationError,
  createRootJsonFixture,
  loadRootJson,
  migrateRootJsonInput,
  parseRootJson,
  rootJsonSchema,
  serializeRootJson,
  writeRootJson,
  type ApplicationArchitecture,
  type CodeArchitecture,
  type PackageManagerName,
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
  type EnsureTextOp,
  type ModuleEntry,
  type Operation,
  type PatchAnchorOp,
  type PatchAstImportOp,
  type RunCommandOp,
  type UpdateManifestOp,
  type UpdateOrmOp,
  type UpdateSchemaAuthOp,
  type UpdateSchemaResourceOp,
  type ZodField,
} from "./engine/operations.js";

export {
  AddRouteError,
  addRoute,
  type AddRouteOptions,
  type AddRouteResult,
} from "./add/route.js";

export {
  AddAuthError,
  addAuth,
  type AddAuthOptions,
  type AddAuthResult,
} from "./add/auth.js";

export {
  AddAtomicError,
  addAtomic,
  addController,
  addMiddleware,
  addModel,
  addService,
  type AddAtomicOptions,
  type AddAtomicResult,
  type AtomicKind,
} from "./add/atomic.js";

export {
  invalidModuleNameMessage,
  isValidModuleName,
  normalizeModuleName,
} from "./add/names.js";

export {
  appendDrizzleTable,
  appendPrismaModel,
  buildMongooseModelFile,
} from "./mutators/orm-registry.js";

export {
  buildResourceFiles,
  defaultResourceZodFields,
  resolveResourceNames,
  resourceOrmFields,
  type ResourceNames,
} from "./registry/codegen/resource-files.js";

export {
  Transaction,
  TransactionError,
  applyOperations,
  type TransactionOptions,
} from "./engine/transaction.js";

export { formatOperationPlan } from "./engine/plan-format.js";

export {
  ROOT_LOCK_FILENAME,
  WriteLockError,
  withProjectWriteLock,
} from "./engine/write-lock.js";

export {
  formatDoctorReport,
  runDoctor,
  type DoctorIssue,
  type DoctorResult,
  type RunDoctorOptions,
} from "./doctor/run-doctor.js";

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
  isSupportedExpressJsStack,
  isSupportedExpressStack,
  isSupportedExpressTsStack,
  unsupportedStackMessage,
  type InitAnswers,
} from "./init/answers.js";

export { adoptExistingProject, type AdoptResult } from "./init/adopt.js";

export {
  AddInfraError,
  addInfra,
  type AddInfraOptions,
  type AddInfraResult,
  type InfraKind,
} from "./add/infra.js";

export {
  AddCapabilityError,
  addCapability,
  type AddCapabilityOptions,
  type AddCapabilityResult,
  type CapabilityKind,
} from "./add/capability.js";

export {
  AddMonorepoError,
  addMonorepo,
  type AddMonorepoOptions,
  type AddMonorepoResult,
} from "./add/monorepo.js";

export {
  SUPPORTED_COMBOS,
  aliasesForCodeArchitecture,
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
  getExpressJsTemplatesRoot,
  getExpressTsTemplatesRoot,
  structureizeExpressJs,
  structureizeExpressTs,
  type StructureizeResult,
} from "./init/structureizer.js";

export {
  getStackProvider,
  getStackProviderForConfig,
  isSupportedStack,
  listStackProviders,
  resolveStackProvider,
  structureizeProject,
} from "./providers/resolve-provider.js";

export {
  defaultSourceAliases,
  isTypeScript,
  localizeSourcePath,
  sourceExtension,
  withSourceExt,
  type SourceExtension,
} from "./providers/language.js";

export {
  assertNoNodeProjectFiles,
  FORBIDDEN_NODE_PROJECT_FILES,
  listTopLevelNames,
} from "./providers/language-agnostic.js";

export {
  assertNodeStackCapability,
  assertStackCapability,
  isNodeProjectLanguage,
  stackSupportsAuthResource,
} from "./providers/stack-guards.js";

export {
  renderTemplateFile,
  renderTemplateString,
  type TemplateContext,
} from "./templates/renderer.js";
