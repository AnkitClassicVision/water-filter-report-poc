import { describe, expect, it } from "vitest";
import { buildPathways, foldLabel } from "../lib/assessment";
import { compareResults } from "../lib/compare";
import { getParkerFixture } from "../lib/report";

describe("Parker fixture", () => {
  it("matches the v5 PDF / EWG 13-over scoreboard", () => {
    const fixture = getParkerFixture();
    expect(fixture.utility.pwsId).toBe("CO0118040");
    expect(fixture.detectedCount).toBe(38);
    const out = compareResults(fixture.results);
    expect(out.overGuidelineCount).toBe(13);
    const haa9 = out.exceedances.find((r) => r.name.includes("HAA9"));
    expect(haa9).toBeTruthy();
    expect(Math.round(haa9!.foldOver)).toBe(146);
    const arsenic = out.exceedances.find((r) => r.name === "Arsenic");
    expect(Math.round(arsenic!.foldOver)).toBe(52);
    const pathways = buildPathways(out);
    expect(pathways[0].id).toBe("cancer");
    expect(foldLabel(146)).toBe("146x");
  });
});
