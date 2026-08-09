import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolve a provider templates directory for both monorepo `@root/core`
 * layouts and the published `root-scaffold` pack (templates next to dist).
 */
export function resolveTemplatesRoot(providerFolder: string): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // Published pack: dist/cli.js → ../templates/<provider>
    path.join(here, "templates", providerFolder),
    path.join(here, "..", "templates", providerFolder),
    // Monorepo: dist/providers → ../../templates/<provider>
    path.join(here, "..", "..", "templates", providerFolder),
    // Monorepo from dist/init (legacy callers)
    path.join(here, "..", "..", "..", "templates", providerFolder),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    [
      `Could not locate templates for provider "${providerFolder}".`,
      "Tried:",
      ...candidates.map((c) => `  - ${c}`),
    ].join("\n"),
  );
}
