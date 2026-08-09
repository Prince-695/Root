import { CommandPlate } from "@/components/CommandPlate";
import { Link } from "react-router-dom";

export function WhyUseIt() {
  return (
    <>
      <h1>Why use Root?</h1>
      <p className="lede">
        Adding one API feature by hand often means updating five or six places. Miss one, and the
        doorbell is dead while the kitchen still looks fine.
      </p>

      <h2>The pain without Root</h2>
      <p>Suppose you want a “posts” API. Without a scaffolder that interconnects, you typically:</p>
      <ol>
        <li>Create a route file (the URL door)</li>
        <li>Create a controller (who answers the door)</li>
        <li>Create a service (who does the work)</li>
        <li>Add a Zod schema (the order checklist)</li>
        <li>Add a database model if you use an ORM</li>
        <li>
          Mount the router in <code>server.ts</code>
        </li>
        <li>Remember to register the module somewhere so tools know it exists</li>
      </ol>
      <p>
        People forget the mount line constantly. Or they add the model but never the schema. Or they
        add auth later and forget to protect <code>POST</code>. Root’s job is to make that whole
        checklist one command — and to roll back if any step fails.
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
        code={`npx root@latest add resource invoice
npx root@latest add auth
npx root@latest doctor`}
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

      <h2>Who it is for</h2>
      <ul>
        <li>People building an API who want a sensible Express start</li>
        <li>People who want JWT login and resources wired correctly</li>
        <li>People who prefer owned code over a locked SaaS template</li>
        <li>Teams that want deterministic scaffolding (no AI guessing)</li>
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
