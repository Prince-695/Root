# Phase 7 — Remaining Atomic Adds

| Field | Value |
|---|---|
| **Status** | Complete — ready for manual review |
| **Date** | August 9, 2026 |
| **Gate** | Green (atomic adds + MVP regression + 3-combo typebuild) |
| **Next phase** | Phase 8 — Doctor, Dry-Run, Reliability Hardening |

---

## 1. Executive Summary

Root’s `add` surface is complete for documented atomics: `model`, `service`, `middleware`, and `controller`. Each updates `root.json` modules, validates names, refuses duplicates, and warns when pieces are not HTTP-wired. `add model` also updates the Schema Registry and ORM artifacts. Phase 6 auth/resource E2E remains green.

---

## 2. What We Built

### 2.1 Recipes

- `model` — Zod schema + Prisma/Drizzle/Mongoose artifact + manifest
- `service` — `src/services/<name>.service.ts` stub + warning
- `middleware` — `src/middleware/<name>.ts` stub + warning
- `controller` — `src/controllers/<name>.controller.ts` + warn if no route module

### 2.2 API + CLI

- `addAtomic` / `addModel` / `addService` / `addMiddleware` / `addController`
- Shared name rules (`kebab` / lowercase)
- CLI help examples for all component types

### 2.3 Warnings (graph awareness)

| Kind | Warning |
|---|---|
| model | Schema/ORM only — use `add route` for HTTP |
| service | Not wired to HTTP |
| middleware | Not mounted yet |
| controller | No matching route module |

---

## 3. Gate Metrics

| # | Metric | Result |
|---|---|---|
| 7.1 | add model (Prisma) | Pass — model + schema + manifest |
| 7.2 | add service | Pass |
| 7.3 | add middleware | Pass |
| 7.4 | add controller | Pass |
| 7.5 | Name validation | Pass — invalid names rejected |
| 7.6 | MVP regression | Pass — Phase 6 auth e2e suite |
| 7.7 | Build matrix smoke | Pass — Prisma / Mongoose / none typebuild after adds |

---

## 4. How to Verify

```bash
pnpm --filter @root/core test
pnpm --filter @root/cli test
pnpm check

pnpm root-cli add model comment --skip-generate
pnpm root-cli add service mailer --skip-generate
pnpm root-cli add middleware rate-limit --skip-generate
pnpm root-cli add controller invoice --skip-generate
```

---

## 5. Out of Scope (Phase 8+)

- Full `doctor` integrity suite
- Dry-run hardening / lockfiles
- Stress: 25-route scale

---

## 6. Review Notes

Stop here for manual review before Phase 8.
