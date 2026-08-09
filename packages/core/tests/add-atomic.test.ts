import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AddAtomicError, addAtomic, addController, addModel } from "../src/add/atomic.js";
import { createInitAnswers } from "../src/init/answers.js";
import { structureizeExpressTs } from "../src/init/structureizer.js";

describe("atomic adds (Phase 7)", () => {
  it("add model on Prisma updates schema, prisma model, and manifest", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-model-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("model-api", { docker: false }),
    });

    const result = await addModel({
      projectRoot: dir,
      name: "comment",
      skipGenerate: true,
      runCommand: async () => {},
      addedAt: "2026-08-09T00:00:00.000Z",
    });

    expect(result.warnings.length).toBeGreaterThan(0);
    const schema = await readFile(path.join(dir, "src/schema.ts"), "utf8");
    expect(schema).toContain("commentSchema");

    const prisma = await readFile(path.join(dir, "prisma/schema.prisma"), "utf8");
    expect(prisma).toContain("model Comment");

    const root = JSON.parse(await readFile(path.join(dir, "root.json"), "utf8")) as {
      modules: Record<string, { type: string }>;
    };
    expect(root.modules.comment?.type).toBe("model");
  });

  it("add service / middleware / controller create files + manifest", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-atomic-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("atomic-api", {
        docker: false,
        database: "none",
        orm: "none",
      }),
    });

    await addAtomic({
      projectRoot: dir,
      kind: "service",
      name: "mailer",
      skipGenerate: true,
      runCommand: async () => {},
    });
    await access(path.join(dir, "src/services/mailer.service.ts"));

    await addAtomic({
      projectRoot: dir,
      kind: "middleware",
      name: "rate-limit",
      skipGenerate: true,
      runCommand: async () => {},
    });
    await access(path.join(dir, "src/middleware/rate-limit.ts"));

    const controller = await addController({
      projectRoot: dir,
      name: "invoice",
      skipGenerate: true,
      runCommand: async () => {},
    });
    expect(controller.warnings.some((w) => /no matching resource/i.test(w))).toBe(true);
    await access(path.join(dir, "src/controllers/invoice.controller.ts"));

    const root = JSON.parse(await readFile(path.join(dir, "root.json"), "utf8")) as {
      modules: Record<string, { type: string }>;
    };
    expect(root.modules.mailer?.type).toBe("service");
    expect(root.modules["rate-limit"]?.type).toBe("middleware");
    expect(root.modules.invoice?.type).toBe("controller");
  });

  it("rejects invalid names and duplicates", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-atomic-val-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("val-api", { docker: false, database: "none", orm: "none" }),
    });

    await expect(
      addAtomic({
        projectRoot: dir,
        kind: "service",
        name: "9bad",
        skipGenerate: true,
        runCommand: async () => {},
      }),
    ).rejects.toMatchObject({ code: "invalid-name" });

    await addAtomic({
      projectRoot: dir,
      kind: "service",
      name: "mailer",
      skipGenerate: true,
      runCommand: async () => {},
    });

    await expect(
      addAtomic({
        projectRoot: dir,
        kind: "service",
        name: "mailer",
        skipGenerate: true,
        runCommand: async () => {},
      }),
    ).rejects.toBeInstanceOf(AddAtomicError);
  });
});
