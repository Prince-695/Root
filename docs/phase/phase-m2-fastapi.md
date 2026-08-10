# Phase M2 — FastAPI auth + resource

## Summary

FastAPI projects can run `add auth` and `add resource` with **native Python** files only. Recipes live in `packages/core/src/providers/fastapi-recipes.ts` and are wired through `StackProvider.planAuth` / `planResource`.

## Layout

```
app/main.py          # health + [ROOT-INJECT:ROUTES]
app/routers/
app/schemas/
app/services/
app/deps.py          # after add auth
```

## Gate

- Init → add auth → add resource → doctor OK
- `requirements.txt` / `pyproject.toml` gain PyJWT + bcrypt (never `package.json`)
- Vitest: `tests/stack-guards.test.ts` FastAPI case

## Out of scope

SQLAlchemy persistence beyond init deps; full capability parity (cache/queue/…).
