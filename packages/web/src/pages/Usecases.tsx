import { CommandPlate } from "@/components/CommandPlate";
import { Link } from "react-router-dom";

export function Usecases() {
  return (
    <>
      <h1>Use cases</h1>
      <p className="lede">
        Short recipes for common backends. Copy the commands, then read the notes so you know what
        you just built.
      </p>

      <h2>Notes API with login</h2>
      <p>
        A personal notes backend: anyone who signs up can create notes; list/get work once you have
        a token on mutating routes.
      </p>
      <CommandPlate
        title="terminal"
        code={`mkdir notes-api && cd notes-api
npx rootcli@latest --yes init
npx rootcli@latest add auth
npx rootcli@latest add resource note
cp .env.example .env   # set ACCESS_TOKEN_SECRET
pnpm install && pnpm dev`}
      />
      <p className="code-note">
        Try <code>POST /auth/signup</code> → <code>POST /auth/signin</code> →{" "}
        <code>POST /api/note</code> with <code>Authorization: Bearer …</code> and body{" "}
        <code>{`{ "title": "buy milk" }`}</code>.
      </p>

      <h2>Catalog with protected creates</h2>
      <p>
        Public product list, authenticated creates — good for a tiny shop admin. Init with JWT (or{" "}
        <code>add auth</code> later), then:
      </p>
      <CommandPlate title="terminal" code="npx rootcli@latest add resource product" />
      <CommandPlate
        title="HTTP idea"
        code={`GET  /api/product           → public list
POST /api/product           → needs Bearer token
     { "title": "Mug" }`}
      />

      <h2>Peek before writing</h2>
      <p>
        When you are unsure what a command will touch, dry-run first. Root prints the operation plan
        and leaves the disk alone.
      </p>
      <CommandPlate title="terminal" code="npx rootcli@latest --dry-run add resource invoice" />

      <h2>Health check after merges</h2>
      <CommandPlate
        title="terminal"
        code={`npx rootcli@latest doctor
npx rootcli@latest diff
npx rootcli@latest list`}
      />
      <p className="code-note">
        Use these after pull requests or manual edits. If someone removed the{" "}
        <code>[ROOT-INJECT:ROUTES]</code> anchor, doctor will say so.
      </p>

      <p>
        Walkthrough with more code: <Link to="/docs/first-project">First project</Link>.
      </p>
    </>
  );
}
