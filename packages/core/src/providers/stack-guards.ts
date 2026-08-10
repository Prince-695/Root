import type { RootJson } from "../config/root-json.js";
import { ERRORS } from "../errors/messages.js";

/** Languages that may receive Express/Node recipes (package.json + .ts/.js). */
export function isNodeProjectLanguage(language: RootJson["language"]): boolean {
  return language === "typescript" || language === "javascript";
}

/** Stacks with native planAuth / planResource (or Node registry recipes). */
export function stackSupportsAuthResource(
  config: Pick<RootJson, "language" | "framework">,
): boolean {
  if (isNodeProjectLanguage(config.language)) {
    return true;
  }
  if (
    config.language === "python" &&
    (config.framework === "fastapi" || config.framework === "flask")
  ) {
    return true;
  }
  if (config.language === "go" && config.framework === "go-http") {
    return true;
  }
  return false;
}

export type StackCapability = "auth" | "resource" | string;

/**
 * Refuse capabilities the current stack cannot plan.
 * Node stacks use Express registry recipes; FastAPI/Flask/Go use provider planners.
 */
export function assertStackCapability(
  config: Pick<RootJson, "language" | "framework">,
  capability: StackCapability,
): void {
  if (capability === "auth" || capability === "resource") {
    if (stackSupportsAuthResource(config)) {
      return;
    }
    throw new Error(
      ERRORS.addCapabilityUnsupportedOnStack(capability, config.language, config.framework),
    );
  }

  // Node-only extras (cache, queue, atomic MVC, …)
  if (isNodeProjectLanguage(config.language)) {
    return;
  }
  throw new Error(ERRORS.addRequiresNodeStack(capability, config.language, config.framework));
}

/**
 * @deprecated Prefer assertStackCapability — kept for call sites / exports.
 */
export function assertNodeStackCapability(
  config: Pick<RootJson, "language" | "framework">,
  capability: string,
): void {
  assertStackCapability(config, capability);
}
