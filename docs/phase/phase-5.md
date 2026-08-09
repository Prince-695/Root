# Phase 5 — `add route` End-to-End

| Field | Value |
|---|---|
| **Status** | Complete — ready for manual review |
| **Date** | August 9, 2026 |
| **Gate** | Green (file interconnect + HTTP smoke + Postgres/Prisma & Mongo/Mongoose CRUD) |
| **Next phase** | Phase 6 — `add auth` + Auth-Aware Graph |

---

## 1. Executive Summary

Modify-mode works: `root add route <name>` plans and applies a full interconnection on a real generated Express TS project — layered MVC files, Zod schema, server mount, ORM model, and `root.json` module entry — with duplicate refusal and transactional rollback.

---

## 2. What We Built

### 2.1 `addRoute` API + CLI

- `packages/core/src/add/route.ts` — validate name, plan resource recipe, apply transaction, optional `prisma generate`
- `packages/cli/src/commands/add.ts` — `add route <name>`, `--skip-generate`, `--dry-run` op listing
- Errors: missing name, unknown component, duplicate module

### 2.2 Resource recipe (layered MVC)

- Routes / controller / service under `root.json` aliases
- Mount: `/api/<slug>` (e.g. `post` → `/api/post`)
- Schema: `postSchema` + exports rewrite
- ORM:
  - Prisma → append `model` + `runCommand prisma generate`
  - Drizzle → append table in `src/db/schema.ts`
  - Mongoose → `src/models/<slug>.model.ts`
  - none → in-memory service store

### 2.3 Supporting mutators

- `packages/core/src/mutators/orm-registry.ts`
- `packages/core/src/registry/codegen/resource-files.ts`
- Operation type `updateOrm` in the transaction engine

### 2.4 Boot polish

- Mongoose projects call `connectDb()` from generated `src/index.ts` before listen

### 2.5 CI / E2E

- GitHub Actions services: Postgres 16 + Mongo 7
- Env: `ROOT_E2E_DATABASE_URL`, `ROOT_E2E_MONGO_URL`
- Local primary: Docker Desktop + testcontainers; Podman can work if Docker socket unavailable

---

## 3. Gate Metrics

| # | Metric | Result |
|---|---|---|
| 5.1 | E2E add route + boot | Pass — `/api/post` 200 (orm none + DB stacks) |
| 5.2 | CRUD smoke (DB up) | Pass — POST 201 → GET by id 200 |
| 5.3 | Schema sync | Pass — `postSchema` exported |
| 5.4 | Server sync | Pass — mount once |
| 5.5 | Manifest sync | Pass — `modules.post` |
| 5.6 | ORM sync | Pass — Prisma `model Post` / Mongoose `PostModel` |
| 5.7 | Zero manual edits | Pass — generator output only |
| 5.8 | Duplicate guard | Pass — second add non-zero; no dup mounts |
| 5.9 | Failure rollback | Pass — pre-add snapshot restored |
| 5.10 | Matrix subset | Pass — Postgres+Prisma and Mongo+Mongoose |
| 5.11 | Timing | Pass — interconnect &lt; 2s (no install/generate) |

---

## 4. How to Verify

```bash
# File interconnect + HTTP (orm none)
pnpm --filter @root/core test

# DB E2E (CI services or local Postgres/Mongo)
ROOT_E2E_DATABASE_URL='postgresql://postgres:postgres@localhost:5432/root' \
ROOT_E2E_MONGO_URL='mongodb://127.0.0.1:27017/root?directConnection=true' \
pnpm --filter @root/core exec vitest run tests/add-route-db.e2e.test.ts

pnpm check

# Manual
pnpm root-cli --yes init demo-api --skip-install
cd demo-api && pnpm install
pnpm root-cli add route post --skip-generate   # from repo; or pnpm dlx root@latest …
```

---

## 5. Out of Scope (Phase 6+)

- `add auth` and auth-aware resource wrapping
- Field customization prompts for routes
- Doctor / dry-run hardening beyond current flags
- FastAPI / Spring providers

---

## 6. Review Notes

Stop here for manual review before Phase 6. Commit on a `phase-5` branch when ready.
