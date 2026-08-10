# Architecture overview

Root is a **framework-aware backend composition CLI** distributed as `rootcli` on npm.

## Layers

```text
CLI (packages/cli)
  → Commands (init, add, remove, list, inspect, diff, doctor, sync)
  → Project context (detector + root.json)
  → Stack providers (Express, Hono, Nest, gRPC, FastAPI, Flask, Go, …)
  → Recipes + planner + journaled transactions
  → Language-native installers (npm family | pip/uv | go mod)
```

## Language-agnostic invariant

The CLI host is Node/TypeScript. **Generated projects are pure for their language.**

| Stack | Allowed project files | Forbidden |
|---|---|---|
| Express / Hono / Nest / gRPC-JS | `package.json`, TS/JS sources | — |
| FastAPI / Flask | `pyproject.toml` / `requirements.txt`, `.py` | `package.json`, `node_modules`, `tsconfig.json` |
| Go net/http | `go.mod`, `.go` | same Node files |

Enforced by `assertNoNodeProjectFiles` in `@root/core` for non-Node providers.

## Extending Root

| Add… | Where |
|---|---|
| Framework | `packages/core/src/providers/` + register in `resolve-provider.ts` |
| Capability | `packages/core/src/add/` or `registry/recipes/` |
| DB/ORM combo | `init/stack-matrix.ts` (+ provider-specific ORM allow-lists) |
| Infra | `add/infra.ts` |

See [../future/BACKLOG.md](../future/BACKLOG.md) and [../Implementation_phases.md](../Implementation_phases.md).
