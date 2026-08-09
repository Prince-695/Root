import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRootJsonFixture, serializeRootJson } from "../src/config/root-json.js";
import { detectProject } from "../src/engine/detector.js";

async function tempDir(prefix: string): Promise<string> {
  return mkdtemp(path.join(tmpdir(), prefix));
}

describe("detectProject", () => {
  it("1. completely empty directory → empty-safe", async () => {
    const dir = await tempDir("root-empty-");
    const result = await detectProject(dir);
    expect(result.kind).toBe("empty-safe");
  });

  it("2. only .git → empty-safe", async () => {
    const dir = await tempDir("root-git-");
    await mkdir(path.join(dir, ".git"));
    const result = await detectProject(dir);
    expect(result.kind).toBe("empty-safe");
  });

  it("3. only README.md → empty-safe", async () => {
    const dir = await tempDir("root-readme-");
    await writeFile(path.join(dir, "README.md"), "# hi\n", "utf8");
    const result = await detectProject(dir);
    expect(result.kind).toBe("empty-safe");
  });

  it("4. .git + README.md + LICENSE → empty-safe", async () => {
    const dir = await tempDir("root-safe-combo-");
    await mkdir(path.join(dir, ".git"));
    await writeFile(path.join(dir, "README.md"), "# hi\n", "utf8");
    await writeFile(path.join(dir, "LICENSE"), "MIT\n", "utf8");
    const result = await detectProject(dir);
    expect(result.kind).toBe("empty-safe");
  });

  it("5. only .gitignore → empty-safe", async () => {
    const dir = await tempDir("root-gitignore-");
    await writeFile(path.join(dir, ".gitignore"), "node_modules\n", "utf8");
    const result = await detectProject(dir);
    expect(result.kind).toBe("empty-safe");
  });

  it("6. random index.js → foreign", async () => {
    const dir = await tempDir("root-foreign-js-");
    await writeFile(path.join(dir, "index.js"), "console.log(1)\n", "utf8");
    const result = await detectProject(dir);
    expect(result.kind).toBe("foreign");
  });

  it("7. package.json present → foreign", async () => {
    const dir = await tempDir("root-foreign-pkg-");
    await writeFile(path.join(dir, "package.json"), "{}\n", "utf8");
    const result = await detectProject(dir);
    expect(result.kind).toBe("foreign");
  });

  it("8. node_modules present → foreign", async () => {
    const dir = await tempDir("root-foreign-nm-");
    await mkdir(path.join(dir, "node_modules"));
    const result = await detectProject(dir);
    expect(result.kind).toBe("foreign");
  });

  it("9. src/ folder present → foreign", async () => {
    const dir = await tempDir("root-foreign-src-");
    await mkdir(path.join(dir, "src"));
    const result = await detectProject(dir);
    expect(result.kind).toBe("foreign");
  });

  it("10. valid root.json → root-project", async () => {
    const dir = await tempDir("root-valid-");
    const config = createRootJsonFixture({ projectName: "valid-api" });
    await writeFile(path.join(dir, "root.json"), serializeRootJson(config), "utf8");
    const result = await detectProject(dir);
    expect(result.kind).toBe("root-project");
    if (result.kind === "root-project") {
      expect(result.config.projectName).toBe("valid-api");
    }
  });

  it("11. invalid root.json → root-project-invalid", async () => {
    const dir = await tempDir("root-invalid-");
    await writeFile(path.join(dir, "root.json"), JSON.stringify({ projectName: "broken" }), "utf8");
    const result = await detectProject(dir);
    expect(result.kind).toBe("root-project-invalid");
    if (result.kind === "root-project-invalid") {
      expect(result.error.message).toMatch(/Invalid root\.json|language|framework/);
    }
  });

  it("12. malformed root.json JSON → root-project-invalid", async () => {
    const dir = await tempDir("root-malformed-");
    await writeFile(path.join(dir, "root.json"), "{nope", "utf8");
    const result = await detectProject(dir);
    expect(result.kind).toBe("root-project-invalid");
  });

  it("13. README + index.ts → foreign (unsafe wins)", async () => {
    const dir = await tempDir("root-mixed-");
    await writeFile(path.join(dir, "README.md"), "# x\n", "utf8");
    await writeFile(path.join(dir, "index.ts"), "export {}\n", "utf8");
    const result = await detectProject(dir);
    expect(result.kind).toBe("foreign");
  });
});
