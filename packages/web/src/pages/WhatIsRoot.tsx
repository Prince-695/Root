import { CommandPlate } from "@/components/CommandPlate";
import { Link } from "react-router-dom";

export function WhatIsRoot() {
  return (
    <>
      <h1>What is Root?</h1>
      <p className="lede">
        Root is a pure-engineering command-line tool that creates Express backends and keeps every
        related file in sync when you add a feature — no AI, no cloud account, you own the code.
      </p>

      <h2>The short version</h2>
      <p>
        Think of a backend as a kitchen. A phone app or website is the dining room: it asks for
        “save this post” or “log me in.” The kitchen (your API) answers those requests.
      </p>
      <p>
        Building that kitchen by hand means many files must agree: the URL door, the handler, the
        business logic, the validation rules, maybe a database table, and a line in the server that
        plugs the door in. Miss one piece and the kitchen looks fine but the doorbell is dead.
      </p>
      <p>
        <strong>Root is a kitchen kit.</strong> You answer a few questions (language, database,
        login?). Root lays out shelves and pipes. Later you say “add a post resource” and Root
        updates <em>all</em> the connected pieces in one go — or undoes everything if a step fails.
      </p>

      <h2>What you actually run</h2>
      <p>
        Root is not a website and not a hosting service. It is a program you invoke from a terminal.
        The usual form is:
      </p>
      <CommandPlate title="terminal" code="npx root@latest init" />
      <p className="code-note">
        <code>npx</code> downloads and runs the latest <code>root</code> package without a global
        install. Same idea with <code>pnpm dlx</code>, <code>yarn dlx</code>, or <code>bunx</code>.
      </p>

      <h2>Capabilities, not file kinds</h2>
      <p>
        Older scaffolders often expose low-level pieces: “add a model,” “add a controller,” “add a
        route.” That still leaves you to wire them together.
      </p>
      <p>
        Root’s public surface is <strong>backend capabilities</strong> — things you want the API to
        <em>do</em>:
      </p>
      <ul>
        <li>
          <code>add resource post</code> — a full HTTP noun (list / get / create), wired end-to-end
        </li>
        <li>
          <code>add auth</code> — signup, signin, JWT token checks
        </li>
        <li>
          <code>add middleware</code> / <code>add service</code> — shared filters or logic modules
        </li>
      </ul>
      <CommandPlate
        title="terminal"
        code={`npx root@latest add auth
npx root@latest add resource post`}
      />
      <p className="code-note">
        One capability command can touch many files. That multi-file update is called{" "}
        <strong>interconnection</strong>.
      </p>

      <h2>What Root writes (example)</h2>
      <p>
        After <code>init</code>, every project has a small contract file named{" "}
        <code>root.json</code>. Root reads it before every <code>add</code> so it knows your
        language, database, and which modules already exist.
      </p>
      <CommandPlate
        title="root.json (simplified)"
        code={`{
  "projectName": "my-api",
  "language": "typescript",
  "framework": "express",
  "database": "postgres",
  "orm": "prisma",
  "auth": "none",
  "modules": {}
}`}
      />
      <p className="code-note">
        After <code>add resource post</code>, <code>modules</code> gains an entry for{" "}
        <code>post</code>. After <code>add auth</code>, you will see <code>auth</code> too. That
        notebook is how Root stays honest about your project.
      </p>

      <h2>What Root is not</h2>
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
              <td>Fixed recipes. Same answers → same structure. No chat bot.</td>
            </tr>
            <tr>
              <td>A host or cloud</td>
              <td>Nothing is uploaded. Deploy yourself when you are ready.</td>
            </tr>
            <tr>
              <td>A locked template SaaS</td>
              <td>Generated files are normal Express code you can edit forever.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Next: <Link to="/docs/why-use-it">Why use it?</Link> or jump to{" "}
        <Link to="/docs/first-project">First project</Link>.
      </p>
    </>
  );
}
