import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addRoute } from "../src/add/route.js";
import { runDoctor } from "../src/doctor/run-doctor.js";
import { planInterconnect } from "../src/engine/interconnect-planner.js";
import { loadModuleGraph } from "../src/engine/module-graph.js";
import { Transaction } from "../src/engine/transaction.js";
import { createInitAnswers } from "../src/init/answers.js";
import { structureizeExpressTs } from "../src/init/structureizer.js";
import { validateSyntax } from "../src/mutators/file-injector.js";

async function hashTree(dir: string): Promise<string> {
  const parts: string[] = [];
  async function walk(rel: string): Promise<void> {
    const abs = path.join(dir, rel);
    const entries = await readdir(abs, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === "node_modules" || entry.name === ".root.lock") continue;
      const child = path.join(rel, entry.name);
      if (entry.isDirectory()) {
        await walk(child);
      } else {
        const body = await readFile(path.join(dir, child));
        parts.push(`${child}:${createHash("sha256").update(body).digest("hex")}`);
      }
    }
  }
  await walk(".");
  return createHash("sha256").update(parts.join("\n")).digest("hex");
}

describe("reliability (Phase 8)", () => {
  it("dry-run add route leaves disk unchanged", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-dry-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("dry-rel", { docker: false, database: "none", orm: "none" }),
    });
    const before = await hashTree(dir);
    const result = await addRoute({
      projectRoot: dir,
      name: "widget",
      dryRun: true,
      skipGenerate: true,
      runCommand: async () => {},
    });
    expect(result.ops.length).toBeGreaterThan(0);
    expect(await hashTree(dir)).toBe(before);
  });

  it("scale: 25 resources inject cleanly under 2s average file work", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-scale-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("scale-api", { docker: false, database: "none", orm: "none" }),
    });

    const times: number[] = [];
    for (let i = 0; i < 25; i += 1) {
      const started = performance.now();
      await addRoute({
        projectRoot: dir,
        name: `item${i}`,
        skipGenerate: true,
        runCommand: async () => {},
        addedAt: "2026-08-09T00:00:00.000Z",
      });
      times.push(performance.now() - started);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    expect(avg).toBeLessThan(2000);

    const server = await readFile(path.join(dir, "src/server.ts"), "utf8");
    validateSyntax(server, "src/server.ts");
    expect(server.match(/app\.use\("\/api\/item/g)?.length).toBe(25);

    const doctor = await runDoctor({ projectRoot: dir });
    expect(doctor.ok).toBe(true);
  }, 120_000);

  it("chaos: injected failures leave zero partial states across 50 runs", async () => {
    for (let run = 0; run < 50; run += 1) {
      const dir = await mkdtemp(path.join(tmpdir(), `root-chaos-${run}-`));
      await structureizeExpressTs({
        targetDir: dir,
        answers: createInitAnswers(`chaos-${run}`, {
          docker: false,
          database: "none",
          orm: "none",
        }),
      });
      const before = await hashTree(dir);
      const graph = await loadModuleGraph(dir);
      const ops = planInterconnect({
        recipeId: "resource",
        graph,
        resourceName: "post",
        allowRunCommand: false,
      });
      expect(ops.length).toBeGreaterThan(2);
      const failAtIndex = 1 + (run % (ops.length - 1));
      const tx = new Transaction({
        projectRoot: dir,
        failAtIndex,
        runCommand: async () => {},
      });
      await expect(tx.apply(ops)).rejects.toThrow(/Injected failure/);
      expect(await hashTree(dir)).toBe(before);
    }
  }, 180_000);

  it("write lock refuses concurrent modify", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-lock-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("lock-api", { docker: false, database: "none", orm: "none" }),
    });
    await writeFile(
      path.join(dir, ".root.lock"),
      JSON.stringify({ pid: 1, createdAt: new Date().toISOString() }, null, 2),
      "utf8",
    );

    await expect(
      addRoute({
        projectRoot: dir,
        name: "post",
        skipGenerate: true,
        runCommand: async () => {},
      }),
    ).rejects.toMatchObject({ code: "locked" });
  });
});
