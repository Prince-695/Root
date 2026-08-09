import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
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
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`${command} ${args.join(" ")} => ${code}\n${stderr}\n${stdout}`));
      }
    });
  });
}

function preferLoopback(url: string): string {
  return url.replace("://localhost", "://127.0.0.1");
}

async function dockerAvailable(): Promise<boolean> {
  try {
    await run(process.cwd(), "docker", ["info"]);
    return true;
  } catch {
    return false;
  }
}

async function resolvePostgresUrl(): Promise<string | null> {
  if (process.env.ROOT_E2E_DATABASE_URL) {
    return preferLoopback(process.env.ROOT_E2E_DATABASE_URL);
  }
  if (!(await dockerAvailable())) {
    return null;
  }
  const { PostgreSqlContainer } = await import("@testcontainers/postgresql");
  const container = await new PostgreSqlContainer("postgres:16-alpine").start();
  // Stash stopper on global for afterAll in this process — container stopped in test finally.
  (globalThis as { __rootPgStop?: () => Promise<void> }).__rootPgStop = async () => {
    await container.stop();
  };
  return container.getConnectionUri();
}

async function resolveMongoUrl(): Promise<string | null> {
  if (process.env.ROOT_E2E_MONGO_URL) {
    return preferLoopback(process.env.ROOT_E2E_MONGO_URL);
  }
  if (!(await dockerAvailable())) {
    return null;
  }
  const { MongoDBContainer } = await import("@testcontainers/mongodb");
  const container = await new MongoDBContainer("mongo:7").start();
  (globalThis as { __rootMongoStop?: () => Promise<void> }).__rootMongoStop = async () => {
    await container.stop();
  };
  // MongoDBContainer advertises a replica-set hostname that is not resolvable from the host.
  // Use the published port + directConnection for host-side mongoose clients.
  const port = container.getMappedPort(27017);
  return `mongodb://127.0.0.1:${port}/root?directConnection=true`;
}

async function smokeHttp(
  dir: string,
  options: { connectMongo?: boolean } = {},
): Promise<{ createStatus: number; getStatus: number; id: string }> {
  const harness = `
import { createServer } from "./src/server.ts";
${options.connectMongo ? 'import mongoose from "mongoose";\nimport { connectDb } from "./src/db/client.ts";\nawait connectDb();' : ""}

const app = createServer();
const server = app.listen(0);
await new Promise((r) => server.once("listening", r));
const addr = server.address();
if (!addr || typeof addr === "string") throw new Error("bad address");
const port = addr.port;

const listRes = await fetch("http://127.0.0.1:" + port + "/api/post");
if (listRes.status !== 200) throw new Error("list " + listRes.status);

const createRes = await fetch("http://127.0.0.1:" + port + "/api/post", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ title: "from-e2e" }),
});
const created = await createRes.json();
if (createRes.status !== 201) throw new Error("create " + createRes.status + " " + JSON.stringify(created));
const id = created.data.id ?? created.data._id;

const getRes = await fetch("http://127.0.0.1:" + port + "/api/post/" + id);
if (getRes.status !== 200) throw new Error("get " + getRes.status);

await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
${options.connectMongo ? "await mongoose.disconnect();" : ""}
console.log(JSON.stringify({ createStatus: createRes.status, getStatus: getRes.status, id: String(id) }));
`;
  await writeFile(path.join(dir, "smoke-db.mts"), harness, "utf8");
  const stdout = await run(dir, "pnpm", ["exec", "tsx", "smoke-db.mts"]);
  const line = stdout.trim().split("\n").at(-1) ?? "";
  return JSON.parse(line) as { createStatus: number; getStatus: number; id: string };
}

const hasEnvPg = Boolean(process.env.ROOT_E2E_DATABASE_URL);
const hasEnvMongo = Boolean(process.env.ROOT_E2E_MONGO_URL);
const canDocker = await dockerAvailable();
const runPg = hasEnvPg || canDocker;
const runMongo = hasEnvMongo || canDocker;

describe.skipIf(!runPg)("add route DB E2E — Postgres + Prisma", () => {
  const dirs: string[] = [];
  afterAll(async () => {
    await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
    const stop = (globalThis as { __rootPgStop?: () => Promise<void> }).__rootPgStop;
    if (stop) {
      await stop();
    }
  });

  it("GET empty list, POST 201, GET by id 200", async () => {
    const databaseUrl = await resolvePostgresUrl();
    expect(databaseUrl).toBeTruthy();
    const dir = await mkdtemp(path.join(tmpdir(), "root-pg-"));
    dirs.push(dir);

    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("pg-api", { docker: false }),
    });
    await writeFile(path.join(dir, ".env"), `DATABASE_URL="${databaseUrl}"\nPORT=3000\n`, "utf8");
    await addRoute({
      projectRoot: dir,
      name: "post",
      skipGenerate: true,
      runCommand: async () => {},
    });
    await run(dir, "pnpm", ["install"]);
    await run(dir, "pnpm", ["exec", "prisma", "generate"]);
    await run(dir, "pnpm", ["exec", "prisma", "db", "push"]);

    const result = await smokeHttp(dir);
    expect(result.createStatus).toBe(201);
    expect(result.getStatus).toBe(200);
    expect(result.id.length).toBeGreaterThan(0);
  }, 180_000);
});

describe.skipIf(!runMongo)("add route DB E2E — Mongo + Mongoose", () => {
  const dirs: string[] = [];
  afterAll(async () => {
    await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
    const stop = (globalThis as { __rootMongoStop?: () => Promise<void> }).__rootMongoStop;
    if (stop) {
      await stop();
    }
  });

  it("GET empty list, POST 201, GET by id 200", async () => {
    const databaseUrl = await resolveMongoUrl();
    expect(databaseUrl).toBeTruthy();
    const dir = await mkdtemp(path.join(tmpdir(), "root-mongo-"));
    dirs.push(dir);

    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("mongo-e2e", {
        database: "mongodb",
        orm: "mongoose",
        docker: false,
      }),
    });
    await writeFile(path.join(dir, ".env"), `DATABASE_URL="${databaseUrl}"\nPORT=3000\n`, "utf8");
    await addRoute({
      projectRoot: dir,
      name: "post",
      skipGenerate: true,
      runCommand: async () => {},
    });
    await run(dir, "pnpm", ["install"]);

    const result = await smokeHttp(dir, { connectMongo: true });
    expect(result.createStatus).toBe(201);
    expect(result.getStatus).toBe(200);
    expect(result.id.length).toBeGreaterThan(0);
  }, 180_000);
});
