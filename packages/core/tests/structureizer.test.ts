import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createGoldenInitAnswers, createInitAnswers } from "../src/init/answers.js";
import { structureizeExpressTs } from "../src/init/structureizer.js";

async function tempDir(prefix: string): Promise<string> {
  return mkdtemp(path.join(tmpdir(), prefix));
}

describe("structureizeExpressTs (Phase 2 golden path)", () => {
  it("writes a bootable Express TS + Prisma project shape", async () => {
    const dir = await tempDir("root-struct-");
    const answers = createGoldenInitAnswers("demo-api");
    const started = Date.now();
    const result = await structureizeExpressTs({ targetDir: dir, answers });
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(10_000);
    expect(result.filesWritten).toContain("package.json");
    expect(result.filesWritten).toContain("root.json");
    expect(result.filesWritten).toContain("src/server.ts");

    const required = [
      "package.json",
      "tsconfig.json",
      "root.json",
      ".env.example",
      ".gitignore",
      "README.md",
      "prisma/schema.prisma",
      "docker-compose.yml",
      "src/index.ts",
      "src/server.ts",
      "src/config/env.ts",
      "src/db/client.ts",
      "src/schema.ts",
      "src/middleware/errorHandler.ts",
      "vitest.config.ts",
      "tests/health.test.ts",
    ];

    for (const file of required) {
      await access(path.join(dir, file));
    }

    // Minimal default: no layered health controller/routes at init
    await expect(access(path.join(dir, "src/controllers/health.controller.ts"))).rejects.toThrow();
    await expect(access(path.join(dir, "src/routes/health.routes.ts"))).rejects.toThrow();

    const rootJson = JSON.parse(await readFile(path.join(dir, "root.json"), "utf8")) as {
      language: string;
      framework: string;
      database: string;
      orm: string;
      architecture: string;
    };
    expect(rootJson).toMatchObject({
      language: "typescript",
      framework: "express",
      database: "postgresql",
      orm: "prisma",
      architecture: "minimal",
    });

    const server = await readFile(path.join(dir, "src/server.ts"), "utf8");
    expect(server.match(/\[ROOT-INJECT:ROUTES\]/g)?.length).toBe(1);
    expect(server).toContain('app.get("/health"');

    const schema = await readFile(path.join(dir, "src/schema.ts"), "utf8");
    expect(schema).toContain("Auth Schemas");
    expect(schema).toContain("Resource Schemas");
    expect(schema).toContain("Exports");

    const envExample = await readFile(path.join(dir, ".env.example"), "utf8");
    expect(envExample).toContain("DATABASE_URL=");
    expect(envExample).not.toMatch(/sk_live|password=secret123/);

    const pkg = await readFile(path.join(dir, "package.json"), "utf8");
    expect(pkg).toContain('"name": "demo-api"');
  });

  it("writes layered-mvc health routes when requested", async () => {
    const dir = await tempDir("root-struct-layered-");
    const answers = createInitAnswers("layered-api", {
      architecture: "layered-mvc",
      docker: false,
      testing: "none",
    });
    await structureizeExpressTs({ targetDir: dir, answers });
    await access(path.join(dir, "src/routes/health.routes.ts"));
    await access(path.join(dir, "src/controllers/health.controller.ts"));
    const server = await readFile(path.join(dir, "src/server.ts"), "utf8");
    expect(server).toContain("healthRouter");
  });

  it("omits docker compose when docker is false", async () => {
    const dir = await tempDir("root-struct-nodocker-");
    const answers = { ...createGoldenInitAnswers("no-docker"), docker: false, githubActions: true };
    await structureizeExpressTs({ targetDir: dir, answers });
    await expect(access(path.join(dir, "docker-compose.yml"))).rejects.toThrow();
    await access(path.join(dir, ".github/workflows/ci.yml"));
  });
});
