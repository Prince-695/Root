export type CodeSample = {
  title: string;
  code: string;
  note?: string;
};

export type CommandDoc = {
  slug: string;
  title: string;
  oneLiner: string;
  commands: string[];
  overview: string;
  when: string;
  see: string[];
  files: string[];
  next: string[];
  mistakes: string[];
  samples?: CodeSample[];
};

export const commands: CommandDoc[] = [
  {
    slug: "init",
    title: "init — start a backend",
    oneLiner: "Create a brand-new backend project from Root’s templates.",
    overview:
      "Init is the only command that creates a project. It checks the folder is safe (empty, or a new named subfolder), asks (or defaults) language/framework/database/ORM/auth/extras, then structureizes Express files: health route, layered folders, root.json contract, .env.example, README, and an inject anchor in the server so later adds know where to mount routers. Optional dependency install runs unless --skip-install. If you chose JWT at init, auth setup may run immediately after structureize.",
    commands: [
      "npx rooot@latest init",
      "npx rooot@latest --yes init my-api",
      "pnpm dlx rooot@latest init",
    ],
    when: "Only in an empty folder (or a new folder name). Not inside an existing Root project.",
    see: [
      "Wizard questions — or instant defaults with --yes (TypeScript + Express + Postgres + Prisma).",
      "Files appear: server, health check, root.json, README, .env.example.",
      "Optional dependency install unless --skip-install.",
    ],
    files: [
      "root.json — contract notebook",
      "src/server.* — middleware, /health, [ROOT-INJECT:ROUTES]",
      "package.json — scripts like pnpm dev",
      ".env.example — sample secrets",
    ],
    next: ["cp .env.example .env", "pnpm install", "pnpm dev → http://localhost:3000/health"],
    mistakes: [
      "Running init in a messy folder of unrelated files.",
      "Using Node older than 22.18.",
      "Forgetting to copy .env.example → .env.",
    ],
    samples: [
      {
        title: "root.json right after init (idea)",
        code: `{
  "projectName": "my-api",
  "language": "typescript",
  "framework": "express",
  "database": "postgres",
  "orm": "prisma",
  "auth": "none",
  "modules": {}
}`,
        note: "modules stays empty until you add capabilities. auth becomes jwt if you chose JWT at init (or after add auth).",
      },
    ],
  },
  {
    slug: "add-auth",
    title: "add auth — login capability",
    oneLiner: "Install signup, signin, signout, and token checking (JWT).",
    overview:
      "Auth is a capability, not a single middleware file. Root adds /auth routes (signup, signin, signout), controllers, services, JWT authenticate middleware, Zod schema entries, .env.example hints (ACCESS_TOKEN_SECRET), README notes, and a User model for your ORM (or an in-memory stand-in when orm is none). If resources already exist, mutating routes may be retrofitted to require a Bearer token so you do not leave open creates after bolting login on later.",
    commands: ["npx rooot@latest add auth", "pnpm dlx rooot@latest add auth"],
    when: "Inside a Root project when you want login.",
    see: [
      "POST /auth/signup and /auth/signin become available.",
      "ACCESS_TOKEN_SECRET expected in .env.",
      "Existing resources may start protecting POST/PUT/DELETE.",
    ],
    files: [
      "src/middleware/auth.*",
      "src/routes/auth.routes.* + controller + service",
      "User model / schema updates for your ORM",
      "root.json modules.auth",
    ],
    next: [
      "Set ACCESS_TOKEN_SECRET in .env",
      "Restart pnpm dev",
      "signup → signin → use Authorization: Bearer <token>",
    ],
    mistakes: [
      "Forgetting the secret in .env.",
      "Expecting cookie sessions — MVP auth is stateless JWT.",
    ],
    samples: [
      {
        title: "signin request / response (idea)",
        code: `POST /auth/signin
Content-Type: application/json

{ "email": "a@b.com", "password": "secret" }

→ { "success": true, "data": { "accessToken": "eyJ…" } }`,
        note: "Send that token on protected resource creates: Authorization: Bearer eyJ…",
      },
    ],
  },
  {
    slug: "add-resource",
    title: "add resource — API resource capability",
    oneLiner:
      "Add a full HTTP resource (list, get, create) with schema, data layer, and server mount.",
    overview:
      "This is the main interconnection path — the shadcn-like moment for backends. Root creates routes, controller, and service; appends a Zod schema; updates ORM models when applicable; mounts /api/<name> near the [ROOT-INJECT:ROUTES] anchor; and registers the module in root.json. Duplicate names are refused. If auth exists, mutating verbs usually require authenticate. Dry-run prints the full operation plan without writing.",
    commands: ["npx rooot@latest add resource post", "pnpm dlx rooot@latest add resource post"],
    when: "When you need a new noun in your API (posts, notes, invoices…).",
    see: [
      "GET /api/<name> and POST /api/<name>",
      "If auth exists, POST usually needs a Bearer token",
      "Duplicate names are refused (no silent double mount)",
    ],
    files: [
      "src/routes/<name>.routes.*",
      "src/controllers/<name>.controller.*",
      "src/services/<name>.service.*",
      "schema + ORM model when applicable",
      "server mount near [ROOT-INJECT:ROUTES]",
      "root.json modules.<name> type resource",
    ],
    next: [
      "Call GET /api/post",
      "POST with a token when auth is on",
      "npx rooot@latest inspect post",
    ],
    mistakes: [
      "Adding the same name twice.",
      "Deleting the inject anchor in server.",
      "Expecting full CRUD — MVP ships list / get / create.",
    ],
    samples: [
      {
        title: "src/routes/post.routes.ts (idea)",
        code: `import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { postSchema } from "../schema.js";
import * as ctrl from "../controllers/post.controller.js";

export const postRoutes = Router();

postRoutes.get("/", ctrl.listPost);
postRoutes.get("/:id", ctrl.getPostById);
postRoutes.post("/", authenticate, validate(postSchema), ctrl.createPost);`,
        note: "authenticate is present when auth is installed. validate rejects bad bodies before the controller runs.",
      },
      {
        title: "create a post",
        code: `POST /api/post
Authorization: Bearer <token>
Content-Type: application/json

{ "title": "hello" }`,
      },
    ],
  },
  {
    slug: "add-middleware",
    title: "add middleware — shared request filter",
    oneLiner: "Create a reusable middleware capability (not a full HTTP resource).",
    overview:
      "Creates a middleware module and registers it in root.json. Unlike add resource, this does not open a public URL — you import and mount it where you need it.",
    commands: ["npx rooot@latest add middleware rate-limit"],
    when: "When you need a shared filter (logging, rate limits, custom checks).",
    see: ["A middleware file is created", "You may still need to mount it on a router"],
    files: ["src/middleware/<name>.*", "root.json modules.<name> type middleware"],
    next: ["Import and use it on a router or in server"],
    mistakes: ["Expecting a public URL immediately — middleware is not a resource."],
    samples: [
      {
        title: "using the middleware (idea)",
        code: `import { rateLimit } from "../middleware/rate-limit.js";

postRoutes.post("/", rateLimit, authenticate, validate(postSchema), ctrl.createPost);`,
      },
    ],
  },
  {
    slug: "add-service",
    title: "add service — business logic module",
    oneLiner: "Create a service capability for business logic without wiring HTTP yet.",
    overview:
      "Useful when you want a named logic module (mailer, billing helpers) before or beside HTTP. Root warns that it is not exposed over HTTP until you wire it into a resource/controller.",
    commands: ["npx rooot@latest add service mailer"],
    when: "When you want a logic module to call from controllers later.",
    see: ["A service file is created and registered"],
    files: ["src/services/<name>.service.*"],
    next: ["Wire it into a resource or controller", "Or use add resource for a full HTTP surface"],
    mistakes: ["Expecting /api/mailer to appear — use add resource for HTTP."],
  },
  {
    slug: "add-planned",
    title: "Planned capabilities",
    oneLiner: "These names are reserved on the CLI and will gain recipes soon.",
    overview:
      "Root’s public surface already names future capabilities so the UX stays stable. Today they print a clear “not available yet” message instead of inventing half-baked behavior.",
    commands: [
      "npx rooot@latest add database postgres",
      "npx rooot@latest add job send-email",
      "npx rooot@latest add event order.created",
      "npx rooot@latest add storage s3",
      "npx rooot@latest add cache redis",
      "npx rooot@latest add module billing",
    ],
    when: "Not implemented yet — try them only to see the reserved message.",
    see: ["A clear “not available yet” message"],
    files: ["None today"],
    next: ["Use add resource / add auth / add middleware / add service for now"],
    mistakes: ["Assuming database can be swapped after init — use init choices today."],
  },
  {
    slug: "list",
    title: "list — show registered modules",
    oneLiner: "Print every module Root knows about in root.json.",
    overview:
      "Read-only roster of modules: name, type (resource, auth, …), and added timestamp. Useful after a few adds or when onboarding someone to an existing project.",
    commands: ["npx rooot@latest list"],
    when: "Anytime you want a roster of what was added.",
    see: ["Name, type, and added timestamp for each module"],
    files: ["Read-only — does not write files"],
    next: ["inspect <name> for file-level detail"],
    mistakes: [],
  },
  {
    slug: "inspect",
    title: "inspect — detail one module",
    oneLiner: "Show type, timestamps, and whether expected files exist.",
    overview:
      "Given a module name, Root prints expected related files with [ok] or [missing] markers, plus expected HTTP mounts for resources and auth.",
    commands: ["npx rooot@latest inspect post"],
    when: "When debugging a single capability.",
    see: ["[ok] / [missing] markers for related files", "Expected mount path for resources"],
    files: ["Read-only"],
    next: ["doctor or diff if files are missing"],
    mistakes: ["Inspecting a name that was never added"],
  },
  {
    slug: "diff",
    title: "diff — show drift",
    oneLiner: "Compare root.json expectations to files on disk.",
    overview:
      "Drift happens after merges or hand edits. diff reports issues in a focused way; --strict treats auth consistency warnings as errors.",
    commands: ["npx rooot@latest diff", "npx rooot@latest diff --strict"],
    when: "After manual edits or merges.",
    see: ["A list of drift issues, or “No drift detected”"],
    files: ["Read-only"],
    next: ["Fix issues, then doctor / sync"],
    mistakes: [],
  },
  {
    slug: "doctor",
    title: "doctor — integrity check",
    oneLiner: "Full health check for anchors, mounts, schema, and auth consistency.",
    overview:
      "Doctor is the long checklist: valid root.json, inject anchors present, mounts look healthy, schema/ORM consistency, auth wiring. Run it whenever something feels wrong.",
    commands: ["npx rooot@latest doctor", "npx rooot@latest doctor --strict"],
    when: "After edits, or when something feels wrong.",
    see: ["OK, warnings, or errors with plain messages"],
    files: ["Read-only"],
    next: ["Fix listed issues", "Re-run doctor until OK"],
    mistakes: ["Ignoring a missing [ROOT-INJECT:ROUTES] warning — later adds need that anchor."],
  },
  {
    slug: "sync",
    title: "sync — verify wiring",
    oneLiner: "Today runs integrity checks; auto-repair is planned.",
    overview:
      "sync is the capability-shaped name for “make the project consistent.” Today it reports doctor-style status; future versions may rewrite drift automatically.",
    commands: ["npx rooot@latest sync"],
    when: "When you want a sync-shaped command after pulls.",
    see: ["Doctor-style report"],
    files: ["Read-only today"],
    next: ["Watch for future auto-repair"],
    mistakes: [],
  },
  {
    slug: "remove",
    title: "remove — unwind a capability (planned)",
    oneLiner: "Safely remove a capability with interconnection unwind — not implemented yet.",
    overview:
      "The goal is the reverse of add: unmount, unschema, unmanifest — without leaving orphans. Until then, remove files carefully and verify with doctor/diff.",
    commands: ["npx rooot@latest remove resource post"],
    when: "When you want to delete a capability cleanly.",
    see: ["Clear not-implemented message"],
    files: ["None today"],
    next: ["Remove carefully by hand, then doctor / diff"],
    mistakes: ["Expecting automatic cleanup today"],
  },
  {
    slug: "dry-run",
    title: "--dry-run — preview without writing",
    oneLiner: "Show the operation plan and write nothing.",
    overview:
      "--dry-run is a global flag (place it before the subcommand). Init and add print the planned operations and leave the disk unchanged — perfect before a scary add.",
    commands: ["npx rooot@latest --dry-run add resource comment"],
    when: "When you are cautious before changing files.",
    see: ["Printed plan; disk unchanged"],
    files: ["None written"],
    next: ["Re-run without --dry-run when ready"],
    mistakes: [
      "Putting --dry-run after the subcommand in a way your shell/tooling ignores — prefer: root --dry-run add …",
    ],
  },
];
