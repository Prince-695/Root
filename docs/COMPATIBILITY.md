# Compatibility

## Node.js

| Version | Status |
|---|---|
| 18.x | Supported |
| 20.x | Supported |
| 22.x | Supported (CI default) |

Engines field: `node >= 18`.

## Package managers (dlx / install)

| Tool | Invoke CLI | Notes |
|---|---|---|
| pnpm | `pnpm dlx root-scaffold@latest …` | Primary |
| npm | `npx root-scaffold@latest …` | Supported |
| yarn | `yarn dlx root-scaffold@latest …` | Best-effort |
| bun | `bunx root-scaffold@latest …` | Best-effort |

## Generated app stacks (ready)

| Language | Framework | Status |
|---|---|---|
| TypeScript | Express | Ready (MVP) |
| JavaScript | Express | Ready (Phase 10.1) |
| TypeScript | Fastify | Planned |
| Python | FastAPI | Planned |
| Java | Spring Boot | Planned |

## Semver

- `0.x` — public preview; breaking changes allowed with changelog notes
- `1.0.0` — stable API for init/add/doctor + Express providers
