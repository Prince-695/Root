import { CommandPlate } from "@/components/CommandPlate";
import { Link } from "react-router-dom";

export function WhatIsRoot() {
  return (
    <>
      <h1>What is Root?</h1>
      <p className="lede">
        Root is a deterministic scaffolding CLI for Express backends. It structureizes a project,
        then interconnects routes, controllers, services, Zod schemas, ORM models, and{" "}
        <code>app.use</code> mounts when you add a capability — with transactional rollback on
        failure. No AI, no SaaS account, source files stay yours.
      </p>

      <h2>Problem statement</h2>
      <p>
        Hand-rolling a resource means keeping an <strong>MVC-style layered stack</strong>{" "}
        consistent: router → controller → service → validation → persistence → server mount →
        project manifest. Miss the mount or the schema and you get a 404 or a silent validation
        hole. Auth bolted on later often forgets to guard mutating verbs (<code>POST</code>/
        <code>PUT</code>/<code>DELETE</code>).
      </p>
      <p>
        Root treats that checklist as one <strong>capability recipe</strong>. You invoke{" "}
        <code>add resource post</code>; the engine expands ops, takes <code>.root.lock</code>, and
        either commits the full interconnection or rolls back to the pre-command snapshot.
      </p>

      <h2>Runtime & distribution</h2>
      <p>
        Ready providers: <strong>Express + TypeScript</strong> and{" "}
        <strong>Express + JavaScript</strong>. Invoke via package runners (no global install
        required):
      </p>
      <CommandPlate title="terminal" code="npx rootcli@latest init" />
      <p className="code-note">
        Equivalents: <code>pnpm dlx</code>, <code>yarn dlx</code>, <code>bunx</code>. Engines: Node{" "}
        <code>^22.18 || &gt;=24</code>. Monorepo contributors use <code>pnpm root-cli</code> after{" "}
        <code>pnpm build</code>.
      </p>

      <h2>Capability surface vs MVC atoms</h2>
      <p>
        The public UX is capability-oriented — not <code>add model</code> /{" "}
        <code>add controller</code> / <code>add route</code> as first-class commands (
        <code>add route</code> still aliases to <code>add resource</code> for one release):
      </p>
      <CommandPlate
        title="terminal"
        code={`npx rootcli@latest add auth
npx rootcli@latest add resource post
npx rootcli@latest add middleware rate-limit
npx rootcli@latest add service mailer`}
      />
      <div className="docs-two-col">
        <div className="docs-panel">
          <h3>add resource</h3>
          <p>
            RESTful noun at <code>/api/&lt;name&gt;</code>: list/get/create, Zod schema, ORM model
            when configured, inject-anchor mount, <code>root.json</code> module entry. With JWT
            present, mutating handlers typically chain <code>authenticate</code> middleware.
          </p>
        </div>
        <div className="docs-panel">
          <h3>add auth</h3>
          <p>
            Stateless JWT: signup/signin/signout routes, <code>authenticate</code> middleware, User
            persistence via Prisma/Drizzle/Mongoose or in-memory when <code>orm: none</code>. May
            retrofit existing resources so creates require a Bearer token.
          </p>
        </div>
      </div>
      <p>
        <code>add middleware</code> / <code>add service</code> emit shared pipeline filters or
        domain services without registering an HTTP mount — compose them into routers yourself, or
        use <code>add resource</code> for a full surface.
      </p>

      <h2>Manifest: root.json</h2>
      <p>
        The project contract. The detector and module graph load it before every mutate command.
        Fields include language, framework, database, orm, auth mode, path aliases, and{" "}
        <code>modules</code>.
      </p>
      <CommandPlate
        title="root.json (example)"
        code={`{
  "projectName": "my-api",
  "language": "typescript",
  "framework": "express",
  "database": "postgres",
  "orm": "prisma",
  "auth": "jwt",
  "modules": {
    "auth": { "type": "auth", "addedAt": "2026-08-09T14:00:00.000Z" },
    "post": { "type": "resource", "addedAt": "2026-08-09T14:05:00.000Z" }
  }
}`}
      />
      <p className="code-note">
        <code>list</code> / <code>inspect</code> / <code>diff</code> / <code>doctor</code> all
        reconcile this manifest against the filesystem.
      </p>

      <h2>Interconnection engine (summary)</h2>
      <p>
        Pipeline: CLI → module graph (manifest + probes) → planner (recipe → ops) → write lock +
        transaction → mutators (files, Zod registry, ORM, server inject) → manifest update. Failure
        triggers full rollback. Prefer <code>--dry-run</code> to inspect the op list first.
      </p>
      <CommandPlate
        title="op plan sketch — add resource post"
        code={`create  src/routes/post.routes.ts
create  src/controllers/post.controller.ts
create  src/services/post.service.ts
patch   src/schema.ts            ← postSchema (Zod)
patch   prisma/schema.prisma     ← model Post
patch   src/server.ts            ← app.use("/api/post", …) @ [ROOT-INJECT:ROUTES]
patch   root.json                ← modules.post`}
      />
      <p className="code-note">
        Deep dive: <Link to="/docs/how-it-works">How it works</Link> (HLD) · terms:{" "}
        <Link to="/docs/glossary">Glossary</Link>.
      </p>

      <h2>Non-goals</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Not this</th>
              <th>Technical reason</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>LLM / AI codegen</td>
              <td>Deterministic Handlebars recipes + planner; reproducible diffs.</td>
            </tr>
            <tr>
              <td>Hosted PaaS</td>
              <td>No deploy pipeline; you run Node locally or bring your own host.</td>
            </tr>
            <tr>
              <td>Remote control plane</td>
              <td>
                No telemetry account; all I/O is local filesystem + optional npm registry fetch.
              </td>
            </tr>
            <tr>
              <td>Opaque binary runtime</td>
              <td>Emits plain Express/TS|JS sources under your VCS.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="callout">
        Product thesis: sell <strong>safe multi-file interconnection</strong>, not a one-shot
        starter zip. One capability command → coherent layered stack → doctorable contract.
      </div>

      <p>
        Next: <Link to="/docs/why-use-it">Why use it?</Link> ·{" "}
        <Link to="/docs/first-project">First project</Link>.
      </p>
    </>
  );
}
