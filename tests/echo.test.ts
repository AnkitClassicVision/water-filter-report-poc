import { describe, expect, it } from "vitest";
import { findUtilityByZip } from "../lib/echo";

const echoFirst = {
  Results: {
    Message: "Success",
    QueryRows: "1",
    QueryID: "1",
    Facilities: [
      {
        PWSId: "CO0118040",
        PWSName: "Parker Water & Sanitation District",
        CitiesServed: "Parker",
        StateCode: "CO",
        PopulationServedCount: 60000,
        PWSTypeCode: "CWS",
        PWSTypeDesc: "Community water system"
      }
    ]
  }
};

describe("findUtilityByZip", () => {
  it("maps a community system from mocked ECHO JSON", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify(echoFirst), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    const utility = await findUtilityByZip("80134", fetchImpl);
    expect(utility?.pwsId).toBe("CO0118040");
    expect(utility?.name).toMatch(/Parker/);
    expect(utility?.source).toBe("echo");
  });

  it("returns null when ECHO has zero rows", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ Results: { QueryRows: "0", QueryID: "2" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    const utility = await findUtilityByZip("00000", fetchImpl);
    expect(utility).toBeNull();
  });
});
