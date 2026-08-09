# Root — Explained for Everyone

This guide uses everyday words. You do **not** need to know how to code to understand what Root does. If you later want to *run* Root, you will need a computer with Node.js installed — the steps below tell you exactly what to type.

---

## 1. What is Root?

Imagine you want to open a small restaurant kitchen (a **backend** — the part of an app that lives on a server and answers requests like “save this post” or “log me in”).

Normally you would:

- Buy every pot and pan yourself  
- Draw a map of where everything goes  
- Wire the lights, water, and gas by hand  
- Hope you did not forget a pipe  

**Root is a kitchen kit.** You answer a few questions (“What kind of fridge?” “Do you want locks on the door?”). Root lays out the kitchen for you: shelves, labels, pipes already connected. The kitchen is **yours**. You can change anything later. Root does not keep the keys.

In computer words: Root is a **command-line tool** that creates and updates backend projects (starting with **Express** apps) and keeps all the pieces hooked together.

---

## 2. Why does Root exist?

Building a backend by hand means many tiny files must agree with each other:

- A “route” (the door people knock on)  
- A “controller” (the person who answers the door)  
- A “service” (the cook who does the work)  
- A “schema” (the checklist for what a valid order looks like)  
- Sometimes a database model (how food is stored in the fridge)  
- A note in a config file that says “this door exists”  

If you add one piece and forget another, the kitchen looks fine but the doorbell is dead.

**Root’s job:** when you say “add a post door,” it updates **all** the connected pieces in one go. If something fails halfway, it **undoes** the change so you are not left with a half-built mess.

---

## 3. Who is Root for?

- People building an API (an app that other apps talk to)  
- People who want a sensible starting structure without copying random templates from the internet  
- People who want login (JWT) and resources (like “posts”) wired correctly  

### What Root is **not**

| Not this | Why |
|---|---|
| Artificial intelligence | Root uses fixed recipes. No guessing. No chat bot. |
| A website host | It does not put your app on the internet for you. |
| A cloud account | Nothing is uploaded to Root’s servers. |
| A language runtime | Your app still runs with Node.js on your machine. |

---

## 4. Everyday use cases

1. **Empty folder → working API** — You have nothing. You run `init`. You get a project that answers “are you alive?” at `/health`.  
2. **Add login** — You run `add auth`. Signup and signin doors appear.  
3. **Add a resource** — You run `add resource post`. Create/list/get posts appear, wired to the schema and server. If login exists, creating a post requires a token.  
4. **Check health of the project** — You run `doctor`. Root tells you if files drifted or mounts are missing.  
5. **Peek before changing** — You run with `--dry-run`. Root shows the plan and writes nothing.

---

## 5. Words you will see (glossary)

| Word | Plain meaning |
|---|---|
| **Backend / API** | The kitchen that answers requests from phones or websites. |
| **Terminal / command line** | A text window where you type instructions. |
| **Node.js** | The engine that runs JavaScript on your computer. Root needs a recent Node (22.18+ or 24+). |
| **pnpm / npm** | Tools that download packages. Think “app store for code libraries.” |
| **Package / CLI** | A program you run with a short command. You run Root with `npx root@latest` (package and command: `root`). |
| **Folder / project** | A directory of files that make up your API. |
| **`root.json`** | Root’s notebook about *your* project: language, database, which modules were added. |
| **Route** | A door URL, like `/api/post`. |
| **Auth / JWT** | A lock-and-key system. After login you get a temporary key (token). |
| **ORM** | A helper that talks to a database (Prisma, Drizzle, Mongoose, or none). |
| **Schema** | Rules for what a valid request body looks like (Root uses Zod). |
| **Interconnection** | Updating every related file when you add one feature. |
| **Rollback** | Undo everything if a step fails. |
| **Dry-run** | Show the plan; do not write files. |
| **Doctor** | A checklist that looks for broken wiring. |

---

## 6. End-to-end setup (first project)

Do these in order. Copy carefully.

### Step A — Install Node.js

