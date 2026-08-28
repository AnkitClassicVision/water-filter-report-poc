import { describe, expect, it } from "vitest";
import { compareResults } from "../lib/compare";
import { quotePackages } from "../lib/products";
import { getParkerFixture } from "../lib/report";

describe("quotePackages", () => {
  it("returns base, gold, and platinum", () => {
    const compare = compareResults(getParkerFixture().results);
    const pkgs = quotePackages(compare);
    expect(pkgs.map((p) => p.id)).toEqual(["base", "gold", "platinum"]);
    expect(pkgs[2].priceUsd).toBeGreaterThan(pkgs[0].priceUsd);
    expect(pkgs[0].items.some((i) => i.slot === "undersink_ro")).toBe(true);
    expect(pkgs[1].items.some((i) => i.slot === "shower_carbon")).toBe(true);
    expect(pkgs[2].items.some((i) => i.slot === "whole_home")).toBe(true);
    expect(pkgs.every((p) => p.items.every((i) => i.placeholder))).toBe(true);
  });
});
