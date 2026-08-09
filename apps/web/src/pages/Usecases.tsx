import { CommandPlate } from "../components/CommandPlate";

export function Usecases() {
  return (
    <>
      <h1>Use cases</h1>
      <p className="lede">Short stories. Same tool, different goals.</p>

      <h2>Notes API</h2>
      <CommandPlate
        code={`mkdir notes-api && cd notes-api
pnpm dlx root-scaffold@latest --yes init
pnpm dlx root-scaffold@latest add auth
pnpm dlx root-scaffold@latest add route note
cp .env.example .env
pnpm install && pnpm prisma:generate && pnpm dev`}
      />
      <p>Sign up → sign in → create a note with the token → list notes → run doctor.</p>

      <h2>Public catalog, private create</h2>
      <p>
        Init with JWT (or add auth later), then <code>add route product</code>. Anyone can list;
        only token holders can create.
      </p>

      <h2>Peek before you leap</h2>
      <CommandPlate code="pnpm dlx root-scaffold@latest --dry-run add route invoice" />
      <p>
        Read the plan. Re-run without <code>--dry-run</code> when ready.
      </p>
    </>
  );
}
