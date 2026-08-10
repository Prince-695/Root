# Provider guide — adding a stack

1. Create structureize function under `packages/core/src/providers/`.
2. If non-Node: call `assertNoNodeProjectFiles(targetDir)` before return; never write `package.json`.
3. Register in `resolve-provider.ts` with `status: "ready"`.
4. Extend wizard framework/language options in `packages/cli/src/init/wizard.ts`.
5. Add Vitest coverage under `packages/core/tests/`.
6. Update `docs/COMPATIBILITY.md` and write `docs/phase/phase-N.md`.

## Compatibility matrix sketch

| Provider | Language | ORMs | Installer |
|---|---|---|---|
| express-ts/js | TS/JS | prisma, drizzle, mongoose, none | npm/pnpm/yarn/bun |
| hono-ts | TS | same Node matrix | npm family |
| nestjs-ts | TS | same | npm family |
| grpc-ts | TS | same | npm family |
| fastapi | Python | sqlalchemy, none | pip/uv |
| flask | Python | sqlalchemy, none | pip/uv |
| go-http | Go | gorm, none | go mod |
