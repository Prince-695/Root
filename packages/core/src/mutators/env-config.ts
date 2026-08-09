import { ACCESS_TOKEN_ENV_LINE, AUTH_README_SECTION } from "../registry/codegen/auth-files.js";

/** Ensure ACCESS_TOKEN_SECRET is present in .env.example (or .env). */
export function ensureAccessTokenEnv(content: string): string {
  if (content.includes("ACCESS_TOKEN_SECRET")) {
    return content;
  }
  const trimmed = content.replace(/\s*$/, "");
  return `${trimmed}\n${ACCESS_TOKEN_ENV_LINE}\n`;
}

/** Ensure env.ts Zod schema includes ACCESS_TOKEN_SECRET. */
export function ensureAccessTokenInEnvTs(content: string): string {
  if (content.includes("ACCESS_TOKEN_SECRET")) {
    return content;
  }

  // Insert before the closing of envSchema object.
  const marker = "});";
  const idx = content.indexOf("const envSchema = z.object({");
  if (idx === -1) {
    throw new Error("Could not locate envSchema in src/config/env.ts");
  }
  const closeIdx = content.indexOf(marker, idx);
  if (closeIdx === -1) {
    throw new Error("Could not locate end of envSchema in src/config/env.ts");
  }

  const insertion = `  ACCESS_TOKEN_SECRET: z.string().min(16).default("dev-only-change-me-please"),\n`;
  return `${content.slice(0, closeIdx)}${insertion}${content.slice(closeIdx)}`;
}

export function ensureAuthReadmeSection(content: string): string {
  if (content.includes("authorization: Bearer") || content.includes("## Authentication")) {
    return content;
  }
  return `${content.trimEnd()}\n${AUTH_README_SECTION}`;
}
