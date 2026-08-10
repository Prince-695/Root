# Root

Pure-engineering backend scaffolding CLI (**no AI**) — capability-oriented interconnection for backends.

**Express (TypeScript/JavaScript) is the complete gold path.** FastAPI, Flask, and Go net/http support **init + add auth + add resource** with language-native files only (never `package.json` in Python/Go projects).

## Quick start (Express)

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

## Quick start (FastAPI / Flask / Go)

```bash
mkdir py-api && cd py-api
npx rootcli@latest init
# language: python · framework: fastapi (or flask) · orm: none|sqlalchemy

npx rootcli@latest add auth
npx rootcli@latest add resource post
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload   # Flask: flask --app app run --debug

npx rootcli@latest doctor
# assert: no package.json in this folder
```

```bash
mkdir go-api && cd go-api
npx rootcli@latest init
# language: go · framework: go-http · orm: none|gorm

npx rootcli@latest add auth
npx rootcli@latest add resource post
go mod tidy && go run .
npx rootcli@latest doctor
```

Manual end-to-end matrix for every stack and command: **[test.md](test.md)**.

### Command surface

```bash
npx rootcli@latest init
npx rootcli@latest add auth
npx rootcli@latest add resource <name>
npx rootcli@latest add middleware <name>    # Node / Express
npx rootcli@latest add service <name>       # Node / Express
npx rootcli@latest add cache <type>         # Node / Express
npx rootcli@latest add queue <type>         # Node / Express
npx rootcli@latest add storage <type>       # Node / Express
npx rootcli@latest add websocket            # Node / Express
npx rootcli@latest add logging              # Node / Express
npx rootcli@latest add health               # Node / Express
npx rootcli@latest add rate-limit           # Node / Express
npx rootcli@latest add docker               # all stacks
npx rootcli@latest add github-actions       # all stacks
npx rootcli@latest add kubernetes          # all stacks
npx rootcli@latest add monorepo             # Node
npx rootcli@latest remove <type> <name>
npx rootcli@latest list
npx rootcli@latest inspect <name>
npx rootcli@latest diff
npx rootcli@latest doctor
npx rootcli@latest sync
npx rootcli@latest --dry-run <command>
npx rootcli@latest --help
npx rootcli@latest --version
```

Root exposes **backend capabilities** (`resource`, `auth`, …). Atomic MVC kinds (`model` / `controller` / …) remain Node/Express helpers.

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

- [Manual E2E testing](test.md)
- [Explanation for everyone](docs/explanation.md)
- [Web interface plan](docs/web-interface-plan.md)
- [Product Requirements (PRD)](docs/PRD.md)
- [Implementation Phases](docs/Implementation_phases.md)
- [Compatibility](docs/COMPATIBILITY.md)
- [Changelog](CHANGELOG.md)
- [Phase completion notes](docs/phase/)

## License

MIT
