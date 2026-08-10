# Root — end-to-end manual testing

Detailed copy-paste QA for every supported language/framework and every CLI command that exists today.

Use this after `pnpm build` (contributors) or with a published/local tarball (`npx rootcli@latest` / `pnpm dlx ./release/rootcli/rootcli-0.1.0.tgz`).

---

## 0. Prerequisites

| Tool | Why |
|---|---|
| Node.js `^22.18 \|\| >=24` | Runs the Root CLI |
| pnpm (recommended) | Monorepo + local `pnpm root-cli` |
| Python **3.11+** | FastAPI / Flask generated apps |
| Go **1.22+** | Go net/http generated apps |
| curl | HTTP checks |
| Optional: Docker | Infra file smoke only |

### Invoke helpers

Pick one and stick to it for a session:

```bash
# Contributors (from this repo, after build)
export ROOT='pnpm root-cli'

# Published / preview
export ROOT='npx rootcli@latest'

# Local packed tarball (after pnpm pack:audit)
export ROOT='pnpm dlx /ABS/PATH/TO/Root/release/rootcli/rootcli-0.1.0.tgz'
```

Never use `pnpm root` (pnpm-reserved). Global flags work on either form:

```bash
$ROOT --help
$ROOT --version
$ROOT --verbose --yes init …
$ROOT --dry-run add auth
```

### Pass / fail convention

At the end of each stack section, tick the checklist. **Fail** = unexpected files (`package.json` in Python/Go), crash, wrong HTTP status, or `doctor` errors (warnings may be OK unless noted).

---

## 1. Command catalog (support matrix)

| Command | Express TS/JS | Hono / Nest / gRPC | FastAPI | Flask | Go net/http |
|---|---|---|---|---|---|
| `init` | Yes (full) | Yes (minimal) | Yes | Yes | Yes |
| `add auth` | Yes | Limited (Node recipes) | Yes (native) | Yes (native) | Yes (native) |
| `add resource <name>` | Yes | Limited | Yes (native) | Yes (native) | Yes (native) |
| `add middleware \| service \| model \| controller` | Yes | Node only | **Refuse** | **Refuse** | **Refuse** |
| `add cache \| queue \| storage \| websocket \| logging \| health \| rate-limit` | Yes | Node only | **Refuse** | **Refuse** | **Refuse** |
| `add docker \| github-actions \| kubernetes` | Yes | Yes | Yes | Yes | Yes |
| `add monorepo` | Node | Node | **Refuse** | **Refuse** | **Refuse** |
| `remove <type> <name>` | Yes (where implemented) | Same | Best-effort | Best-effort | Best-effort |
| `list` | Yes | Yes | Yes | Yes | Yes |
| `inspect <name>` | Yes | Yes | Yes | Yes | Yes |
| `diff` | Yes | Yes | Yes | Yes | Yes |
| `doctor` | Yes | Yes | Yes (+ purity) | Yes (+ purity) | Yes (+ purity) |
| `sync` | Yes | Yes | Yes | Yes | Yes |
| `--dry-run <cmd>` | Yes | Yes | Yes | Yes | Yes |

Planned (expect clear “not available”): `add database`, `add job`, `add event`, `add module`.

---

## 1.1 What “native auth + resource” means

In this document, **native auth + resource** means:

> On that stack, `add auth` and `add resource <name>` are implemented with **language-native planners** (`provider.planAuth` / `provider.planResource`). They write **real files for that language’s ecosystem** — not Express/TypeScript recipes dropped into a Python or Go tree, and not a fake Node shim.

### What you get (behavior)

Same product intent as Express:

| Capability | What it does |
|---|---|
| `add auth` | Signup / signin (JWT-style), middleware or dependency that checks `Authorization: Bearer …`, User storage for the stack’s ORM (or in-memory when `orm: none`), mounts under `/auth`, entry in `root.json` |
| `add resource <name>` | List / get / create HTTP surface under `/api/<name>`, wired into the app entry, schema/validation for that language, module entry in `root.json`. If auth already exists, mutating routes usually require a token |

So the **HTTP story** (health → signup → signin → create with token → list) is what you QA — see FastAPI / Flask / Go sections below.

### What “native” specifically guarantees

