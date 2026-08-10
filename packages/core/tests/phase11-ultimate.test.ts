import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRootJsonFixture, parseRootJson } from "../src/config/root-json.js";
import { createInitAnswers } from "../src/init/answers.js";
import { assertNoNodeProjectFiles } from "../src/providers/language-agnostic.js";
import {
  structureizeFastapi,
  structureizeFlask,
  structureizeGoHttp,
} from "../src/providers/non-node.js";

describe("language-agnostic non-Node providers", () => {
  it("FastAPI project has no package.json / node_modules", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-fastapi-"));
    const result = await structureizeFastapi({
      targetDir: dir,
      answers: createInitAnswers("py-api", {
        language: "python",
        framework: "fastapi",
        database: "postgresql",
        orm: "sqlalchemy",
        packageManager: "pip",
        validation: "pydantic",
        testing: "pytest",
        docker: false,
      }),
    });
    expect(result.filesWritten).toContain("pyproject.toml");
    expect(result.filesWritten).toContain("app/main.py");
    expect(result.filesWritten).not.toContain("package.json");
    await expect(assertNoNodeProjectFiles(dir)).resolves.toBeUndefined();
  });

  it("Flask project has no Node project files", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-flask-"));
    await structureizeFlask({
      targetDir: dir,
      answers: createInitAnswers("flask-api", {
        language: "python",
        framework: "flask",
        database: "none",
        orm: "none",
        packageManager: "pip",
        validation: "none",
        testing: "pytest",
        docker: false,
      }),
    });
    await expect(assertNoNodeProjectFiles(dir)).resolves.toBeUndefined();
  });

  it("Go net/http project has no Node project files", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-go-"));
    const result = await structureizeGoHttp({
      targetDir: dir,
      answers: createInitAnswers("go-api", {
        language: "go",
        framework: "go-http",
        database: "sqlite",
        orm: "gorm",
        packageManager: "go-mod",
        validation: "none",
        testing: "none",
        docker: false,
      }),
    });
    expect(result.filesWritten).toContain("go.mod");
    expect(result.filesWritten).toContain("main.go");
    await expect(assertNoNodeProjectFiles(dir)).resolves.toBeUndefined();
  });
});

describe("root.json v2 migration", () => {
  it("migrates v1 flat architecture", () => {
    const v1 = createRootJsonFixture({ architecture: "layered-mvc" });
    const { version: _v, architectureDetail: _d, packageManager: _p, repository: _r, ...rest } = v1;
    const raw: Record<string, unknown> = {
      ...rest,
      architecture: "layered-mvc",
      features: { docker: false, githubActions: false },
    };
    // Simulate a v1 file with no version field
    const { version: _omit, ...withoutVersion } = raw as { version?: number } & Record<
      string,
      unknown
    >;
    void _omit;
    const parsed = parseRootJson(withoutVersion);
    expect(parsed.version).toBe(2);
    expect(parsed.architectureDetail?.code).toBe("layered-mvc");
    expect(parsed.packageManager).toBe("pnpm");
  });

  it("accepts sqlite database", () => {
    const config = createRootJsonFixture({ database: "sqlite", orm: "prisma" });
    expect(config.database).toBe("sqlite");
  });
});
