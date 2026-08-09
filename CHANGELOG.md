# Changelog

All notable changes to Root (`root-scaffold`) are documented here.

## 0.1.0 — Public Preview (2026-08-09)

### Added

- Publishable pack `root-scaffold` (bin: `root`) with vendored engine + templates
- `root init` / `add` / `doctor` MVP for Express + TypeScript
- Express + JavaScript provider (init, auth, route, doctor)
- DB × ORM matrix, JWT auth-aware routes, atomic adds
- Dry-run plans, write lock, reliability tests
- Pack audit + local tarball dlx smoke scripts
- Node 22 / 24 CI matrix (`engines`: `^22.18.0 || >=24`)

### Notes

- Unscoped npm name `root` is taken; public invocation is `pnpm dlx root-scaffold@latest`
- Fastify, FastAPI, and Spring Boot remain planned providers
- CLI requires Node 22.18+ (Babel 8); Node 18/20 are not supported
