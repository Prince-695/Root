import { realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * True when this module is the process entry.
 * npx/npm bin shims are often symlinks (`node_modules/.bin/rooot` → `dist/cli.js`);
 * compare real paths so `npx rooot@latest` actually calls `run()`.
 */
export function isMainModule(entry: string | undefined, moduleUrl: string): boolean {
  if (!entry) {
    return false;
  }

  let modulePath: string;
  try {
    modulePath = fileURLToPath(moduleUrl);
  } catch {
    return false;
  }

  try {
    return realpathSync(entry) === realpathSync(modulePath);
  } catch {
    try {
      return pathToFileURL(entry).href === moduleUrl;
    } catch {
      return false;
    }
  }
}
