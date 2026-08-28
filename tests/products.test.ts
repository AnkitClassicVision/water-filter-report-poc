import { describe, expect, it } from "vitest";
import { compareResults } from "../lib/compare";
import { quotePackages } from "../lib/products";
import { getParkerFixture } from "../lib/report";

describe("quotePackages", () => {
  it("returns real-price base, gold, and platinum", () => {
    const compare = compareResults(getParkerFixture().results);
    const pkgs = quotePackages(compare);
    expect(pkgs.map((p) => p.id)).toEqual(["base", "gold", "platinum"]);
    expect(pkgs[0].priceUsd).toBe(198.8);
    expect(pkgs[1].priceUsd).toBe(240.38);
    expect(pkgs[2].priceUsd).toBe(1197.8);
    expect(pkgs.every((p) => p.items.every((i) => i.placeholder === false))).toBe(true);
    expect(pkgs.every((p) => p.items.every((i) => Boolean(i.buyUrl)))).toBe(true);
  });
});
