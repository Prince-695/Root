import { CommandPlate } from "../components/CommandPlate";

export function Install() {
  return (
    <>
      <h1>Install</h1>
      <p className="lede">
        You need Node.js on your computer, then you run Root with a one-line package command.
      </p>

      <h2>1. Install Node.js</h2>
      <ol>
        <li>
          Open <a href="https://nodejs.org">nodejs.org</a>
        </li>
        <li>
          Install version <strong>22.18+</strong> or <strong>24</strong>
        </li>
        <li>Open a terminal and check:</li>
      </ol>
      <CommandPlate code="node -v" />
      <p>
        You should see a version number. If you see “command not found,” Node is not installed yet.
      </p>

      <h2>2. Run Root (when published on npm)</h2>
      <p className="section-label">pnpm (recommended)</p>
      <CommandPlate code="pnpm dlx root-scaffold@latest init" />
      <p className="section-label">npm</p>
      <CommandPlate code="npx root-scaffold@latest init" />

      <h2>3. Defaults / folder name</h2>
      <CommandPlate code={"pnpm dlx root-scaffold@latest --yes init my-api"} />
      <p>
        <code>--yes</code> skips questions and uses the golden defaults (TypeScript + Express +
        Postgres + Prisma).
      </p>

      <h2>4. From this GitHub repository (contributors)</h2>
      <CommandPlate
        code={`git clone https://github.com/Prince-695/Root.git
cd Root
pnpm install
pnpm build
pnpm root-cli --help`}
      />

      <h2>5. From a GitHub Release tarball</h2>
      <CommandPlate code="pnpm dlx ./root-scaffold-0.1.0.tgz --yes init my-api" />

      <div className="callout">
        Remember: the <strong>command</strong> is <code>root</code>, the{" "}
        <strong>npm package</strong> is <code>root-scaffold</code>.
      </div>
    </>
  );
}
