import { Link } from "react-router-dom";
import { commands } from "../content/commands";

export function CommandsIndex() {
  return (
    <>
      <h1>All commands</h1>
      <p className="lede">
        Each page explains what to type, when to use it, what files change, and common mistakes — in
        plain language.
      </p>
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
