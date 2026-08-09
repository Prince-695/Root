import { CommandPlate } from "@/components/CommandPlate";
import { HldDiagram } from "@/components/HldDiagram";
import { Link } from "react-router-dom";

export function HowItWorks() {
  return (
    <>
      <h1>How it works</h1>
      <p className="lede">
        High-level design of the interconnection engine: detector → module graph → planner → locked
        transaction → mutators. Deterministic recipes; anchors preferred over brittle regex; AST
        patches where needed.
      </p>

      <h2>High-level design</h2>
      <p>
        Staged pipeline as titled TUI boxes (HLD). Each capability command walks this path once.
      </p>
      <HldDiagram />

      <h2>Stage breakdown</h2>
      <ol>
        <li>
          <strong>CLI</strong> — Commander parses global flags (<code>--dry-run</code>,{" "}
          <code>--yes</code>) and the capability argv; resolves <code>cwd</code>.
        </li>
        <li>
          <strong>Detector</strong> — requires a valid <code>root.json</code> for mutate commands;
          init refuses foreign non-empty dirs / existing Root projects.
        </li>
        <li>
          <strong>Module graph</strong> — loads the manifest and probes disk (auth present?
          duplicate module?). Feeds planner context.
        </li>
        <li>
          <strong>Planner</strong> — expands a capability <em>recipe</em> into an ordered{" "}
          <code>Operation[]</code> (create file, patch schema, patch server, update ORM, patch
          manifest).
        </li>
        <li>
          <strong>Lock + transaction</strong> — <code>.root.lock</code> serializes writers; apply
          ops; on error restore the pre-command snapshot (full rollback).
        </li>
      </ol>

      <h2>Inject anchors</h2>
      <p>
        Generated <code>createServer()</code> includes a stable marker so mounts stay predictable.
        Prefer anchor injection over scanning for arbitrary <code>app.use</code> patterns.{" "}
        <code>doctor</code> flags a missing marker.
      </p>
      <CommandPlate
        title="src/server.ts (excerpt)"
        code={`import express from "express";

export function createServer() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });

  // [ROOT-INJECT:ROUTES]
  // mutator inserts: import + app.use("/api/post", postRoutes)

  return app;
}`}
      />
      <p className="code-note">
        After <code>add resource post</code>, the mutator inserts the router import and{" "}
        <code>app.use("/api/post", postRoutes)</code> adjacent to the anchor.
      </p>

      <h2>Auth-aware planning</h2>
      <p>
        If the module graph reports <code>auth: jwt</code> (or an <code>auth</code> module), resource
        recipes attach <code>authenticate</code> on mutating verbs and may set ownership from the
        JWT claims. Adding auth <em>after</em> resources can retrofit existing creates — same
        interconnection machinery, different recipe branch.
      </p>
      <CommandPlate
        title="auth + resource HTTP"
        code={`POST /auth/signin  → { accessToken }
POST /api/post
  Authorization: Bearer <accessToken>
  { "title": "hello" }`}
      />

      <h2>Reliability primitives</h2>
      <div className="docs-two-col">
        <div className="docs-panel">
          <h3>Dry-run</h3>
          <p>
            <code>--dry-run</code> runs plan generation and prints ops; skips apply. Use before risky
            adds in a dirty working tree.
          </p>
        </div>
        <div className="docs-panel">
          <h3>Doctor / Diff</h3>
          <p>
            Reconcile manifest expectations vs disk: missing anchors, mounts, schema/ORM drift, auth
            consistency. <code>--strict</code> promotes auth warnings to errors.
          </p>
        </div>
      </div>

      <div className="callout">
        Interconnection ≠ “drop a template file.” It is a <strong>planned, locked, reversible</strong>{" "}
        multi-file mutation against a live project contract.
      </div>

      <p>
        <Link to="/docs/project-anatomy">Project anatomy</Link> ·{" "}
        <Link to="/docs/glossary">Glossary</Link>
      </p>
    </>
  );
}