| Guarantee | FastAPI / Flask / Go | Express TS/JS (gold path) |
|---|---|---|
| Project files | `app/*.py`, `requirements.txt` / `pyproject.toml`, or `go.mod` + `*.go` | `package.json`, `src/**/*.ts` or `.js` |
| **No** Node project files | Must never create `package.json`, `tsconfig.json`, `node_modules` | Node files are expected |
| Planner | Stack provider `planAuth` / `planResource` | Node interconnection recipes (`planInterconnect` / registry) |
| Install / run | `pip`/`uv` + `uvicorn`/`flask`, or `go mod tidy` + `go run` | `pnpm install` + `pnpm dev` |
| Extra capabilities (`cache`, `middleware`, …) | **Refused** (Node-only today) | Supported |

**Native ≠ “full Express feature parity.”** It means auth + resource are first-class for that language. Docker / GitHub Actions / Kubernetes may still be allowed as file-only infra; monorepo and Node MVC atomics are not.

### What it is *not*

- **Not** “auth somehow includes a resource automatically.” You still run **two** commands: `add auth` then `add resource post` (or the reverse on stacks that retrofit).
- **Not** the same as Hono / Nest / gRPC “Limited” rows — those may still lean on Node-shaped recipes; treat them as smoke until deep providers land.
- **Not** a shared runtime. Python stays Python; Go stays Go. Root only scaffolds and interconnects.

### How to spot native vs limited while testing

```bash
# After init + add auth + add resource post on FastAPI/Flask/Go:
test ! -e package.json          # must pass (native purity)
$ROOT doctor                    # should stay OK (includes language-purity checks)
ls app/                         # Python: real .py modules
# or
ls *.go go.mod                  # Go: real Go sources
```

If `add auth` created Express-looking `src/routes/*.ts` inside a FastAPI project, that would **fail** the native contract — open a bug.

---

## 2. Cross-cutting scenarios (run once)

### 2.1 Help / version

```bash
$ROOT --help
$ROOT --version
$ROOT init --help
$ROOT add --help
```

**Expect:** usage text; version string; no crash.

### 2.2 Foreign / non-empty refuse

```bash
mkdir -p /tmp/root-foreign && cd /tmp/root-foreign
echo 'not empty' > note.txt
$ROOT --yes init   # should refuse unsafe init into foreign non-empty dir (unless adopt flow)
```

**Expect:** actionable error; no partial Root project (or explicit adopt path if you chose adopt).

### 2.3 Dry-run writes nothing

```bash
mkdir -p /tmp/root-dry && cd /tmp/root-dry
$ROOT --yes init express-dry   # or interactive Express golden path
# snapshot file list
$ROOT --dry-run add auth
$ROOT --dry-run add resource post
# file list unchanged; no new modules in root.json
```

### 2.4 Duplicate auth

```bash
$ROOT add auth
$ROOT add auth   # must refuse duplicate
```

---

## 3. Express TypeScript (gold path)

### 3.1 Setup

```bash
rm -rf /tmp/root-express-ts && mkdir /tmp/root-express-ts && cd /tmp/root-express-ts
$ROOT init
```

**Wizard choices (interactive):**

- Language: TypeScript  
- Framework: Express  
- Architecture: **minimal** (default) or layered-mvc  
- Database: none (fastest) **or** postgresql + prisma  
- Auth: none (add later) or jwt  
- Package manager: pnpm  

Non-interactive example (flags depend on CLI version; prefer interactive if unsure):

```bash
$ROOT --yes init
```

### 3.2 Install + health

```bash
pnpm install   # or npm/yarn/bun per choice
pnpm dev &
sleep 2
curl -s http://127.0.0.1:3000/health   # port may differ — check README / logs
```

**Expect:** JSON with ok/true.

### 3.3 Auth + resource

```bash
$ROOT add auth
$ROOT add resource post
# restart server if needed
curl -s -X POST http://127.0.0.1:3000/auth/signup \
  -H 'content-type: application/json' \
  -d '{"email":"a@example.com","password":"password123"}'
TOKEN=$(curl -s -X POST http://127.0.0.1:3000/auth/signin \
  -H 'content-type: application/json' \
  -d '{"email":"a@example.com","password":"password123"}' | jq -r .accessToken // .access_token)
curl -s -X POST http://127.0.0.1:3000/api/post \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"title":"hello"}'
curl -s http://127.0.0.1:3000/api/post
```

### 3.4 Node capabilities + infra

