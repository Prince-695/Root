# Root

Pure-engineering backend scaffolding CLI (**no AI**) — capability-oriented interconnection for Express backends.

## Quick start (empty folder)

```bash
mkdir my-api && cd my-api
npx rootcli@latest init
# choose TypeScript or JavaScript + Express, DB/ORM, optional JWT

npx rootcli@latest add auth              # if not selected at init
npx rootcli@latest add resource post
pnpm install && pnpm dev

# GET /health
# POST /auth/signup → POST /auth/signin → token
# POST /api/post with Authorization: Bearer <token>
npx rootcli@latest doctor
```

Also: `pnpm dlx rootcli@latest …` · `yarn dlx rootcli@latest …` · `bunx rootcli@latest …`

### Command surface

```bash
npx rootcli@latest init
npx rootcli@latest add auth
npx rootcli@latest add resource <name>
npx rootcli@latest add database <type>      # planned
npx rootcli@latest add middleware <name>
npx rootcli@latest add service <name>
npx rootcli@latest add job <name>           # planned
npx rootcli@latest add event <name>         # planned
npx rootcli@latest add storage <type>       # planned
npx rootcli@latest add cache <type>         # planned
npx rootcli@latest add module <name>        # planned
npx rootcli@latest remove <type> <name>     # planned
npx rootcli@latest list
npx rootcli@latest inspect <name>
npx rootcli@latest diff
npx rootcli@latest doctor
npx rootcli@latest sync
npx rootcli@latest --dry-run <command>
npx rootcli@latest --help
npx rootcli@latest --version
```

Root exposes **backend capabilities** (`resource`, `auth`, `database`, …), not low-level MVC file kinds (`model` / `controller` / `route`).

## Non-coder docs (web)

Black-and-white Bloom-like docs site (React + Vite + Tailwind + shadcn, no backend, no auth):

```bash
pnpm install
pnpm web
# → http://localhost:5173
```

Or read the same narrative in Markdown: [docs/explanation.md](docs/explanation.md)

## Monorepo (contributors)

| Package / app | Name | Role |
|---|---|---|
| `packages/cli` | `@root/cli` | Commander CLI + `root` bin |
| `packages/core` | `@root/core` | Engine, templates, mutators |
| `packages/web` | `@root/web` | Docs / landing site (static) |

```bash
pnpm install
pnpm build
pnpm test

# Local CLI (after build) — never `pnpm root` (pnpm reserved)
pnpm root-cli --help
pnpm root-cli --yes init my-api
```

Default branch for ongoing work: **`main`**.

### Release scripts

| Script | Meaning |
|---|---|
| `pnpm prepare-publish` | Build vendored `release/rootcli` |
| `pnpm pack:audit` | `npm pack` + assert templates/bin/dist |
| `pnpm pack:smoke` | dlx from local tarball → init/add/doctor + health |
| `pnpm web` | Docs site dev server |

### Useful scripts

| Script | Meaning |
|---|---|
| `pnpm build` | Turbo build all packages |
| `pnpm typecheck` | TypeScript across packages |
| `pnpm test` | Vitest across packages |
| `pnpm lint` | Biome check |
| `pnpm check` | lint + typecheck + test + build |

## Docs

- [Explanation for everyone](docs/explanation.md)
- [Web interface plan](docs/web-interface-plan.md)
- [Product Requirements (PRD)](docs/PRD.md)
- [Implementation Phases](docs/Implementation_phases.md)
- [Compatibility](docs/COMPATIBILITY.md)
- [Changelog](CHANGELOG.md)
- [Phase completion notes](docs/phase/)

## License

MIT
