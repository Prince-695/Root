# Phase 6 — `add auth` + Auth-Aware Graph

| Field | Value |
|---|---|
| **Status** | Complete — ready for manual review |
| **Date** | August 9, 2026 |
| **Gate** | Green (MVP: authenticated API without hand-wiring) |
| **Next phase** | Phase 7 — Remaining Atomic Adds |

---

## 1. Executive Summary

`root add auth` installs a complete JWT module (signup/signin/signout, `authenticate` middleware, Zod auth schemas, env/README). Resources added after auth protect mutating routes and bind ownership from the token (`authorId`), ignoring client spoofing. Adding auth after routes **retrofits** existing resources (order-independence B). Init with JWT runs auth during structureize.

---

## 2. What We Built

### 2.1 Auth recipe + `addAuth`

- Routes: `POST /auth/signup|signin|signout`
- Middleware: `authenticate` (Bearer JWT)
- Service: bcrypt + JWT (`bcryptjs`, `jsonwebtoken`)
- User persistence per ORM (Prisma/Mongoose/Drizzle/in-memory)
- Schema registry auth block + exports
- `.env.example` / `env.ts` / README auth docs
- `root.json` → `auth: "jwt"` + `modules.auth`

### 2.2 Auth-aware `add route`

- POST: `authenticate, validate, create`
- Controller uses `req.authenticatedUser.id`
- Zod resource schema omits `authorId`
- ORM models include `authorId` when auth is present

### 2.3 Order independence

| Order | Behavior |
|---|---|
| A — auth then route | New resources generated auth-aware |
| B — route then auth | Retrofit rewrites route/controller/service (+ ORM authorId); warns in CLI |

### 2.4 Init JWT

Selecting JWT at init calls `addAuth` after structureize (before install).

---

## 3. Gate Metrics

| # | Metric | Result |
|---|---|---|
| 6.1 | Auth E2E signup/signin | Pass — 201/200 + token |
| 6.2 | Protected create | Pass — POST with Bearer → 201 |
| 6.3 | Unauthenticated create | Pass — 401 |
| 6.4 | Identity integrity | Pass — body `authorId` ignored; token id used |
| 6.5 | Schema order | Pass — auth before resources |
| 6.6 | Middleware mount | Pass — `authenticate` on POST |
| 6.7 | Order A | Pass |
| 6.8 | Order B | Pass — retrofit policy + tests |
| 6.9 | Secrets safety | Pass — no hardcoded production secrets |
| 6.10 | Public GET regression | Pass — GET `/api/post` 200 without token |

---

## 4. How to Verify

```bash
pnpm --filter @root/core test
pnpm --filter @root/cli test
pnpm check

# Manual MVP demo
pnpm root-cli --yes init demo --skip-install   # or wizard with JWT
cd demo && pnpm install
pnpm root-cli add auth --skip-generate        # if init auth was none
pnpm root-cli add route post --skip-generate
# signup → signin → POST /api/post with Authorization: Bearer …
```

---

## 5. Out of Scope (Phase 7+)

- Atomic `add model|service|middleware|controller`
- Refresh tokens / cookie sessions
- Role-based access control

---

## 6. Review Notes

**This is the product MVP gate.** Stop here for manual review before Phase 7.
