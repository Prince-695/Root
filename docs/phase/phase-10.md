# Phase 10 — Future Stack Providers

| Field | Value |
|---|---|
| **Status** | Partial complete — **10.1 Express JS green**; 10.2–10.4 planned stubs |
| **Date** | August 9, 2026 |
| **Gate** | 10.1 green; Fastify / FastAPI / Spring remain planned |

---

## 1. Executive Summary

Stack providers are pluggable via `resolveStackProvider` / `structureizeProject`. **Express + JavaScript** is a full vertical slice (init → add auth → add route → doctor) sharing the interconnection engine. Fastify, FastAPI, and Spring Boot are registered as `planned` with clear unsupported messages; wizard still marks them Coming soon.

---

## 2. What We Built

- Provider types + registry (`packages/core/src/providers/`)
- Language-aware source extensions (`.ts` / `.js`) across codegen, recipes, doctor, module graph
- `templates/express-js/` ESM templates
- Wizard enables Node.js (JavaScript)
- Planned provider stubs: `fastify-ts`, `fastapi`, `spring-boot`
- Regression: Express TS Phase 6+ suite still required green

---

## 3. How to verify manually

```bash
pnpm root-cli init   # choose JavaScript + Express + none/none or Postgres/Prisma
pnpm root-cli add auth
pnpm root-cli add route post
pnpm root-cli doctor
# Or test: packages/core/tests/express-js.test.ts
```

---

## 4. Gate metrics

| # | Metric | Status |
|---|---|---|
| 10.1.1 | Empty folder init (Express JS) | PASS |
| 10.1.2 | add route interconnection | PASS |
| 10.1.3 | doctor support | PASS |
| 10.1.4 | MVP TS regression | PASS (existing suite) |
| 10.1.5 | Wizard docs | PASS (JS enabled; others coming soon) |
| 10.2–10.4 | Fastify / FastAPI / Spring | Planned (stubs only) |

---

## 5. Intentionally not done

- Fastify templates + inject strategy
- Python FastAPI emitter
- Java Spring Boot emitter
