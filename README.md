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

## Commands (Phase 0 stubs)

```bash
root init          # Structureize empty folder — Phase 2
root add <type>    # Interconnect module — Phases 5–7
root doctor        # Integrity checks — Phase 8
```

## Docs

- [Product Requirements (PRD)](docs/PRD.md)
- [Implementation Phases](docs/Implementation_phases.md)
- [Phase completion notes](docs/phase/) — written after each phase gate

## License

MIT
