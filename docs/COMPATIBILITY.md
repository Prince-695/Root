# Compatibility

## Node.js (CLI / `rootcli`)

| Version | Status |
|---|---|
| 22.x (`>=22.18`) | Supported (CI) |
| 24.x | Supported (CI default / Active LTS) |
| 18.x / 20.x | Not supported |

Engines field: `^22.18.0 || >=24` (aligned with Babel 8).

Generated Express apps may still declare `node >= 18` in their own `package.json` — that is independent of the Root CLI runtime.

## Package managers

### Invoke the CLI

| Tool | Invoke CLI |
|---|---|
| pnpm | `pnpm dlx rootcli@latest …` |
| npm | `npx rootcli@latest …` |
| yarn | `yarn dlx rootcli@latest …` |
| bun | `bunx rootcli@latest …` |

### Generated project installers

| Stack language | Managers |
|---|---|
| TypeScript / JavaScript | npm, pnpm, yarn, bun (chosen at init) |
| Python | pip, uv |
| Go | go mod |

## Generated app stacks

| Language | Framework | Status | Node project files? |
|---|---|---|---|
| TypeScript | Express | Ready | Yes |
| JavaScript | Express | Ready | Yes |
| TypeScript | Hono | Ready (minimal) | Yes |
| TypeScript | NestJS | Ready (minimal) | Yes |
| TypeScript | gRPC | Ready (stub) | Yes |
| Python | FastAPI | Ready | **No** |
| Python | Flask | Ready | **No** |
| Go | net/http | Ready | **No** |
| TypeScript | Fastify | Planned | — |
| Java | Spring Boot | Planned | — |

## Databases × ORMs (Express Node)

PostgreSQL / MySQL / MongoDB / **SQLite** / none × Prisma / Drizzle / Mongoose / none (valid pairs only).

Python: SQLAlchemy | none. Go: GORM | none.

## Semver

- `0.x` — public preview; breaking changes allowed with changelog notes
- `1.0.0` — stable API for init/add/doctor + Express providers

See also [architecture/README.md](./architecture/README.md) and [future/BACKLOG.md](./future/BACKLOG.md).
