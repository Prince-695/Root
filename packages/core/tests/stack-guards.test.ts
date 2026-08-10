import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addAuth } from "../src/add/auth.js";
import { addCapability } from "../src/add/capability.js";
import { addRoute } from "../src/add/route.js";
import { runDoctor } from "../src/doctor/run-doctor.js";
import { createInitAnswers } from "../src/init/answers.js";
import { assertNoNodeProjectFiles } from "../src/providers/language-agnostic.js";
import {
  structureizeFastapi,
  structureizeFlask,
  structureizeGoHttp,
} from "../src/providers/non-node.js";

describe("non-Node stack guards", () => {
  it("allows add auth + resource on Flask and keeps language purity", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-flask-auth-"));
    await structureizeFlask({
      targetDir: dir,
      answers: createInitAnswers("flask-api", {
        language: "python",
        framework: "flask",
        database: "none",
        orm: "none",
        packageManager: "pip",
        validation: "none",
        testing: "pytest",
        docker: false,
      }),
    });

    await addAuth({ projectRoot: dir, skipGenerate: true });
    await addRoute({ projectRoot: dir, name: "post", skipGenerate: true });

    const app = await readFile(path.join(dir, "app.py"), "utf8");
    expect(app).toMatch(/register_blueprint\(auth_bp/);
    expect(app).toMatch(/url_prefix="\/api\/post"/);
    await expect(assertNoNodeProjectFiles(dir)).resolves.toBeUndefined();

    const doctor = await runDoctor({ projectRoot: dir });
    expect(doctor.ok).toBe(true);
  });

  it("refuses Node-only cache capability on Flask", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-flask-cache-"));
    await structureizeFlask({
      targetDir: dir,
      answers: createInitAnswers("flask-api", {
        language: "python",
        framework: "flask",
        database: "none",
        orm: "none",
        packageManager: "pip",
        validation: "none",
        testing: "pytest",
        docker: false,
      }),
    });

    await expect(addCapability({ projectRoot: dir, kind: "cache" })).rejects.toThrow(
      /Cannot add "cache"/i,
    );
  });
});

describe("FastAPI auth + resource", () => {
  it("plans native files without package.json", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-fastapi-e2e-"));
    await structureizeFastapi({
      targetDir: dir,
      answers: createInitAnswers("py-api", {
        language: "python",
        framework: "fastapi",
        database: "none",
        orm: "none",
        packageManager: "pip",
        validation: "pydantic",
        testing: "pytest",
        docker: false,
      }),
    });

    await addAuth({ projectRoot: dir, skipGenerate: true });
    await addRoute({ projectRoot: dir, name: "post", skipGenerate: true });

    const main = await readFile(path.join(dir, "app/main.py"), "utf8");
    expect(main).toMatch(/include_router\(auth_router\.router/);
    expect(main).toMatch(/prefix="\/api\/post"/);
    expect(await readFile(path.join(dir, "requirements.txt"), "utf8")).toMatch(/PyJWT/);
    await expect(assertNoNodeProjectFiles(dir)).resolves.toBeUndefined();

    const doctor = await runDoctor({ projectRoot: dir });
    expect(doctor.ok).toBe(true);
  });
});

describe("Go auth + resource", () => {
  it("registers handlers and go.mod deps without Node files", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-go-e2e-"));
    await structureizeGoHttp({
      targetDir: dir,
      answers: createInitAnswers("go-api", {
        language: "go",
        framework: "go-http",
        database: "none",
        orm: "none",
        packageManager: "go-mod",
        validation: "none",
        testing: "none",
        docker: false,
      }),
    });

    await addAuth({ projectRoot: dir, skipGenerate: true });
    await addRoute({ projectRoot: dir, name: "post", skipGenerate: true });

    const main = await readFile(path.join(dir, "main.go"), "utf8");
    expect(main).toMatch(/auth\.Register\(mux\)/);
    expect(main).toMatch(/post\.Register\(mux\)/);
    expect(main).toMatch(/internal\/auth/);
    const mod = await readFile(path.join(dir, "go.mod"), "utf8");
    expect(mod).toMatch(/github.com\/golang-jwt\/jwt/);
    await expect(assertNoNodeProjectFiles(dir)).resolves.toBeUndefined();

    const doctor = await runDoctor({ projectRoot: dir });
    expect(doctor.ok).toBe(true);
  });
});
