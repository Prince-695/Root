import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { AddRouteError, addRoute } from "../src/add/route.js";
import { createInitAnswers } from "../src/init/answers.js";
import { structureizeExpressTs } from "../src/init/structureizer.js";

async function snapshotTree(dir: string, files: string[]): Promise<string> {
  const parts: string[] = [];
  for (const rel of files.sort()) {
    try {
      const body = await readFile(path.join(dir, rel), "utf8");
      parts.push(`${rel}\n${createHash("sha256").update(body).digest("hex")}`);
    } catch {
      parts.push(`${rel}\n<missing>`);
    }
  }
  return parts.join("\n");
}

const TRACKED = [
  "root.json",
  "src/server.ts",
  "src/schema.ts",
  "prisma/schema.prisma",
  "src/routes/post.routes.ts",
  "src/controllers/post.controller.ts",
  "src/services/post.service.ts",
];

describe("add route (Phase 5 interconnection)", () => {
  it("wires route/controller/service, schema, server mount, prisma model, manifest", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-add-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("add-api", { docker: false }),
    });

    const started = performance.now();
    const result = await addRoute({
      projectRoot: dir,
      name: "post",
      skipGenerate: true,
      runCommand: async () => {},
      addedAt: "2026-08-09T00:00:00.000Z",
    });
    const elapsed = performance.now() - started;

    expect(result.mountPath).toBe("/api/post");
    expect(elapsed).toBeLessThan(2000);

    await access(path.join(dir, "src/routes/post.routes.ts"));
    await access(path.join(dir, "src/controllers/post.controller.ts"));
    await access(path.join(dir, "src/services/post.service.ts"));

    const schema = await readFile(path.join(dir, "src/schema.ts"), "utf8");
    expect(schema).toContain("postSchema");
    expect(schema).toMatch(/export \{[^}]*postSchema/);

    const server = await readFile(path.join(dir, "src/server.ts"), "utf8");
    expect(server).toContain('import { postRouter } from "./routes/post.routes.js"');
    expect(server.match(/app\.use\("\/api\/post", postRouter\)/g)?.length).toBe(1);

    const prisma = await readFile(path.join(dir, "prisma/schema.prisma"), "utf8");
    expect(prisma).toContain("model Post");

    const root = JSON.parse(await readFile(path.join(dir, "root.json"), "utf8")) as {
      modules: Record<string, { type: string }>;
    };
    expect(root.modules.post?.type).toBe("resource");
  });

  it("refuses duplicate add without duplicating mounts", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-add-dup-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("dup-api", { docker: false }),
    });
    await addRoute({
      projectRoot: dir,
      name: "post",
      skipGenerate: true,
      runCommand: async () => {},
    });
    const serverOnce = await readFile(path.join(dir, "src/server.ts"), "utf8");

    await expect(
      addRoute({
        projectRoot: dir,
        name: "post",
        skipGenerate: true,
        runCommand: async () => {},
      }),
    ).rejects.toBeInstanceOf(AddRouteError);

    const serverTwice = await readFile(path.join(dir, "src/server.ts"), "utf8");
    expect(serverTwice).toBe(serverOnce);
    expect(serverTwice.match(/app\.use\("\/api\/post", postRouter\)/g)?.length).toBe(1);
  });

  it("rolls back to pre-add snapshot on injected failure", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-add-rb-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("rb-api", { docker: false }),
    });
    const before = await snapshotTree(dir, TRACKED);

    await expect(
      addRoute({
        projectRoot: dir,
        name: "post",
        skipGenerate: true,
        failAtIndex: 3,
        runCommand: async () => {},
      }),
    ).rejects.toBeInstanceOf(AddRouteError);

    const after = await snapshotTree(dir, TRACKED);
    expect(after).toBe(before);
  });

  it("adds mongoose model for mongo stack", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-add-mongo-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("mongo-api", {
        database: "mongodb",
        orm: "mongoose",
        docker: false,
      }),
    });
    await addRoute({
      projectRoot: dir,
      name: "post",
      skipGenerate: true,
      runCommand: async () => {},
    });
    const model = await readFile(path.join(dir, "src/models/post.model.ts"), "utf8");
    expect(model).toContain("PostModel");
    const service = await readFile(path.join(dir, "src/services/post.service.ts"), "utf8");
    expect(service).toContain("PostModel");
  });
});

describe("add route HTTP smoke (orm none)", () => {
  const dirs: string[] = [];

  afterAll(async () => {
    await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
  });

  it("boots and serves GET/POST /api/post without a database", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-add-http-"));
    dirs.push(dir);
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("http-api", {
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

    // Install only runtime deps needed to import the generated app.
    const { spawn } = await import("node:child_process");
    await new Promise<void>((resolve, reject) => {
      const child = spawn("pnpm", ["install"], {
        cwd: dir,
        stdio: "pipe",
        env: { ...process.env, CI: "true" },
      });
      child.on("error", reject);
      child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`install ${code}`))));
    });

    const harness = `
import { createServer } from "./src/server.ts";

const app = createServer();
const server = app.listen(0);
await new Promise((r) => server.once("listening", r));
const { port } = server.address();

const listRes = await fetch("http://127.0.0.1:" + port + "/api/post");
const listJson = await listRes.json();
if (listRes.status !== 200) throw new Error("list status " + listRes.status);

const createRes = await fetch("http://127.0.0.1:" + port + "/api/post", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ title: "hello" }),
});
const created = await createRes.json();
if (createRes.status !== 201) throw new Error("create status " + createRes.status);
const id = created.data.id;

const getRes = await fetch("http://127.0.0.1:" + port + "/api/post/" + id);
const got = await getRes.json();
if (getRes.status !== 200 || got.data.title !== "hello") {
  throw new Error("get mismatch");
}

server.close();
console.log("SMOKE_OK");
`;
    await writeFile(path.join(dir, "smoke.mts"), harness, "utf8");

    await new Promise<void>((resolve, reject) => {
      const child = spawn("pnpm", ["exec", "tsx", "smoke.mts"], {
        cwd: dir,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let out = "";
      let err = "";
      child.stdout.on("data", (c) => {
        out += String(c);
      });
      child.stderr.on("data", (c) => {
        err += String(c);
      });
      child.on("error", reject);
      child.on("exit", (code) => {
        if (code === 0 && out.includes("SMOKE_OK")) {
          resolve();
        } else {
          reject(new Error(`smoke failed code=${code}\n${out}\n${err}`));
        }
      });
    });
  }, 120_000);
});