```bash
$ROOT add cache redis
$ROOT add middleware request-id
$ROOT add service notifier
$ROOT add docker
$ROOT add github-actions
$ROOT --dry-run add kubernetes
$ROOT list
$ROOT inspect auth
$ROOT inspect post
$ROOT diff
$ROOT doctor
$ROOT sync
```

### 3.5 Checklist — Express TS

- [ ] `root.json` present; `package.json` present (expected)
- [ ] `/health` 200
- [ ] signup / signin / protected POST work
- [ ] `doctor` OK
- [ ] dry-run did not mutate when tested

---

## 4. Express JavaScript

```bash
rm -rf /tmp/root-express-js && mkdir /tmp/root-express-js && cd /tmp/root-express-js
$ROOT init
# Language: JavaScript · Framework: Express · orm: none · auth: none
$ROOT add auth
$ROOT add resource post
pnpm install && pnpm dev &
# same curls as §3.3 (adjust port)
$ROOT doctor
```

### Checklist — Express JS

- [ ] JS sources (no required TS build for orm none)
- [ ] auth + resource HTTP OK
- [ ] doctor OK

---

## 5. Hono / NestJS / gRPC (minimal init)

These stacks **init** successfully. Deep interconnection is limited; treat `add auth` / `add resource` as smoke (may reuse Node/Express-shaped recipes). Prefer purity of init + doctor.

### 5.1 Hono

```bash
rm -rf /tmp/root-hono && mkdir /tmp/root-hono && cd /tmp/root-hono
$ROOT init
# TypeScript · Hono · valid DB/ORM pair
pnpm install
$ROOT doctor
$ROOT add docker
```

### 5.2 NestJS

```bash
rm -rf /tmp/root-nest && mkdir /tmp/root-nest && cd /tmp/root-nest
$ROOT init
# TypeScript · NestJS
pnpm install
$ROOT doctor
```

### 5.3 gRPC

```bash
rm -rf /tmp/root-grpc && mkdir /tmp/root-grpc && cd /tmp/root-grpc
$ROOT init
# TypeScript · gRPC
$ROOT doctor
```

### Checklist — Node extras

- [ ] Init completes; `root.json` written
- [ ] doctor does not falsely claim Python purity issues
- [ ] Document any `add auth` / `add resource` quirks you hit (expected until deep providers land)

---

## 6. FastAPI (Python — native auth + resource)

### 6.1 Init

```bash
rm -rf /tmp/root-fastapi && mkdir /tmp/root-fastapi && cd /tmp/root-fastapi
$ROOT init
```

**Wizard:**

- Language: **python**  
- Framework: **fastapi**  
- ORM: **none** (or sqlalchemy)  
- Package manager: pip or uv  

**Purity (must pass):**

```bash
test ! -e package.json
test ! -e tsconfig.json
test ! -d node_modules
ls app/main.py requirements.txt root.json
```

### 6.2 Add + install + run

```bash
$ROOT --dry-run add auth          # plan only
$ROOT add auth
$ROOT add resource post
$ROOT list
$ROOT inspect auth
$ROOT inspect post

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 &
sleep 2

curl -s http://127.0.0.1:8000/health
curl -s -X POST http://127.0.0.1:8000/auth/signup \
  -H 'content-type: application/json' \
  -d '{"email":"a@example.com","password":"password123"}'
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/auth/signin \
  -H 'content-type: application/json' \
  -d '{"email":"a@example.com","password":"password123"}' | python -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')
curl -s -X POST http://127.0.0.1:8000/api/post \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"title":"hello"}'
curl -s http://127.0.0.1:8000/api/post
```

### 6.3 Infra + maintenance + refusals

```bash
$ROOT add docker
$ROOT add github-actions
$ROOT doctor

# Must refuse Node-only extras:
$ROOT add cache redis     # expect error mentioning Node/Express-only
$ROOT add middleware x    # expect refuse
```

### 6.4 Duplicate + purity again

```bash
$ROOT add auth            # refuse duplicate
test ! -e package.json
kill %1 2>/dev/null || true
```

### Checklist — FastAPI

- [ ] No `package.json` / `node_modules` / `tsconfig.json` ever
- [ ] `app/main.py` contains inject mounts for `/auth` and `/api/post`
- [ ] `/health`, signup, signin, POST `/api/post` work
- [ ] `doctor` OK (includes language-purity)
- [ ] cache/middleware refused

