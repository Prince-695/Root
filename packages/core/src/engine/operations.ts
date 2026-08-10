import type { RootJson } from "../config/root-json.js";

export type ModuleEntry = RootJson["modules"][string];

export type ZodField = {
  name: string;
  zodType: string;
  /** Optional Prisma / ORM type override, e.g. `String @unique`. */
  ormType?: string;
};

export type CreateFileOp = {
  type: "createFile";
  path: string;
  content: string;
};

export type PatchAnchorOp = {
  type: "patchFile";
  path: string;
  kind: "anchor";
  anchor: string;
  insertion: string;
  /** If this substring already exists in the file, skip (idempotent). */
  skipIfContains?: string;
};

export type PatchAstImportOp = {
  type: "patchFile";
  path: string;
  kind: "ast-import";
  source: string;
  specifiers: string[];
  isDefault?: boolean;
};

export type UpdateSchemaAuthOp = {
  type: "updateSchema";
  kind: "auth";
};

export type UpdateSchemaResourceOp = {
  type: "updateSchema";
  kind: "resource";
  resourceName: string;
  fields: ZodField[];
};

export type UpdateManifestOp = {
  type: "updateManifest";
  moduleName: string;
  entry: ModuleEntry;
};

export type EnsureDependencyOp = {
  type: "ensureDependency";
  name: string;
  version: string;
  dev?: boolean;
};

/** Append a pip requirement line to requirements.txt and/or pyproject.toml. */
export type EnsurePythonDependencyOp = {
  type: "ensurePythonDependency";
  name: string;
  /** Spec as written in requirements.txt, e.g. `PyJWT>=2.8.0`. */
  spec: string;
};

/** Ensure a Go module require line exists in go.mod (version optional). */
export type EnsureGoModuleOp = {
  type: "ensureGoModule";
  path: string;
  version: string;
};

export type RunCommandOp = {
  type: "runCommand";
  command: string;
  args: string[];
};

export type UpdateOrmOp = {
  type: "updateOrm";
  kind: "prisma-model" | "drizzle-table" | "mongoose-model";
  resourceName: string;
  fields: ZodField[];
};

export type EnsureTextOp = {
  type: "ensureText";
  path: string;
  skipIfContains: string;
  /** Full-file transform when skipIfContains is absent. */
  transform: "access-token-env" | "access-token-env-ts" | "auth-readme";
};

export type Operation =
  | CreateFileOp
  | PatchAnchorOp
  | PatchAstImportOp
  | UpdateSchemaAuthOp
  | UpdateSchemaResourceOp
  | UpdateManifestOp
  | EnsureDependencyOp
  | EnsurePythonDependencyOp
  | EnsureGoModuleOp
  | RunCommandOp
  | UpdateOrmOp
  | EnsureTextOp;

export function stableStringifyOperations(ops: Operation[]): string {
  return JSON.stringify(ops, null, 2);
}
