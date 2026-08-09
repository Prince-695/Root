# Root

Pure-engineering backend scaffolding CLI (**no AI**) — capability-oriented interconnection for Express backends.

## Quick start (empty folder)

```bash
mkdir my-api && cd my-api
npx root@latest init
# choose TypeScript or JavaScript + Express, DB/ORM, optional JWT

npx root@latest add auth              # if not selected at init
npx root@latest add resource post
pnpm install && pnpm dev

# GET /health
# POST /auth/signup → POST /auth/signin → token
# POST /api/post with Authorization: Bearer <token>
npx root@latest doctor
```

Also: `pnpm dlx root@latest …` · `yarn dlx root@latest …` · `bunx root@latest …`

### Command surface

```bash
npx root@latest init
npx root@latest add auth
npx root@latest add resource <name>
npx root@latest add database <type>      # planned
npx root@latest add middleware <name>
npx root@latest add service <name>
npx root@latest add job <name>           # planned
npx root@latest add event <name>         # planned
npx root@latest add storage <type>       # planned
npx root@latest add cache <type>         # planned
npx root@latest add module <name>        # planned
npx root@latest remove <type> <name>     # planned
npx root@latest list
npx root@latest inspect <name>
npx root@latest diff
npx root@latest doctor
npx root@latest sync
npx root@latest --dry-run <command>
npx root@latest --help
npx root@latest --version
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
| `pnpm prepare-publish` | Build vendored `release/root` |
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
