import { access, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRootJsonFixture, serializeRootJson } from "@root/core";
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

async function tempDir(prefix: string): Promise<string> {
  return mkdtemp(path.join(tmpdir(), prefix));
}

describe("CLI command guards (Phase 1)", () => {
  afterEach(() => {
    process.exitCode = undefined;
    vi.restoreAllMocks();
  });

  it("help documents init, add, and doctor", () => {
    const program = createProgram();
    const byName = Object.fromEntries(program.commands.map((cmd) => [cmd.name(), cmd]));
    expect(program.helpInformation()).toContain("init");
    expect(byName.init?.helpInformation()).toMatch(/folder name|Escape|shadcn/i);
    expect(byName.add?.helpInformation()).toContain("component");
    expect(byName.doctor?.helpInformation()).toContain("integrity");
  });

  it("init with arg creates a subfolder even when cwd is foreign", async () => {
    const dir = await tempDir("cli-foreign-");
    await writeFile(path.join(dir, "index.js"), "1\n", "utf8");
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const program = createProgram();

    await withCwd(dir, async () => {
      await program.parseAsync(["node", "root", "--yes", "init", "nested-api", "--skip-install"]);
    });

    expect(process.exitCode ?? 0).toBe(0);
    await access(path.join(dir, "nested-api", "root.json"));
  });

  it("init --yes --dry-run stays in empty cwd", async () => {
    const dir = await tempDir("cli-empty-");
    await mkdir(path.join(dir, ".git"));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = createProgram();

    await withCwd(dir, async () => {
      await program.parseAsync(["node", "root", "--yes", "--dry-run", "init"]);
    });

    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("dry-run");
    expect(output).toContain("Would create folder: no");
    expect(process.exitCode ?? 0).toBe(0);
  });

  it("init --yes refuses existing Root project in cwd", async () => {
    const dir = await tempDir("cli-existing-");
    await writeFile(
      path.join(dir, "root.json"),
      serializeRootJson(createRootJsonFixture({ projectName: "exists" })),
      "utf8",
    );
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const program = createProgram();

    await withCwd(dir, async () => {
      await program.parseAsync(["node", "root", "--yes", "init"]);
    });

    expect(process.exitCode).toBe(1);
    expect(err.mock.calls.flat().join("\n")).toMatch(/already a Root project/i);
  });

  it("add without root.json tells user to run init", async () => {
    const dir = await tempDir("cli-add-empty-");
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const program = createProgram();

    await withCwd(dir, async () => {
      await program.parseAsync(["node", "root", "add", "route", "post"]);
    });

    expect(process.exitCode).toBe(1);
    expect(err.mock.calls.flat().join("\n")).toMatch(/init/i);
  });

  it("add works on valid Root project", async () => {
    const dir = await tempDir("cli-add-ok-");
    await writeFile(
      path.join(dir, "root.json"),
      serializeRootJson(createRootJsonFixture({ projectName: "ok-api" })),
      "utf8",
    );
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = createProgram();

    await withCwd(dir, async () => {
      await program.parseAsync(["node", "root", "add", "route", "post"]);
    });

    expect(process.exitCode ?? 0).toBe(0);
    expect(log.mock.calls.flat().join("\n")).toContain("ok-api");
  });

  it("doctor validates root.json and fails on invalid contract", async () => {
    const dir = await tempDir("cli-doctor-bad-");
    await writeFile(path.join(dir, "root.json"), JSON.stringify({ projectName: "x" }), "utf8");
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const program = createProgram();

    await withCwd(dir, async () => {
      await program.parseAsync(["node", "root", "doctor"]);
    });

    expect(process.exitCode).toBe(1);
    expect(err.mock.calls.flat().join("\n")).toMatch(/Invalid root\.json|language|FAILED/);
  });

  it("doctor passes on valid root.json", async () => {
    const dir = await tempDir("cli-doctor-ok-");
    await writeFile(
      path.join(dir, "root.json"),
      serializeRootJson(createRootJsonFixture({ projectName: "healthy" })),
      "utf8",
    );
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const program = createProgram();

    await withCwd(dir, async () => {
      await program.parseAsync(["node", "root", "doctor"]);
    });

    expect(process.exitCode ?? 0).toBe(0);
    expect(log.mock.calls.flat().join("\n")).toContain("OK");
  });

  it("verbose flag reaches init handler", async () => {
    const dir = await tempDir("cli-verbose-");
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const program = createProgram();

    await withCwd(dir, async () => {
      await program.parseAsync(["node", "root", "--verbose", "--yes", "init", "--skip-install"]);
    });

    expect(err.mock.calls.flat().join("\n")).toContain("[verbose]");
  });
});
