import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createProgram } from "../src/cli.js";

async function withCwd<T>(dir: string, fn: () => Promise<T>): Promise<T> {
  const previous = process.cwd();
  process.chdir(dir);
  try {
    return await fn();
  } finally {
    process.chdir(previous);
  }
}

describe("root init generation (Phase 2)", () => {
  afterEach(() => {
    process.exitCode = undefined;
    vi.restoreAllMocks();
  });

  it("generates golden-path project with --yes --skip-install", async () => {
    const parent = await mkdtemp(path.join(tmpdir(), "cli-init-gen-"));
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    const program = createProgram();
    await withCwd(parent, async () => {
      await program.parseAsync(["node", "root", "--yes", "init", "phase2-app", "--skip-install"]);
    });

    expect(process.exitCode ?? 0).toBe(0);
    const projectDir = path.join(parent, "phase2-app");
    await access(path.join(projectDir, "root.json"));
    await access(path.join(projectDir, "src/server.ts"));
    await access(path.join(projectDir, "prisma/schema.prisma"));

    const rootJson = JSON.parse(await readFile(path.join(projectDir, "root.json"), "utf8")) as {
      framework: string;
      orm: string;
      database: string;
    };
    expect(rootJson.framework).toBe("express");
    expect(rootJson.orm).toBe("prisma");
    expect(rootJson.database).toBe("postgresql");

    const server = await readFile(path.join(projectDir, "src/server.ts"), "utf8");
    expect(server).toContain("[ROOT-INJECT:ROUTES]");
  });
});
