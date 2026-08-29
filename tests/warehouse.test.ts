import { describe, expect, it } from "vitest";
import { pwsIdsForZip, warehouseResults } from "../lib/warehouse";

describe("EPA warehouse", () => {
  it("maps Parker ZIP to CO0118040", () => {
    expect(pwsIdsForZip("80134")).toContain("CO0118040");
  });

  it("returns EPA occurrence for NYC 10001", () => {
    const ids = pwsIdsForZip("10001");
    expect(ids.length).toBeGreaterThan(0);
    const rows = warehouseResults(ids[0]);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.sourceUrl?.includes("epa.gov"))).toBe(true);
  });

  it("has SYR4 radium/TTHM/HAA for Parker", () => {
    const rows = warehouseResults("CO0118040");
    const names = rows.map((r) => r.name);
    expect(names.some((n) => n.includes("Radium"))).toBe(true);
    expect(names.some((n) => n.includes("trihalomethane"))).toBe(true);
    expect(names.some((n) => n.includes("HAA5"))).toBe(true);
  });
});
