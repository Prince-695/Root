import type { RootJson } from "../config/root-json.js";

export type ModuleEntry = RootJson["modules"][string];

export type ZodField = {
  name: string;
  zodType: string;
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

export type Operation =
  | CreateFileOp
  | PatchAnchorOp
  | PatchAstImportOp
  | UpdateSchemaAuthOp
  | UpdateSchemaResourceOp
  | UpdateManifestOp
  | EnsureDependencyOp
  | RunCommandOp
  | UpdateOrmOp;

export function stableStringifyOperations(ops: Operation[]): string {
  return JSON.stringify(ops, null, 2);
}
