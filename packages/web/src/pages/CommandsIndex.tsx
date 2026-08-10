import { CommandPlate } from "@/components/CommandPlate";
import { commands } from "@/content/commands";
import { Link } from "react-router-dom";

export function CommandsIndex() {
  return (
    <>
      <h1>All commands</h1>
      <p className="lede">
        Root’s surface is capability-oriented. Each page explains what to type, what interconnection
        does, and walks through the code you get — in plain language.
      </p>

      <CommandPlate
        title="cheat sheet"
        code={`npx rootcli@latest init
npx rootcli@latest add auth
npx rootcli@latest add resource <name>
npx rootcli@latest add middleware <name>
npx rootcli@latest add service <name>
npx rootcli@latest list
npx rootcli@latest inspect <name>
npx rootcli@latest diff
npx rootcli@latest doctor
npx rootcli@latest sync
npx rootcli@latest --dry-run <command>`}
      />
      <p className="code-note">
        Planned (names reserved): <code>add database|job|event|storage|cache|module</code>,{" "}
        <code>remove</code>.
      </p>

      <h2>Browse</h2>
      <ul>
        {commands.map((c) => (
          <li key={c.slug}>
            <Link to={`/docs/commands/${c.slug}`}>{c.title}</Link> — {c.oneLiner}
          </li>
        ))}
      </ul>
    </>
  );
}
