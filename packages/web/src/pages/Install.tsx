import { CommandPlate } from "@/components/CommandPlate";
import { Link } from "react-router-dom";

export function Install() {
  return (
    <>
      <h1>Install</h1>
      <p className="lede">
        Root is a CLI you run from an empty folder. No account. No global install required — package
        runners fetch the published pack for you. This page is the complete invoke reference.
      </p>

      <h2>1. Node.js (required)</h2>
      <p>
        Install Node <code>^22.18</code> or <code>&gt;=24</code> from{" "}
        <a href="https://nodejs.org">nodejs.org</a>. The Root CLI engines field rejects older majors
        (18/20) because the publish toolchain (Babel 8) requires modern Node. Generated apps may
        still declare a looser engine in their own <code>package.json</code> — that is separate from
        the CLI runtime.
      </p>
      <CommandPlate title="terminal" code="node -v" />
      <p className="code-note">
        You should see something like <code>v22.18.0</code> or <code>v24.x.x</code>. If the computer
        says “command not found,” Node is not installed yet. After installing, open a <em>new</em>{" "}
        terminal window so <code>PATH</code> updates.
      </p>

      <h2>2. Invoke Root (any package manager)</h2>
      <p>
        Pick the runner you already use. All of these mean: “download and run the latest published{" "}
        <code>root</code> CLI.”
      </p>
      <CommandPlate title="npm" code="npx rooot@latest init" />
      <CommandPlate title="pnpm" code="pnpm dlx rooot@latest init" />
      <CommandPlate title="yarn" code="yarn dlx rooot@latest init" />
      <CommandPlate title="bun" code="bunx rooot@latest init" />
      <p className="code-note">
        Package name and bin name are both <code>root</code>. Docs prefer{" "}
        <code>npx rooot@latest …</code> as the canonical example. You do <strong>not</strong> need{" "}
        <code>npm i -g root</code>.
      </p>

      <h2>3. Global flags (put them before the subcommand)</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Flag</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>--yes</code>
              </td>
              <td>Skip safe prompts (init defaults, etc.).</td>
            </tr>
            <tr>
              <td>
                <code>--dry-run</code>
              </td>
              <td>Print the plan; write nothing.</td>
            </tr>
            <tr>
              <td>
                <code>--verbose</code>
              </td>
              <td>Extra logging for debugging.</td>
            </tr>
            <tr>
              <td>
                <code>--help</code> / <code>--version</code>
              </td>
              <td>Help text and package version.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <CommandPlate
        title="examples"
        code={`npx rooot@latest --yes init my-api
npx rooot@latest --dry-run add resource invoice
npx rooot@latest --verbose doctor
npx rooot@latest --help`}
      />

      <h2>4. Init options you will use often</h2>
      <CommandPlate title="defaults + named folder" code="npx rooot@latest --yes init my-api" />
      <p className="code-note">
        <code>--yes</code> uses the golden path (TypeScript + Express + Postgres + Prisma).{" "}
        <code>my-api</code> creates that folder under the current directory and skips the
        folder-name prompt.
      </p>
      <CommandPlate title="skip dependency install" code="npx rooot@latest init --skip-install" />
      <p className="code-note">
        Useful in CI or when you want to edit <code>package.json</code> before{" "}
        <code>pnpm install</code>.
      </p>
      <CommandPlate title="preview only" code="npx rooot@latest --dry-run --yes init my-api" />

      <h2>5. From a local release tarball</h2>
      <p>
        If you downloaded a GitHub release <code>.tgz</code>, or built one with{" "}
        <code>pnpm prepare-publish</code> + <code>pnpm pack:audit</code>:
      </p>
      <CommandPlate title="terminal" code="npx ./root-0.1.0.tgz --yes init my-api" />
      <p className="code-note">
        Same CLI surface as the registry pack — templates and engine are vendored inside the
        tarball.
      </p>

      <h2>6. Contributors (this monorepo)</h2>
      <CommandPlate
        title="from the Root repo"
        code={`pnpm install
pnpm build
pnpm root-cli --help
pnpm root-cli --yes init my-api`}
      />
      <p className="code-note">
        Use <code>pnpm root-cli</code>, never <code>pnpm root</code> (pnpm reserves that name). The
        docs site lives at <code>packages/web</code> — run <code>pnpm web</code> for the Vite
        server.
      </p>

      <h2>7. Verify the CLI</h2>
      <CommandPlate
        title="smoke"
        code={`npx rooot@latest --version
npx rooot@latest --help`}
      />
      <p>
        You should see the engine banner and the capability command list (<code>init</code>,{" "}
        <code>add</code>, <code>list</code>, <code>inspect</code>, <code>diff</code>,{" "}
        <code>doctor</code>, <code>sync</code>, …).
      </p>

      <div className="callout">
        Stuck on Node version errors? Upgrade Node first — almost every “CLI won’t start” report in
        preview is an old runtime.
      </div>

      <p>
        Next: <Link to="/docs/first-project">First project</Link>.
      </p>
    </>
  );
}
