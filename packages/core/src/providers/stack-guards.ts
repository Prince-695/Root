import type { RootJson } from "../config/root-json.js";
import { ERRORS } from "../errors/messages.js";

/** Languages that may receive Express/Node recipes (package.json + .ts/.js). */
export function isNodeProjectLanguage(language: RootJson["language"]): boolean {
  return language === "typescript" || language === "javascript";
}

/**
 * Refuse Node-only capabilities on Python/Go/etc. so we never pollute a
 * language-agnostic project with package.json or Express sources.
 */
export function assertNodeStackCapability(
  config: Pick<RootJson, "language" | "framework">,
  capability: string,
): void {
  if (isNodeProjectLanguage(config.language)) {
    return;
  }
  throw new Error(ERRORS.addRequiresNodeStack(capability, config.language, config.framework));
}
