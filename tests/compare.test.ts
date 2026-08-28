import { describe, expect, it } from "vitest";
import { compareResults } from "../lib/compare";

describe("compareResults", () => {
  it("counts exceedances and fold-over", () => {
    const out = compareResults([
      {
        name: "Arsenic",
        value: 2,
        unit: "ppb",
        healthGuideline: 0.004,
        healthGuidelineSource: "CA PHG",
        mcl: 10,
        healthEffects: ["cancer"],
        exposure: ["consumption"]
      },
      {
        name: "Nitrate",
        value: 0.05,
        unit: "ppm",
        healthGuideline: 0.14,
        healthGuidelineSource: "EWG",
        mcl: 10,
        healthEffects: ["developmental"],
        exposure: ["consumption"]
      }
    ]);
    expect(out.reportedCount).toBe(2);
    expect(out.overGuidelineCount).toBe(1);
    expect(out.exceedances[0].name).toBe("Arsenic");
    expect(out.exceedances[0].foldOver).toBeCloseTo(500);
  });

  it("ranks top 3 health groups by contaminant count", () => {
    const out = compareResults([
      {
        name: "PFOA",
        value: 5,
        unit: "ppt",
        healthGuideline: 0.09,
        healthGuidelineSource: "x",
        healthEffects: ["cancer", "developmental"],
        exposure: ["consumption"]
      },
      {
        name: "Arsenic",
        value: 2,
        unit: "ppb",
        healthGuideline: 0.004,
        healthGuidelineSource: "x",
        healthEffects: ["cancer"],
        exposure: ["consumption"]
      },
      {
        name: "Radium",
        value: 6,
        unit: "pCi/L",
        healthGuideline: 0.05,
        healthGuidelineSource: "x",
        healthEffects: ["cancer"],
        exposure: ["consumption"]
      }
    ]);
    expect(out.topHealthGroups[0].id).toBe("cancer");
    expect(out.topHealthGroups.length).toBeLessThanOrEqual(3);
  });
});
