import { describe, expect, it } from "vitest";
import { compareResults } from "../lib/compare";
import { getParkerFixture } from "../lib/report";

describe("Parker fixture", () => {
  it("produces a scoreboard from cited public rows", () => {
    const fixture = getParkerFixture();
    expect(fixture.utility.pwsId).toBe("CO0118040");
    expect(fixture.demoZip).toBe("80134");
    const out = compareResults(fixture.results);
    expect(out.reportedCount).toBe(fixture.results.length);
    expect(out.reportedCount).toBeGreaterThanOrEqual(1);
    expect(out.overGuidelineCount).toBeGreaterThan(0);
    const ids = out.topHealthGroups.map((g) => g.id);
    expect(ids.some((id) => ["cancer", "liver", "developmental"].includes(id))).toBe(true);
    expect(fixture.claimedFromCall).toMatch(/13/);
  });
});
