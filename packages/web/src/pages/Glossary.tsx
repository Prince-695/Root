const terms: { term: string; def: string }[] = [
  {
    term: "Backend / API",
    def: "The server-side kitchen that answers requests from phones or websites (save a post, log in, list items).",
  },
  {
    term: "Capability",
    def: "A backend feature you add with one command — resource, auth, middleware, service — not a single MVC file kind.",
  },
  {
    term: "Resource",
    def: "An HTTP noun with list/get/create wiring. Example: add resource post → /api/post plus schema, service, and server mount.",
  },
  {
    term: "Interconnection",
    def: "Updating every related file when you add one capability, as a single planned transaction.",
  },
  {
    term: "root.json",
    def: "Root’s notebook for this project: language, database, ORM, auth, and which modules were added.",
  },
  {
    term: "Inject anchor",
    def: "A comment like [ROOT-INJECT:ROUTES] in server.* so Root knows where to plug new routers. Do not delete it.",
  },
  {
    term: "Auth / JWT",
    def: "Login capability: signup/signin and Bearer tokens. Mutating resource routes often require the token.",
  },
  {
    term: "ORM",
    def: "A helper that talks to a database (Prisma, Drizzle, Mongoose) or none for in-memory / no DB.",
  },
  {
    term: "Schema (Zod)",
    def: "Rules for what a valid request body looks like. Invalid bodies fail before the controller runs.",
  },
  {
    term: "Doctor",
    def: "Integrity check for anchors, mounts, schema, auth consistency, and root.json health.",
  },
  {
    term: "Diff",
    def: "Shows drift between root.json expectations and files on disk.",
  },
  {
    term: "Dry-run",
    def: "Show the operation plan; write nothing to disk.",
  },
  {
    term: "Rollback",
    def: "If any step in an add fails, Root restores the pre-command snapshot so you are not left half-wired.",
  },
  {
    term: "npx root@latest",
    def: "Canonical way to run the CLI. Also: pnpm dlx / yarn dlx / bunx. Local monorepo: pnpm root-cli.",
  },
];

export function Glossary() {
  return (
    <>
      <h1>Glossary</h1>
      <p className="lede">
        Plain meanings for words you will see across the manual and CLI output.
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
