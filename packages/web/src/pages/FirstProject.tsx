import { CommandPlate } from "@/components/CommandPlate";
import { Link } from "react-router-dom";

export function FirstProject() {
  return (
    <>
      <h1>First project</h1>
      <p className="lede">
        Empty folder → health check → login → a real resource. This is the end-to-end path Root is
        built for. Each step shows what to type and what the generated pieces mean.
      </p>

      <h2>0. What you will have at the end</h2>
      <ul>
        <li>
          An Express app with <code>GET /health</code>
        </li>
        <li>
          JWT auth at <code>/auth/signup</code> and <code>/auth/signin</code>
        </li>
        <li>
          A <code>post</code> resource at <code>/api/post</code> (list / get / create)
        </li>
        <li>Protected creates when a Bearer token is required</li>
        <li>
          A healthy <code>root doctor</code> report
        </li>
      </ul>

      <h2>1. Empty folder</h2>
      <CommandPlate
        title="terminal"
        code={`mkdir my-api
cd my-api`}
      />
      <p className="code-note">
        Start clean. Init refuses a foreign non-empty directory unless you pass a new folder name
        (for example <code>npx rootcli@latest init nested-api</code>).
      </p>

      <h2>2. Init the kitchen</h2>
      <CommandPlate title="interactive wizard" code="npx rootcli@latest init" />
      <p>Or skip questions with defaults (TypeScript + Express + Postgres + Prisma):</p>
      <CommandPlate title="defaults" code="npx rootcli@latest --yes init" />
      <p className="code-note">
        Init writes Express files, a health route, <code>root.json</code>, <code>.env.example</code>
        , README, and the <code>[ROOT-INJECT:ROUTES]</code> anchor in the server. It may install
        dependencies unless you pass <code>--skip-install</code>. If you chose JWT at init, auth may
        already be applied.
      </p>

      <h2>3. Environment + run</h2>
      <CommandPlate
        title="terminal"
        code={`cp .env.example .env
pnpm install
pnpm prisma:generate   # if you chose Prisma; skip for orm none
pnpm dev`}
      />
      <p>
        Open <code>http://localhost:3000/health</code>. A healthy project answers with a small JSON
        envelope:
      </p>
      <CommandPlate
        title="GET /health → body"
        code={`{
  "success": true,
  "data": { "status": "ok" }
}`}
      />
      <p className="code-note">
        Set <code>DATABASE_URL</code> in <code>.env</code> when using a real database. For{" "}
        <code>orm: none</code> you can skip Prisma entirely and still complete the auth + resource
        tour with in-memory storage.
      </p>

      <h2>4. Add login (if not chosen at init)</h2>
      <CommandPlate title="terminal" code="npx rootcli@latest add auth" />
      <p>
        This installs JWT signup/signin under <code>/auth</code>, middleware that checks{" "}
        <code>Authorization: Bearer …</code>, schema entries, env hints, and a User model for your
        ORM. Put a secret in <code>.env</code>:
      </p>
      <CommandPlate
        title=".env (excerpt)"
        code={`ACCESS_TOKEN_SECRET=change-me-to-a-long-random-string
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myapi?schema=public`}
      />
      <p className="code-note">
        Restart <code>pnpm dev</code> after editing env. Then try signup → signin and keep the
        token.
      </p>
      <CommandPlate
        title="signin (idea)"
        code={`POST /auth/signin
Content-Type: application/json

{ "email": "a@b.com", "password": "secret" }

→ { "success": true, "data": { "accessToken": "eyJ…" } }`}
      />

      <h2>5. Add a resource</h2>
      <CommandPlate title="terminal" code="npx rootcli@latest add resource post" />
      <p>Root creates layered files and mounts them. The public surface becomes:</p>
      <CommandPlate
        title="HTTP surface"
        code={`GET  /api/post          → list posts (usually public)
GET  /api/post/:id      → one post
POST /api/post          → create (needs Bearer token if auth exists)
         body: { "title": "hello" }`}
      />
      <p>A generated route file looks like this (simplified):</p>
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
        <code>authenticate</code> appears when auth is installed. <code>validate(postSchema)</code>{" "}
        rejects bad bodies before the controller runs. The service underneath talks to your ORM (or
        memory) so the controller stays thin. Server mount lands next to{" "}
        <code>[ROOT-INJECT:ROUTES]</code>.
      </p>

      <h2>6. Create a post with the token</h2>
      <CommandPlate
        title="HTTP"
        code={`POST /api/post
Authorization: Bearer eyJ…
Content-Type: application/json

{ "title": "hello from Root" }`}
      />
      <p className="code-note">
        Without the header, create should refuse (401/403 depending on middleware). List and get
        stay public in the MVP recipe.
      </p>

      <h2>7. Check the wiring</h2>
      <CommandPlate
        title="terminal"
        code={`npx rootcli@latest doctor
npx rootcli@latest list
npx rootcli@latest inspect post
npx rootcli@latest diff
npx rootcli@latest --dry-run add resource comment`}
      />
      <div className="docs-two-col">
        <div className="docs-panel">
          <h3>doctor</h3>
          <p>
            Full integrity: anchors, mounts, schema, auth consistency. Fix anything it prints, then
            re-run until OK.
          </p>
        </div>
        <div className="docs-panel">
          <h3>list / inspect / diff</h3>
          <p>
            Roster modules, zoom into one module’s files, or show drift between{" "}
            <code>root.json</code> and disk after hand edits.
          </p>
        </div>
      </div>

      <h2>8. Common stalls</h2>
      <ul>
        <li>
          <strong>Old Node</strong> — upgrade to 22.18+ / 24+.
        </li>
        <li>
          <strong>Missing secret</strong> — set <code>ACCESS_TOKEN_SECRET</code> and restart.
        </li>
        <li>
          <strong>Deleted inject anchor</strong> — restore <code>[ROOT-INJECT:ROUTES]</code>; doctor
          will complain if it is gone.
        </li>
        <li>
          <strong>Duplicate resource</strong> — Root refuses a second <code>add resource post</code>
          .
        </li>
        <li>
          <strong>DB URL</strong> — Prisma stacks need a reachable <code>DATABASE_URL</code>.
        </li>
      </ul>

      <div className="callout">
        Want the boxed pipeline view? Open <Link to="/docs/how-it-works">How it works</Link>. Want
        every flag? Open <Link to="/docs/commands">Commands</Link>.
      </div>
    </>
  );
}
