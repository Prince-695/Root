# Product Requirements Document (PRD)

## Root — Backend Scaffolding CLI

| Field | Value |
|---|---|
| **Version** | 2.0 |
| **Date** | August 9, 2026 |
| **Document Owner** | Product + Engineering |
| **Status** | Active — Source of Truth |
| **Related Doc** | [Implementation_phases.md](./Implementation_phases.md) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem & Opportunity](#2-problem--opportunity)
3. [Product Vision & Positioning](#3-product-vision--positioning)
4. [What Root Is (and Is Not)](#4-what-root-is-and-is-not)
5. [Target Users](#5-target-users)
6. [Core Concepts](#6-core-concepts)
7. [Operating Modes](#7-operating-modes)
8. [Distribution & Invocation](#8-distribution--invocation)
9. [Command Reference](#9-command-reference)
10. [Interactive Init Wizard](#10-interactive-init-wizard)
11. [Generated Project Structure](#11-generated-project-structure)
12. [Full Interconnection Model](#12-full-interconnection-model)
13. [Schema Registry](#13-schema-registry)
14. [Project Contract — root.json](#14-project-contract--rootjson)
15. [Stack Support Matrix](#15-stack-support-matrix)
16. [High-Level Architecture](#16-high-level-architecture)
17. [Non-Functional Requirements](#17-non-functional-requirements)
18. [Security Requirements](#18-security-requirements)
19. [Success Metrics & KPIs](#19-success-metrics--kpis)
20. [Out of Scope](#20-out-of-scope)
21. [Risks & Mitigations](#21-risks--mitigations)
22. [Open Questions](#22-open-questions)
23. [Glossary](#23-glossary)
24. [Appendix — Competitive Positioning](#24-appendix--competitive-positioning)

---

## 1. Executive Summary

**Root** is a pure-engineering terminal CLI that creates and evolves backend systems.

It is the **shadcn/ui equivalent for backend development**:

- Users run it via package runners (`pnpm dlx root@latest …`).
- Generated code lives **in the user’s repository** — they own it.
- `init` **structures** a production-grade backend from an empty folder.
- `add` **registers modules** into an existing Root project and **rewires every connected surface** (routes, controllers, services, schema, server mounts, database models, auth, dependencies, manifest) in one atomic transaction.

Root is **not** an AI product. It does not guess business logic. It asks clear engineering questions in the terminal and emits a deterministic, fully wired backend.

**First shipping stack:** Node.js + Express + TypeScript, with real database and ORM/ODM choices (PostgreSQL, MySQL, MongoDB × Prisma, Drizzle, Mongoose).

**Future stacks:** Python FastAPI, Java Spring Boot — same product model, different stack providers.

---

## 2. Problem & Opportunity

### 2.1 Problem Statement

Backend developers repeatedly waste time on:

1. **Greenfield setup** — folder layout, configs, middleware, env validation, scripts, Docker, CI.
2. **Repetitive modules** — every new resource needs routes, controllers, services, validation, DB models, and server registration.
3. **Broken wiring** — forgetting an import, skipping schema updates, mounting a route incorrectly, or leaving auth off mutating endpoints.
4. **Inconsistent team structure** — each service looks different; onboarding suffers.
5. **Tool fragmentation** — Nest CLI, Spring Initializr, ad-hoc Yeoman generators, copy-paste repos — none provide a unified, ownership-friendly, interconnection-first experience across stacks.

### 2.2 Opportunity

There is no widely adopted **“shadcn for backend”**:

| Gap in market | Root’s answer |
|---|---|
| Generators that dump files without wiring | Module Graph + Interconnect Planner |
| Framework lock-in CLIs (Nest-only, Rails-only) | Stack-provider model; Express first, more later |
| Black-box frameworks | Code ownership — copy into your repo |
| AI-generated spaghetti | Deterministic templates + explicit CLI choices |
| Global binary / awkward install UX | `pnpm dlx root@latest` |

---

## 3. Product Vision & Positioning

### 3.1 Vision Statement

> Root lets any developer stand up a production-shaped backend in minutes, then grow it module by module — with every addition perfectly interconnected — using only a terminal CLI and pure engineering.

### 3.2 Positioning Analogy (shadcn/ui)

| shadcn/ui | Root |
|---|---|
| `pnpm dlx shadcn@latest init` | `pnpm dlx root@latest init` |
| `components.json` | `root.json` |
| `pnpm dlx shadcn@latest add button` | `pnpm dlx root@latest add route post` |
| UI primitives copied into `components/ui` | Backend modules copied into `src/` |
| Design tokens + shared utils | Shared middleware + Schema Registry + server anchors |
| You own and edit components | You own and edit routes, controllers, services |
| Not a UI runtime framework | Not a new HTTP runtime — wraps Express (etc.) |

### 3.3 Core Philosophy

1. **Own your code** — Root is a scaffolder/wrapper, not a runtime dependency of the API.
2. **Interconnection is the product** — orphan files are bugs.
3. **Empty folder → company-scalable structure** — production defaults, layered architecture.
4. **Ask everything at init** — stack, DB, ORM, auth, testing, Docker, CI — in the CLI.
5. **Deterministic engineering** — no AI, no magic guesswork.
6. **Atomic & safe** — every `add` is all-or-nothing with rollback.
7. **Stack providers over time** — Node/Express first; FastAPI and Spring Boot later.

---

## 4. What Root Is (and Is Not)

### 4.1 Root IS

- A **terminal CLI** distributed via npm and invoked with `pnpm dlx` / `npx` / `bunx`
- A **framework wrapper** that scaffolds and wires backends (Express today)
- A **structureizer** for empty projects and a **graph updater** for existing Root projects
- A **Module Graph engine** that keeps schema, server, routes, auth, and DB in sync
- A path from **entry-level production** to **company-scalable** layered backends

### 4.2 Root IS NOT

- An AI / LLM codegen assistant
- A new HTTP server framework replacing Express/FastAPI/Spring
- A hosted SaaS required for generation (local-first)
- A tool that silently rewrites unrelated non-Root codebases
- A global-binary-first product (dlx is the primary UX)

---

## 5. Target Users

### 5.1 Primary Users

- Backend engineers building REST APIs and services
- Full-stack developers standing up MVPs quickly
- Tech leads enforcing consistent service structure across teams

### 5.2 Personas

#### Persona 1 — Rapid Prototyper Rachel

- Needs a real API structure in minutes, not a throwaway gist
- Runs `pnpm dlx root@latest init` in an empty folder, picks Postgres + Prisma, ships

#### Persona 2 — Enterprise Architect Alex

- Needs consistent layered MVC across many services
- Uses Root so every service has the same anchors, schema registry, and auth patterns

#### Persona 3 — Polyglot Consultant Priya (future)

- Today: Node/Express via Root
- Later: same CLI mental model for FastAPI and Spring Boot

---

## 6. Core Concepts

### 6.1 Structureizer (`init`)

Turns an **empty folder** into a complete, bootable backend matching the user’s wizard answers. Creates folders, entry files, config, DB layer, middleware, health route, scripts, optional Docker/CI, and `root.json`.

### 6.2 Module Graph

In-memory + manifest representation of what is installed in a Root project (`auth`, `post`, `comment`, …) and how those modules relate (depends on validate middleware, depends on schema registry, protected by auth, has Prisma model, …).

### 6.3 Interconnect Planner

Given an `add` request, expands the module recipe and its dependencies into an ordered list of file creates, file patches, dependency installs, and manifest updates. Executes them as one transaction.

### 6.4 Schema Registry

Single source of truth for Zod validation schemas in the generated app (`src/schema.ts`). Auth schemas first; resource schemas after; exports always rewritten.

### 6.5 Inject Anchors

Stable markers in generated files (e.g. `[ROOT-INJECT:ROUTES]` in `server.ts`) that the File Injector targets when mounting new routers. More reliable than pure heuristic AST edits for route registration.

### 6.6 Stack Provider

Pluggable emitter for a language/framework pair (`ExpressTsProvider`, later `FastApiProvider`, `SpringBootProvider`). The planner is provider-agnostic; templates and mutators are provider-specific.

### 6.7 Journaled Transaction

Before writing, Root snapshots affected files. On any failure, it restores them. Users never get half-wired projects.

---

## 7. Operating Modes

### 7.1 Create Mode — Folder Prompt (shadcn-style)

**Trigger:** `pnpm dlx root@latest init` from any directory.

**Folder selection (before the stack wizard):**

1. Prompt: **What is your project / folder name?**
2. **Enter a name** → Root creates `<cwd>/<name>/` (if needed) and initializes inside it  
3. **Press Escape / cancel** → continue in the **current folder** (only if that folder is empty/safe)  
4. Optional CLI skip: `pnpm dlx root@latest init my-api` creates `./my-api` without the folder prompt

This matches shadcn/ui: you do not need an empty cwd first — give a folder name and Root creates it.

**Then:**

1. Run full interactive stack wizard (Phase 2+)
2. Emit complete project tree for chosen stack
3. Write `root.json`
4. Install dependencies with detected package manager
5. Print next steps (`pnpm dev`, how to add modules)

**Acceptance:** After init, `pnpm dev` (or equivalent) serves a health endpoint without manual file edits.

### 7.2 Modify Mode — Existing Root Project

**Trigger:** `pnpm dlx root@latest add …` when `root.json` exists.

**Behavior:**

1. Load `root.json` and detect stack/DB/ORM
2. Plan interconnection operations
3. Execute atomic transaction
4. Update `modules` in `root.json`

**Acceptance:** No manual wiring required; app boots; new routes respond; schema/server/manifest aligned.

### 7.3 Safety Rules

| Situation | Behavior |
|---|---|
| `add` without `root.json` | Error: run `init` first |
| `init` in non-empty non-Root project + Escape (stay in cwd) | Refuse; tell user to enter a new folder name |
| `init` in non-empty dir + folder name | Create subdirectory and init there |
| `init` when `root.json` already exists | Refuse or offer upgrade path later; v0.1 refuses |
| Duplicate `add route post` | Idempotent refuse or prompt overwrite — never silent duplicate |

---

## 8. Distribution & Invocation

### 8.1 Primary UX

```bash
mkdir my-api && cd my-api
pnpm dlx root@latest init
pnpm dlx root@latest add auth
pnpm dlx root@latest add route post
```

Also supported:

```bash
npx root@latest init
bunx root@latest init
```

### 8.2 Package Requirements

- Publishable npm package with `bin` entry `root`
- Compatible with Node.js ≥ 18 (required for dlx/npx ecosystems)
- Detect package manager from lockfiles / user agent for installs inside the **target** project

### 8.3 Global Install (optional, not primary)

```bash
npm i -g root
root init
```

Docs and marketing always lead with **dlx**.

---

## 9. Command Reference

### 9.1 `root init`

**Purpose:** Structureize a backend from an empty folder via interactive wizard.

```bash
pnpm dlx root@latest init
pnpm dlx root@latest init --yes          # use defaults where safe (advanced)
pnpm dlx root@latest init --dry-run      # preview file tree, write nothing
pnpm dlx root@latest init --verbose
```

### 9.2 `root add <component> [name]`

**Purpose:** Register a module into an existing Root project with full interconnection.

| Subcommand | Name required | Effect |
|---|---|---|
| `add route <name>` | Yes | Resource: routes + controller + service + schema + server mount + DB model (if ORM) + auth wrap (if auth) |
| `add auth` | No | Auth routes/controllers/service + JWT middleware + auth schema anchor |
| `add controller <name>` | Yes | Controller only (still registered in manifest; may warn if orphan) |
| `add service <name>` | Yes | Service layer file |
| `add middleware <name>` | Yes | Middleware scaffold |
| `add model <name>` | Yes | DB model + schema registry entry |

```bash
pnpm dlx root@latest add route post
pnpm dlx root@latest add auth
pnpm dlx root@latest add model comment
```

### 9.3 `root doctor`

**Purpose:** Verify graph integrity.

Checks:

- `root.json` valid
- Inject anchors present
- Schema banners intact and ordered
- Manifest modules exist on disk
- Server mounts match declared resources
- Auth presence consistent with protected routes (configurable strictness)

```bash
pnpm dlx root@latest doctor
```

### 9.4 Global Flags

| Flag | Meaning |
|---|---|
| `--dry-run` | Plan and print; no writes |
| `--yes` | Skip confirmation prompts where safe |
| `--verbose` | Detailed logs |
| `--version` / `--help` | Standard CLI meta |

### 9.5 Future Commands (post-MVP)

- `root diff` — show pending interconnection diff
- `root upgrade` — refresh base templates carefully
- Remote registry: `root add @acme/billing-webhook`

---

## 10. Interactive Init Wizard

Everything is asked in the terminal (Clack-style prompts). No web UI. No AI.

### 10.1 Wizard Steps (v0.1 — Node/Express)

| Step | Prompt | Options (MVP notes) |
|---|---|---|
| 1 | Project name | Default: current folder name |
| 2 | Language / runtime | **Node.js (TypeScript)** enabled; Node JS soon; **Python FastAPI** disabled “Coming soon”; **Java Spring Boot** disabled “Coming soon” |
| 3 | HTTP framework | **Express** enabled; Fastify later |
| 4 | Architecture style | **Layered MVC** (default); Minimal (routes + services) |
| 5 | Database | PostgreSQL, MySQL, MongoDB, None |
| 6 | ORM / ODM | Filtered by DB — Prisma, Drizzle, Mongoose, None (see matrix §15) |
| 7 | Authentication | JWT, None (can `add auth` later) |
| 8 | Validation | Zod (default for TS) |
| 9 | Testing | Vitest, None |
| 10 | Extras (multiselect) | Docker Compose (DB-matched), GitHub Actions, Biome/ESLint+Prettier |
| 11 | Package manager | Detect + confirm (pnpm / npm / yarn / bun) |
| 12 | Summary | Show choices → confirm → generate |

### 10.2 Persistence

All answers are written into `root.json` so subsequent `add` commands generate stack-correct code (e.g. Prisma service vs Mongoose service).

### 10.3 UX Principles

- Keyboard-first, clear labels, “Coming soon” disabled options visible
- Symbols + color (not color alone)
- Actionable errors (“Directory not empty — Root refuses to overwrite. Use an empty folder.”)
- Final summary before any disk writes

---

## 11. Generated Project Structure

### 11.1 Target Tree (Layered MVC — Express TypeScript)

```
my-api/
├── root.json                 # Project contract / Module Graph manifest
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
├── docker-compose.yml        # if selected
├── prisma/                   # if Prisma
│   └── schema.prisma
├── drizzle/                  # if Drizzle (or equivalent layout)
├── src/
│   ├── index.ts              # listen + graceful shutdown
│   ├── server.ts             # Express app, middleware, [ROOT-INJECT:ROUTES]
│   ├── config/               # zod env validation
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middleware/           # errorHandler, validate, logger, authenticate?
│   ├── schema.ts             # Schema Registry
│   ├── db/                   # client singleton
│   ├── models/               # if Mongoose
│   ├── utils/
│   └── types/
└── tests/                    # if Vitest selected
```

### 11.2 Production-Grade Defaults (always for layered MVC)

- Central error handler
- Request logging
- `helmet` + `cors`
- Zod-validated environment config
- Graceful shutdown (`SIGTERM` / `SIGINT`)
- Health route (`GET /health`)
- npm scripts: `dev`, `build`, `start`, `test`, `lint`
- DB client as singleton
- Inject anchors ready for `add`
- Consistent naming conventions for team scale

### 11.3 Quality Bar

Root targets **entry-level production** that can grow to **company-scalable** services without reshuffling the tree. It is not a single-file demo generator.

---

## 12. Full Interconnection Model

### 12.1 North-Star Rule

> When a developer registers anything, **one command** leaves a consistent, bootable system. No manual imports. No forgotten schema. No orphan controllers.

### 12.2 Example Transaction — `pnpm dlx root@latest add route post`

| Step | Action |
|---|---|
| 1 | Create `src/routes/post.routes.ts` |
| 2 | Create `src/controllers/post.controller.ts` |
| 3 | Create `src/services/post.service.ts` (uses selected DB client) |
| 4 | Append `postSchema` to Schema Registry; rewrite exports |
| 5 | Inject import + `app.use('/api/post', postRouter)` into `server.ts` |
| 6 | Add DB model (Prisma / Drizzle / Mongoose) if ORM enabled |
| 7 | If auth installed: protect mutating routes; use `req.authenticatedUser.id` for ownership; omit spoofable ids from schema |
| 8 | Ensure required npm dependencies |
| 9 | Record `post` in `root.json` → `modules` |
| 10 | On any failure: rollback all file changes |

### 12.3 Auth Interconnection

After `add auth`:

- Future `add route` resources auto-apply `authenticate` on `POST` / `PUT` / `DELETE`
- Controllers resolve identity from `req.authenticatedUser` — **never** from `req.body`
- Schema Registry places auth schemas in the **Auth** section (top anchor)
- `doctor` can flag mutating routes missing auth when auth module is present

### 12.4 Naming Conventions (enforced in templates)

| Context | Convention | Example |
|---|---|---|
| Router export | `camelCase` + `Router` | `postRouter` |
| Controller functions | verb + noun | `createPost`, `getAllPosts` |
| Service methods | verb + noun | `postService.create` |
| Schema variables | noun + `Schema` | `postSchema`, `signUpSchema` |
| Auth request property | exact name | `req.authenticatedUser` |
| Identity fields | noun + `Id` | `authorId`, `ownerId` |

---

## 13. Schema Registry

### 13.1 Role

`src/schema.ts` (path configurable via `root.json` aliases) is the **single source of truth** for Zod schemas.

### 13.2 Section Order (always)

1. File header (do not edit banners warning)
2. Auth Schemas section
3. Resource Schemas section
4. Exports section

### 13.3 Mutation Rules

| Command | Registry effect |
|---|---|
| First `add` in a project | Create registry skeleton if missing |
| `add auth` | Write `signUpSchema` / `signInSchema` under Auth section |
| `add route` / `add model` | Append resource schema under Resource section |
| Every mutation | Rewrite `export { … }` to match declared schemas |

### 13.4 Ordering Guarantee

Regardless of command order, effective semantic order remains:

**authSchemas → resourceSchemas → exports**

---

## 14. Project Contract — root.json

Analogous to shadcn’s `components.json`.

```json
{
  "$schema": "https://root.dev/schema.json",
  "projectName": "my-api",
  "language": "typescript",
  "framework": "express",
  "architecture": "layered-mvc",
  "database": "postgresql",
  "orm": "prisma",
  "auth": "jwt",
  "validation": "zod",
  "testing": "vitest",
  "aliases": {
    "routes": "src/routes",
    "controllers": "src/controllers",
    "services": "src/services",
    "middleware": "src/middleware",
    "schema": "src/schema.ts",
    "server": "src/server.ts",
    "db": "src/db"
  },
  "features": {
    "docker": true,
    "githubActions": true
  },
  "modules": {
    "auth": { "type": "auth", "addedAt": "2026-08-09T00:00:00.000Z" },
    "post": { "type": "resource", "addedAt": "2026-08-09T00:00:00.000Z" }
  },
  "inject": {
    "routesAnchor": "[ROOT-INJECT:ROUTES]"
  }
}
```

**Rules:**

- Written by `init`; read by every `add` / `doctor`
- `modules` is the install manifest
- Aliases drive where files are written
- Stack fields drive which templates/mutators run

---

## 15. Stack Support Matrix

### 15.1 Language / Framework Roadmap

| Stack | Status |
|---|---|
| Node.js + Express + TypeScript | **v0.1 — build now** |
| Node.js + Express + JavaScript | Near-term after TS |
| Node.js + Fastify + TypeScript | Later |
| Python + FastAPI | Future stack provider |
| Java + Spring Boot | Future stack provider |

### 15.2 Database × ORM/ODM (Express TS)

| Database | Prisma | Drizzle | Mongoose | None |
|---|---|---|---|---|
| PostgreSQL | Yes | Yes | — | Yes |
| MySQL | Yes | Yes | — | Yes |
| MongoDB | Yes (Prisma Mongo) | — | Yes | Yes |
| None | — | — | — | Yes |

Invalid combinations are **not shown** in the wizard.

### 15.3 Validation & Testing Defaults (TS)

- Validation: Zod
- Testing: Vitest (optional)

---

## 16. High-Level Architecture

### 16.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                 Terminal CLI (no AI)                        │
│         pnpm dlx root  →  Commander + Clack                 │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      Root Engine                            │
│  Project Detector │ root.json │ Module Graph                │
│  Interconnect Planner │ Stack Providers                     │
└───────┬─────────────┬──────────────┬────────────────────────┘
        │             │              │
        ▼             ▼              ▼
  Templates     File Injector   Schema Registry
  (Handlebars)  (anchors+AST)   (ordered schema.ts)
        │             │              │
        └─────────────┼──────────────┘
                      ▼
              DB Mutators (Prisma / Drizzle / Mongoose)
              Dependency Installer
                      │
                      ▼
              Journaled FS Transaction (+ rollback)
```

### 16.2 Key Technologies (CLI itself)

| Concern | Choice |
|---|---|
| Language | TypeScript |
| CLI parsing | Commander.js |
| Interactive UI | @clack/prompts |
| Templates | Handlebars |
| AST | Babel parser/traverse/generator |
| Validation | Zod |
| Tests | Vitest |
| Config discovery | cosmiconfig or direct `root.json` read |

### 16.3 Explicit Non-Goals in Architecture

- No LLM calls
- No telemetry by default
- No requirement that generated apps depend on a Root runtime package

---

## 17. Non-Functional Requirements

### 17.1 Performance

| Metric | Target |
|---|---|
| CLI help / version cold path | < 200ms when locally installed; dlx download time excluded |
| `init` generation (excluding network install) | < 10 seconds for standard layered Express TS |
| `add route` interconnection | < 2 seconds file work (excluding npm install / prisma generate) |
| Peak memory during generation | < 100MB |

### 17.2 Reliability

- Atomic transactions with rollback
- Pre-flight validation before writes
- Idempotent adds (no silent duplicates)
- Clear, actionable error messages

### 17.3 Compatibility

- Node.js ≥ 18 for running the CLI via dlx/npx
- OS: Linux, macOS, Windows (WSL2 recommended on Windows)
- Package managers: pnpm, npm, yarn, bun (detect + use)

### 17.4 Usability

- Fully usable in interactive TTY
- Non-interactive flags for CI (`--yes`, `--dry-run`) where defined
- Accessibility: symbols in addition to color

---

## 18. Security Requirements

1. **No arbitrary code execution from templates** — templates are data rendered by Handlebars, not `eval`’d user JS
2. **No secrets in committed files** — `.env.example` placeholders only
3. **Auth defaults** — JWT middleware attaches `req.authenticatedUser`; identity never trusted from body
4. **Dependency pins** — generated apps use pinned (or clearly ranged) dependency versions, not uncontrolled `latest`
5. **Telemetry off by default** — local-first
6. **Refuse unsafe `init`** into non-empty foreign projects in v0.1

---

## 19. Success Metrics & KPIs

### 19.1 Product Success

| Metric | Target |
|---|---|
| Time to bootable API from empty folder | < 10 minutes including first-time dlx + install |
| Manual wiring steps after `add route` | **Zero** |
| Failed generation leaving partial state | **Zero** (rollback) |
| Developer satisfaction (survey) | ≥ 95% “would use again” among early adopters |

### 19.2 Launch Criteria (see Implementation Phases for gates)

- Empty folder init → health endpoint works
- `add auth` + `add route` → authenticated CRUD works end-to-end
- `doctor` catches broken anchors
- Docs teach **only** the dlx flow as primary

---

## 20. Out of Scope

### 20.1 Out of Scope for v0.1

- AI / LLM features of any kind
- Implementing FastAPI or Spring Boot (wizard shows “Coming soon” only)
- Remote component marketplace
- VS Code / JetBrains extensions
- GraphQL / tRPC / NestJS first-class support
- Silently restructuring arbitrary existing backends that are not Root-managed

### 20.2 Deferred (documented future)

- Fastify provider
- Remote registries (`@org/module`)
- OpenAPI generation on `add route`
- Interactive field prompts for resource schemas/models
- `root upgrade` template migrations

---

## 21. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| AST injection breaks user-edited files | High | Medium | Prefer inject anchors; validate syntax; rollback; `doctor` |
| DB/ORM matrix explodes maintenance | High | High | Golden-path first (Postgres+Prisma); matrix phased; contract tests |
| npm package name `root` unavailable | Medium | Medium | Use scoped name `@…/root` if needed; keep bin `root` |
| Users expect AI magic | Medium | Medium | Explicit positioning: pure engineering CLI |
| Multi-language too early | High | Medium | Stack providers; ship Express TS excellence first |
| Partial writes on crash | High | Low | Journaled transactions |

---

## 22. Open Questions

1. Final npm package name / scope if `root` is taken
2. How aggressive should `doctor --strict` be about auth on all mutating routes?
3. Should `init` with auth selected generate auth immediately, or only enable feature flag for later `add auth`? *(Recommendation: if user selects JWT at init, generate auth module during init.)*
4. Minimum Node version for **generated** apps (recommend 20 LTS)
5. Biome vs ESLint+Prettier as default lint tooling

---

## 23. Glossary

| Term | Definition |
|---|---|
| **Structureizer** | `init` process that builds a full backend tree from wizard answers |
| **Module Graph** | Model of installed modules and their relationships |
| **Interconnect Planner** | Expands an `add` into ordered create/patch/install ops |
| **Schema Registry** | Ordered Zod schema file (`src/schema.ts`) |
| **Inject Anchor** | Stable comment marker for safe code injection |
| **Stack Provider** | Language/framework-specific generator implementation |
| **root.json** | Project contract and module manifest |
| **Journaled Transaction** | Snapshot + commit/rollback file mutation session |
| **`req.authenticatedUser`** | Standard request property for JWT payload |
| **Create Mode** | Empty-folder `init` |
| **Modify Mode** | `add` against existing Root project |

---

## 24. Appendix — Competitive Positioning

| Tool | Limitation | Root difference |
|---|---|---|
| Yeoman | Aging UX; generator quality varies; weak interconnection | Modern dlx UX; Module Graph |
| Plop | Micro-generator; requires setup | Opinionated production structure + wiring |
| Nest CLI | Nest-only | Express-first wrapper; ownership model; multi-stack roadmap |
| Spring Initializr | Java / often web UI | Terminal-first; later Spring as one provider |
| shadcn/ui | Frontend only | Same *product shape*, for backend systems |

**Root’s differentiator:** shadcn-style ownership + distribution, plus **mandatory end-to-end interconnection** for backend modules.

---

**Document Status:** Active source of truth for product behavior  
**Next Document:** [Implementation_phases.md](./Implementation_phases.md) — phased delivery with debug/testing gates  
**Next Review:** After Phase 0 completion
