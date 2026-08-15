# Compatibility

## Node.js (CLI / `rooot`)

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
| pnpm | `pnpm dlx rooot@latest …` |
| npm | `npx rooot@latest …` |
| yarn | `yarn dlx rooot@latest …` |
| bun | `bunx rooot@latest …` |

### Generated project installers

| Stack language | Managers |
|---|---|
| TypeScript / JavaScript | npm, pnpm, yarn, bun (chosen at init) |
| Python | pip, uv |
| Go | go mod |

## Generated app stacks

| Language | Framework | Status | init | add auth / resource | Node project files? |
|---|---|---|---|---|---|
| TypeScript | Express | Ready | Yes | Yes (full) | Yes |
| JavaScript | Express | Ready | Yes | Yes (full) | Yes |
| TypeScript | Hono | Ready (minimal init) | Yes | Via Node recipes (limited) | Yes |
| TypeScript | NestJS | Ready (minimal init) | Yes | Via Node recipes (limited) | Yes |
| TypeScript | gRPC | Ready (stub init) | Yes | Limited | Yes |
| Python | FastAPI | Ready (auth + resource) | Yes | Yes (native Python) | **No** |
| Python | Flask | Ready (auth + resource) | Yes | Yes (native Python) | **No** |
| Go | net/http | Ready (auth + resource) | Yes | Yes (native Go) | **No** |
| TypeScript | Fastify | Planned | — | — | — |
| Java | Spring Boot | Planned | — | — | — |

**Invariant:** invoking Root with `npx` / `pnpm dlx` does **not** mean the generated Python/Go app becomes a Node project. Those apps must never gain `package.json`, `node_modules`, or `tsconfig.json`.

Capabilities like `add cache`, `add queue`, atomic `middleware`/`service`, etc. remain **Node/Express-oriented**. Infra (`docker`, `github-actions`, `kubernetes`) works across stacks.

## Databases × ORMs (Express Node)

PostgreSQL / MySQL / MongoDB / **SQLite** / none × Prisma / Drizzle / Mongoose / none (valid pairs only).

Python: SQLAlchemy | none. Go: GORM | none.

## Semver

- `0.x` — public preview; breaking changes allowed with changelog notes
- `1.0.0` — stable API for init/add/doctor + Express providers

See also [architecture/README.md](./architecture/README.md) and [future/BACKLOG.md](./future/BACKLOG.md).
