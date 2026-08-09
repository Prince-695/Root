import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ZodField } from "../engine/operations.js";
import { schemaExportName, toCamelCase } from "../registry/types.js";

export const AUTH_BANNER =
  "// ─── Auth Schemas ─────────────────────────────────────────────────────────────";
export const RESOURCE_BANNER =
  "// ─── Resource Schemas ─────────────────────────────────────────────────────────";
export const EXPORTS_BANNER =
  "// ─── Exports ──────────────────────────────────────────────────────────────────";

const AUTH_BLOCK = `const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
`;

export type SchemaRegistry = {
  filePath: string;
  content: string;
};

export async function loadSchemaRegistry(
  projectRoot: string,
  schemaRel: string,
): Promise<SchemaRegistry> {
  const filePath = path.join(projectRoot, schemaRel);
  const content = await readFile(filePath, "utf8");
  return { filePath, content };
}

export function ensureBanners(content: string): string {
  const next = content;
  for (const banner of [AUTH_BANNER, RESOURCE_BANNER, EXPORTS_BANNER]) {
    if (!next.includes(banner)) {
      throw new Error(`schema.ts missing required banner: ${banner}`);
    }
  }
  return next;
}

function sectionBody(content: string, startBanner: string, endBanner: string): string {
  const start = content.indexOf(startBanner);
  const end = content.indexOf(endBanner);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Invalid section between ${startBanner} and ${endBanner}`);
  }
  return content.slice(start + startBanner.length, end);
}

function replaceSection(
  content: string,
  startBanner: string,
  endBanner: string,
  body: string,
): string {
  const start = content.indexOf(startBanner);
  const end = content.indexOf(endBanner);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Invalid section between ${startBanner} and ${endBanner}`);
  }
  const before = content.slice(0, start + startBanner.length);
  const after = content.slice(end);
  const normalized = body.startsWith("\n") ? body : `\n${body}`;
  const withTrailing = normalized.endsWith("\n") ? normalized : `${normalized}\n`;
  return `${before}${withTrailing}${after}`;
}

export function writeAuthSchemas(content: string): string {
  ensureBanners(content);
  const body = sectionBody(content, AUTH_BANNER, RESOURCE_BANNER);
  if (body.includes("signUpSchema")) {
    return rewriteExports(content);
  }
  return rewriteExports(replaceSection(content, AUTH_BANNER, RESOURCE_BANNER, `\n${AUTH_BLOCK}`));
}

export function appendResourceSchema(
  content: string,
  resourceName: string,
  fields: ZodField[],
): string {
  ensureBanners(content);
  const exportName = schemaExportName(resourceName);
  const resourceSection = sectionBody(content, RESOURCE_BANNER, EXPORTS_BANNER);
  if (
    resourceSection.includes(`const ${exportName}`) ||
    resourceSection.includes(`export const ${exportName}`)
  ) {
    return rewriteExports(content);
  }

  const fieldLines = fields.map((field) => `  ${field.name}: ${field.zodType},`).join("\n");
  const block = `
const ${exportName} = z.object({
${fieldLines}
});
`;

  const next = replaceSection(
    content,
    RESOURCE_BANNER,
    EXPORTS_BANNER,
    `${resourceSection.replace(/\n+$/, "\n")}${block}`,
  );
  return rewriteExports(next);
}

export function collectExportNames(content: string): string[] {
  ensureBanners(content);
  const auth = sectionBody(content, AUTH_BANNER, RESOURCE_BANNER);
  const resources = sectionBody(content, RESOURCE_BANNER, EXPORTS_BANNER);
  const names: string[] = [];
  const re = /(?:export\s+)?const (\w+)\s*=/g;
  for (const section of [auth, resources]) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null = re.exec(section);
    while (match) {
      names.push(match[1] as string);
      match = re.exec(section);
    }
  }
  return names;
}

export function rewriteExports(content: string): string {
  ensureBanners(content);
  const names = collectExportNames(content);
  const exportsIndex = content.indexOf(EXPORTS_BANNER);
  const before = content.slice(0, exportsIndex + EXPORTS_BANNER.length);
  const exportLine = names.length === 0 ? "\nexport {};\n" : `\nexport { ${names.join(", ")} };\n`;
  return `${before}${exportLine}`;
}

/** Apply auth then resources in canonical banner order regardless of call order. */
export function applySchemaUpdates(
  content: string,
  updates: Array<{ kind: "auth" } | { kind: "resource"; resourceName: string; fields: ZodField[] }>,
): string {
  let next = ensureBanners(content);
  const authUpdates = updates.filter((u) => u.kind === "auth");
  const resourceUpdates = updates.filter((u) => u.kind === "resource");

  if (authUpdates.length > 0) {
    next = writeAuthSchemas(next);
  }
  for (const update of resourceUpdates) {
    if (update.kind === "resource") {
      next = appendResourceSchema(next, update.resourceName, update.fields);
    }
  }
  return rewriteExports(next);
}

export async function saveSchemaRegistry(registry: SchemaRegistry): Promise<void> {
  await writeFile(registry.filePath, registry.content, "utf8");
}

export function defaultResourceFields(resourceName: string): ZodField[] {
  const camel = toCamelCase(resourceName);
  return [
    { name: "id", zodType: "z.string().uuid().optional()" },
    { name: camel === "user" ? "email" : "title", zodType: "z.string().min(1)" },
  ];
}
