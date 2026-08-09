# Changelog

All notable changes to Root (`root`) are documented here.

## 0.1.0 — Public Preview (2026-08-09)

### Added

- Publishable pack `root` (bin: `root`) with vendored engine + templates
- Capability-oriented CLI: `init`, `add resource|auth|middleware|service`, `list`, `inspect`, `diff`, `doctor`, `sync`
- Planned stubs: `add database|job|event|storage|cache|module`, `remove`
- Express TypeScript + JavaScript providers
- DB × ORM matrix, JWT auth-aware resources, dry-run plans, write lock
- Pack audit + local tarball dlx smoke scripts
- Node 22 / 24 CI matrix (`engines`: `^22.18.0 || >=24`)

### Notes

- Public UX: `npx root@latest …` (also pnpm/yarn/bun dlx)
- Low-level `add model` / `add controller` / `add route` are not the public surface (`add route` aliases to `add resource` for one release)
- Fastify, FastAPI, and Spring Boot remain planned providers
- CLI requires Node 22.18+ (Babel 8); Node 18/20 are not supported
