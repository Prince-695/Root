import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { addAuth } from "../src/add/auth.js";
import { addRoute } from "../src/add/route.js";
import { loadRootJson } from "../src/config/root-json.js";
import { formatDoctorReport, runDoctor } from "../src/doctor/run-doctor.js";
import { createInitAnswers } from "../src/init/answers.js";
import { structureizeExpressJs } from "../src/init/structureizer.js";

const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function tempProject(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "root-express-js-"));
  dirs.push(dir);
  return dir;
}

describe("express-js provider (Phase 10.1)", () => {
  it("init + add auth + add route + doctor (orm none)", async () => {
    const targetDir = await tempProject();
    const answers = createInitAnswers("js-api", {
      language: "javascript",
      database: "none",
      orm: "none",
      docker: false,
      testing: "none",
    });

    const result = await structureizeExpressJs({ targetDir, answers });
    expect(result.filesWritten).toContain("src/server.js");
    expect(result.filesWritten).toContain("src/schema.js");
    expect(result.filesWritten).not.toContain("tsconfig.json");

    await access(path.join(targetDir, "src/server.js"));
    const server = await readFile(path.join(targetDir, "src/server.js"), "utf8");
    expect(server).toContain("[ROOT-INJECT:ROUTES]");

    const config = await loadRootJson(targetDir);
    expect(config.language).toBe("javascript");
    expect(config.aliases.server).toBe("src/server.js");
    expect(config.aliases.schema).toBe("src/schema.js");

    await addAuth({
      projectRoot: targetDir,
      skipGenerate: true,
      runCommand: async () => {},
    });
    await access(path.join(targetDir, "src/middleware/auth.js"));
    await access(path.join(targetDir, "src/routes/auth.routes.js"));

    await addRoute({
      projectRoot: targetDir,
      name: "post",
      skipGenerate: true,
      runCommand: async () => {},
    });
    await access(path.join(targetDir, "src/routes/post.routes.js"));
    await access(path.join(targetDir, "src/controllers/post.controller.js"));
    await access(path.join(targetDir, "src/services/post.service.js"));

    const postRoutes = await readFile(path.join(targetDir, "src/routes/post.routes.js"), "utf8");
    expect(postRoutes).toContain("authenticate");
    expect(postRoutes).not.toContain("import type");

    const doctor = await runDoctor({ projectRoot: targetDir });
    expect(doctor.ok, formatDoctorReport(doctor)).toBe(true);
  });
});
