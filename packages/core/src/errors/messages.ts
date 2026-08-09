export const ERRORS = {
  initForeignDirectory: (cwd: string) =>
    [
      `Cannot initialize in a non-empty directory: ${cwd}`,
      "",
      "Enter a new folder name when prompted (Root will create it), or press Escape only in an empty folder.",
      "Example:",
      "  pnpm dlx root@latest init",
      "  → folder name: my-api",
    ].join("\n"),

  initAlreadyRootProject: (cwd: string) =>
    [
      `This directory is already a Root project: ${cwd}`,
      "",
      "Found a valid root.json. Use add/doctor instead of init:",
      "  pnpm dlx root@latest add route <name>",
      "  pnpm dlx root@latest doctor",
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
      "  pnpm dlx root@latest init",
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
      "  pnpm dlx root@latest add route <name>",
      "Example:",
      "  pnpm dlx root@latest add route post",
    ].join("\n"),

  addComponentNotImplemented: (component: string) =>
    [
      `Component type "${component}" is not implemented yet.`,
      "",
      "Phase 5 supports: route",
      "Coming later: auth, model, service, middleware, controller",
    ].join("\n"),

  doctorNotRootProject: (cwd: string) =>
    [
      `Not a Root-managed project: ${cwd}`,
      "",
      "doctor expects a valid root.json. Run init in an empty folder first.",
    ].join("\n"),
} as const;
