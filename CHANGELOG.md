# Changelog

All notable changes to Root (`rooot`) are documented here.

## Unreleased — Ultimate composition (Phases 11–20)

### Added

- `root.json` v2: `version`, `packageManager`, `architectureDetail`, `repository`, `features.kubernetes`
- SQLite in Express DB×ORM matrix (Prisma/Drizzle/none)
- Adopt-existing Node projects (`package.json` without overwrite)
- Init package-manager selection (npm/pnpm/yarn/bun; pip/uv; go mod)
- Capabilities: `add cache|queue|storage|websocket|logging|health|rate-limit`
- Infra: `add docker|github-actions|kubernetes`
- `add monorepo` (pnpm workspace scaffold)
- Providers: Hono, NestJS, gRPC (TS); FastAPI, Flask (Python); Go net/http
- FastAPI / Flask / Go: native `add auth` + `add resource` (no Node project files)
- Language-agnostic invariant for Python/Go (no Node project files)
- Docs: `docs/architecture/`, `docs/future/BACKLOG.md`, phase notes 11–20, root `test.md` E2E matrix

### Changed

- README / COMPATIBILITY: Express complete; FastAPI/Flask/Go ready for init+auth+resource
- Stack capability guard allows native Python/Go auth/resource; Node-only extras still blocked on non-Node
- Public package/bin renamed from `rootcli` to `rooot` (never published under the old name). Sole bin is `rooot`; no `root` / `rootcli` aliases.

## 0.1.0 — Public Preview (2026-08-09)

### Added

- Publishable pack `rooot` (bin: `rooot`) with vendored engine + templates
- Capability-oriented CLI: `init`, `add resource|auth|middleware|service`, `list`, `inspect`, `diff`, `doctor`, `sync`
- Planned stubs: `add database|job|event|storage|cache|module`, `remove`
- Express TypeScript + JavaScript providers
- DB × ORM matrix, JWT auth-aware resources, dry-run plans, write lock
- Pack audit + local tarball dlx smoke scripts
- Node 22 / 24 CI matrix (`engines`: `^22.18.0 || >=24`)

### Notes

- Public UX: `npx rooot@latest …` (also pnpm/yarn/bun dlx)
- Low-level `add model` / `add controller` / `add route` are not the public surface (`add route` aliases to `add resource` for one release)
- Fastify and Spring Boot remain planned providers
- CLI requires Node 22.18+ (Babel 8); Node 18/20 are not supported
