const terms: { term: string; def: string }[] = [
  {
    term: "API / HTTP API",
    def: "Application Programming Interface over HTTP. Clients send requests (GET/POST/…) to routes; the server returns JSON and status codes.",
  },
  {
    term: "CLI",
    def: "Command-Line Interface. Root’s product surface — you invoke it with npx/pnpm dlx, not a GUI.",
  },
  {
    term: "Scaffolding",
    def: "Generating project structure and boilerplate from templates (Handlebars in Root’s engine).",
  },
  {
    term: "Capability",
    def: "Public add target (resource, auth, middleware, service…). Contrasts with low-level MVC file kinds.",
  },
  {
    term: "Resource",
    def: "RESTful noun exposed at /api/<name> with list/get/create handlers, Zod validation, and optional ORM persistence.",
  },
  {
    term: "MVC (layered)",
    def: "Model–View–Controller style split Root uses as routes → controllers → services (+ schema/ORM), even though there is no server-rendered View.",
  },
  {
    term: "Middleware",
    def: "Express functions in the request pipeline (logging, validate, authenticate). Run before the route handler.",
  },
  {
    term: "JWT / Bearer token",
    def: "JSON Web Token auth. Client sends Authorization: Bearer <token> on protected mutating routes after signup/signin.",
  },
  {
    term: "ORM",
    def: "Object–Relational Mapper (Prisma, Drizzle) or ODM (Mongoose). Maps code models to database tables/collections. orm: none uses in-memory stores.",
  },
  {
    term: "Zod schema",
    def: "Runtime TypeScript-first validators for request bodies. Invalid input fails in validate middleware before the controller.",
  },
  {
    term: "root.json",
    def: "Project manifest / contract: language, framework, database, orm, auth, aliases, and registered modules.",
  },
  {
    term: "Module graph",
    def: "In-memory view of root.json modules plus disk probes (e.g. auth present?) used by the planner.",
  },
  {
    term: "Recipe / Planner",
    def: "Capability → ordered list of filesystem operations (create/patch). The planner expands recipes deterministically.",
  },
  {
    term: "Transaction + rollback",
    def: "Apply ops under .root.lock; on failure restore the pre-command snapshot so the project is never half-wired.",
  },
  {
    term: "Inject anchor",
    def: "Stable comment marker such as [ROOT-INJECT:ROUTES] where Root patches app.use(…) mounts. Prefer anchors over brittle regex.",
  },
  {
    term: "Idempotent refuse",
    def: "Duplicate add resource <name> is rejected instead of double-mounting or silently overwriting.",
  },
  {
    term: "Dry-run",
    def: "Global --dry-run: print the operation plan; no writes. Safe preview of interconnection.",
  },
  {
    term: "Doctor / Diff / Sync",
    def: "Integrity tooling: doctor = full checks; diff = drift vs disk; sync = verify wiring (auto-repair planned).",
  },
  {
    term: "dlx / npx",
    def: "Run a package without a global install. Canonical: npx rootcli@latest … (also pnpm dlx, yarn dlx, bunx).",
  },
  {
    term: "Monorepo",
    def: "This repo: packages/cli, packages/core, packages/web under Turborepo + pnpm. Local invoke: pnpm root-cli.",
  },
  {
    term: "AST / mutators",
    def: "Abstract Syntax Tree edits for precise patches (secondary to anchors). Mutators update schema/ORM/server/manifest.",
  },
  {
    term: "Engines (Node)",
    def: "CLI requires Node ^22.18 || >=24. Generated apps may declare their own engines independently.",
  },
];

export function Glossary() {
  return (
    <>
      <h1>Glossary</h1>
      <p className="lede">
        Technical terms used across the CLI, engine, and this manual. Skim before deep-diving
        commands if any word looks unfamiliar.
      </p>
      <dl className="glossary">
        {terms.map((t) => (
          <div key={t.term}>
            <dt>{t.term}</dt>
            <dd>{t.def}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
