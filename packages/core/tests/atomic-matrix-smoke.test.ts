import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addAtomic } from "../src/add/atomic.js";
import { createInitAnswers } from "../src/init/answers.js";
import { structureizeExpressTs } from "../src/init/structureizer.js";

async function run(cwd: string, command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "pipe",
      env: { ...process.env, CI: "true" },
    });
    let err = "";
    child.stderr.on("data", (c) => {
      err += String(c);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} => ${code}\n${err}`));
    });
  });
}

const COMBOS = [
  { database: "postgresql" as const, orm: "prisma" as const },
  { database: "mongodb" as const, orm: "mongoose" as const },
  { database: "none" as const, orm: "none" as const },
];

describe("atomic adds matrix smoke (Phase 7.7)", () => {
  it("typebuilds at least 3 ORM combos after model+service adds", async () => {
    for (const combo of COMBOS) {
      const dir = await mkdtemp(path.join(tmpdir(), `root-atm-${combo.orm}-`));
      try {
        await structureizeExpressTs({
          targetDir: dir,
          answers: createInitAnswers(`atm-${combo.orm}`, {
            database: combo.database,
            orm: combo.orm,
            docker: false,
            testing: "none",
          }),
        });
        await addAtomic({
          projectRoot: dir,
          kind: "model",
          name: "note",
          skipGenerate: true,
          runCommand: async () => {},
        });
        await addAtomic({
          projectRoot: dir,
          kind: "service",
          name: "notifier",
          skipGenerate: true,
          runCommand: async () => {},
        });
        await run(dir, "pnpm", ["install"]);
        if (combo.orm === "prisma") {
          await run(dir, "pnpm", ["exec", "prisma", "generate"]);
        }
        await run(dir, "pnpm", ["build"]);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    }
    expect(COMBOS).toHaveLength(3);
  }, 300_000);
});
