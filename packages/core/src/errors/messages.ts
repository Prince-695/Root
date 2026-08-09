import { ROOT_NPM_PACKAGE } from "../constants.js";

const dlx = (args: string) => `pnpm dlx ${ROOT_NPM_PACKAGE}@latest ${args}`;

export const ERRORS = {
  initForeignDirectory: (cwd: string) =>
    [
      `Cannot initialize in a non-empty directory: ${cwd}`,
      "",
      "Enter a new folder name when prompted (Root will create it), or press Escape only in an empty folder.",
      "Example:",
      `  ${dlx("init")}`,
      "  → folder name: my-api",
    ].join("\n"),

  initAlreadyRootProject: (cwd: string) =>
    [
      `This directory is already a Root project: ${cwd}`,
      "",
      "Found a valid root.json. Use add/doctor instead of init:",
      `  ${dlx("add route <name>")}`,
      `  ${dlx("doctor")}`,
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
      `  ${dlx("init")}`,
    ].join("\n"),

  addInvalidRootJson: (details: string) =>
    [
      "Cannot add modules because root.json is invalid.",
      "",
      details,
      "",
      "Fix the contract file, then retry.",
    ].join("\n"),

  addRouteRequiresName: () =>
    [
      "Missing route name.",
      "",
      "Usage:",
      `  ${dlx("add route <name>")}`,
      "Example:",
      `  ${dlx("add route post")}`,
    ].join("\n"),

  addRequiresName: (component: string) =>
    [
      `Missing ${component} name.`,
      "",
      "Usage:",
      `  ${dlx(`add ${component} <name>`)}`,
      "Examples:",
      `  ${dlx("add model comment")}`,
      `  ${dlx("add service mailer")}`,
      `  ${dlx("add middleware rate-limit")}`,
      `  ${dlx("add controller invoice")}`,
    ].join("\n"),

  addComponentNotImplemented: (component: string) =>
    [
      `Unknown component type "${component}".`,
      "",
      "Supported: route | auth | model | service | middleware | controller",
    ].join("\n"),

  doctorNotRootProject: (cwd: string) =>
    [
      `Not a Root-managed project: ${cwd}`,
      "",
      "doctor expects a valid root.json. Run init in an empty folder first.",
    ].join("\n"),
} as const;
