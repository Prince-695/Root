# Phase 8 — Doctor, Dry-Run, Reliability Hardening

| Field | Value |
|---|---|
| **Status** | Complete — ready for manual review |
| **Date** | August 9, 2026 |
| **Gate** | Green (doctor, dry-run, scale, chaos rollback) |
| **Next phase** | Phase 9 — Release Engineering & Public Preview |

---

## 1. Executive Summary

Root can **diagnose** and **preview** safely: `doctor` runs full integrity checks, `--dry-run` prints a detailed operation plan without touching disk, modify commands take a single-writer `.root.lock`, and chaos/scale tests prove rollback and interconnect performance under load.

---

## 2. What We Built

### 2.1 Doctor (`runDoctor`)

Checks:

1. Valid `root.json`
2. Alias paths/files exist
3. Inject anchor in `server.ts`
4. Schema banners ordered (Auth → Resource → Exports)
5. Manifest modules have files on disk
6. Resources have server mounts
7. Auth consistency (warnings by default; `--strict` → errors)

### 2.2 Dry-run

- `formatOperationPlan` prints create/patch/schema/ORM/deps lines
- Hash-verified: dry-run leaves the tree unchanged

### 2.3 Single-writer lock

- `.root.lock` around apply; concurrent Root refuses with a clear message
- Stale locks (>5m) are replaced
- Documented assumption: one writer at a time

### 2.4 Reliability tests

- 25-route scale: doctor clean, server parses, avg interconnect &lt; 2s
- 50× chaos failAtIndex: byte-identical restore
- Phase 6 auth e2e remains in the suite

---

## 3. Gate Metrics

| # | Metric | Result |
|---|---|---|
| 8.1 | Doctor clean project | Pass |
| 8.2 | Missing anchor | Pass — points at `server.ts` |
| 8.3 | Manifest drift | Pass |
| 8.4 | Dry-run add | Pass — plan printed; disk hash unchanged |
| 8.5 | 25-route scale | Pass |
| 8.6 | Chaos rollback (50) | Pass — 0 partial states |
| 8.7 | MVP regression | Pass — Phase 6 suite |
| 8.8 | Perf (25th adds) | Pass — avg &lt; 2s |

---

## 4. How to Verify

```bash
pnpm --filter @root/core test
pnpm check

pnpm root-cli doctor
pnpm root-cli doctor --strict
pnpm root-cli --dry-run add route preview-me
```

---

## 5. Out of Scope (Phase 9+)

- npm publish / dlx registry smoke
- Multi-writer coordination beyond lock refuse
- FastAPI / Spring providers

---

## 6. Review Notes

Stop here for manual review before Phase 9 (public preview engineering).
