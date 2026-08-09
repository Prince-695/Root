import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addRoute } from "../src/add/route.js";
import { formatDoctorReport, runDoctor } from "../src/doctor/run-doctor.js";
import { createInitAnswers } from "../src/init/answers.js";
import { structureizeExpressTs } from "../src/init/structureizer.js";

describe("doctor (Phase 8)", () => {
  it("passes on a healthy project with a resource", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-doc-ok-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("doc-ok", { docker: false, database: "none", orm: "none" }),
    });
    await addRoute({
      projectRoot: dir,
      name: "post",
      skipGenerate: true,
      runCommand: async () => {},
    });

    const result = await runDoctor({ projectRoot: dir });
    expect(result.ok).toBe(true);
    expect(formatDoctorReport(result)).toMatch(/OK/);
  });

  it("fails when inject anchor is missing and points at server.ts", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-doc-anchor-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("doc-anchor", { docker: false, database: "none", orm: "none" }),
    });
    const serverPath = path.join(dir, "src/server.ts");
    const server = await readFile(serverPath, "utf8");
    await writeFile(serverPath, server.replace("[ROOT-INJECT:ROUTES]", "NO_ANCHOR"), "utf8");

    const result = await runDoctor({ projectRoot: dir });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "anchor-missing")).toBe(true);
    expect(formatDoctorReport(result)).toMatch(/server\.ts/);
  });

  it("fails on manifest drift when route file is removed", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-doc-drift-"));
    await structureizeExpressTs({
      targetDir: dir,
      answers: createInitAnswers("doc-drift", { docker: false, database: "none", orm: "none" }),
    });
    await addRoute({
      projectRoot: dir,
      name: "post",
      skipGenerate: true,
      runCommand: async () => {},
    });
    await rm(path.join(dir, "src/routes/post.routes.ts"));

    const result = await runDoctor({ projectRoot: dir });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "manifest-drift")).toBe(true);
  });
});
