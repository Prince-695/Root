import { CommandPlate } from "../components/CommandPlate";

export function FirstProject() {
  return (
    <>
      <h1>First project</h1>
      <p className="lede">Follow these steps in order. Copy carefully. Pause after each block.</p>

      <h2>A. Empty folder</h2>
      <CommandPlate
        code={`mkdir my-api
cd my-api`}
      />

      <h2>B. Init</h2>
      <CommandPlate code="pnpm dlx root-scaffold@latest init" />
      <p>
        Answer the questions, or use <code>--yes</code> for defaults.
      </p>

      <h2>C. Environment + install + run</h2>
      <CommandPlate
        code={`cp .env.example .env
pnpm install
pnpm prisma:generate
pnpm dev`}
      />
      <p>
        Open <code>http://localhost:3000/health</code>. You should see an “ok” style response. (Skip{" "}
        <code>prisma:generate</code> if you chose no database.)
      </p>

      <h2>D. Auth + a resource</h2>
      <CommandPlate
        code={`pnpm dlx root-scaffold@latest add auth
pnpm dlx root-scaffold@latest add route post`}
      />

      <h2>E. Try the idea</h2>
      <ol>
        <li>
          Sign up at <code>/auth/signup</code>
        </li>
        <li>
          Sign in at <code>/auth/signin</code> — keep the token
        </li>
        <li>
          List posts at <code>/api/post</code>
        </li>
        <li>
          Create a post at <code>/api/post</code> with header{" "}
          <code>Authorization: Bearer &lt;token&gt;</code>
        </li>
      </ol>

      <h2>F. Doctor</h2>
      <CommandPlate code="pnpm dlx root-scaffold@latest doctor" />
      <p>If something drifted, Root prints plain messages about missing files or mounts.</p>
    </>
  );
}
