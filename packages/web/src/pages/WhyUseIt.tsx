import { CommandPlate } from "@/components/CommandPlate";
import { Link } from "react-router-dom";

export function WhyUseIt() {
  return (
    <>
      <h1>Why use Root?</h1>
      <p className="lede">
        Hand-wiring a layered Express resource touches router, controller, service, Zod schema, ORM
        model, <code>app.use</code> mount, and the project manifest. Partial updates leave you with
        404s, unvalidated bodies, or unauthenticated mutators. Root collapses that into one
        transactional capability command.
      </p>

      <h2>Failure modes without interconnection</h2>
      <p>
        For a <code>posts</code> API you normally must keep these coherent:
      </p>
      <ol>
        <li>
          Router module (<code>*.routes.*</code>) — HTTP verbs and middleware chain
        </li>
        <li>Controller — request/response mapping</li>
        <li>Service — domain + persistence</li>
        <li>
          Zod schema — runtime validation via <code>validate</code> middleware
        </li>
        <li>ORM model / migration surface (Prisma, Drizzle, Mongoose)</li>
        <li>Server mount near a stable inject point</li>
        <li>
          Manifest registration (<code>root.json</code> modules)
        </li>
      </ol>
      <p>
        Common bugs: forgotten <code>app.use</code>, schema never registered, auth added later
        without guarding <code>POST</code>. Root’s job is to apply the full checklist as one recipe
        — and roll back if any op fails.
      </p>

      <h2>What “interconnection” looks like</h2>
      <p>
        When you run <code>add resource post</code>, Root does not drop a single lonely file. It
        plans a list of operations, then applies them under a write lock:
      </p>
      <CommandPlate
        title="conceptual plan (simplified)"
        code={`create  src/routes/post.routes.ts
create  src/controllers/post.controller.ts
create  src/services/post.service.ts
patch   src/schema.ts          ← postSchema
patch   prisma/schema.prisma   ← model Post   (if Prisma)
patch   src/server.ts          ← app.use("/api/post", …)
patch   root.json              ← modules.post`}
      />
      <p className="code-note">
        If the server patch fails halfway, Root restores the previous snapshot. You do not keep a
        half-wired resource.
      </p>

      <h2>Capability-first UX</h2>
      <p>
        You tell Root what you want the backend to <em>gain</em>, not which MVC file to emit:
      </p>
      <CommandPlate
        title="terminal"
        code={`npx rootcli@latest add resource invoice
npx rootcli@latest add auth
npx rootcli@latest doctor`}
      />
      <ul>
        <li>
          <strong>resource</strong> — public HTTP surface + wiring
        </li>
        <li>
          <strong>auth</strong> — login capability; may retrofit existing resources
        </li>
        <li>
          <strong>doctor</strong> — verify the notebook still matches the disk
        </li>
      </ul>

      <h2>Compared to copying a GitHub template</h2>
      <div className="docs-two-col">
        <div className="docs-panel">
          <h3>Static template</h3>
          <p>
            Great once. The second feature is still hand-wired. Auth bolted on later often misses
            protecting creates. Diffs are huge and hard to review.
          </p>
        </div>
        <div className="docs-panel">
          <h3>Root interconnection</h3>
          <p>
            Init gives you the kitchen. Every later capability is a small, reviewable transaction
            against <em>your</em> project — with dry-run, doctor, and rollback.
          </p>
        </div>
      </div>

      <h2>Who it is for</h2>
      <ul>
        <li>People building an API who want a sensible Express start</li>
        <li>People who want JWT login and resources wired correctly</li>
        <li>People who prefer owned code over a locked SaaS template</li>
        <li>Teams that want deterministic scaffolding (no AI guessing)</li>
        <li>Anyone who has deleted a half-finished route mount at 1am</li>
      </ul>

      <h2>What it is not</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Not this</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Artificial intelligence</td>
              <td>Fixed recipes. No guessing. No chat bot.</td>
            </tr>
            <tr>
              <td>A website host</td>
              <td>It does not put your app on the internet for you.</td>
            </tr>
            <tr>
              <td>A cloud account</td>
              <td>Nothing is uploaded to Root’s servers.</td>
            </tr>
            <tr>
              <td>A language runtime</td>
              <td>Your app still runs with Node.js on your machine.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Next: <Link to="/docs/install">Install</Link>.
      </p>
    </>
  );
}
