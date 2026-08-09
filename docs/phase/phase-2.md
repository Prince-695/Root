# Phase 2 — Init Wizard + Express TS Golden Path

| Field | Value |
|---|---|
| **Status** | Complete — ready for manual review |
| **Date** | August 9, 2026 |
| **Gate** | Green (`pnpm check` + generate/build/`GET /health` E2E) |
| **Next phase** | Phase 3 — Database & ORM Matrix |

---

## 1. Executive Summary

`root init` now **generates a real, bootable backend** for the Phase 2 golden path:

**TypeScript + Express + layered MVC + PostgreSQL + Prisma**

Flow:

1. shadcn-style folder name (create subfolder or Escape = cwd)  
2. Interactive wizard (or `--yes` golden defaults)  
3. Structureizer writes templates + `root.json`  
4. Optional dependency install + `prisma generate`  

Verified end-to-end: generate → `pnpm build` → `GET /health` → **200** `{ success: true, data.status: "ok" }`.

---

## 2. What We Built

### 2.1 Wizard (`packages/cli/src/init/wizard.ts`)

Asks for language, framework, architecture, database, ORM, auth, testing, extras (Docker / GitHub Actions).  
Non-golden options shown as disabled “Coming soon / Phase 3”.  
`--yes` skips prompts and uses golden defaults.

### 2.2 Structureizer (`packages/core`)

- `InitAnswers` → `root.json`
- Handlebars renderer
- Template pack: `packages/core/templates/express-ts/`
- Writes layered app: `src/index.ts`, `server.ts` (with `[ROOT-INJECT:ROUTES]`), health route, middleware, schema registry skeleton, Prisma schema, Docker Compose (optional), Vitest (optional)

### 2.3 Install helper

Detects pnpm/npm/yarn/bun and runs install + `prisma generate` (skip with `--skip-install`).

### 2.4 CLI

```bash
pnpm root-cli --yes init my-api
pnpm root-cli --yes init my-api --skip-install
pnpm root-cli --yes --dry-run init my-api
```

---

## 3. Manual Verification Checklist

```bash
pnpm build
mkdir -p /tmp/root-p2 && cd /tmp/root-p2
pnpm --dir /path/to/Root root-cli --yes init demo-api
cd demo-api
cp .env.example .env
# optional: docker compose up -d
pnpm prisma:generate   # if install already ran, may already be done
pnpm build
pnpm dev
# open http://localhost:3000/health
```

Expect JSON:

```json
{ "success": true, "data": { "status": "ok", "service": "demo-api", ... } }
```

Also confirm:

- `root.json` has `express` / `typescript` / `postgresql` / `prisma`
- `src/server.ts` contains `[ROOT-INJECT:ROUTES]` once
- `src/schema.ts` has Auth / Resource / Exports banners
- `.env.example` lists `DATABASE_URL` (no real secrets)

---

## 4. Phase 2 Gate Metrics

| # | Metric | Result |
|---|---|---|
| 2.1 | `init --yes` create-mode E2E | **PASS** |
| 2.2 | `GET /health` → 200 + success JSON | **PASS** |
| 2.3 | Generated `pnpm build` | **PASS** |
| 2.4 | `root.json` contract fields | **PASS** |
| 2.5 | Layered MVC required files | **PASS** |
| 2.6 | Inject anchor exactly once | **PASS** |
| 2.7 | Schema registry banners | **PASS** |
| 2.8 | Generation &lt; 10s (exclude install) | **PASS** |
| 2.9 | Foreign cwd without new name still refused | **PASS** (Phase 1 behavior kept) |
| 2.10 | Structureizer/unit coverage of templates | **PASS** (structureizer + init-generate tests) |

---

## 5. Intentionally Not Built Yet

- MySQL / Mongo / Drizzle / Mongoose matrix (Phase 3)
- Interconnect engine / `add route` wiring (Phases 4–5)
- Full `add auth` module generation (Phase 6) — wizard only records JWT preference in `root.json`
- FastAPI / Spring Boot

---

## 6. Suggested Review Focus

1. Generated folder layout and defaults (Docker on by default with `--yes`)  
2. Health at `/health` (also `/api/health`)  
3. Whether JWT at init should scaffold auth files immediately (currently deferred to Phase 6)

When you approve, say **commit phase 2** and/or **go phase 3**.
