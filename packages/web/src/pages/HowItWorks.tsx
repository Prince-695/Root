import { CommandPlate } from "@/components/CommandPlate";
import { Link } from "react-router-dom";

export function HowItWorks() {
  return (
    <>
      <h1>How it works</h1>
      <p className="lede">
        Five stages in a line: you speak, the CLI opens the project, the graph reads the truth, the
        planner expands a recipe, a locked transaction writes — or rolls back.
      </p>

      <h2>The pipeline</h2>
      <div className="diagram">{`You
 └─► root CLI
      └─► Module graph (root.json + disk probes)
           └─► Planner (recipe → ordered operations)
                └─► .root.lock  →  Transaction
                     ├─ create / patch files
                     ├─ update schema / ORM / manifest
                     └─ on failure → full rollback`}</div>

      <ol>
        <li>
          <strong>You</strong> type a command such as <code>npx root@latest add resource post</code>
          .
        </li>
        <li>
          The <strong>CLI</strong> confirms you are inside a Root project (valid{" "}
          <code>root.json</code>).
        </li>
        <li>
          The <strong>module graph</strong> loads the notebook and peeks at the disk (“is auth
          already there?”, “does a post module exist?”).
        </li>
        <li>
          The <strong>planner</strong> expands a capability recipe into ordered operations: create
          file, patch server near an inject anchor, update schema, update ORM, update{" "}
          <code>root.json</code>.
        </li>
        <li>
          A <strong>lock file</strong> (<code>.root.lock</code>) stops two Roots from writing at
          once. A <strong>transaction</strong> applies every step. If one step fails, Root restores
          the pre-command snapshot.
        </li>
      </ol>

      <h2>The inject anchor</h2>
      <p>
        Generated servers include a special comment so Root knows where to plug new routers. Do not
        delete it — <code>doctor</code> will complain if it goes missing.
      </p>
      <CommandPlate
        title="src/server.ts (excerpt)"
        code={`import express from "express";
// … middleware …

export function createServer() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });

  // [ROOT-INJECT:ROUTES]
  // ← Root inserts: app.use("/api/post", postRoutes)

  return app;
}`}
      />
      <p className="code-note">
        After <code>add resource post</code>, Root adds an import and{" "}
        <code>app.use("/api/post", postRoutes)</code> next to that marker — so new doors land in a
        predictable place.
      </p>

      <h2>Auth awareness</h2>
      <p>
        If <code>add auth</code> ran first (or you chose JWT at init), a new resource’s mutating
        routes usually require a Bearer token. If you add auth <em>after</em> resources, Root can
        retrofit existing create handlers so they become protected too.
      </p>
      <CommandPlate
        title="request shape (idea level)"
        code={`POST /auth/signin
{ "email": "a@b.com", "password": "secret" }
→ { "accessToken": "…" }

POST /api/post
Authorization: Bearer <accessToken>
{ "title": "hello" }`}
      />

      <div className="callout">
        That is why <code>add resource</code> feels magical: it is not one file — it is a
        transaction across many files, guided by <code>root.json</code>.
      </div>

      <p>
        See also: <Link to="/docs/project-anatomy">Project anatomy</Link>.
      </p>
    </>
  );
}