1. Open [https://nodejs.org](https://nodejs.org).  
2. Install a **current** version (**22.18+** or **24**).  
3. Open a terminal and type:

```bash
node -v
```

You should see a version number. If the computer says “command not found,” Node is not installed yet.

### Step B — Make an empty folder

```bash
mkdir my-api
cd my-api
```

### Step C — Run Root init

When the package is on npm:

```bash
pnpm dlx root@latest init
```

Or with npm:

```bash
npx root@latest init
```

From this GitHub repo (contributors):

```bash
pnpm install
pnpm build
pnpm root-cli init
```

Answer the questions (or use `--yes` for defaults: TypeScript + Express + Postgres + Prisma).

### Step D — Install project libraries and run

```bash
cp .env.example .env
pnpm install
pnpm prisma:generate
pnpm dev
```

(If you chose “no database,” you can skip `prisma:generate`.)

Open a browser to `http://localhost:3000/health`. You should see a friendly “ok” style response.

### Step E — Add login and a resource

```bash
pnpm dlx root@latest add auth
pnpm dlx root@latest add resource post
```

Restart `pnpm dev` if it was already running.

### Step F — Try it (idea level)

1. Sign up at `/auth/signup` (send email + password).  
2. Sign in at `/auth/signin` — you get a **token** (key).  
3. List posts at `/api/post` (usually open).  
4. Create a post at `/api/post` **with** the key in the header. Without the key, create should refuse.

### Step G — Doctor

```bash
pnpm dlx root@latest doctor
```

If something is wrong, Root prints plain messages about missing files or mounts.

---

## 7. Package installer commands (cheat sheet)

| Goal | Command |
|---|---|
| Run latest from npm (pnpm) | `pnpm dlx root@latest <command>` |
| Run latest from npm (npm) | `npx root@latest <command>` |
| Init with defaults | `pnpm dlx root@latest --yes init` |
| Init into a named folder | `pnpm dlx root@latest init my-api` |
| Skip installing deps during init | `pnpm dlx root@latest init --skip-install` |
| Local from this monorepo | `pnpm root-cli <command>` (after `pnpm build`) |
| From a downloaded release `.tgz` | `pnpm dlx ./root-0.1.0.tgz --yes init my-api` |

> Invoke with `npx root@latest` (also `pnpm dlx` / `yarn dlx` / `bunx`). Local monorepo: `pnpm root-cli`.

---

## 8. Every command, line by line

### 8.1 `init` — build the kitchen

**What you type**

```bash
pnpm dlx root@latest init
# or
pnpm dlx root@latest --yes init my-api
```

**What it means in real life**  
“Create a new backend project from Root’s templates.”

**When to use**  
Only in an empty (or new) folder. Not inside an existing Root project.

**What happens**

1. Root checks the folder is safe to use.  
2. Asks (or uses defaults) for language, framework, database, ORM, auth, extras.  
3. Writes many files (server, health route, config, `root.json`, …).  
4. Optionally installs libraries.  
5. If you chose JWT at init, it may run auth setup immediately.

**Files you care about**

- `root.json` — Root’s notebook  
- `src/server.ts` or `src/server.js` — main app wiring (+ a special comment so later adds know where to plug in)  
- `src/schema.ts` / `.js` — validation rules  
- `.env.example` — sample secrets (copy to `.env`, never commit real secrets)  
- `package.json` — project name and scripts (`pnpm dev`)

**What to do next**  
Copy `.env.example` → `.env`, install, run `pnpm dev`, hit `/health`.

**Common mistakes**

- Running init in a messy folder full of unrelated files.  
- Forgetting to copy `.env`.  
- Using an old Node version.

---

### 8.2 `add auth` — put locks on the door

**What you type**

```bash
pnpm dlx root@latest add auth
```

**What it means**  
“Install signup/signin/signout and a middleware that checks tokens.”

**When to use**  
Inside a Root project (`root.json` exists), when you want JWT login.

**What happens**

- Creates auth routes, controller, service, middleware  
- Adds User storage for your ORM (or in-memory if none)  
- Updates schema + env example + README  
- Mounts `/auth` on the server  
- If you already had resources, Root may **retrofit** them so creates require login  

**What to do next**  
Set `ACCESS_TOKEN_SECRET` in `.env`. Restart the server. Try signup/signin.

**Common mistakes**

- Forgetting the secret in `.env`.  
- Expecting sessions/cookies — this MVP is **stateless JWT** (client keeps the token).

---

### 8.3 `add resource <name>` — add an API resource

**What you type**

```bash
pnpm dlx root@latest add resource post
```

**What it means**  
“Create a full resource named `post`: list, get by id, create — and wire schema, ORM, and server mount.”

**When to use**  
When you need a new noun in your API (posts, notes, invoices…).

**What happens (interconnection)**

- Route file + controller + service  
- Schema entry  
- ORM model/table if applicable  
- Import + `app.use("/api/post", …)` near the inject anchor  
- `root.json` module entry  
- If auth exists: create is protected; ownership comes from the token  

**What to do next**  
Restart (if needed), call `GET /api/post`, then `POST` with a token if auth is on.

**Common mistakes**

- Duplicate names (`add resource post` twice).  
- Removing the `[ROOT-INJECT:ROUTES]` comment from the server file (doctor will complain).

---

### 8.4 Other capabilities

```bash
npx root@latest add middleware rate-limit
npx root@latest add service mailer
npx root@latest list
npx root@latest inspect post
npx root@latest diff
npx root@latest sync
```

Middleware/service create shared filters or business-logic modules — they do **not** open a public URL by themselves. Use `add resource` for that. `list` / `inspect` / `diff` / `sync` help you see and verify what Root registered.

Planned (names reserved; not implemented yet):

```bash
npx root@latest add database postgres
npx root@latest add job send-email
npx root@latest add event order.created
npx root@latest add storage s3
npx root@latest add cache redis
npx root@latest add module billing
npx root@latest remove resource post
```


---

### 8.5 `doctor` — inspect the kitchen

```bash
pnpm dlx root@latest doctor
pnpm dlx root@latest doctor --strict
```

**What it means**  
“Check that Root’s notebook matches the files and that mounts/anchors look healthy.”

**When to use**  
After manual edits, merges, or weird errors.

`--strict` treats auth mismatches as hard errors instead of warnings.

---

### 8.6 `--dry-run` — peek without building

```bash
pnpm dlx root@latest --dry-run add resource comment
```

**What it means**  
“Show the operation plan. Do not touch the disk.”

**When to use**  
When you are curious or cautious.

---

## 9. How the whole system works (high level)

Think of five workers in a line:

1. **You** type a command in the terminal.  
2. **CLI** (`root`) reads your words and opens the project.  
3. **Module graph** reads `root.json` and peeks at the disk (“is auth already there?”).  
4. **Planner** expands a **recipe** into an ordered list of operations (create file, patch server, update schema…).  
5. **Lock + transaction** takes a padlock (`.root.lock`), applies every operation, and if anything fails, **rolls back** to the previous snapshot.

```text
You
 └─► root CLI
      └─► Module graph (root.json + probes)
           └─► Planner (recipe → operations)
                └─► .root.lock → Transaction
                     ├─ write / patch files
                     ├─ update schema / ORM / manifest
                     └─ on failure → rollback
```

That is why `add resource` feels magical: it is not one file — it is a **transaction** across many files.

---

## 10. Project anatomy (important files)

After `init`, you will see something like:

| Path | Plain meaning |
|---|---|
| `root.json` | Root’s contract for this project |
| `package.json` | Scripts and library list |
| `src/index.ts` / `.js` | Starts the server |
| `src/server.ts` / `.js` | Middleware + mounts; contains inject anchor |
| `src/routes/` | Doors (URLs) |
| `src/controllers/` | Door attendants |
| `src/services/` | Business work |
| `src/middleware/` | Shared checks (logger, validate, auth) |
| `src/schema.ts` / `.js` | Validation checklists |
| `src/db/` | Database client |
| `.env.example` | Sample environment variables |
| `prisma/` or drizzle files | Database shape (if you chose those ORMs) |

---

## 11. Use-case story: “I want a notes API”

1. `mkdir notes-api && cd notes-api`  
2. `pnpm dlx root@latest --yes init` (or answer the wizard)  
3. `pnpm dlx root@latest add auth`  
4. `pnpm dlx root@latest add resource note`  
5. `cp .env.example .env` → set secrets → `pnpm install` → `pnpm dev`  
6. Sign up → sign in → create a note with the token → list notes  
7. `pnpm dlx root@latest doctor`  

You now have a small, owned backend — not a black box SaaS.

---

## 12. Remember

- **You own the code.** Root is a starter + updater, not a landlord.  
- **No AI.** Recipes are deterministic.  
- **Interconnection is the product.** One command, many files, rollback on failure.  
- Invoke: `npx root@latest` · capabilities: `add resource`, `add auth`, …  

When something feels scary, run `--dry-run` first, then `doctor` after.
