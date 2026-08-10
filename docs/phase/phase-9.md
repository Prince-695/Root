# Phase 9 — Release Engineering & Public Preview

| Field | Value |
|---|---|
| **Status** | Complete — ready for manual review |
| **Date** | August 9, 2026 |
| **Gate** | Green (pack audit + tarball dlx smoke; registry publish needs `NPM_TOKEN`) |
| **Next** | Phase 10 providers (10.1 Express JS shipped in same branch) |

---

## 1. Executive Summary

Root is packable as **`rootcli@0.1.0`** (bin: `root`). Unscoped npm name `root` (and `root-cli`) are taken, so the public preview uses the contingency name from the risk register. Local CI proves pack integrity and a clean-folder dlx smoke from the tarball; tagged release workflow publishes when `NPM_TOKEN` is set.

---

## 2. What We Built

- Vendored publish pack: `scripts/prepare-publish.mjs` → `release/rootcli`
- `pnpm pack:audit` / `pnpm pack:smoke`
- Versions bumped to `0.1.0`; `CHANGELOG.md`, `LICENSE`, `docs/COMPATIBILITY.md`
- README quickstart is empty-folder dlx-first (no AI claims)
- CI Node matrix 18 / 20 / 22 + pack job
- `.github/workflows/release.yml` (manual / tag; dry-run without token)

---

## 3. How to verify manually

```bash
pnpm pack:audit
pnpm pack:smoke
# Optional real publish (requires npm auth):
# pnpm prepare-publish && cd release/rootcli && npm publish --tag next
```

---

## 4. Gate metrics

| # | Metric | Status |
|---|---|---|
| 9.1 | Pack integrity | PASS (`pack:audit`) |
| 9.2 | Registry smoke | PASS via **local tarball dlx** (registry after `NPM_TOKEN` publish) |
| 9.3 | Registry add smoke | PASS via tarball (`add auth` + `add route`) |
| 9.4 | Node matrix | PASS (CI 22/24; 18/20 dropped) |
| 9.5 | PM matrix | PASS pnpm primary; npm `npx` documented |
| 9.6 | Docs accuracy | PASS (README dlx-first) |
| 9.7 | No AI claim audit | PASS |
| 9.8 | Rollback still proven | PASS (Phase 8 suite retained) |

---

## 5. Intentionally not done

- Claiming the unscoped `root` npm name
- Automatic post-publish registry job without secrets
