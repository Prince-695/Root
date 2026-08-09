import { cn } from "@/lib/utils";
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
      { to: "/docs/commands/add-resource", label: "add resource" },
      { to: "/docs/commands/add-middleware", label: "add middleware" },
      { to: "/docs/commands/add-service", label: "add service" },
      { to: "/docs/commands/add-planned", label: "planned adds" },
      { to: "/docs/commands/list", label: "list" },
      { to: "/docs/commands/inspect", label: "inspect" },
      { to: "/docs/commands/diff", label: "diff" },
      { to: "/docs/commands/doctor", label: "doctor" },
      { to: "/docs/commands/sync", label: "sync" },
      { to: "/docs/commands/remove", label: "remove" },
      { to: "/docs/commands/dry-run", label: "--dry-run" },
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
    <div className="grid min-h-screen md:grid-cols-[240px_1fr]">
      <aside className="scrollbar-none sticky top-0 h-auto overflow-auto border-b-2 border-foreground bg-[rgba(244,244,240,0.97)] px-5 pt-7 pb-12 md:h-screen md:border-r-2 md:border-b-0">
        <NavLink
          to="/"
          className="mb-2 inline-block border-b-2 border-foreground font-serif text-[1.65rem] leading-none no-underline transition-[border-width] hover:border-b-[3px]"
        >
          Root
        </NavLink>
        <p className="mb-9 max-w-[20ch] text-[0.82rem] leading-[1.65] text-muted-foreground">
          Printed-manual docs. No account. No AI.
        </p>
        <nav className="flex flex-col gap-7">
          {groups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-2.5 font-sans text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {group.title}
              </h4>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {group.links.map((link) => (
                  <li key={link.to} className="mb-0">
                    <NavLink
                      to={link.to}
                      end={link.to === "/docs"}
                      className={({ isActive }) =>
                        cn(
                          "block border-l-2 border-transparent py-1.5 pr-2 pl-2.5 text-[0.9rem] leading-snug no-underline transition-colors",
                          isActive
                            ? "border-foreground bg-secondary/80 font-medium"
                            : "hover:border-foreground/25 hover:bg-secondary/40",
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className="scrollbar-none flex justify-center px-5 py-12 sm:px-8 sm:py-14 md:px-12 lg:px-16">
        <article className="manual-page w-full max-w-[42rem]">
          <Outlet />
          <p className="footer-meta">
            Invoke with <code>npx root@latest</code> · also pnpm/yarn/bun dlx · Node{" "}
            <code>^22.18 || &gt;=24</code>
          </p>
        </article>
      </main>
    </div>
  );
}
