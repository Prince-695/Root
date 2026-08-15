# Phase 0 — Repository Foundation & Tooling

| Field | Value |
|---|---|
| **Status** | Complete — ready for manual review |
| **Date** | August 9, 2026 |
| **Gate** | Green (local `pnpm check` + CLI help smoke) |
| **Next phase** | Phase 1 — CLI Shell, Detection & `root.json` |

---

## 1. Executive Summary

Phase 0 establishes Root as a **Turborepo + pnpm workspaces monorepo** with a working CLI skeleton. Nothing generates backends yet — that starts in Phase 2 — but the engineering substrate is real:

- Install → lint → typecheck → test → build all succeed via Turbo
- `root --help` shows `init`, `add`, and `doctor` (stubs)
- CI workflow mirrors the same checks
- No AI SDKs; no committed secrets

You can clone, install, and exercise the CLI help path today. **Please review manually before we start Phase 1.**

---

## 2. What We Built

### 2.1 Monorepo layout

```
Root/
├── package.json              # private workspace root + Turbo scripts
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json        # shared strict TS config
├── biome.json                # lint + format
├── .github/workflows/ci.yml
├── README.md
├── scripts/add-bin-shebang.mjs
├── packages/
│   ├── cli/                  # @root/cli — Commander + bin `root`
│   └── core/                 # @root/core — shared identity helpers
└── docs/
    ├── PRD.md
    ├── Implementation_phases.md
    └── phase/
        ├── README.md
        └── phase-0.md        # this file
```

**Deviation from earlier “single package” note:** per product direction, Phase 0 uses **Turborepo monorepo** from day one. `Implementation_phases.md` §1.3 was updated to match.

### 2.2 Packages

| Package | npm name | Purpose in Phase 0 |
|---|---|---|
| CLI | `@root/cli` | `bin: root`, Commander program, stub commands |
| Core | `@root/core` | Engine banner, command name constants, `isRootCommand` |

`@root/cli` depends on `@root/core` via `workspace:*`. Turbo builds `core` before `cli`.

### 2.3 CLI surface (stubs only)

```bash
pnpm build
pnpm root-cli --help
pnpm root-cli init
pnpm root-cli add route post
pnpm root-cli doctor
```


Each command prints a clear “Phase 0 stub / coming in Phase N” message. Global flags registered: `--verbose`, `--dry-run`, `--yes`, `--version`.

### 2.4 Tooling

- **TypeScript** strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Vitest** per package (7 tests total)
- **Biome** lint/format at repo root
- **Turbo** task graph: `build`, `typecheck`, `test`, `dev`
- **GitHub Actions** `.github/workflows/ci.yml` → `pnpm check` + help smoke

### 2.5 Scripts (repo root)

| Script | Does |
|---|---|
| `pnpm install` | Workspace install |
| `pnpm check` | lint + typecheck + test + build |
| `pnpm build` / `test` / `typecheck` / `lint` | Turbo / Biome |
| `pnpm root-cli …` | Runs built CLI (`node packages/cli/dist/cli.js`) |

---

## 3. Manual Verification Checklist (for you)

From the repo root:

```bash
pnpm install
pnpm check
pnpm root-cli --help
pnpm root-cli init
pnpm root-cli add route post
pnpm root-cli doctor
pnpm root-cli --version
```

> Note: the workspace script is `pnpm root-cli` (not `pnpm root`) because `pnpm root` is a reserved pnpm command.

**Expect:**

1. `pnpm check` exits 0  
2. Help lists `init`, `add`, `doctor`  
3. Stub commands print “Phase 0 stub” text (not generate files)  
4. Version prints `0.0.0`

Optional: open a PR and confirm GitHub Actions is green (needs push/remote).

---

## 4. Phase 0 Gate Metrics

| # | Metric | Result |
|---|---|---|
| 0.1 | Clean install (`pnpm install`) | **PASS** |
| 0.2 | Typecheck (`pnpm typecheck`) | **PASS** |
| 0.3 | Unit tests (`pnpm test`) — 7/7 | **PASS** |
| 0.4 | CLI boots; help shows init/add/doctor | **PASS** (`pnpm root-cli --help`) |
| 0.5 | CI workflow present (parity with local check) | **PASS** (file added; remote run pending your push) |
| 0.6 | No AI deps / no committed `.env` secrets | **PASS** |

---

## 5. Intentionally Not Built Yet

- Interactive init wizard / file generation  
- Project detector / `root.json`  
- Interconnection engine / Schema Registry  
- Templates, registry recipes, DB/ORM matrix  
- Publishing to npm / real `pnpm dlx rooot@latest`  

Those belong to Phases 1–9 as documented in `Implementation_phases.md`.

---

## 6. Suggested Review Focus

1. Are you happy with package names `@root/cli` + `@root/core`?  
2. Is Turborepo layout (`packages/*`) what you wanted?  
3. Any extra package you want early (e.g. `@root/templates` empty shell)?  

When you approve, we proceed to **Phase 1** only, then stop again for your review + `docs/phase/phase-1.md`.
