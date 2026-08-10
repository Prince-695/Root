# Root v0.1.0 — Public Preview

Pure-engineering backend scaffolding CLI (**no AI**). npm package: **`rootcli`**. Bins: `rootcli` and `root` (unscoped `root` / `root-cli` are taken on npm).

## Install (when published to npm)

```bash
pnpm dlx rootcli@latest init
# or
npx rootcli@latest init
```

## Install from this GitHub Release

```bash
# download rootcli-0.1.0.tgz from Assets, then:
pnpm dlx ./rootcli-0.1.0.tgz --yes init my-api
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
pnpm dlx rootcli@latest init
pnpm dlx rootcli@latest add auth
pnpm dlx rootcli@latest add resource post
pnpm install && pnpm dev
pnpm dlx rootcli@latest doctor
```
