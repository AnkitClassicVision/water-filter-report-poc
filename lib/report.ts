import parker from "../data/fixtures/parker-co0118040.json";
import { compareResults } from "./compare";
import { DISCLAIMER, zipOk } from "./disclaimer";
import { findUtilityByZip } from "./echo";
import { quotePackages } from "./products";
import { templateNarrative, writeNarrative } from "./report-llm";
import type { OccurrenceFixture, ReportResponse, Utility } from "./types";

const PARKER = parker as OccurrenceFixture;

const FIXTURES: Record<string, OccurrenceFixture> = {
  [PARKER.demoZip]: PARKER,
  [PARKER.utility.pwsId]: PARKER
};

export function getParkerFixture(): OccurrenceFixture {
  return PARKER;
}

export async function buildReport(
  zip: string,
  opts?: { fetchImpl?: typeof fetch }
): Promise<ReportResponse | { error: string; status: number }> {
  if (!zipOk(zip)) {
    return { error: "ZIP must be 5 digits.", status: 400 };
  }

  const fixture = FIXTURES[zip];
  let utility: Utility | null = fixture?.utility ?? null;
  let dataQuality: ReportResponse["dataQuality"] = fixture ? "fixture" : "echo_partial";

  if (!utility) {
    try {
      utility = await findUtilityByZip(zip, opts?.fetchImpl);
      if (utility) dataQuality = "echo_partial";
    } catch {
      utility = null;
    }
  }

  if (!utility && fixture) utility = fixture.utility;
  if (!utility) {
    return {
      error: "No public water system found for that ZIP in EPA ECHO, and no local occurrence fixture exists.",
      status: 404
    };
  }

  const occurrence = fixture ?? FIXTURES[utility.pwsId];
  const results = occurrence?.results ?? [];
  const compare = compareResults(results);
  const packages = quotePackages(compare);
  let narrative = templateNarrative({ utility, compare, packages });
  if (!process.env.VITEST) {
    const llm = await writeNarrative({ utility, compare, packages });
    if (llm) narrative = llm;
  }

  return {
    utility: { ...utility, zip },
    compare,
    packages,
    narrative,
    disclaimer: DISCLAIMER,
    dataQuality: occurrence ? (fixture ? "fixture" : dataQuality) : "echo_partial",
    claimedFromCall: occurrence?.claimedFromCall
  };
}

const hits = new Map<string, { n: number; t: number }>();

export function rateLimit(ip: string, limit = 10, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.t > windowMs) {
    hits.set(ip, { n: 1, t: now });
    return true;
  }
  if (row.n >= limit) return false;
  row.n += 1;
  return true;
}
