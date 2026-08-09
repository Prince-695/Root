import type { RootJson } from "../config/root-json.js";

export type SourceExtension = "ts" | "js";

export function isTypeScript(config: Pick<RootJson, "language">): boolean {
  return config.language !== "javascript";
}

export function sourceExtension(config: Pick<RootJson, "language">): SourceExtension {
  return isTypeScript(config) ? "ts" : "js";
}

/** Join a basename with the stack's source extension (e.g. `auth` → `auth.ts`). */
export function withSourceExt(config: Pick<RootJson, "language">, baseName: string): string {
  const ext = sourceExtension(config);
  return `${baseName.replace(/\.(ts|js)$/, "")}.${ext}`;
}

/** Rewrite a relative path's final extension to match the project language. */
export function localizeSourcePath(config: Pick<RootJson, "language">, relPath: string): string {
  const ext = sourceExtension(config);
  return relPath.replace(/\.(ts|js)$/, `.${ext}`);
}

export function defaultSourceAliases(language: RootJson["language"]): {
  schema: string;
  server: string;
} {
  const ext = language === "javascript" ? "js" : "ts";
  return {
    schema: `src/schema.${ext}`,
    server: `src/server.${ext}`,
  };
}
