import { NavLink, Outlet } from "react-router-dom";

const groups: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: "Start",
    links: [
      { to: "/docs", label: "Start here" },
      { to: "/docs/what-is-root", label: "What is Root?" },
      { to: "/docs/why-use-it", label: "Why use it?" },
      { to: "/docs/install", label: "Install" },
      { to: "/docs/first-project", label: "First project" },
    ],
  },
  {
    title: "Commands",
    links: [
      { to: "/docs/commands", label: "All commands" },
      { to: "/docs/commands/init", label: "init" },
      { to: "/docs/commands/add-auth", label: "add auth" },
      { to: "/docs/commands/add-route", label: "add route" },
      { to: "/docs/commands/add-atomic", label: "atomic adds" },
      { to: "/docs/commands/doctor", label: "doctor" },
      { to: "/docs/commands/dry-run", label: "dry-run" },
    ],
  },
  {
    title: "Deeper",
    links: [
      { to: "/docs/how-it-works", label: "How it works" },
      { to: "/docs/project-anatomy", label: "Project anatomy" },
      { to: "/docs/usecases", label: "Use cases" },
      { to: "/docs/glossary", label: "Glossary" },
    ],
  },
];

export function DocsLayout() {
  return (
    <div className="docs-shell">
      <aside className="docs-nav">
        <NavLink to="/" className="nav-brand">
          Root
        </NavLink>
        <p className="nav-note">Printed-manual docs. No account. No AI.</p>
        {groups.map((group) => (
          <div className="nav-group" key={group.title}>
            <h4>{group.title}</h4>
            <ul>
              {group.links.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} end={link.to === "/docs"}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
      <main className="docs-main">
        <article className="manual-page">
          <Outlet />
          <p className="footer-meta">
            Package name <code>root-scaffold</code> · command name <code>root</code> · Node{" "}
            <code>^22.18 || &gt;=24</code>
          </p>
        </article>
      </main>
    </div>
  );
}
