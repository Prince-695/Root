---
name: root-cli
description: >-
  Build and evolve the Root backend scaffolding CLI (Turborepo monorepo). Use when
  working on @root/cli, @root/core, init/add/doctor commands, root.json, project
  detection, interconnection engine, schema registry, templates, phase gates, or
  docs under docs/. Trigger for Root product work, phase implementation, and
  pnpm dlx rootcli flows.
---

# Root CLI Development

Root is a **pure-engineering** terminal CLI (no AI codegen) — shadcn/ui for backends.

## Product invariants

1. Primary UX: `pnpm dlx rootcli@latest …` (local: `pnpm root-cli …` after build).
2. **Create mode:** empty folder → `init` structureizes a full backend.
3. **Modify mode:** existing `root.json` → `add` rewires Module Graph (schema, server, DB, auth, manifest) atomically.
4. Interconnection is mandatory — orphan generated files are bugs.
5. First stack: Node + Express + TypeScript; FastAPI / Spring Boot later.

## Repo layout

- `packages/cli` — `@root/cli` Commander entry + `bin: root`
- `packages/core` — `@root/core` detector, `root.json`, engine (grows by phase)
- `docs/PRD.md` + `docs/Implementation_phases.md` — source of truth
- `docs/phase/phase-N.md` — write **after** each phase gate passes, then stop for human review

## Phase workflow (mandatory)

1. Implement **only** the current phase from `docs/Implementation_phases.md`.
2. Meet every Phase Gate metric (tests + manual CLI checks).
3. Write `docs/phase/phase-N.md` with executive summary.
4. **Stop** for user review — do not start the next phase until asked.

## Engineering rules

- Prefer TDD for detector/config/engine pure logic.
- Use Zod for `root.json`; actionable errors with field paths.
- Refuse unsafe `init` into foreign non-empty dirs; `add` requires Root project.
- Keep generated apps free of Root runtime lock-in.
- Run `pnpm check` before claiming a phase complete.
- Script name is `pnpm root-cli` (not `pnpm root` — reserved by pnpm).

## Key docs to read first

- [docs/PRD.md](../../../docs/PRD.md)
- [docs/Implementation_phases.md](../../../docs/Implementation_phases.md)
- Latest [docs/phase/](../../../docs/phase/) completion note
