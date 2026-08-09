/**
 * @root/core — shared engine surface for the Root CLI.
 * Phase 0 exposes identity helpers only; generation arrives in later phases.
 */

export const ROOT_ENGINE_NAME = "root" as const;

export const ROOT_ENGINE_VERSION = "0.0.0" as const;

export type RootCommandName = "init" | "add" | "doctor";

export const ROOT_COMMANDS: readonly RootCommandName[] = ["init", "add", "doctor"] as const;

/** Human-readable one-liner used by the CLI welcome/help path. */
export function getEngineBanner(): string {
  return `${ROOT_ENGINE_NAME} v${ROOT_ENGINE_VERSION} — pure-engineering backend scaffolding CLI`;
}

/** Returns true when the value is a known top-level Root command. */
export function isRootCommand(value: string): value is RootCommandName {
  return (ROOT_COMMANDS as readonly string[]).includes(value);
}