---

## 7. Flask (Python — native auth + resource)

```bash
rm -rf /tmp/root-flask && mkdir /tmp/root-flask && cd /tmp/root-flask
$ROOT init
# python · flask · orm none

$ROOT add auth
$ROOT add resource post
test ! -e package.json

python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
flask --app app run --debug --port 5000 &
sleep 2

curl -s http://127.0.0.1:5000/health
curl -s -X POST http://127.0.0.1:5000/auth/signup \
  -H 'content-type: application/json' \
  -d '{"email":"a@example.com","password":"password123"}'
TOKEN=$(curl -s -X POST http://127.0.0.1:5000/auth/signin \
  -H 'content-type: application/json' \
  -d '{"email":"a@example.com","password":"password123"}' | python -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')
curl -s -X POST http://127.0.0.1:5000/api/post \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"title":"hello"}'
curl -s http://127.0.0.1:5000/api/post

$ROOT add docker
$ROOT doctor
$ROOT add queue bullmq    # must refuse
```

### Checklist — Flask

- [ ] Blueprints registered in `app.py`
- [ ] HTTP flows OK
- [ ] Purity + doctor OK
- [ ] Node capabilities refused

---

## 8. Go net/http (native auth + resource)

```bash
rm -rf /tmp/root-go && mkdir /tmp/root-go && cd /tmp/root-go
$ROOT init
# language: go · framework: go-http · orm: none|gorm

$ROOT add auth
$ROOT add resource post
test ! -e package.json
grep -E 'jwt|uuid|crypto' go.mod

go mod tidy
go run . &
sleep 2

curl -s http://127.0.0.1:8080/health
curl -s -X POST http://127.0.0.1:8080/auth/signup \
  -H 'content-type: application/json' \
  -d '{"email":"a@example.com","password":"password123"}'
TOKEN=$(curl -s -X POST http://127.0.0.1:8080/auth/signin \
  -H 'content-type: application/json' \
  -d '{"email":"a@example.com","password":"password123"}' | python -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')
curl -s -X POST http://127.0.0.1:8080/api/post \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"title":"hello"}'
curl -s http://127.0.0.1:8080/api/post

$ROOT doctor
$ROOT add kubernetes
$ROOT add cache redis   # must refuse
kill %1 2>/dev/null || true
```

### Checklist — Go

- [ ] `main.go` calls `auth.Register` + `post.Register`
- [ ] Import inject includes `internal/auth` and `internal/post`
- [ ] HTTP OK on `:8080`
- [ ] No Node project files; doctor OK

---

## 9. Adopt-mode / existing Node project (optional)

If the CLI offers **adopt** when a `package.json` already exists:

```bash
mkdir -p /tmp/root-adopt && cd /tmp/root-adopt
npm init -y
$ROOT init
# choose adopt / yes to keep package.json
$ROOT doctor
```

**Expect:** Root writes `root.json` and safe files without destroying the existing app carelessly.

---

## 10. Contributor regression (repo root)

From the Root monorepo:

```bash
pnpm install
pnpm build
pnpm --filter @root/core test
pnpm pack:audit
pnpm pack:smoke
pnpm check          # lint + typecheck + test + build (full gate)
```

**Expect:** core Vitest green; pack audit OK; pack smoke Express health + auth + resource + doctor OK.

---

## 11. Sign-off table

| Stack | Init | Auth | Resource | Doctor | Purity / Node files | Tester | Date |
|---|---|---|---|---|---|---|---|
| Express TS | | | | | package.json OK | | |
| Express JS | | | | | package.json OK | | |
| Hono | | n/a or limited | limited | | Node OK | | |
| NestJS | | limited | limited | | Node OK | | |
| gRPC | | limited | limited | | Node OK | | |
| FastAPI | | | | | **no** package.json | | |
| Flask | | | | | **no** package.json | | |
| Go | | | | | **no** package.json | | |

---

## Notes

- Ports: Express often `3000`, FastAPI `8000`, Flask `5000`, Go `8080` — confirm from process logs.
- Token field: Express may return `accessToken`; Python/Go return `access_token`.
- `pnpm root-cli` runs compiled `packages/cli/dist` — rebuild after core changes.
- See also [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) and [README.md](README.md).
