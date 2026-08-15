import { CommandPlate } from "@/components/CommandPlate";
import { Link } from "react-router-dom";

export function DocsHome() {
  return (
    <>
      <h1>Start here</h1>
      <p className="lede">
        Root docs for engineers: scaffolding CLI, capability surface, interconnection engine, and
        how generated Express code fits together. Plain walkthroughs plus technical terms — glossary
        when you need a definition.
      </p>

      <h2>TL;DR</h2>
      <p>
        Root is a <strong>deterministic scaffolding CLI</strong> for Express. <code>init</code>{" "}
        structureizes a project; <code>add &lt;capability&gt;</code> expands a recipe into
        filesystem ops under a write lock with <strong>transactional rollback</strong>. Public UX is
        capability-first (<code>resource</code>, <code>auth</code>, …), not raw MVC file adds. No
        LLM in the product path.
      </p>

      <CommandPlate
        title="golden path"
        code={`mkdir my-api && cd my-api
npx rooot@latest init
cp .env.example .env
pnpm install && pnpm dev          # GET /health

npx rooot@latest add auth          # JWT + /auth/*
npx rooot@latest add resource post # /api/post + Zod + ORM
npx rooot@latest doctor`}
      />
      <p className="code-note">
        Health probe → JWT auth module → interconnected resource (router, controller, service,
        schema, mount, manifest). Unpack each step in the pages below.
      </p>

      <h2>Capability matrix</h2>
      <div className="docs-two-col">
        <div className="docs-panel">
          <h3>Implemented</h3>
          <ul>
            <li>
              <code>init</code> — structureize + <code>root.json</code>
            </li>
            <li>
              <code>add auth</code> — JWT middleware + routes
            </li>
            <li>
              <code>add resource</code> — REST noun + interconnection
            </li>
            <li>
              <code>add middleware</code> / <code>add service</code> — atomic modules
            </li>
            <li>
              <code>list</code> · <code>inspect</code> · <code>diff</code> · <code>doctor</code> ·{" "}
              <code>sync</code>
            </li>
            <li>
              Global <code>--dry-run</code> / <code>--yes</code> / <code>--verbose</code>
            </li>
          </ul>
        </div>
        <div className="docs-panel">
          <h3>Reserved stubs</h3>
          <ul>
            <li>
              <code>add database|job|event|storage|cache|module</code>
            </li>
            <li>
              <code>remove &lt;type&gt; &lt;name&gt;</code>
            </li>
          </ul>
          <p>CLI rejects with an explicit not-implemented message — no speculative half-writes.</p>
        </div>
      </div>

      <h2>Manual map</h2>
      <ol>
        <li>
          <Link to="/docs/what-is-root">What is Root?</Link> — problem statement, capability vs MVC,
          manifest
        </li>
        <li>
          <Link to="/docs/why-use-it">Why use it?</Link> — interconnection vs hand-wiring / static
          templates
        </li>
        <li>
          <Link to="/docs/install">Install</Link> — engines, dlx/npx, flags, tarball, monorepo
        </li>
        <li>
          <Link to="/docs/first-project">First project</Link> — E2E: health → JWT → resource →
          doctor
        </li>
        <li>
          <Link to="/docs/commands">Commands</Link> — per-command ops, files, samples
        </li>
        <li>
          <Link to="/docs/how-it-works">How it works</Link> — HLD: graph → planner → lock →
          transaction
        </li>
        <li>
          <Link to="/docs/project-anatomy">Project anatomy</Link> — generated tree + contracts
        </li>
        <li>
          <Link to="/docs/usecases">Use cases</Link> — notes API, catalog, dry-run workflow
        </li>
        <li>
          <Link to="/docs/glossary">Glossary</Link> — CLI / HTTP / ORM / engine jargon
        </li>
      </ol>

      <h2>Control-plane mental model</h2>
      <CommandPlate
        title="pipeline"
        code={`argv
  → CLI (commander) + project detector
  → ModuleGraph(root.json + FS probes)
  → Planner(recipe → Operation[])
  → .root.lock + Transaction(apply | rollback)
  → mutators (routes, Zod, ORM, inject anchor, manifest)`}
      />
      <p className="code-note">
        That multi-file transaction is why <code>add resource</code> is the product, not a single
        template dump. See <Link to="/docs/how-it-works">How it works</Link>.
      </p>

      <h2>Constraints</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Constraint</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Node engines (CLI)</td>
              <td>
                <code>^22.18.0 || &gt;=24</code>
              </td>
            </tr>
            <tr>
              <td>Invoke</td>
              <td>
                <code>npx rooot@latest</code> / pnpm|yarn|bun dlx
              </td>
            </tr>
            <tr>
              <td>Stacks (ready)</td>
              <td>Express TS · Express JS</td>
            </tr>
            <tr>
              <td>Validation / auth</td>
              <td>Zod · JWT (Bearer)</td>
            </tr>
            <tr>
              <td>ORM matrix</td>
              <td>Prisma · Drizzle · Mongoose · none</td>
            </tr>
            <tr>
              <td>AI features</td>
              <td>Explicit non-goal</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="callout">
        Determinism over novelty: same wizard answers → same structure. Prefer{" "}
        <code>--dry-run</code> and <code>doctor</code> when iterating.
      </div>

      <p>
        <Link to="/docs/install">Install</Link> · <Link to="/docs/glossary">Glossary</Link> ·{" "}
        <Link to="/docs/first-project">First project</Link>
      </p>
    </>
  );
}
