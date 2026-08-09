import { access, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRootJsonFixture, serializeRootJson } from "@root/core";
import { describe, expect, it } from "vitest";
import { resolveInitTarget } from "../src/init/resolve-target.js";

async function tempDir(prefix: string): Promise<string> {
  return mkdtemp(path.join(tmpdir(), prefix));
}

const noPrompt = async () => {
  throw new Error("prompt should not be called");
};

describe("resolveInitTarget (shadcn-style folder UX)", () => {
  it("Escape/cancel uses current empty folder", async () => {
    const dir = await tempDir("init-escape-");
    const result = await resolveInitTarget({
      cwd: dir,
      flags: { verbose: false, dryRun: false, yes: false },
      promptFolderName: async () => null,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.targetDir).toBe(path.resolve(dir));
      expect(result.createdFolder).toBe(false);
    }
  });

  it("Escape in a foreign folder fails with guidance to name a folder", async () => {
    const dir = await tempDir("init-foreign-escape-");
    await writeFile(path.join(dir, "index.js"), "1\n", "utf8");

    const result = await resolveInitTarget({
      cwd: dir,
      flags: { verbose: false, dryRun: false, yes: false },
      promptFolderName: async () => null,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/folder name|non-empty/i);
    }
  });

  it("named folder is created inside a foreign cwd", async () => {
    const dir = await tempDir("init-foreign-create-");
    await writeFile(path.join(dir, "index.js"), "1\n", "utf8");

    const result = await resolveInitTarget({
      cwd: dir,
      flags: { verbose: false, dryRun: false, yes: false },
      promptFolderName: async () => "my-api",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.createdFolder).toBe(true);
      expect(result.targetDir).toBe(path.join(dir, "my-api"));
      expect(result.projectName).toBe("my-api");
      await access(result.targetDir);
    }
  });

  it("CLI arg skips prompt and creates the folder", async () => {
    const dir = await tempDir("init-arg-");
    const result = await resolveInitTarget({
      cwd: dir,
      projectNameArg: "from-arg",
      flags: { verbose: false, dryRun: false, yes: false },
      promptFolderName: noPrompt,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.targetDir).toBe(path.join(dir, "from-arg"));
      expect(result.createdFolder).toBe(true);
    }
  });

  it("dry-run with a name does not create the folder on disk", async () => {
    const dir = await tempDir("init-dry-");
    const result = await resolveInitTarget({
      cwd: dir,
      projectNameArg: "ghost-api",
      flags: { verbose: false, dryRun: true, yes: false },
      promptFolderName: noPrompt,
      dryRun: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.createdFolder).toBe(true);
      await expect(access(path.join(dir, "ghost-api"))).rejects.toThrow();
    }
  });

  it("rejects invalid folder names", async () => {
    const dir = await tempDir("init-badname-");
    const result = await resolveInitTarget({
      cwd: dir,
      projectNameArg: "My API!",
      flags: { verbose: false, dryRun: false, yes: false },
      promptFolderName: noPrompt,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/Invalid folder name/);
    }
  });

  it("rejects an existing non-empty target folder name", async () => {
    const dir = await tempDir("init-exists-");
    await mkdir(path.join(dir, "taken"));
    await writeFile(path.join(dir, "taken", "file.txt"), "x\n", "utf8");

    const result = await resolveInitTarget({
      cwd: dir,
      projectNameArg: "taken",
      flags: { verbose: false, dryRun: false, yes: false },
      promptFolderName: noPrompt,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/already exists and is not empty/);
    }
  });

  it("rejects init into an existing Root project folder name", async () => {
    const dir = await tempDir("init-root-exists-");
    await mkdir(path.join(dir, "exists"));
    await writeFile(
      path.join(dir, "exists", "root.json"),
      serializeRootJson(createRootJsonFixture({ projectName: "exists" })),
      "utf8",
    );

    const result = await resolveInitTarget({
      cwd: dir,
      projectNameArg: "exists",
      flags: { verbose: false, dryRun: false, yes: false },
      promptFolderName: noPrompt,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/already a Root project/);
    }
  });

  it("--yes without name stays in empty cwd and skips prompt", async () => {
    const dir = await tempDir("init-yes-");
    const result = await resolveInitTarget({
      cwd: dir,
      flags: { verbose: false, dryRun: false, yes: true },
      promptFolderName: noPrompt,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.createdFolder).toBe(false);
      expect(result.targetDir).toBe(path.resolve(dir));
    }
  });
});
