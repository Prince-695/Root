import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createGoldenInitAnswers } from "../src/init/answers.js";
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
      "src/routes/health.routes.ts",
      "src/controllers/health.controller.ts",
      "src/middleware/errorHandler.ts",
      "vitest.config.ts",
      "tests/health.test.ts",
    ];

    for (const file of required) {
      await access(path.join(dir, file));
    }

    const rootJson = JSON.parse(await readFile(path.join(dir, "root.json"), "utf8")) as {
      language: string;
      framework: string;
      database: string;
      orm: string;
    };
    expect(rootJson).toMatchObject({
      language: "typescript",
      framework: "express",
      database: "postgresql",
      orm: "prisma",
    });

    const server = await readFile(path.join(dir, "src/server.ts"), "utf8");
    expect(server.match(/\[ROOT-INJECT:ROUTES\]/g)?.length).toBe(1);

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

  it("omits docker compose when docker is false", async () => {
    const dir = await tempDir("root-struct-nodocker-");
    const answers = { ...createGoldenInitAnswers("no-docker"), docker: false, githubActions: true };
    await structureizeExpressTs({ targetDir: dir, answers });
    await expect(access(path.join(dir, "docker-compose.yml"))).rejects.toThrow();
    await access(path.join(dir, ".github/workflows/ci.yml"));
  });
});
