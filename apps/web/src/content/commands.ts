export type CommandDoc = {
  slug: string;
  title: string;
  oneLiner: string;
  commands: string[];
  when: string;
  see: string[];
  files: string[];
  next: string[];
  mistakes: string[];
};

export const commands: CommandDoc[] = [
  {
    slug: "init",
    title: "init — build the kitchen",
    oneLiner: "Create a brand-new backend project from Root’s templates.",
    commands: [
      "pnpm dlx root-scaffold@latest init",
      "pnpm dlx root-scaffold@latest --yes init my-api",
      "npx root-scaffold@latest init",
      "pnpm root-cli init   # from this monorepo after pnpm build",
    ],
    when: "Only in an empty folder (or a new folder name). Not inside an existing Root project.",
    see: [
      "Questions about language, database, login, extras — or instant defaults with --yes.",
      "Many files appear: server, health check, root.json, README, env example.",
      "Optional library install at the end.",
    ],
    files: [
      "root.json — Root’s notebook about your project",
      "src/server.ts or src/server.js — main wiring + inject anchor",
      "src/schema.ts / .js — validation checklists",
      "package.json — scripts like pnpm dev",
      ".env.example — sample secrets (copy to .env)",
    ],
    next: [
      "cp .env.example .env",
      "pnpm install (and prisma:generate if you chose Prisma)",
      "pnpm dev → open http://localhost:3000/health",
    ],
    mistakes: [
      "Running init in a messy folder full of unrelated files.",
      "Forgetting to copy .env.example to .env.",
      "Using Node older than 22.18.",
    ],
  },
  {
    slug: "add-auth",
    title: "add auth — put locks on the door",
    oneLiner: "Install signup, signin, signout, and a token checker (JWT).",
    commands: ["pnpm dlx root-scaffold@latest add auth"],
    when: "Inside a Root project (root.json exists) when you want login.",
    see: [
      "New /auth doors for signup and signin.",
      "Middleware that reads Authorization: Bearer <token>.",
      "Env example gains ACCESS_TOKEN_SECRET.",
      "Existing resources may be retrofitted so creates require login.",
    ],
    files: [
      "src/middleware/auth.*",
      "src/routes/auth.routes.*",
      "src/controllers/auth.controller.*",
      "src/services/auth.service.*",
      "User model / table for your ORM (or in-memory if none)",
    ],
    next: [
      "Set ACCESS_TOKEN_SECRET in .env",
      "Restart pnpm dev",
      "Try signup → signin → copy the token",
    ],
    mistakes: [
      "Forgetting the secret in .env.",
      "Expecting cookie sessions — this MVP is a token the client stores.",
    ],
  },
  {
    slug: "add-route",
    title: "add route — add a resource door",
    oneLiner: "Create a full resource (list, get, create) and wire schema, ORM, and server mount.",
    commands: ["pnpm dlx root-scaffold@latest add route post"],
    when: "When you need a new noun in your API (posts, notes, invoices…).",
    see: [
      "GET /api/<name> and POST /api/<name> appear.",
      "If auth exists, POST usually needs a token; ownership comes from the token.",
      "root.json gains a module entry.",
    ],
    files: [
      "src/routes/<name>.routes.*",
      "src/controllers/<name>.controller.*",
      "src/services/<name>.service.*",
      "schema entry + ORM model when applicable",
      "server import + app.use mount near [ROOT-INJECT:ROUTES]",
    ],
    next: ["Restart if needed", "Call GET /api/post", "POST with a token when auth is on"],
    mistakes: [
      "Adding the same name twice.",
      "Deleting the [ROOT-INJECT:ROUTES] comment from the server file.",
    ],
  },
  {
    slug: "add-atomic",
    title: "atomic adds — one shelf at a time",
    oneLiner: "Create only a model, service, middleware, or controller — not a full HTTP resource.",
    commands: [
      "pnpm dlx root-scaffold@latest add model comment",
      "pnpm dlx root-scaffold@latest add service mailer",
      "pnpm dlx root-scaffold@latest add middleware rate-limit",
      "pnpm dlx root-scaffold@latest add controller invoice",
    ],
    when: "When you want a partial building block and will connect it yourself (or later with add route).",
    see: ["A single new file (or model change).", "A warning if it is not yet wired to a URL."],
    files: ["Depends on the kind: models/, services/, middleware/, controllers/"],
    next: ["Wire it into a route, or run add route for a full resource instead"],
    mistakes: ["Expecting a public URL immediately — atomic adds do not always mount HTTP."],
  },
  {
    slug: "doctor",
    title: "doctor — inspect the kitchen",
    oneLiner: "Check that Root’s notebook matches the files and mounts look healthy.",
    commands: [
      "pnpm dlx root-scaffold@latest doctor",
      "pnpm dlx root-scaffold@latest doctor --strict",
    ],
    when: "After manual edits, merges, or confusing errors.",
    see: [
      "OK, warnings, or errors about missing files, anchors, mounts, auth drift.",
      "--strict turns auth mismatches into hard errors.",
    ],
    files: ["Read-only — doctor does not rewrite your project"],
    next: ["Fix listed issues, or re-run the suggested add command"],
    mistakes: ["Ignoring warnings until production — run doctor early."],
  },
  {
    slug: "dry-run",
    title: "dry-run — peek without building",
    oneLiner: "Show the operation plan and write nothing to disk.",
    commands: ["pnpm dlx root-scaffold@latest --dry-run add route comment"],
    when: "When you are curious or cautious before changing files.",
    see: ["A printed plan of creates/patches/schema/ORM/deps lines", "Disk stays unchanged"],
    files: ["None written"],
    next: ["Re-run the same command without --dry-run when ready"],
    mistakes: ["Thinking dry-run installed libraries — it only prints a plan."],
  },
];
