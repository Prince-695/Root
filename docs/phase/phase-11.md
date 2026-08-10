# Phase 11 — Express composition maturity

| Field | Value |
|---|---|
| **Status** | Complete |
| **Date** | August 10, 2026 |
| **Gate** | Green (SQLite matrix + adopt + PM + infra adds + root.json v2) |

## Executive summary

Deepened Express: SQLite combos, adopt-existing `package.json`, package-manager prompt, architecture preference fields, `add docker` / `add github-actions`, versioned `root.json`.

## Verify

```bash
pnpm --filter @root/core test
pnpm root-cli init --yes --skip-install
pnpm root-cli add docker   # in a postgres project
```

## Intentionally deferred

Full feature-based/clean folder remaps (preference stored; layered paths until dedicated templates).
