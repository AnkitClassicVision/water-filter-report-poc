import { describe, expect, it } from "vitest";
import { compareResults } from "../lib/compare";
import { quotePackages } from "../lib/products";
import { getParkerFixture } from "../lib/report";
import { narrativeHasInventedNumbers, writeNarrative } from "../lib/report-llm";

describe("writeNarrative", () => {
  it("returns null without an API key", async () => {
    const fixture = getParkerFixture();
    const compare = compareResults(fixture.results);
    const packages = quotePackages(compare);
    const out = await writeNarrative(
      { utility: fixture.utility, compare, packages },
      { apiKey: "" }
    );
    expect(out).toBeNull();
  });

  it("rejects invented numbers", () => {
    const fixture = getParkerFixture();
    const compare = compareResults(fixture.results);
    const packages = quotePackages(compare);
    expect(
      narrativeHasInventedNumbers("There are 999 studies linking these contaminants to cancer.", {
        utility: fixture.utility,
        compare,
        packages
      })
    ).toBe(true);
  });
});
