import { describe, expect, it } from "vitest";
import {
  ROOT_COMMANDS,
  ROOT_ENGINE_NAME,
  ROOT_ENGINE_VERSION,
  getEngineBanner,
  isRootCommand,
} from "../src/index.js";

describe("@root/core", () => {
  it("exposes stable engine identity", () => {
    expect(ROOT_ENGINE_NAME).toBe("root");
    expect(ROOT_ENGINE_VERSION).toBe("0.0.0");
  });

  it("lists the Phase 0 command surface", () => {
    expect(ROOT_COMMANDS).toEqual(["init", "add", "doctor"]);
  });

  it("builds a welcome banner", () => {
    expect(getEngineBanner()).toContain("root");
    expect(getEngineBanner()).toContain("0.0.0");
  });

  it("type-guards known commands", () => {
    expect(isRootCommand("init")).toBe(true);
    expect(isRootCommand("add")).toBe(true);
    expect(isRootCommand("doctor")).toBe(true);
    expect(isRootCommand("unknown")).toBe(false);
  });
});
