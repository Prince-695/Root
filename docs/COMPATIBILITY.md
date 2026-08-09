# Compatibility

## Node.js (CLI / `root-scaffold`)

| Version | Status |
|---|---|
| 22.x (`>=22.18`) | Supported (CI) |
| 24.x | Supported (CI default / Active LTS) |
| 18.x / 20.x | Not supported |

Engines field: `^22.18.0 || >=24` (aligned with Babel 8).

Generated Express apps may still declare `node >= 18` in their own `package.json` — that is independent of the Root CLI runtime.

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
