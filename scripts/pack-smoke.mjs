#!/usr/bin/env node
/**
 * Local registry-equivalent smoke: pack → dlx from tarball → init/add/doctor.
 * Health is checked via createServer + fetch (no long-lived process).
 */
import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, cwd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("no port"));
        return;
      }
      const { port } = addr;
      srv.close(() => resolve(port));
    });
  });
}

execSync("node scripts/prepare-publish.mjs", { cwd: root, stdio: "inherit" });
const releaseDir = path.join(root, "release", "root");
const packJson = execSync("npm pack --json", { cwd: releaseDir, encoding: "utf8" });
const [{ filename }] = JSON.parse(packJson);
const tarball = path.join(releaseDir, filename);

const work = mkdtempSync(path.join(tmpdir(), "root-smoke-"));
const appDir = path.join(work, "app");

try {
  run(`mkdir -p ${JSON.stringify(appDir)}`, work);
  run(`pnpm dlx ${JSON.stringify(tarball)} --yes init smoke-api --skip-install`, appDir);

  const project = path.join(appDir, "smoke-api");
  if (!existsSync(path.join(project, "root.json"))) {
    throw new Error("init did not create root.json");
  }
  if (!existsSync(path.join(project, "src/server.ts"))) {
    throw new Error("expected Express TS server.ts from --yes golden path");
  }

  run("pnpm install", project);
  run("pnpm exec prisma generate", project);

  const port = await freePort();
  writeFileSync(
    path.join(project, ".env"),
    [
      "NODE_ENV=development",
      `PORT=${port}`,
      "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smoke?schema=public",
      "",
    ].join("\n"),
  );

  const probe = `
import { createServer } from "./src/server.ts";
const app = createServer();
const server = app.listen(${port}, "127.0.0.1", async () => {
  const res = await fetch("http://127.0.0.1:${port}/health");
  const body = await res.json();
  server.close();
  if (res.status !== 200 || body?.data?.status !== "ok") {
    console.error(body);
    process.exit(1);
  }
  console.log("health ok", res.status);
});
`;
  writeFileSync(path.join(project, "_smoke_probe.mts"), probe);
  run("pnpm exec tsx _smoke_probe.mts", project);

  run(`pnpm dlx ${JSON.stringify(tarball)} add auth`, project);
  run(`pnpm dlx ${JSON.stringify(tarball)} add resource post`, project);
  run(`pnpm dlx ${JSON.stringify(tarball)} doctor`, project);

  const rootJson = JSON.parse(readFileSync(path.join(project, "root.json"), "utf8"));
  if (!rootJson.modules?.post || !rootJson.modules?.auth) {
    throw new Error("expected auth + post modules after add smoke");
  }

  console.log("Pack smoke OK");
} finally {
  rmSync(work, { recursive: true, force: true });
}
