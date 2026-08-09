import { describe, expect, it } from "vitest";
import { createProgram } from "../src/cli.js";

describe("@root/cli", () => {
  it("registers init, add, and doctor commands", () => {
    const program = createProgram();
    const names = program.commands.map((command) => command.name());
    expect(names).toEqual(expect.arrayContaining(["init", "add", "doctor"]));
  });

  it("exposes global flags used by later phases", () => {
    const program = createProgram();
    const options = program.options.map((option) => option.long);
    expect(options).toEqual(expect.arrayContaining(["--verbose", "--dry-run", "--yes"]));
  });

  it("prints help mentioning the primary commands", async () => {
    const program = createProgram();
    const help = program.helpInformation();
    expect(help).toContain("init");
    expect(help).toContain("add");
    expect(help).toContain("doctor");
  });
});
