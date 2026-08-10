import { rootInvoke } from "../constants.js";

export const ERRORS = {
  initForeignDirectory: (cwd: string) =>
    [
      `Cannot initialize in a non-empty directory: ${cwd}`,
      "",
      "Enter a new folder name when prompted (Root will create it), or press Escape only in an empty folder.",
      "Example:",
      `  ${rootInvoke("init")}`,
      "  → folder name: my-api",
    ].join("\n"),

  initAlreadyRootProject: (cwd: string) =>
    [
      `This directory is already a Root project: ${cwd}`,
      "",
      "Found a valid root.json. Use add/doctor instead of init:",
      `  ${rootInvoke("add resource <name>")}`,
      `  ${rootInvoke("doctor")}`,
    ].join("\n"),

  initInvalidRootJson: (details: string) =>
    ["Found root.json but it is invalid. Fix or remove it before running init.", "", details].join(
      "\n",
    ),

  initInvalidFolderName: (name: string) =>
    [
      `Invalid folder name: "${name}"`,
      "",
      "Use lowercase letters, numbers, and hyphens only (e.g. my-api).",
    ].join("\n"),

  initTargetNotEmpty: (target: string) =>
    [
      `Folder already exists and is not empty: ${target}`,
      "",
      "Choose a different folder name, or remove/empty that folder first.",
    ].join("\n"),

  initCancelled: () => "Init cancelled.",

  addRequiresRootProject: (cwd: string) =>
    [
      `Not a Root-managed project: ${cwd}`,
      "",
      "Missing or unreadable root.json. Create a backend first:",
      `  ${rootInvoke("init")}`,
    ].join("\n"),

  addInvalidRootJson: (details: string) =>
    [
      "Cannot add modules because root.json is invalid.",
      "",
      details,
      "",
      "Fix the contract file, then retry.",
    ].join("\n"),

  addResourceRequiresName: () =>
    [
      "Missing resource name.",
      "",
      "Usage:",
      `  ${rootInvoke("add resource <name>")}`,
      "Example:",
      `  ${rootInvoke("add resource post")}`,
    ].join("\n"),

  /** @deprecated Use addResourceRequiresName */
  addRouteRequiresName: () => ERRORS.addResourceRequiresName(),

  addRequiresName: (capability: string) =>
    [
      `Missing ${capability} name.`,
      "",
      "Usage:",
      `  ${rootInvoke(`add ${capability} <name>`)}`,
      "Examples:",
      `  ${rootInvoke("add middleware rate-limit")}`,
      `  ${rootInvoke("add service mailer")}`,
      `  ${rootInvoke("add resource post")}`,
    ].join("\n"),

  addCapabilityNotImplemented: (capability: string) =>
    [
      `Capability "${capability}" is not available yet.`,
      "",
      "Supported now:",
      "  add resource | add auth | add middleware | add service",
      "  add cache | add queue | add storage | add websocket | add logging | add health | add rate-limit",
      "  add docker | add github-actions | add kubernetes",
      "",
      "Planned:",
      "  add database | add job | add event | add module | add monorepo",
    ].join("\n"),

  addUnknownCapability: (capability: string) =>
    [
      `Unknown capability "${capability}".`,
      "",
      "Supported:",
      "  resource | auth | middleware | service",
      "  cache | queue | storage | websocket | logging | health | rate-limit",
      "  docker | github-actions | kubernetes",
      "",
      "Examples:",
      `  ${rootInvoke("add resource post")}`,
      `  ${rootInvoke("add auth")}`,
      `  ${rootInvoke("add cache redis")}`,
      `  ${rootInvoke("add docker")}`,
    ].join("\n"),

  /**
   * Node-only recipes must not run on Python/Go projects (would write .ts/.js + package.json).
   * Using npx to invoke the CLI is fine; this guards the *generated project* from Node pollution.
   */
  addRequiresNodeStack: (capability: string, language: string, framework: string) =>
    [
      `Cannot add "${capability}" to a ${language}/${framework} project.`,
      "",
      `"add ${capability}" currently only generates Express (TypeScript/JavaScript) code.`,
      "Running it here would incorrectly create .ts/.js files or a package.json.",
      "",
      "Your app stays language-pure. Use npx only to invoke the Root CLI — that does not",
      "install Node into this project.",
      "",
      "Supported on this stack: add auth | add resource | add docker | add github-actions | add kubernetes",
      `(auth/resource require FastAPI, Flask, or Go net/http — not "${capability}")`,
    ].join("\n"),

  /** Capability has no planner on this stack yet (e.g. Hono auth deep recipes). */
  addCapabilityUnsupportedOnStack: (capability: string, language: string, framework: string) =>
    [
      `Cannot add "${capability}" to a ${language}/${framework} project.`,
      "",
      `This stack does not implement "${capability}" recipes yet.`,
      "Supported auth/resource stacks: Express (TS/JS), FastAPI, Flask, Go net/http.",
      "Safe infra on all stacks: add docker | add github-actions | add kubernetes",
    ].join("\n"),

  /** @deprecated */
  addComponentNotImplemented: (component: string) => ERRORS.addUnknownCapability(component),

  removeRequiresArgs: () =>
    [
      "Missing remove arguments.",
      "",
      "Usage:",
      `  ${rootInvoke("remove <type> <name>")}`,
      "Example:",
      `  ${rootInvoke("remove resource post")}`,
    ].join("\n"),

  inspectRequiresName: () =>
    [
      "Missing module name.",
      "",
      "Usage:",
      `  ${rootInvoke("inspect <name>")}`,
      "Example:",
      `  ${rootInvoke("inspect post")}`,
    ].join("\n"),

  doctorNotRootProject: (cwd: string) =>
    [
      `Not a Root-managed project: ${cwd}`,
      "",
      "doctor expects a valid root.json. Run init in an empty folder first.",
    ].join("\n"),

  commandRequiresRootProject: (cwd: string, command: string) =>
    [
      `Not a Root-managed project: ${cwd}`,
      "",
      `Missing or unreadable root.json. Create a backend first, then run \`${command}\`:`,
      `  ${rootInvoke("init")}`,
    ].join("\n"),
} as const;
