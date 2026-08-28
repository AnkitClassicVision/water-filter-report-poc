import { describe, expect, it } from "vitest";
import { buildReport, searchZip } from "../lib/report";

const parkerEcho = {
  PWSId: "CO0118040",
  PWSName: "PARKER WSD",
  StateCode: "CO",
  PopulationServedCount: "75949",
  PWSTypeCode: "CWS",
  PWSActivityCode: "A",
  SeriousViolator: "No",
  HealthFlag: "No",
  SDWAContaminantsInViol3yr: "1008=Chlorine dioxide; 1009=Chlorite; 3014=E. COLI"
};

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

const fetchImpl: typeof fetch = async (input) => {
  const url = String(input);
  if (url.includes("/api/v1/zip/80134")) {
    return json({
      systems: [
        {
          pwsid: "CO0118040",
          name: "Parker Wsd",
          population: 75949,
          type: "Community Water System",
          violations: 19,
          health_based: 0
        }
      ]
    });
  }
  if (url.includes("/api/v1/system/CO0118040")) {
    return json({
      pwsid: "CO0118040",
      name: "Parker Wsd",
      population: 75949,
      city: "Parker",
      state: "CO",
      type: "Community Water System",
      zip: "80134",
      health_based: 0,
      violations: 19
    });
  }
  if (url.includes("sdw_rest_services.get_systems")) {
    return json({
      Results: { QueryRows: "1", QueryID: "1", WaterSystems: [parkerEcho] }
    });
  }
  return new Response("nope", { status: 404 });
};

describe("searchZip", () => {
  it("returns live SDWIS hits for a ZIP", async () => {
    const out = await searchZip("80134", { fetchImpl });
    if ("error" in out) throw new Error(out.error);
    expect(out.systems[0].pwsId).toBe("CO0118040");
  });

  it("rejects a bad ZIP", async () => {
    const out = await searchZip("8013");
    expect("error" in out && out.status === 400).toBe(true);
  });
});

describe("buildReport", () => {
  it("returns 400 for a bad ZIP", async () => {
    const out = await buildReport("8013");
    expect("error" in out && out.status === 400).toBe(true);
  });

  it("returns live Parker report for 80134", async () => {
    const out = await buildReport("80134", { fetchImpl });
    if ("error" in out) throw new Error(out.error);
    expect(out.utility.pwsId).toBe("CO0118040");
    expect(out.dataQuality).toBe("live");
    expect(out.epaLive?.contaminantsInViolation3yr.map((c) => c.name)).toContain("Chlorite");
    expect(out.packages).toHaveLength(3);
    expect(out.packages[0].priceUsd).toBe(198.8);
    expect(out.compare.reportedCount).toBeGreaterThan(0);
  });
});
