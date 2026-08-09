import { CommandPlate } from "@/components/CommandPlate";
import { Link } from "react-router-dom";

export function ProjectAnatomy() {
  return (
    <>
      <h1>Project anatomy</h1>
      <p className="lede">
        After <code>init</code>, these are the shelves that matter. Knowing them makes{" "}
        <code>doctor</code> messages and manual edits much less scary.
      </p>

      <h2>Map of the kitchen</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Path</th>
              <th>What it is for</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>root.json</code>
              </td>
              <td>
                Contract notebook: language, DB/ORM, auth, registered modules. Root reads this
                before every add.
              </td>
            </tr>
            <tr>
              <td>
                <code>package.json</code>
              </td>
              <td>
                Scripts (<code>dev</code>, Prisma helpers) and dependency list.
              </td>
            </tr>
            <tr>
              <td>
                <code>src/index.*</code>
              </td>
              <td>Boots the process: loads env, listens on PORT.</td>
            </tr>
            <tr>
              <td>
                <code>src/server.*</code>
              </td>
              <td>
                Express app factory: middleware, <code>/health</code>, inject anchor for mounts.
              </td>
            </tr>
            <tr>
              <td>
                <code>src/routes/</code>
              </td>
              <td>URL doors — which HTTP methods hit which handlers.</td>
            </tr>
            <tr>
              <td>
                <code>src/controllers/</code>
              </td>
              <td>Thin HTTP layer: parse request, call service, shape JSON response.</td>
            </tr>
            <tr>
              <td>
                <code>src/services/</code>
              </td>
              <td>Business work and data access.</td>
            </tr>
            <tr>
              <td>
                <code>src/middleware/</code>
              </td>
              <td>
                Shared filters: logger, <code>validate</code>, <code>auth</code>.
              </td>
            </tr>
            <tr>
              <td>
                <code>src/schema.*</code>
              </td>
              <td>Zod checklists for request bodies.</td>
            </tr>
            <tr>
              <td>
                <code>src/db/</code>
              </td>
              <td>Database client (Prisma / Drizzle / Mongoose / none).</td>
            </tr>
            <tr>
              <td>
                <code>.env.example</code>
              </td>
              <td>
                Sample secrets — copy to <code>.env</code>, never commit real secrets.
              </td>
            </tr>
            <tr>
              <td>
                <code>prisma/</code> or drizzle schema
              </td>
              <td>Database shape when you chose those ORMs.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>root.json after a few adds</h2>
      <CommandPlate
        title="root.json (example)"
        code={`{
  "projectName": "my-api",
  "language": "typescript",
  "framework": "express",
  "database": "none",
  "orm": "none",
  "auth": "jwt",
  "modules": {
    "auth": { "type": "auth", "addedAt": "2026-08-09T12:00:00.000Z" },
    "post": { "type": "resource", "addedAt": "2026-08-09T12:05:00.000Z" }
  }
}`}
      />
      <p className="code-note">
        <code>list</code> and <code>inspect</code> read this notebook. <code>diff</code> /{" "}
        <code>doctor</code> compare it to files on disk.
      </p>

      <h2>Response shape</h2>
      <p>
        Generated handlers usually return a small envelope so clients can branch on{" "}
        <code>success</code>:
      </p>
      <CommandPlate
        title="JSON envelope"
        code={`{ "success": true,  "data": { /* … */ } }
{ "success": false, "error": { "message": "…" } }`}
      />

      <h2>Files you should not casually delete</h2>
      <ul>
        <li>
          <code>[ROOT-INJECT:ROUTES]</code> in <code>src/server.*</code> — later adds need it
        </li>
        <li>
          <code>root.json</code> — the contract; corrupt it and add/doctor stop working until fixed
        </li>
        <li>
          Auth middleware once resources depend on it — remove only if you also unwind protected
          routes
        </li>
      </ul>

      <h2>Optional stacks you may see</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Choice at init</th>
              <th>Extra paths</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Prisma</td>
              <td>
                <code>prisma/schema.prisma</code>, generate scripts
              </td>
            </tr>
            <tr>
              <td>Drizzle</td>
              <td>
                <code>src/db/schema.*</code>
              </td>
            </tr>
            <tr>
              <td>Mongoose</td>
              <td>
                <code>src/models/*.model.*</code>
              </td>
            </tr>
            <tr>
              <td>Docker extra</td>
              <td>
                <code>docker-compose.yml</code> for local DB
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Deeper: <Link to="/docs/how-it-works">How it works</Link> ·{" "}
        <Link to="/docs/commands">Commands</Link>.
      </p>
    </>
  );
}
