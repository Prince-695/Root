# Phase 3 — Database & ORM Matrix

| Field | Value |
|---|---|
| **Status** | Complete — ready for manual review |
| **Date** | August 9, 2026 |
| **Gate** | Green (all 10 combos generate + typebuild; Postgres+Prisma health regression) |
| **Next phase** | Phase 4 — Interconnection Engine Core |

---

## 1. Executive Summary

Init is no longer Postgres+Prisma-only. Root now supports the full **Express TypeScript DB×ORM matrix** from the PRD:

| Database | Prisma | Drizzle | Mongoose | None |
|---|---|---|---|---|
| PostgreSQL | yes | yes | — | yes |
| MySQL | yes | yes | — | yes |
| MongoDB | yes | — | yes | yes |
| None | — | — | — | yes |

Wizard **filters ORM options by database** (invalid pairs never offered). Structureizer emits the right `src/db/client.ts`, env defaults, Docker engine image, and package deps per combo.

---

## 2. What We Built

### 2.1 Stack matrix (`packages/core/src/init/stack-matrix.ts`)

- `SUPPORTED_COMBOS` (10)
- `isValidCombo` / `ormOptionsForDatabase` / `buildStackTemplateContext`
- Default connection strings per engine

### 2.2 Template variants

- Prisma → `prisma/schema.prisma` + Prisma client (`src/db/client.ts`)
- Drizzle → `drizzle.config.ts` + `src/db/schema.ts` + Drizzle client (pg / mysql2)
- Mongoose → Mongoose client + `src/models/`
- None → stub `src/db/client.ts`
- Docker Compose: postgres / mysql / mongo images
- README documents connection strings per DB

### 2.3 Wizard

All databases enabled; ORM list depends on selected DB; Docker label matches engine.

### 2.4 Install

`prisma generate` runs **only** when ORM is Prisma.

### 2.5 Matrix harness

```bash
node scripts/matrix-typebuild.mjs
```

Generates + `pnpm install` + build for every supported combo.

---

## 3. Manual Verification

```bash
pnpm build

# Interactive — pick MySQL + Drizzle, etc.
pnpm root-cli init my-mysql-app

# Or force golden path
pnpm root-cli --yes init my-pg-app

# Full matrix typebuild (slow)
node scripts/matrix-typebuild.mjs
```

---

## 4. Phase 3 Gate Metrics

| # | Metric | Result |
|---|---|---|
| 3.1 | All supported combos generate | **PASS** (10/10) |
| 3.2 | Typebuild matrix | **PASS** (10/10) |
| 3.3 | Invalid combo blocked | **PASS** (mysql+mongoose) |
| 3.4 | Docker compose per engine | **PASS** |
| 3.5 | Env keys per combo | **PASS** |
| 3.6 | `src/db/client.ts` singleton/stub | **PASS** |
| 3.7 | Live DB smoke | **SKIPPED** (optional; health works without live DB) |
| 3.8 | Postgres+Prisma health regression | **PASS** (HTTP 200) |

---

## 5. Intentionally Not Built Yet

- Interconnect Planner / File Injector / Schema Registry mutations (Phase 4)
- `add route` / `add auth` full wiring (Phases 5–6)
- FastAPI / Spring Boot

---

## 6. Suggested Review Focus

1. Drizzle placeholder `health_checks` table — OK as stub?  
2. Mongoose lazy `connectDb()` vs auto-connect on boot  
3. Whether `none + none` should offer Docker (currently no)

When ready: **commit phase 3**, then **go phase 4**.
