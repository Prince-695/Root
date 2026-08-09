import { CommandPlate } from "@/components/CommandPlate";
import { Link } from "react-router-dom";

export function DocsHome() {
  return (
    <>
      <h1>Start here</h1>
      <p className="lede">
        This manual explains Root in plain language — what it is, why the commands look the way they
        do, and what the generated code means. Read in order, or jump when you already know a piece.
      </p>

      <h2>Root in one breath</h2>
      <p>
        Root scaffolds Express backends and <strong>interconnects</strong> files when you add
        capabilities like <code>auth</code> or <code>resource</code>. No AI. No account. You keep
        every file.
      </p>
      <CommandPlate
        title="typical first hour"
        code={`mkdir my-api && cd my-api
npx root@latest init
cp .env.example .env
pnpm install && pnpm dev
# → http://localhost:3000/health

npx root@latest add auth
npx root@latest add resource post
npx root@latest doctor`}
      />
      <p className="code-note">
        That sequence gives you a living API with login and a wired <code>/api/post</code> resource.
        The rest of this manual unpacks each step.
      </p>

      <h2>Read in this order</h2>
      <ol>
        <li>
          <Link to="/docs/what-is-root">What is Root?</Link> — kitchen metaphor + what a capability
          is
        </li>
        <li>
          <Link to="/docs/why-use-it">Why use it?</Link> — the multi-file pain interconnection
          solves
        </li>
        <li>
          <Link to="/docs/install">Install</Link> — Node version + how to invoke the CLI
        </li>
        <li>
          <Link to="/docs/first-project">First project</Link> — empty folder → health → auth →
          resource, with code walkthroughs
        </li>
        <li>
          <Link to="/docs/commands">Commands</Link> — every capability, line by line
        </li>
        <li>
          <Link to="/docs/how-it-works">How it works</Link> — planner, lock, rollback, inject anchor
        </li>
        <li>
          <Link to="/docs/project-anatomy">Project anatomy</Link> — what each generated file is for
        </li>
      </ol>

      <div className="callout">
        Root is <strong>not</strong> artificial intelligence. It follows fixed recipes so the same
        answers always produce the same structure. That predictability is the point.
      </div>
    </>
  );
}
