import { describe, expect, it } from "vitest";
import { SUPPORTED_COMBOS, isValidCombo, ormOptionsForDatabase } from "../src/init/stack-matrix.js";

describe("stack matrix", () => {
  it("lists all supported combos", () => {
    expect(SUPPORTED_COMBOS.length).toBe(10);
  });

  it("accepts valid pairs and rejects invalid ones", () => {
    expect(isValidCombo("postgresql", "prisma")).toBe(true);
    expect(isValidCombo("postgresql", "drizzle")).toBe(true);
    expect(isValidCombo("mysql", "mongoose")).toBe(false);
    expect(isValidCombo("mongodb", "drizzle")).toBe(false);
    expect(isValidCombo("none", "prisma")).toBe(false);
    expect(isValidCombo("none", "none")).toBe(true);
  });

  it("filters ORM options by database", () => {
    expect(ormOptionsForDatabase("postgresql")).toEqual(["prisma", "drizzle", "none"]);
    expect(ormOptionsForDatabase("mongodb")).toEqual(["mongoose", "prisma", "none"]);
    expect(ormOptionsForDatabase("none")).toEqual(["none"]);
  });
});
