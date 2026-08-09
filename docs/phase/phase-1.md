# Phase 1 — CLI Shell, Detection & root.json

| Field | Value |
|---|---|
| **Status** | Complete — ready for manual review |
| **Date** | August 9, 2026 |
| **Gate** | Green (`pnpm check` + coverage + CLI smoke) |
| **Next phase** | Phase 2 — Init Wizard + Express TS Golden Path |

---

## 1. Executive Summary

Phase 1 makes Root **directory-aware and contract-aware**. The CLI no longer blindly stubs every command: it classifies the current folder, validates `root.json` with Zod, and refuses unsafe create/modify actions with clear messages.

Also installed **project Cursor skills** (from skills.sh + a custom Root skill) under `.cursor/skills/` and `.agents/skills/`.

**Still not generating backends** — that is Phase 2. But create vs modify safety is real end-to-end.

---

## 2. What We Built

### 2.1 `@root/core`

| Module | Role |
|---|---|
| `src/config/root-json.ts` | Zod schema, parse/load/write, `createRootJsonFixture`, field-path errors |
| `src/engine/detector.ts` | Classifies `empty-safe` / `root-project` / `root-project-invalid` / `foreign` |
| `src/errors/messages.ts` | Actionable user-facing error copy |

Dependency added: `zod`.

### 2.2 `@root/cli` command behavior

| Command | Phase 1 behavior |
|---|---|
| `init` | **shadcn-style folder prompt:** enter name → create subfolder; Escape → current folder (if empty-safe); refuses foreign cwd on Escape / existing Root / invalid `root.json`; honors `--dry-run` + `--verbose` + `--yes` |
| `add` | Requires valid Root project; otherwise tells user to run `init` |
| `doctor` | Validates `root.json` shape; OK / FAILED with field errors |

Global flags wired through Commander `optsWithGlobals()`: `--verbose`, `--dry-run`, `--yes`.

### 2.3 Tests

- **13** detector filesystem scenarios  
- **8** root.json unit tests  
- **9** CLI guard/integration tests (+ prior help tests)  
- Coverage on `root-json.ts` + `detector.ts`: **~95% lines** (threshold ≥80%)

### 2.4 Skills (`.cursor` + skills.sh)

Installed into **`.agents/skills/`** (skills CLI canonical) and mirrored to **`.cursor/skills/`**:

| Skill | Source |
|---|---|
| `writing-plans` | obra/superpowers |
| `executing-plans` | obra/superpowers |
| `test-driven-development` | obra/superpowers |
| `systematic-debugging` | obra/superpowers |
| `verification-before-completion` | obra/superpowers |
| `prisma-cli` | prisma/skills |
| `prisma-client-api` | prisma/skills |
| `prisma-database-setup` | prisma/skills |
| `writing-guidelines` | vercel-labs/agent-skills |
| `shadcn` | shadcn-ui/ui |
| **`root-cli`** | **project custom** (phase workflow + product invariants) |

Also:

- `skills-lock.json` — lockfile for `npx skills experimental_install`
- `.cursor/rules/root-phases.mdc` — always-on phase-gate rule

---

## 3. Manual Verification Checklist (for you)

```bash
pnpm install
pnpm check
pnpm root-cli --help
pnpm root-cli init --help

# create a subfolder from a non-empty cwd (no interactive prompt)
mkdir /tmp/root-foreign && echo x > /tmp/root-foreign/index.js
cd /tmp/root-foreign
pnpm --dir /path/to/Root root-cli init my-api
# expect: creates /tmp/root-foreign/my-api, ready for structureizer

# stay in empty cwd without prompting
mkdir /tmp/root-empty && cd /tmp/root-empty
pnpm --dir /path/to/Root root-cli --yes --dry-run init
# expect: dry-run, Would create folder: no

# interactive (TTY): pnpm root-cli init
#   → type a name = create folder
#   → Escape = use current folder (only if empty/safe)

# add without root.json
cd /tmp/root-empty
pnpm --dir /path/to/Root root-cli add route post
# expect: run init first, exit 1
```

Or from repo after `pnpm build`:

```bash
node packages/cli/dist/cli.js doctor   # in a dir with valid root.json fixture
```

Inspect skills:

```bash
ls .cursor/skills
ls .agents/skills
```

---

## 4. Phase 1 Gate Metrics

| # | Metric | Result |
|---|---|---|
| 1.1 | Help completeness (`init`/`add`/`doctor`) | **PASS** |
| 1.2 | Empty / `.git`-only → `empty-safe` | **PASS** |
| 1.3 | Foreign `index.js` → init refused | **PASS** |
| 1.4 | Valid `root.json` → `root-project` | **PASS** |
| 1.5 | Broken `root.json` → field errors | **PASS** |
| 1.6 | `add` in empty dir → run init | **PASS** |
| 1.7 | Coverage detector + root-json ≥ 80% | **PASS** (~95% lines) |
| 1.8 | `--dry-run` reaches init handler | **PASS** |

---

## 5. Intentionally Not Built Yet

- Interactive init wizard / file generation (Phase 2)
- DB/ORM matrix (Phase 3)
- Interconnect Planner / Schema Registry mutations (Phases 4–6)
- Full `doctor` anchor/mount graph checks (Phase 8)

---

## 6. Suggested Review Focus

1. Are safe-empty allowlist entries (`.git`, `README.md`, `LICENSE`, …) correct for you?
2. Is the `root.json` Zod shape complete enough before Phase 2 generation?
3. Are the installed skills the set you wanted (any extras/removals)?

When you approve, say **go Phase 2** — we stop again after that phase with `docs/phase/phase-2.md`.
