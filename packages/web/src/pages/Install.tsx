import { CommandPlate } from "@/components/CommandPlate";
import { Link } from "react-router-dom";

export function Install() {
  return (
    <>
      <h1>Install</h1>
      <p className="lede">
        Root is a CLI you run from an empty folder. No account. No global install required — package
        runners fetch it for you.
      </p>

      <h2>1. Node.js</h2>
      <p>
        Install Node <code>^22.18</code> or <code>&gt;=24</code> from{" "}
        <a href="https://nodejs.org">nodejs.org</a>. Older Node (18/20) is not supported by the CLI.
        Check your version:
      </p>
      <CommandPlate title="terminal" code="node -v" />
      <p className="code-note">
        You should see something like <code>v22.18.0</code> or <code>v24.x.x</code>. If the computer
        says “command not found,” Node is not installed yet.
      </p>

      <h2>2. Invoke Root (any package manager)</h2>
      <p>
        Pick the runner you already use. All of these mean: “run the latest published{" "}
        <code>root</code> CLI.”
      </p>
      <CommandPlate title="npm" code="npx root@latest init" />
      <CommandPlate title="pnpm" code="pnpm dlx root@latest init" />
      <CommandPlate title="yarn" code="yarn dlx root@latest init" />
      <CommandPlate title="bun" code="bunx root@latest init" />
      <p className="code-note">
        The package name and the bin name are both <code>root</code>. Docs and help text prefer{" "}
        <code>npx root@latest …</code> as the canonical example.
      </p>

      <h2>3. Useful init flags</h2>
      <CommandPlate title="defaults + named folder" code="npx root@latest --yes init my-api" />
      <p className="code-note">
        <code>--yes</code> skips prompts and uses safe defaults (TypeScript + Express + Postgres +
        Prisma). <code>my-api</code> creates that folder under your current directory.
      </p>
      <CommandPlate title="preview only" code="npx root@latest --dry-run --yes init my-api" />
      <p className="code-note">
        Global <code>--dry-run</code> shows what would happen and writes nothing — useful when you
        are cautious.
      </p>

      <h2>4. From a local release tarball</h2>
      <p>
        If you downloaded a release <code>.tgz</code> (or built one with the monorepo pack scripts):
      </p>
      <CommandPlate title="terminal" code="npx ./root-0.1.0.tgz --yes init my-api" />

      <h2>5. Contributors (this monorepo)</h2>
      <CommandPlate
        title="from the Root repo"
        code={`pnpm install
pnpm build
pnpm root-cli --help
pnpm root-cli --yes init my-api`}
      />
      <p className="code-note">
        Use <code>pnpm root-cli</code>, never <code>pnpm root</code> (pnpm reserves that name).
      </p>

      <p>
        Next: <Link to="/docs/first-project">First project</Link>.
      </p>
    </>
  );
}
