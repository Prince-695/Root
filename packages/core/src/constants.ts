export const ROOT_ENGINE_NAME = "root" as const;

/** Semver of the engine / publishable CLI pack (keep in sync with package versions). */
export const ROOT_ENGINE_VERSION = "0.1.0" as const;

/**
 * npm package + bin name for public invocation.
 * Primary UX: `npx root@latest …` (also pnpm dlx / yarn dlx / bunx).
 */
export const ROOT_NPM_PACKAGE = "root" as const;

/** Preferred one-liner shown in errors and docs. */
export function rootInvoke(args: string): string {
  const trimmed = args.trim();
  return trimmed.length > 0
    ? `npx ${ROOT_NPM_PACKAGE}@latest ${trimmed}`
    : `npx ${ROOT_NPM_PACKAGE}@latest`;
}

/** Same command across common runners (for install pages). */
export function rootInvokeAll(args: string): string[] {
  const a = args.trim();
  const suffix = a.length > 0 ? ` ${a}` : "";
  return [
    `npx ${ROOT_NPM_PACKAGE}@latest${suffix}`,
    `pnpm dlx ${ROOT_NPM_PACKAGE}@latest${suffix}`,
    `yarn dlx ${ROOT_NPM_PACKAGE}@latest${suffix}`,
    `bunx ${ROOT_NPM_PACKAGE}@latest${suffix}`,
  ];
}
