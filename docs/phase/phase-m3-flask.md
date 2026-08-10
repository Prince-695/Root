# Phase M3 — Flask auth + resource

## Summary

Flask mirrors FastAPI: blueprints under `routers/`, services under `services/`, `auth_guard.require_auth` for protected creates. Init `app.py` includes `[ROOT-INJECT:ROUTES]`.

## Gate

- Init → add auth → add resource → doctor OK
- Language purity (`assertNoNodeProjectFiles`)
- Node-only `add cache` still refused

## Run

```bash
flask --app app run --debug
```
