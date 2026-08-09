import { CommandPlate } from "@/components/CommandPlate";
import { Link } from "react-router-dom";

export function FirstProject() {
  return (
    <>
      <h1>First project</h1>
      <p className="lede">
        Empty folder → health check → login → a real resource. Follow the steps; each block shows
        what to type and what it means.
      </p>

      <h2>1. Empty folder</h2>
      <CommandPlate
        title="terminal"
        code={`mkdir my-api
cd my-api`}
      />
      <p className="code-note">
        Start clean. Init refuses messy folders full of unrelated files (unless you pass a new
        folder name).
      </p>

      <h2>2. Init the kitchen</h2>
      <CommandPlate title="terminal" code="npx root@latest init" />
      <p>
        Answer the wizard (language, database, ORM, optional JWT), or skip questions with defaults:
      </p>
      <CommandPlate title="terminal" code="npx root@latest --yes init" />
      <p className="code-note">
        Init writes Express files, a health route, <code>root.json</code>, <code>.env.example</code>
        , and a README. It may also install dependencies unless you pass <code>--skip-install</code>
        .
      </p>

      <h2>3. Environment + run</h2>
      <CommandPlate
        title="terminal"
        code={`cp .env.example .env
pnpm install
pnpm dev`}
      />
      <p>
        Open <code>http://localhost:3000/health</code>. A healthy project answers with a small JSON
        envelope, roughly:
      </p>
      <CommandPlate
        title="GET /health → body"
        code={`{
  "success": true,
  "data": { "status": "ok" }
}`}
      />
      <p className="code-note">
        If you chose Prisma, set <code>DATABASE_URL</code> in <code>.env</code> and run{" "}
        <code>pnpm prisma:generate</code> (or the script printed by init) before you rely on the
        database.
      </p>

      <h2>4. Add login</h2>
      <CommandPlate title="terminal" code="npx root@latest add auth" />
      <p>
        This installs JWT signup/signin under <code>/auth</code>, middleware that checks{" "}
        <code>Authorization: Bearer …</code>, and a User model for your ORM (or an in-memory
        stand-in when ORM is <code>none</code>). Put a secret in <code>.env</code>:
      </p>
      <CommandPlate
        title=".env (excerpt)"
        code={`ACCESS_TOKEN_SECRET=change-me-to-a-long-random-string
PORT=3000`}
      />
      <p className="code-note">
        Restart <code>pnpm dev</code> after editing env. Then signup → signin → keep the token for
        the next step.
      </p>

      <h2>5. Add a resource</h2>
      <CommandPlate title="terminal" code="npx root@latest add resource post" />
      <p>
        Root creates the layered files and mounts them. Conceptually, the public surface becomes:
      </p>
      <CommandPlate
        title="HTTP surface"
        code={`GET  /api/post          → list posts (usually public)
GET  /api/post/:id      → one post
POST /api/post          → create (needs Bearer token if auth exists)
         body: { "title": "hello" }`}
      />
      <p>A generated route file looks like this idea (simplified):</p>
      <CommandPlate
        title="src/routes/post.routes.ts (idea)"
        code={`import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { postSchema } from "../schema.js";
import * as ctrl from "../controllers/post.controller.js";

export const postRoutes = Router();

postRoutes.get("/", ctrl.listPost);
postRoutes.get("/:id", ctrl.getPostById);
postRoutes.post("/", authenticate, validate(postSchema), ctrl.createPost);`}
      />
      <p className="code-note">
        <code>authenticate</code> appears when auth is present. <code>validate(postSchema)</code>{" "}
        rejects bad bodies before the controller runs. The service underneath talks to your ORM (or
        memory) so the controller stays thin.
      </p>

      <h2>6. Check the wiring</h2>
      <CommandPlate title="terminal" code="npx root@latest doctor" />
      <p>Also useful while you explore:</p>
      <CommandPlate
        title="terminal"
        code={`npx root@latest list
npx root@latest inspect post
npx root@latest diff
npx root@latest --dry-run add resource comment`}
      />

      <div className="callout">
        Stuck? Read <Link to="/docs/how-it-works">How it works</Link> (inject anchors + rollback) or{" "}
        <Link to="/docs/commands/add-resource">add resource</Link> in detail.
      </div>
    </>
  );
}
