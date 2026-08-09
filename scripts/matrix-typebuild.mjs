#!/usr/bin/env node
import { spawn } from "node:child_process";
/**
 * Phase 3 gate: generate every supported DB×ORM combo and run pnpm build.
 * Usage: node scripts/matrix-typebuild.mjs
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SUPPORTED_COMBOS,
  createInitAnswers,
  structureizeExpressTs,
} from "../packages/core/dist/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
    child.on("error", reject);
  });
}

async function buildCombo(combo) {
  const dir = await mkdtemp(path.join(tmpdir(), `tb-${combo.database}-${combo.orm}-`));
  const name = `tb-${combo.database}-${combo.orm}`.replace(/[^a-z0-9-]/g, "-");
  const answers = createInitAnswers(name, {
    database: combo.database,
    orm: combo.orm,
    docker: false,
    testing: "none",
    githubActions: false,
  });

  console.log(`\n=== ${combo.database} + ${combo.orm} ===`);
  await structureizeExpressTs({ targetDir: dir, answers });
  await run("pnpm", ["install"], dir);
  if (combo.orm === "prisma") {
    await run("pnpm", ["exec", "prisma", "generate"], dir);
  }
  await run("pnpm", ["build"], dir);
  await rm(dir, { recursive: true, force: true });
  console.log(`OK ${combo.database} + ${combo.orm}`);
}

async function main() {
  // Ensure core is built
  await run("pnpm", ["--filter", "@root/core", "build"], root);

  for (const combo of SUPPORTED_COMBOS) {
    await buildCombo(combo);
  }
  console.log(`\nAll ${SUPPORTED_COMBOS.length} combos typebuilt successfully.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
