# Phase M4 — Go net/http auth + resource

## Summary

Go net/http uses `internal/auth` and `internal/<resource>` packages. `main.go` has `[ROOT-INJECT:IMPORTS]` and `[ROOT-INJECT:ROUTES]`. Dependencies land in `go.mod` via `ensureGoModule` (jwt, uuid, x/crypto).

## Gate

- Init → add auth → add resource → doctor OK
- No Node project files
- Handlers use Go 1.22+ method patterns (`POST /auth/signup`, …)

## Run

```bash
go mod tidy
go run .
```
