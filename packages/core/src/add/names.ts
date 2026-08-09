/** Shared naming rules for add route/model/service/middleware/controller. */
export function normalizeModuleName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidModuleName(name: string): boolean {
  const slug = normalizeModuleName(name);
  return slug.length > 0 && /^[a-z][a-z0-9-]*$/.test(slug);
}

export function invalidModuleNameMessage(name: string, kind: string): string {
  return [
    `Invalid ${kind} name "${name}".`,
    "",
    "Use lowercase letters, numbers, and hyphens (e.g. comment, rate-limit).",
    "Names must start with a letter.",
  ].join("\n");
}
