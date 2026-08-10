import { createInitAnswers } from "@root/core";
import { describe, expect, it } from "vitest";
import { buildInitNextSteps } from "../src/init/next-steps.js";

describe("buildInitNextSteps", () => {
  it("shows Flask/pip commands for Python — never pnpm dev", () => {
    const text = buildInitNextSteps({
      targetDir: "/tmp/hello-world",
      answers: createInitAnswers("hello-world", {
        language: "python",
        framework: "flask",
        packageManager: "pip",
        database: "postgresql",
        orm: "none",
        validation: "none",
        testing: "pytest",
        docker: false,
      }),
      adoptExisting: false,
      skipInstall: true,
    });
    expect(text).toContain("pip install -r requirements.txt");
    expect(text).toContain("flask --app app run --debug");
    expect(text).not.toContain("pnpm dev");
    expect(text).not.toContain(".env.example");
  });

  it("shows uvicorn for FastAPI", () => {
    const text = buildInitNextSteps({
      targetDir: "/tmp/api",
      answers: createInitAnswers("api", {
        language: "python",
        framework: "fastapi",
        packageManager: "uv",
        database: "none",
        orm: "none",
        validation: "pydantic",
        testing: "pytest",
        docker: false,
      }),
      adoptExisting: false,
      skipInstall: true,
    });
    expect(text).toContain("uv pip install");
    expect(text).toContain("uvicorn app.main:app --reload");
    expect(text).not.toContain("pnpm");
  });

  it("shows go run for Go projects", () => {
    const text = buildInitNextSteps({
      targetDir: "/tmp/go-api",
      answers: createInitAnswers("go-api", {
        language: "go",
        framework: "go-http",
        packageManager: "go-mod",
        database: "sqlite",
        orm: "gorm",
        validation: "none",
        testing: "none",
        docker: false,
      }),
      adoptExisting: false,
      skipInstall: true,
    });
    expect(text).toContain("go mod tidy");
    expect(text).toContain("go run .");
    expect(text).not.toContain("pnpm dev");
    expect(text).not.toContain("npm run");
  });

  it("shows package-manager-specific Node dev command", () => {
    const text = buildInitNextSteps({
      targetDir: "/tmp/node-api",
      answers: createInitAnswers("node-api", {
        packageManager: "npm",
        docker: false,
      }),
      adoptExisting: false,
      skipInstall: false,
      installed: true,
    });
    expect(text).toContain("npm run dev");
    expect(text).toContain("cp .env.example .env");
    expect(text).not.toContain("flask");
  });
});
