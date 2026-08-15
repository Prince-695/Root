# Root v0.1.0 — Public Preview

Pure-engineering backend scaffolding CLI (**no AI**). npm package: **`rooot`**. Sole bin: `rooot` (unscoped `root` / `root-cli` are taken on npm).

## Install (when published to npm)

```bash
pnpm dlx rooot@latest init
# or
npx rooot@latest init
```

## Install from this GitHub Release

```bash
# download rooot-0.1.0.tgz from Assets, then:
pnpm dlx ./rooot-0.1.0.tgz --yes init my-api
```

## Local monorepo (contributors)

```bash
pnpm install && pnpm build
pnpm root-cli --help
```

## Requirements

- Node.js `^22.18.0` or `>=24`

## What’s in 0.1.0

- `init` / `add` / `doctor` for Express TypeScript and Express JavaScript
- JWT auth, auth-aware routes, atomic adds, dry-run, write lock
- Pack audit + tarball smoke scripts

## Demo

```bash
mkdir my-api && cd my-api
pnpm dlx rooot@latest init
pnpm dlx rooot@latest add auth
pnpm dlx rooot@latest add resource post
pnpm install && pnpm dev
pnpm dlx rooot@latest doctor
```
