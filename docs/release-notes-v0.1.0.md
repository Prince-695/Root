# Root v0.1.0 — Public Preview

Pure-engineering backend scaffolding CLI (**no AI**). Bin name: `root`. npm package name: **`root`** (unscoped `root` is taken on npm).

## Install (when published to npm)

```bash
pnpm dlx root@latest init
# or
npx root@latest init
```

## Install from this GitHub Release

```bash
# download root-0.1.0.tgz from Assets, then:
pnpm dlx ./root-0.1.0.tgz --yes init my-api
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
pnpm dlx root@latest init
pnpm dlx root@latest add auth
pnpm dlx root@latest add resource post
pnpm install && pnpm dev
pnpm dlx root@latest doctor
```
