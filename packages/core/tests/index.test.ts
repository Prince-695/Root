import { describe, expect, it } from "vitest";
import {
  ROOT_COMMANDS,
  ROOT_ENGINE_NAME,
  ROOT_ENGINE_VERSION,
  ROOT_NPM_PACKAGE,
  getEngineBanner,
  isRootCommand,
} from "../src/index.js";

describe("@root/core", () => {
  it("exposes stable engine identity", () => {
    expect(ROOT_ENGINE_NAME).toBe("root");
    expect(ROOT_ENGINE_VERSION).toBe("0.1.0");
    expect(ROOT_NPM_PACKAGE).toBe("rooot");
  });

  it("lists the public command surface", () => {
    expect(ROOT_COMMANDS).toEqual([
      "init",
      "add",
      "remove",
      "list",
      "inspect",
      "diff",
      "doctor",
      "sync",
    ]);
  });

  it("builds a welcome banner", () => {
    expect(getEngineBanner()).toContain("root");
    expect(getEngineBanner()).toContain("0.1.0");
  });

  it("type-guards known commands", () => {
    expect(isRootCommand("init")).toBe(true);
    expect(isRootCommand("add")).toBe(true);
    expect(isRootCommand("list")).toBe(true);
    expect(isRootCommand("doctor")).toBe(true);
    expect(isRootCommand("unknown")).toBe(false);
  });
});
