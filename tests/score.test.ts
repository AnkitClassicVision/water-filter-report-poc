import { describe, expect, it } from "vitest";
import { compareResults } from "../lib/compare";
import { getParkerFixture } from "../lib/report";
import { scoreWaterQuality } from "../lib/score";

describe("scoreWaterQuality", () => {
  it("scores a clean EPA-only system near 100", () => {
    const out = scoreWaterQuality("99999", "XX0000000", "Clean PWS", {
      reportedCount: 0,
      overGuidelineCount: 0,
      exceedances: [],
      withinGuideline: [],
      topHealthGroups: []
    }, undefined, {
      healthFlag: "No",
      seriousViolator: "No",
      activity: "A",
      contaminantsInViolation3yr: [],
      currentViolationContaminants: [],
      echoQuery: "",
      sources: []
    });
    expect(out.quality).toBe(100);
    expect(out.band).toBe("good");
    expect(out.basis).toBe("epa-only");
  });

  it("scores Parker well below 100 because of EWG exceedances", () => {
    const fixture = getParkerFixture();
    const compare = compareResults(fixture.results);
    const out = scoreWaterQuality("80134", fixture.utility.pwsId, fixture.utility.name, compare, 38, {
      healthFlag: "No",
      seriousViolator: "No",
      activity: "A",
      contaminantsInViolation3yr: [
        { code: "1008", name: "Chlorine dioxide" },
        { code: "1009", name: "Chlorite" }
      ],
      currentViolationContaminants: [],
      echoQuery: "",
      sources: []
    });
    expect(out.quality).toBeGreaterThanOrEqual(0);
    expect(out.quality).toBeLessThan(80);
    expect(out.band).not.toBe("good");
    expect(out.headline).toMatch(/80134/);
    expect(out.drivers.some((d) => /EWG/i.test(d))).toBe(true);
  });
});
