import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createInitAnswers } from "../src/init/answers.js";
import { SUPPORTED_COMBOS } from "../src/init/stack-matrix.js";
import { structureizeExpressTs } from "../src/init/structureizer.js";

describe("Phase 3 generation matrix", () => {
  it("generates every supported combo with correct root.json + db client", async () => {
    for (const combo of SUPPORTED_COMBOS) {
      const dir = await mkdtemp(path.join(tmpdir(), `matrix-${combo.database}-${combo.orm}-`));
      const answers = createInitAnswers(`app-${combo.database}-${combo.orm}`, {
        database: combo.database,
        orm: combo.orm,
        docker: combo.database !== "none" && combo.database !== "sqlite",
        testing: "none",
        githubActions: false,
      });

      const result = await structureizeExpressTs({ targetDir: dir, answers });
      expect(result.filesWritten.length).toBeGreaterThan(5);

      const rootJson = JSON.parse(await readFile(path.join(dir, "root.json"), "utf8")) as {
        database: string;
        orm: string;
      };
      expect(rootJson.database).toBe(combo.database);
      expect(rootJson.orm).toBe(combo.orm);

      await access(path.join(dir, "src/db/client.ts"));

      const envExample = await readFile(path.join(dir, ".env.example"), "utf8");
      if (combo.database === "none") {
        expect(envExample).not.toContain("DATABASE_URL=");
      } else {
        expect(envExample).toContain("DATABASE_URL=");
      }

      if (combo.database !== "none" && combo.database !== "sqlite") {
        const compose = await readFile(path.join(dir, "docker-compose.yml"), "utf8");
        if (combo.database === "postgresql") expect(compose).toContain("postgres:");
        if (combo.database === "mysql") expect(compose).toContain("mysql:");
        if (combo.database === "mongodb") expect(compose).toContain("mongo:");
      }

      if (combo.orm === "prisma") {
        const schema = await readFile(path.join(dir, "prisma/schema.prisma"), "utf8");
        if (combo.database === "postgresql") expect(schema).toContain('provider = "postgresql"');
        if (combo.database === "mysql") expect(schema).toContain('provider = "mysql"');
        if (combo.database === "mongodb") expect(schema).toContain('provider = "mongodb"');
        if (combo.database === "sqlite") expect(schema).toContain('provider = "sqlite"');
      }
    }
  }, 60_000);

  it("blocks invalid combinations without writing files", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "matrix-invalid-"));
    const answers = createInitAnswers("bad", {
      database: "mysql",
      orm: "mongoose",
    });

    await expect(structureizeExpressTs({ targetDir: dir, answers })).rejects.toThrow(
      /Invalid database\/ORM/,
    );
    await expect(access(path.join(dir, "package.json"))).rejects.toThrow();
  });
});
