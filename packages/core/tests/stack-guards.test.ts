import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addAuth } from "../src/add/auth.js";
import { addRoute } from "../src/add/route.js";
import { createInitAnswers } from "../src/init/answers.js";
import { structureizeFlask } from "../src/providers/non-node.js";

describe("non-Node stack guards", () => {
  it("refuses add auth on Flask (no TS/JS / package.json pollution)", async () => {
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

    await expect(addAuth({ projectRoot: dir, skipGenerate: true })).rejects.toThrow(
      /Cannot add "auth".*python\/flask/i,
    );
  });

  it("refuses add resource on Flask", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "root-flask-res-"));
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

    await expect(addRoute({ projectRoot: dir, name: "post", skipGenerate: true })).rejects.toThrow(
      /Cannot add "resource"/i,
    );
  });
});
