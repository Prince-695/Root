import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { addAuth } from "../src/add/auth.js";
import { addRoute } from "../src/add/route.js";
import { createInitAnswers } from "../src/init/answers.js";
import { structureizeExpressTs } from "../src/init/structureizer.js";

async function run(cwd: string, command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "pipe",
      env: { ...process.env, CI: "true" },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c) => {
      stdout += String(c);
    });
    child.stderr.on("data", (c) => {
      stderr += String(c);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${command} ${args.join(" ")} => ${code}\n${stderr}\n${stdout}`));
    });
  });
}

async function smokeAuth(dir: string): Promise<{
  signupStatus: number;
  signinStatus: number;
  hasToken: boolean;
  createAuthed: number;
  createUnauthed: number;
  spoofAuthorId: string | null;
  publicGet: number;
}> {
  const harness = `
import { createServer } from "./src/server.ts";

const app = createServer();
const server = app.listen(0);
await new Promise((r) => server.once("listening", r));
const addr = server.address();
if (!addr || typeof addr === "string") throw new Error("bad address");
const port = addr.port;
const base = "http://127.0.0.1:" + port;

const signupRes = await fetch(base + "/auth/signup", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "a@example.com", password: "password123" }),
});
const signupJson = await signupRes.json();
const token = signupJson.data?.token;

const signinRes = await fetch(base + "/auth/signin", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "a@example.com", password: "password123" }),
});

const unauth = await fetch(base + "/api/post", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ title: "nope" }),
});

const authed = await fetch(base + "/api/post", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: "Bearer " + token,
  },
  body: JSON.stringify({ title: "hello", authorId: "spoofed-attacker" }),
});
const created = await authed.json();
const spoofAuthorId = created.data?.authorId ?? null;

const list = await fetch(base + "/api/post");

server.close();
console.log(JSON.stringify({
  signupStatus: signupRes.status,
  signinStatus: signinRes.status,
  hasToken: Boolean(token),
  createAuthed: authed.status,
  createUnauthed: unauth.status,
  spoofAuthorId,
  publicGet: list.status,
}));
`;
  await writeFile(path.join(dir, "smoke-auth.mts"), harness, "utf8");
  const stdout = await run(dir, "pnpm", ["exec", "tsx", "smoke-auth.mts"]);
  const line = stdout.trim().split("\n").at(-1) ?? "";
  return JSON.parse(line) as {
    signupStatus: number;
    signinStatus: number;
    hasToken: boolean;
    createAuthed: number;
    createUnauthed: number;
    spoofAuthorId: string | null;
    publicGet: number;
  };
}

describe("add auth HTTP E2E (orm none)", () => {
  const dirs: string[] = [];
  afterAll(async () => {
    await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
  });

  it("auth then route: signup/signin, protected create, spoof ignored, public GET", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-auth-e2e-a-"));
    dirs.push(dir);
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("auth-e2e-a", {
        database: "none",
        orm: "none",
        docker: false,
        testing: "none",
      }),
    });
    await addAuth({ projectRoot: dir, skipGenerate: true, runCommand: async () => {} });
    await addRoute({
      projectRoot: dir,
      name: "post",
      skipGenerate: true,
      runCommand: async () => {},
    });
    await writeFile(
      path.join(dir, ".env"),
      "ACCESS_TOKEN_SECRET=dev-only-change-me-please\nPORT=3000\n",
      "utf8",
    );
    await run(dir, "pnpm", ["install"]);

    const result = await smokeAuth(dir);
    expect(result.signupStatus).toBe(201);
    expect(result.signinStatus).toBe(200);
    expect(result.hasToken).toBe(true);
    expect(result.createAuthed).toBe(201);
    expect(result.createUnauthed).toBe(401);
    expect(result.spoofAuthorId).not.toBe("spoofed-attacker");
    expect(result.spoofAuthorId).toBeTruthy();
    expect(result.publicGet).toBe(200);
  }, 120_000);

  it("route then auth retrofit: same security guarantees", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-auth-e2e-b-"));
    dirs.push(dir);
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("auth-e2e-b", {
        database: "none",
        orm: "none",
        docker: false,
        testing: "none",
      }),
    });
    await addRoute({
      projectRoot: dir,
      name: "post",
      skipGenerate: true,
      runCommand: async () => {},
    });
    await addAuth({ projectRoot: dir, skipGenerate: true, runCommand: async () => {} });
    await writeFile(
      path.join(dir, ".env"),
      "ACCESS_TOKEN_SECRET=dev-only-change-me-please\nPORT=3000\n",
      "utf8",
    );
    await run(dir, "pnpm", ["install"]);

    const result = await smokeAuth(dir);
    expect(result.signupStatus).toBe(201);
    expect(result.createAuthed).toBe(201);
    expect(result.createUnauthed).toBe(401);
    expect(result.spoofAuthorId).not.toBe("spoofed-attacker");
    expect(result.publicGet).toBe(200);
  }, 120_000);
});
