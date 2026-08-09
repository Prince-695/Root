# Root

Pure-engineering backend scaffolding CLI (**no AI**) — shadcn-style interconnection for Express backends.

## Quick start (empty folder)

```bash
mkdir my-api && cd my-api
pnpm dlx root-scaffold@latest init
# choose TypeScript or JavaScript + Express, DB/ORM, optional JWT

pnpm dlx root-scaffold@latest add auth          # if not selected at init
pnpm dlx root-scaffold@latest add route post
pnpm install && pnpm dev

# GET /health
# POST /auth/signup → POST /auth/signin → token
# POST /api/post with Authorization: Bearer <token>
pnpm dlx root-scaffold@latest doctor
```

> **npm name:** unscoped `root` is already taken on the registry. The publishable package is **`root-scaffold`** (bin still named `root`).  
> npm / yarn: `npx root-scaffold@latest …` / `yarn dlx root-scaffold@latest …`

## Monorepo (contributors)

| Package | Name | Role |
|---|---|---|
| `packages/cli` | `@root/cli` | Commander CLI + `root` bin |
| `packages/core` | `@root/core` | Engine, templates, mutators |

```bash
pnpm install
pnpm build
pnpm test

# Local CLI (after build) — never `pnpm root` (pnpm reserved)
pnpm root-cli --help
pnpm root-cli --yes init my-api
```

### Release scripts

| Script | Meaning |
|---|---|
| `pnpm prepare-publish` | Build vendored `release/root-scaffold` |
| `pnpm pack:audit` | `npm pack` + assert templates/bin/dist |
| `pnpm pack:smoke` | dlx from local tarball → init/add/doctor + health |

### Useful scripts

| Script | Meaning |
|---|---|
| `pnpm build` | Turbo build all packages |
| `pnpm typecheck` | TypeScript across packages |
| `pnpm test` | Vitest across packages |
| `pnpm lint` | Biome check |
| `pnpm check` | lint + typecheck + test + build |

## Docs

- [Product Requirements (PRD)](docs/PRD.md)
- [Implementation Phases](docs/Implementation_phases.md)
- [Compatibility](docs/COMPATIBILITY.md)
- [Changelog](CHANGELOG.md)
- [Phase completion notes](docs/phase/)

## License

MIT
