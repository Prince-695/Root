# Root

## Monorepo

This repository is a **Turborepo + pnpm workspaces** monorepo.

| Package | Name | Role |
|---|---|---|
| `packages/cli` | `@root/cli` | Commander CLI + `root` bin (dlx entry) |
| `packages/core` | `@root/core` | Shared engine types/utilities |

## Quick start (local development)

```bash
pnpm install
pnpm build
pnpm test

# Run the CLI (after build)
pnpm root-cli --help
# equivalent:
node packages/cli/dist/cli.js --help
```



### Useful scripts

| Script | Meaning |
|---|---|
| `pnpm build` | Turbo build all packages |
| `pnpm typecheck` | TypeScript across packages |
| `pnpm test` | Vitest across packages |
| `pnpm lint` | Biome check |
| `pnpm check` | lint + typecheck + test + build |

## Commands

```bash
pnpm root-cli --yes init my-api   # Generate Express TS + Prisma API (Phase 2)
pnpm root-cli add route post      # Interconnect module — Phases 5–7
pnpm root-cli doctor              # Integrity checks — Phase 8
```

Primary UX when published: `pnpm dlx root@latest init`

## Docs

- [Product Requirements (PRD)](docs/PRD.md)
- [Implementation Phases](docs/Implementation_phases.md)
- [Phase completion notes](docs/phase/) — written after each phase gate

## License

MIT
