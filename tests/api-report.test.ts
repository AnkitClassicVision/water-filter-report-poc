import { describe, expect, it } from "vitest";
import { buildReport } from "../lib/report";

describe("buildReport", () => {
  it("returns 400 for a bad ZIP", async () => {
    const out = await buildReport("8013");
    expect("error" in out && out.status === 400).toBe(true);
  });

  it("returns Parker fixture JSON for 80134", async () => {
    const out = await buildReport("80134");
    if ("error" in out) throw new Error(out.error);
    expect(out.utility.pwsId).toBe("CO0118040");
    expect(out.compare.reportedCount).toBeGreaterThan(0);
    expect(out.packages).toHaveLength(3);
    expect(out.disclaimer.toLowerCase()).toMatch(/not medical advice/);
    expect(out.dataQuality).toBe("fixture");
    expect(out.narrative?.headline).toBeTruthy();
  });
});
