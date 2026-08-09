# Implementation Roadmap

## Root — Backend Scaffolding CLI

| Field | Value |
|---|---|
| **Version** | 2.0 |
| **Last Updated** | August 9, 2026 |
| **Document Owner** | Engineering |
| **Status** | Active Development Plan |
| **Related Doc** | [PRD.md](./PRD.md) |

---

## How to Read This Document

This roadmap breaks Root into **long, end-to-end phases**. Root is a high-level product; rushing phases produces fragile generators.

**Rules for every phase:**

1. Deliver a **vertical slice** that works for a real user flow (not only unit tests).
2. End with a **Phase Gate — Debug / Testing Metrics** section.
3. A phase is **not done** until every gate metric passes.
4. Do **not** start the next phase until the current gate is green.
5. Prefer boring, deterministic engineering over clever shortcuts.

**Primary user invocation (always):**

```bash
pnpm dlx root@latest <command>
```

---

## Table of Contents

1. [Technical Context](#1-technical-context)
2. [Phase Overview Timeline](#2-phase-overview-timeline)
3. [Phase 0 — Repository Foundation & Tooling](#phase-0--repository-foundation--tooling)
4. [Phase 1 — CLI Shell, Detection & root.json](#phase-1--cli-shell-detection--rootjson)
5. [Phase 2 — Init Wizard + Express TS Golden Path](#phase-2--init-wizard--express-ts-golden-path)
6. [Phase 3 — Database & ORM Matrix](#phase-3--database--orm-matrix)
7. [Phase 4 — Interconnection Engine Core](#phase-4--interconnection-engine-core)
8. [Phase 5 — `add route` End-to-End](#phase-5--add-route-end-to-end)
9. [Phase 6 — `add auth` + Auth-Aware Graph](#phase-6--add-auth--auth-aware-graph)
10. [Phase 7 — Remaining Atomic Adds](#phase-7--remaining-atomic-adds)
11. [Phase 8 — Doctor, Dry-Run, Reliability Hardening](#phase-8--doctor-dry-run-reliability-hardening)
12. [Phase 9 — Release Engineering & Public Preview](#phase-9--release-engineering--public-preview)
13. [Phase 10 — Future Stack Providers](#phase-10--future-stack-providers)
14. [Cross-Phase Engineering Standards](#14-cross-phase-engineering-standards)
15. [Risk Register](#15-risk-register)
16. [Appendix](#16-appendix)

---

## 1. Technical Context

### 1.1 Product Intent (recap)

Root is a **pure-engineering terminal CLI** (no AI) that:

- **Creates** backends from empty folders (`init`)
- **Modifies** Root-managed backends with full interconnection (`add`)
- Ships first as **Node + Express + TypeScript**
- Later adds **Python FastAPI** and **Java Spring Boot** as stack providers

### 1.2 Technology Stack (CLI package)

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) | Safety for FS/AST mutations |
| Package distribution | npm publish + `bin: root` | Enables `pnpm dlx root@latest` |
| CLI parser | Commander.js | Simple, proven |
| Interactive prompts | @clack/prompts | Modern terminal UX |
| Templates | Handlebars | Clear separation of structure vs values |
| AST | @babel/parser, traverse, generator | Import injection + syntax validation |
| Schema validation | Zod | CLI config + generated apps |
| Tests | Vitest | Fast unit + integration |
| FS helpers | fs-extra or node:fs promises | Reliable copy/write |

### 1.3 Target Repository Shape (Turborepo monorepo)

Root is developed as a **pnpm workspaces + Turborepo** monorepo. The publishable CLI is `@root/cli` (bin name `root` for `pnpm dlx root@latest`).

```
root/
├── package.json                 # private workspace root
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── biome.json
├── packages/
│   ├── cli/                     # @root/cli — Commander entry + bin: root
│   │   ├── src/
│   │   │   ├── cli.ts
│   │   │   └── commands/        # init, add, doctor
│   │   └── tests/
│   └── core/                    # @root/core — engine types + shared logic
│       ├── src/
│       │   ├── index.ts
│       │   ├── detector.ts              # Phase 1+
│       │   ├── module-graph.ts          # Phase 4+
│       │   ├── interconnect-planner.ts  # Phase 4+
│       │   ├── transaction.ts           # Phase 4+
│       │   ├── providers/express-ts/    # Phase 2+
│       │   ├── mutators/                # Phase 4+
│       │   └── config/root-json.ts      # Phase 1+
│       └── tests/
├── templates/                   # Express TS templates (Phase 2+)
│   └── express-ts/
├── registry/                    # built-in module recipes (Phase 4+)
└── docs/
    ├── PRD.md
    ├── Implementation_phases.md
    └── phase/                   # executive notes after each completed phase
        └── phase-0.md
```

Additional packages (e.g. `@root/templates`, `@root/file-injector`) may be extracted later if boundaries justify it.

### 1.4 Architecture Philosophy

1. **Interconnection over file dumps**
2. **Stack providers** isolate language/framework details
3. **Anchors + AST + Schema Registry + Manifest** together enforce consistency
4. **Journaled transactions** prevent partial states
5. **Phase gates** prove end-to-end reality, not slide-deck progress

---

## 2. Phase Overview Timeline

These durations assume a small focused team (1–2 engineers). Adjust with staffing, but **do not skip gates**.

| Phase | Name | Approx. Duration | Outcome |
|---|---|---|---|
| **0** | Repository Foundation & Tooling | 1–2 weeks | Buildable, testable, CI-ready CLI skeleton |
| **1** | CLI Shell, Detection & root.json | 2–3 weeks | `dlx`-ready commands stubbed; project detection works |
| **2** | Init Wizard + Express TS Golden Path | 3–5 weeks | Empty folder → bootable Express TS (Postgres + Prisma) |
| **3** | Database & ORM Matrix | 3–5 weeks | Postgres/MySQL/Mongo × Prisma/Drizzle/Mongoose paths |
| **4** | Interconnection Engine Core | 3–4 weeks | Planner + transactions + injector + schema registry APIs |
| **5** | `add route` End-to-End | 3–4 weeks | Resource registration fully wires running API |
| **6** | `add auth` + Auth-Aware Graph | 3–4 weeks | JWT auth + protected resources, zero manual wiring |
| **7** | Remaining Atomic Adds | 2–3 weeks | model / service / middleware / controller |
| **8** | Doctor, Dry-Run, Reliability | 2–3 weeks | Integrity tooling + hardening |
| **9** | Release Engineering & Public Preview | 2–3 weeks | npm publish, docs, smoke matrix |
| **10** | Future Stack Providers | Ongoing | FastAPI, Spring Boot |

**Rough MVP (Phases 0–6 green):** ~4–7 months elapsed for a thorough build.  
**Public preview (through Phase 9):** additional ~1–2 months.

```
Phase0 → Phase1 → Phase2 → Phase3 → Phase4 → Phase5 → Phase6
   │        │        │        │        │        │        │
 Gate0    Gate1    Gate2    Gate3    Gate4    Gate5    Gate6
                                                         │
                                            Phase7 → Phase8 → Phase9
                                               │        │        │
                                             Gate7    Gate8    Gate9
                                                         │
                                                      Phase10 (future)
```

---

## Phase 0 — Repository Foundation & Tooling

**Goal:** Create the engineering substrate for a publishable TypeScript CLI. No user-facing generation yet.

**Duration:** 1–2 weeks

### Objectives

- Initialize the Root package with TypeScript strict mode
- Configure lint, format, Vitest, and coverage
- Add GitHub Actions CI (install, typecheck, test)
- Define `bin` entrypoint that prints a placeholder welcome / `--help`
- Establish folder conventions from §1.3
- Align docs (`PRD.md`, this file) as the source of truth

### Tasks

1. Create `package.json` with name strategy (`root` or scoped fallback), `"type": "module"`, `bin`
2. Add `tsconfig.json` (strict, NodeNext or bundler strategy as chosen)
3. Add Vitest + sample unit test proving CI works
4. Add ESLint/Biome + format script
5. Add `.github/workflows/ci.yml`
6. Add CONTRIBUTING snippet in README (dlx-first messaging, even if package unpublished)
7. Ensure deleted legacy hello-world files are replaced by this real foundation when coding begins

### Deliverables Checklist

- [x] Turborepo + pnpm workspaces monorepo (`packages/cli`, `packages/core`)
- [x] Packages build to `dist/` via Turbo
- [x] `pnpm root-cli --help` / `node packages/cli/dist/cli.js --help` works locally
- [x] CI workflow added (`.github/workflows/ci.yml`)
- [x] Coverage reporting wired via Vitest (`test:coverage` per package)
- [x] Phase note: [`docs/phase/phase-0.md`](./phase/phase-0.md)

---

### Phase 0 Gate — Debug / Testing Metrics

| # | Metric | How to verify | Pass criteria |
|---|---|---|---|
| 0.1 | Clean install | `pnpm install` in repo | Exit 0 |
| 0.2 | Typecheck | `pnpm typecheck` | Exit 0, 0 errors |
| 0.3 | Unit tests | `pnpm test` | 100% of Phase 0 tests pass |
| 0.4 | CLI boots | `pnpm exec root --help` or `node dist/cli.js --help` | Help text shows `init`, `add`, `doctor` (stubs OK) |
| 0.5 | CI parity | Push to branch / PR | GitHub Actions green |
| 0.6 | No AI / no secrets | Manual doc + repo scan | No LLM SDK deps; no committed `.env` secrets |

**End-to-end meaning at Phase 0:**  
Developer clones repo → installs → runs help → CI validates the same. Foundation is trustworthy.

**Exit rule:** All 0.x metrics green before Phase 1.

---

## Phase 1 — CLI Shell, Detection & root.json

**Goal:** Real command surface and project intelligence — still without full template emission.

**Duration:** 2–3 weeks

### Objectives

- Implement Commander command registration: `init`, `add`, `doctor`
- Global flags: `--verbose`, `--dry-run`, `--yes`, `--version`
- Implement **shadcn-style init folder UX**:
  - prompt for folder name; Escape → current folder; name → create subfolder
  - works from non-empty cwd when a new folder name is provided
- Implement **Project Detector**:
  - empty / safe-empty folder
  - Root project (`root.json` present + valid)
  - foreign non-empty folder (refuse only when targeting that folder, e.g. Escape in foreign cwd)
- Define Zod schema for `root.json` and load/validate helpers
- Write `root.json` fixture helpers for tests
- Error message catalog for detection failures (actionable copy)

### Tasks

1. `src/cli.ts` wires commands
2. `src/config/root-json.ts` — zod schema + parse/serialize
3. `src/engine/detector.ts` — classification API
4. Stub handlers:
   - `init`: detect → if not empty, error; if empty, print “wizard not implemented” OR run empty wizard stub
   - `add`: require Root project or error
   - `doctor`: validate `root.json` if present
5. Unit tests for detector edge cases (`.git` only, README only, node_modules present, etc.)

### Deliverables Checklist

- [x] Detector unit tests cover ≥ 10 filesystem scenarios (13 scenarios)
- [x] Invalid `root.json` fails with path + field errors
- [x] `add` without `root.json` exits non-zero with clear message
- [x] `init` in foreign project exits non-zero
- [x] Phase note: [`docs/phase/phase-1.md`](./phase/phase-1.md)

---

### Phase 1 Gate — Debug / Testing Metrics

| # | Metric | How to verify | Pass criteria |
|---|---|---|---|
| 1.1 | Help completeness | `root --help`, `root init --help`, `root add --help` | All commands documented |
| 1.2 | Empty detection | Temp dir with only `.git` → detector = `empty-safe` | Pass |
| 1.3 | Foreign detection | Temp dir with random `index.js` → `init` refused | Non-zero exit + message mentions empty folder |
| 1.4 | Root detection | Fixture with valid `root.json` → detector = `root-project` | Pass |
| 1.5 | Invalid contract | Broken `root.json` → parse error | Points to field |
| 1.6 | Add guard | `root add route post` in empty dir | Fails telling user to run `init` |
| 1.7 | Test coverage (engine/config) | Vitest coverage | ≥ 80% on `detector` + `root-json` modules |
| 1.8 | Dry-run flag parsed | `root init --dry-run` | Flag reaches handler (log assertion) |

**End-to-end meaning at Phase 1:**  
CLI behaves safely on real directories: it knows when it can create, when it can modify, and when it must stop.

**Exit rule:** All 1.x metrics green before Phase 2.

---

## Phase 2 — Init Wizard + Express TS Golden Path

**Goal:** From an **empty folder**, interactively create a **bootable** Express + TypeScript backend for the first golden path: **PostgreSQL + Prisma**.

**Duration:** 3–5 weeks

### Objectives

- Full Clack wizard UI (disabled “Coming soon” for FastAPI / Spring Boot)
- Structureizer emits layered MVC tree (see PRD §11)
- Write complete `root.json` from answers
- Golden path templates: Express TS + Postgres + Prisma
- Health route, error handler, logger, cors/helmet, zod env config, graceful shutdown
- Inject anchor `[ROOT-INJECT:ROUTES]` in `server.ts`
- Schema Registry skeleton file
- Dependency install via detected package manager
- README next-steps for dlx workflow

### Wizard must collect (even if some paths are stubbed until Phase 3)

- Project name, language, framework, architecture
- Database / ORM (golden path values fully implemented; others may say “coming in next phase” **or** be hidden until Phase 3 — prefer show-all with disable only for other languages)
- Auth / validation / testing / extras

**Phase 2 implementation focus:** correctly generate **Postgres + Prisma + Express TS**. Other DB/ORM combinations can be refused with a friendly “supported in Phase 3” until then, OR scaffold placeholders — **prefer refuse unsupported combos rather than emit broken projects**.

### Tasks

1. Prompt modules for each wizard step
2. Template set under `templates/express-ts/` for golden path
3. Renderer + writer
4. Post-write install step
5. Integration test: generate into temp dir (non-interactive flags / fixture answers)

### Deliverables Checklist

- [x] Empty dir → wizard (or `--yes` defaults) → project files exist
- [x] `root.json` matches choices
- [x] Generated app `pnpm install && pnpm build` succeeds
- [x] `pnpm dev` serves `GET /health` → 200
- [x] Anchor comment present in `server.ts`
- [x] `.env.example` has `DATABASE_URL` placeholder (no real secrets)
- [x] Phase note: [`docs/phase/phase-2.md`](./phase/phase-2.md)

---

### Phase 2 Gate — Debug / Testing Metrics

| # | Metric | How to verify | Pass criteria |
|---|---|---|---|
| 2.1 | Create-mode E2E | Script: empty tmp → `root init --yes` (golden defaults) | Exit 0 |
| 2.2 | Boot health | Start generated server; `curl /health` | HTTP 200 + JSON success shape |
| 2.3 | Typebuild | In generated app: `pnpm build` | Exit 0 |
| 2.4 | Contract present | Read `root.json` | `framework=express`, `language=typescript`, `orm=prisma`, `database=postgresql` |
| 2.5 | Structure audit | Assert required dirs/files exist | 100% of PRD layered MVC required files for golden path |
| 2.6 | Anchor audit | `server.ts` contains `[ROOT-INJECT:ROUTES]` | Present exactly once |
| 2.7 | Schema skeleton | `src/schema.ts` has Auth/Resource/Exports banners | Pass |
| 2.8 | Init timing | Generation only (exclude download) | < 10s on reference machine |
| 2.9 | Refuse non-empty | `init` on foreign project | Non-zero; no files changed |
| 2.10 | Snapshot stability | Template snapshot tests | Snapshots committed; intentional updates only |

**End-to-end meaning at Phase 2:**  
A real developer can create a new folder and get a running Express TS API with production-shaped structure (golden DB path).

**Exit rule:** All 2.x metrics green before Phase 3.

---

## Phase 3 — Database & ORM Matrix

**Goal:** Init correctly structures backends across the supported DB × ORM matrix for Express TypeScript.

**Duration:** 3–5 weeks

### Objectives

- Valid combinations only (PRD §15.2)
- Per-combination templates for:
  - `src/db` client singleton
  - env vars
  - Docker Compose service (if selected)
  - README DB setup instructions
- Wizard filters ORM options by database
- Services / health can optionally verify DB connectivity (soft-fail in dev if DB down — document behavior)
- Matrix test harness generating projects per combination

### Supported combinations to implement

1. PostgreSQL + Prisma  
2. PostgreSQL + Drizzle  
3. MySQL + Prisma  
4. MySQL + Drizzle  
5. MongoDB + Mongoose  
6. MongoDB + Prisma Mongo  
7. Any DB + None (no ORM; repository stubs or TODO service layer)  
8. Database None + ORM None  

### Tasks

1. Combination resolver (`database` + `orm` → template pack)
2. Docker Compose templates per engine
3. Drizzle / Mongoose / Prisma template variants
4. CI matrix job (may be nightly if heavy): generate + typebuild each combo
5. Document connection string formats in generated README

### Deliverables Checklist

- [x] Wizard never offers invalid combo
- [x] Each supported combo typechecks after generate
- [x] Docker Compose (when selected) matches engine (pg / mysql / mongo images)
- [x] `root.json` records `database` + `orm` accurately
- [x] Phase note: [`docs/phase/phase-3.md`](./phase/phase-3.md)

---

### Phase 3 Gate — Debug / Testing Metrics

| # | Metric | How to verify | Pass criteria |
|---|---|---|---|
| 3.1 | Combo coverage | Generation matrix script | 100% of supported combos generate |
| 3.2 | Typebuild matrix | `pnpm build` per generated combo | 100% pass |
| 3.3 | Invalid combo blocked | Force invalid pair via flag/test harness | Error; no write |
| 3.4 | Docker sanity | Compose config YAML parse for pg/mysql/mongo | Valid compose files |
| 3.5 | Env completeness | `.env.example` keys per combo | Required keys present |
| 3.6 | Client singleton | `src/db` exports one client pattern | Assert file + export exists |
| 3.7 | Live DB smoke (optional but recommended) | docker up + migrate + health for **Postgres+Prisma** and **Mongo+Mongoose** | Both pass locally/CI service containers |
| 3.8 | Regression golden path | Phase 2 Postgres+Prisma health E2E still passes | Pass |

**End-to-end meaning at Phase 3:**  
Init is no longer a single-path demo — users can choose real databases/ORMs and still get a buildable, structured backend.

**Exit rule:** All 3.x metrics green before Phase 4.

---

## Phase 4 — Interconnection Engine Core

**Goal:** Build the engine APIs that make Root different — planning, transactions, injection, schema registry — with thorough tests **before** full UX recipes.

**Duration:** 3–4 weeks

### Objectives

- `ModuleGraph` load/save from `root.json` + disk probes
- `InterconnectPlanner` produces ordered `Operation[]`
- `Transaction` journal: backup → apply → commit / rollback
- `FileInjector`: anchor insertion + AST import insert + syntax validate
- `SchemaRegistry` engine: ensure/create, write auth block, append resource, rewrite exports
- Recipe format for built-in registry items (JSON/TS descriptors)

### Operation types (minimum)

- `createFile`
- `patchFile` (anchor or AST)
- `updateSchema`
- `updateManifest`
- `ensureDependency`
- `runCommand` (e.g. `prisma generate`) — optional, gated

### Tasks

1. Define recipe schema for `registry/resource`, `registry/auth`, etc. (stubs OK)
2. Implement planner pure functions (easy to unit test)
3. Implement transaction temp dir / backup map
4. Implement injector against fixture `server.ts`
5. Implement schema registry against fixture files
6. Fuzz/failure tests: mid-transaction throw → rollback restores bytes

### Deliverables Checklist

- [ ] Planner unit tests for dependency ordering
- [ ] Rollback test proves original content restored
- [ ] Injector does not duplicate mounts when run twice (idempotency helper)
- [ ] Schema registry ordering tests (auth then resources)

---

### Phase 4 Gate — Debug / Testing Metrics

| # | Metric | How to verify | Pass criteria |
|---|---|---|---|
| 4.1 | Planner determinism | Same input → same operation list | Stable snapshots |
| 4.2 | Rollback integrity | Inject error on op N | All files byte-identical to pre-tx |
| 4.3 | Anchor inject | Fixture server + mount op | Import + `app.use` inserted at anchor |
| 4.4 | AST import inject | Fixture without import | Import added once; second run no dup |
| 4.5 | Schema order | auth then two resources (any command order) | File order correct; exports complete |
| 4.6 | Syntax validation | Broken inject attempt | Rejected before write commit |
| 4.7 | Engine coverage | Vitest | ≥ 85% coverage on `engine/` + `mutators/` |
| 4.8 | Performance microbench | 100 schema appends on fixture | No catastrophic slowdown; document baseline |

**End-to-end meaning at Phase 4:**  
The “brain” of Root works on fixtures with proven safety. Higher phases only add recipes/UX on a trusted engine.

**Exit rule:** All 4.x metrics green before Phase 5.

---

## Phase 5 — `add route` End-to-End

**Goal:** Modify-mode resource registration works perfectly on a real generated project.

**Duration:** 3–4 weeks

### Objectives

- `pnpm dlx root add route <name>` (local bin equivalent in tests)
- Recipe `resource` expands to full interconnection list
- Service layer uses the project’s ORM client correctly
- DB model mutation for Prisma / Drizzle / Mongoose when enabled
- Manifest update under `modules`
- Idempotent duplicate protection
- Works for layered MVC architecture

### Example acceptance flow

```bash
mkdir app && cd app
pnpm dlx root@latest init --yes          # or test harness init
pnpm dlx root@latest add route post
pnpm dev
# GET /api/post → 200 (empty list OK)
# POST /api/post → 201 with valid body (if DB available)
```

### Tasks

1. Resource templates (routes/controller/service) per ORM flavor
2. Wire planner recipes
3. Prisma model append + `prisma generate` prompt/auto
4. Drizzle table append / Mongoose model create
5. E2E harness with testcontainers or CI services for at least Postgres+Prisma

### Deliverables Checklist

- [ ] Files created in alias paths from `root.json`
- [ ] `server.ts` mount present
- [ ] Schema contains `postSchema`
- [ ] `root.json.modules.post` exists
- [ ] Duplicate add refused cleanly
- [ ] Rollback on forced failure leaves no new module

---

### Phase 5 Gate — Debug / Testing Metrics

| # | Metric | How to verify | Pass criteria |
|---|---|---|---|
| 5.1 | E2E add route | init golden → add route post → boot | `/api/post` responds |
| 5.2 | CRUD smoke (DB up) | POST + GET by id | 201 then 200 with same id |
| 5.3 | Schema sync | Parse `src/schema.ts` | `postSchema` exported |
| 5.4 | Server sync | Parse `server.ts` | mount `/api/post` once |
| 5.5 | Manifest sync | `root.json` | module entry present |
| 5.6 | ORM sync | Prisma schema / drizzle / mongoose | Model/table exists for Post |
| 5.7 | Zero manual edits | Diff against generator output only | No human patch required for smoke |
| 5.8 | Duplicate guard | add route post twice | Second exits non-zero; no dup mounts |
| 5.9 | Failure rollback | Fault injection during add | Project matches pre-add snapshot |
| 5.10 | Matrix subset | add route on Postgres+Prisma and Mongo+Mongoose | Both E2E pass |
| 5.11 | Timing | File interconnection only | < 2s |

**End-to-end meaning at Phase 5:**  
Root modifies a real backend and the new API is usable without hand-wiring.

**Exit rule:** All 5.x metrics green before Phase 6.

---

## Phase 6 — `add auth` + Auth-Aware Graph

**Goal:** Authentication module installs completely, and resources become securely interconnected.

**Duration:** 3–4 weeks

### Objectives

- `add auth` creates:
  - auth routes (`/auth/signup`, `/auth/signin`, `/auth/signout`)
  - auth controller + service (bcrypt + JWT)
  - `authenticate` middleware
  - Auth schemas in Schema Registry (top anchor)
  - env keys in `.env.example` (`ACCESS_TOKEN_SECRET`, etc.)
- Selecting JWT at **init** may generate auth during init (PRD recommendation) — implement consistently
- `add route` after auth:
  - Mutating routes wrapped with `authenticate`
  - Controllers use `req.authenticatedUser.id`
  - Resource schemas omit client-supplied ownership ids
- Document auth header usage in generated README

### Security acceptance

- Cannot set `authorId` via body to spoof another user on create
- Invalid/missing token on POST → 401

### Tasks

1. Auth recipe + templates
2. Auth-aware template context (`hasAuth: true`)
3. Optional: retrofit prompt if auth added after resources already exist (v1: warn + offer update)
4. E2E: signup → signin → create post with Bearer token

### Deliverables Checklist

- [ ] Auth endpoints work
- [ ] JWT issued on signin/signup
- [ ] Protected create works with token
- [ ] Protected create fails without token
- [ ] Schema order: auth blocks before resources

---

### Phase 6 Gate — Debug / Testing Metrics

| # | Metric | How to verify | Pass criteria |
|---|---|---|---|
| 6.1 | Auth E2E signup/signin | HTTP flow against generated app | 201/200 + token |
| 6.2 | Protected create | POST `/api/post` with token | 201 |
| 6.3 | Unauthenticated create | POST without token | 401 |
| 6.4 | Identity integrity | Attempt body `authorId` spoof | Ignored / rejected; server uses token id |
| 6.5 | Schema order | Registry file | Auth section precedes resources |
| 6.6 | Middleware mount | Route file AST/source | `authenticate` on POST/PUT/DELETE |
| 6.7 | Order independence A | auth then route | Pass 6.2–6.4 |
| 6.8 | Order independence B | route then auth | Documented behavior: warn or retrofit; no crash; gate defines chosen policy and tests it |
| 6.9 | Secrets safety | Grep generated files | No hardcoded production secrets |
| 6.10 | Regression | Phase 5 unauthenticated public GET still works | GET `/api/post` 200 without token |

**End-to-end meaning at Phase 6:**  
Root delivers the headline demo: empty folder → init → auth → resource → **working authenticated API**, zero manual wiring.

**Exit rule:** All 6.x metrics green before Phase 7. **This is the product MVP gate.**

---

## Phase 7 — Remaining Atomic Adds

**Goal:** Complete the atomic component surface with graph awareness.

**Duration:** 2–3 weeks

### Objectives

- `add model <name>`
- `add service <name>`
- `add middleware <name>`
- `add controller <name>`
- Each updates manifest
- `add model` updates Schema Registry + ORM artifacts
- Clear warnings when creating pieces that are not fully wired into HTTP (e.g. controller without route)

### Tasks

1. Recipes for each component type
2. Templates
3. Tests for idempotency and naming validation (`kebab/camel` rules)
4. Help text examples

---

### Phase 7 Gate — Debug / Testing Metrics

| # | Metric | How to verify | Pass criteria |
|---|---|---|---|
| 7.1 | add model | On Prisma project | Model in schema + registry entry |
| 7.2 | add service | File created + manifest | Pass |
| 7.3 | add middleware | File created; compiles | Pass |
| 7.4 | add controller | File created; compiles | Pass |
| 7.5 | Name validation | Invalid names rejected | Non-zero + message |
| 7.6 | MVP regression | Phase 6 full E2E suite | 100% pass |
| 7.7 | Build matrix smoke | At least 3 ORM combos still typebuild after adds | Pass |

**End-to-end meaning at Phase 7:**  
All documented `add` subcommands work without breaking the MVP auth/resource journey.

**Exit rule:** All 7.x metrics green before Phase 8.

---

## Phase 8 — Doctor, Dry-Run, Reliability Hardening

**Goal:** Make Root trustworthy for daily use and team environments.

**Duration:** 2–3 weeks

### Objectives

- `root doctor` full checks (PRD §9.3)
- `--dry-run` shows planned file creates/patches without writing
- Verbose logging useful for bug reports
- Stress tests: many resources (e.g. 25 routes) still inject cleanly
- Improve error copy based on failed E2E learnings
- Concurrent-safe writes (refuse if lock / document single-writer assumption)

### Doctor checks (minimum)

1. `root.json` schema valid  
2. Alias paths exist  
3. Inject anchor present  
4. Schema banners present / ordered  
5. Each `modules` entry has files on disk  
6. Each resource has server mount  
7. Auth consistency (strict mode optional)

---

### Phase 8 Gate — Debug / Testing Metrics

| # | Metric | How to verify | Pass criteria |
|---|---|---|---|
| 8.1 | Doctor clean project | On healthy MVP project | Exit 0 |
| 8.2 | Doctor catches missing anchor | Delete anchor; run doctor | Non-zero; message points to `server.ts` |
| 8.3 | Doctor catches manifest drift | Remove route file; run doctor | Non-zero |
| 8.4 | Dry-run add | `add route x --dry-run` | Prints plan; disk unchanged (hash before/after) |
| 8.5 | Scale smoke | Add 25 resources in loop | Server parses; doctor clean; boot OK |
| 8.6 | Chaos rollback | Random failure injection across 50 runs | 0 partial states |
| 8.7 | MVP regression | Phase 6 suite | 100% pass |
| 8.8 | Performance | 25th add interconnection | Still < 2s file work average |

**End-to-end meaning at Phase 8:**  
Root not only generates — it can **diagnose** and **preview**, and survives messy real-world use.

**Exit rule:** All 8.x metrics green before Phase 9.

---

## Phase 9 — Release Engineering & Public Preview

**Goal:** Publish a preview that real users can run with `pnpm dlx root@latest`.

**Duration:** 2–3 weeks

### Objectives

- npm publish pipeline (manual approval or tagged releases)
- Package name finalized; bin `root` works via dlx
- README quickstart **only** shows empty-folder dlx flow
- Versioning policy (semver); changelog
- Compatibility matrix documented (Node 18/20/22)
- Optional: `root@next` tag for canaries
- Smoke test after publish from a clean machine / CI job using **dlx against registry**

### Tasks

1. Prove pack contents (`npm pack` audit — templates included)
2. Publish dry-run
3. Post-publish CI workflow: `pnpm dlx root@<version> init` in clean dir
4. Security review of template deps
5. Landing docs polish

---

### Phase 9 Gate — Debug / Testing Metrics

| # | Metric | How to verify | Pass criteria |
|---|---|---|---|
| 9.1 | Pack integrity | `npm pack` + inspect tarball | Templates + dist + package.bin present |
| 9.2 | Registry smoke | From clean env: `pnpm dlx root@<published> init --yes` | Boot health 200 |
| 9.3 | Registry add smoke | `dlx … add auth` + `add route post` | Auth CRUD E2E pass |
| 9.4 | Node matrix | Run smoke on Node 18, 20, 22 | All pass |
| 9.5 | PM matrix | pnpm + npm dlx/npx smoke | Both pass |
| 9.6 | Docs accuracy | Follow README exactly on clean machine | Success without undocumented steps |
| 9.7 | No AI claim audit | README/PRD/CLI strings | No AI marketing; “pure engineering” clear |
| 9.8 | Rollback still proven | Re-run 8.6 sample | Pass |

**End-to-end meaning at Phase 9:**  
Anyone on the internet can use Root the intended way — `pnpm dlx root@latest init` — and get the MVP journey working.

**Exit rule:** All 9.x metrics green = **Public Preview** release.

---

## Phase 10 — Future Stack Providers

**Goal:** Extend the same product model to other ecosystems without rewriting the engine.

**Duration:** Ongoing (plan in quarters)

### 10.1 Provider: Node Express JavaScript

- Port templates to JS/CJS or ESM per `root.json`
- Reuse interconnection engine

**Gate 10.1 metrics (summary):** init + add auth + add route E2E identical to TS MVP.

### 10.2 Provider: Fastify TypeScript

- New templates + server inject strategy for Fastify
- Wizard enables Fastify option

**Gate 10.2 metrics:** health + resource + auth E2E on Fastify.

### 10.3 Provider: Python FastAPI

- New provider package/emitter
- Pythonic project layout, pydantic schemas registry analogue
- Invocation still `pnpm dlx root@latest` (CLI remains Node-distributed) generating Python files

**Gate 10.3 metrics:** `uvicorn` boot health; add route interconnection; pytest smoke.

### 10.4 Provider: Java Spring Boot

- Maven/Gradle project structure
- Controllers/services/repositories wiring
- Schema/validation analogue as appropriate

**Gate 10.4 metrics:** app starts; one resource CRUD; auth optional slice.

### Phase 10 Gate — Debug / Testing Metrics (per provider)

| # | Metric | Pass criteria |
|---|---|---|
| 10.x.1 | Empty folder init | Bootable app for that stack |
| 10.x.2 | add route interconnection | No manual wiring |
| 10.x.3 | doctor support | Detects broken mounts/manifest for that stack |
| 10.x.4 | MVP TS regression | Express TS Phase 6 suite still 100% green |
| 10.x.5 | Wizard docs | Coming soon removed only when gate green |

---

## 14. Cross-Phase Engineering Standards

### 14.1 Definition of Done (every phase)

- Code reviewed
- Phase gate metrics recorded (CI logs or `docs/gate-results/` notes when coding begins)
- No known partial-write bugs
- PRD updated if behavior changed
- README updated if user flow changed

### 14.2 Testing Strategy Layers

| Layer | Purpose | Tools |
|---|---|---|
| Unit | Planner, registry, detector | Vitest |
| Integration | Temp FS projects | Vitest + fs |
| E2E | Boot generated servers, HTTP | Vitest/supertest + child processes |
| Matrix | DB/ORM combinations | CI services / testcontainers |
| Publish smoke | Real dlx from registry | Post-release workflow |

### 14.3 Quality Targets

| Area | Target |
|---|---|
| Engine coverage | ≥ 85% from Phase 4 onward |
| Template contract tests | Every supported init combo typebuilds |
| Critical E2E | Phase 6 suite always on PR CI |
| Heavy matrix | Nightly allowed |

### 14.4 Performance Budgets (enforce in gates)

- Init generate (no network): < 10s  
- Add interconnection (no network): < 2s  
- Doctor on medium project (25 modules): < 2s  

---

## 15. Risk Register

| Risk | Phase most affected | Mitigation |
|---|---|---|
| ORM matrix explosion | 3, 5 | Golden path first; matrix behind combination resolver; nightly CI |
| AST fragility | 4–6 | Anchors primary; AST secondary; syntax validate; rollback |
| npm name collision | 9 | Scoped package contingency |
| Slow dlx UX | 9 | Keep package lean; avoid huge template binaries |
| Scope creep into AI | all | Explicit PRD non-goal; reject AI feature PRs for v1 |
| Multi-language too early | 10 | Lock Phases 0–9 on Express TS excellence |

---

## 16. Appendix

### 16.1 MVP Demo Script (must work after Phase 6)

```bash
mkdir my-api && cd my-api
pnpm dlx root@latest init
# choose: TypeScript, Express, Layered MVC, PostgreSQL, Prisma, JWT, Vitest, Docker
pnpm dlx root@latest add route post   # if auth not generated at init
# OR if auth selected at init, auth already present
pnpm dev
# POST /auth/signup
# POST /auth/signin → token
# POST /api/post with Authorization: Bearer <token>
# GET /api/post
pnpm dlx root@latest doctor
```

### 16.2 Gate Sign-off Template

Copy for each phase completion record:

```
Phase: <N>
Date:
Engineer:
Gate metrics: PASS / FAIL
Failed IDs (if any):
CI link:
Notes:
Next phase authorized: YES / NO
```

### 16.3 Technology Decision Log

| Decision | Choice | Alternatives considered |
|---|---|---|
| Distribution UX | `pnpm dlx root@latest` | Global install first |
| First stack | Express + TypeScript | Nest, Fastify |
| Validation | Zod | Joi, Yup |
| ORM matrix | Prisma + Drizzle + Mongoose | TypeORM, Sequelize |
| Inject strategy | Anchors + AST | Regex-only, pure AST |
| AI features | None | Copilot-style generation |
| Architecture | Single package first | Monorepo from day 1 |

### 16.4 Glossary Pointer

See [PRD.md §23 Glossary](./PRD.md#23-glossary) for shared terms.

---

**Document Status:** Active Engineering Plan  
**Phase to start when coding begins:** Phase 0  
**MVP declared when:** Phase 6 gate is fully green  
**Public Preview when:** Phase 9 gate is fully green  
**Contributors:** Engineering team; community PRs welcome after Public Preview
