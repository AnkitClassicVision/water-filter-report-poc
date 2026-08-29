import parker from "../data/fixtures/parker-co0118040.json";
import { compareResults } from "./compare";
import { DISCLAIMER, zipOk } from "./disclaimer";
import { findEchoByPws } from "./echo";
import { quotePackages } from "./products";
import { templateNarrative, writeNarrative } from "./report-llm";
import { getSdwisSystem, searchSystemsByZip } from "./sdwis";
import type { OccurrenceFixture, ReportResponse, SearchHit, Utility } from "./types";
import { pwsIdsForZip, warehouseName, warehousePeriod, warehouseResults } from "./warehouse";

const PARKER = parker as OccurrenceFixture;

const FIXTURES_BY_PWS: Record<string, OccurrenceFixture> = {
  [PARKER.utility.pwsId]: PARKER
};

export function getParkerFixture(): OccurrenceFixture {
  return PARKER;
}

function hitsFromWarehouse(zip: string): SearchHit[] {
  return pwsIdsForZip(zip).map((pwsId) => ({
    pwsId,
    name: warehouseName(pwsId) || pwsId,
    type: "UCMR 5 PWS",
    population: 0,
    zip,
    healthBasedViolations: 0,
    totalViolations: 0,
    source: "ucmr5"
  }));
}

export async function searchZip(
  zip: string,
  opts?: { fetchImpl?: typeof fetch }
): Promise<{ zip: string; systems: SearchHit[] } | { error: string; status: number }> {
  if (!zipOk(zip)) return { error: "ZIP must be 5 digits.", status: 400 };
  try {
    const systems = await searchSystemsByZip(zip, opts?.fetchImpl);
    if (systems.length) return { zip, systems };
    return { zip, systems: hitsFromWarehouse(zip) };
  } catch {
    const fallback = hitsFromWarehouse(zip);
    if (fallback.length) return { zip, systems: fallback };
    return { error: "ZIP search failed.", status: 502 };
  }
}

export async function buildReport(
  zip: string,
  opts?: { fetchImpl?: typeof fetch; pwsId?: string }
): Promise<ReportResponse | { error: string; status: number }> {
  if (!zipOk(zip)) {
    return { error: "ZIP must be 5 digits.", status: 400 };
  }

  const fetchImpl = opts?.fetchImpl;
  let systems: SearchHit[] = [];
  try {
    systems = await searchSystemsByZip(zip, fetchImpl);
  } catch {
    systems = [];
  }
  if (!systems.length) systems = hitsFromWarehouse(zip);
  else {
    const have = new Set(systems.map((s) => s.pwsId));
    for (const hit of hitsFromWarehouse(zip)) {
      if (!have.has(hit.pwsId)) systems.push(hit);
    }
  }

  const ranked = [...systems].sort((a, b) => {
    const aw = warehouseResults(a.pwsId).length + (FIXTURES_BY_PWS[a.pwsId] ? 100 : 0);
    const bw = warehouseResults(b.pwsId).length + (FIXTURES_BY_PWS[b.pwsId] ? 100 : 0);
    return bw - aw;
  });
  const chosen =
    systems.find((s) => opts?.pwsId && s.pwsId === opts.pwsId) || ranked[0] || null;

  const sdwis = chosen
    ? await getSdwisSystem(chosen.pwsId, fetchImpl).catch(() => null)
    : null;

  let utility: Utility | null = chosen
    ? {
        pwsId: chosen.pwsId,
        name: sdwis?.name || chosen.name,
        city: sdwis?.city || chosen.city,
        state: sdwis?.state || chosen.state,
        zip,
        populationServed: sdwis?.population || chosen.population,
        source: "sdwis"
      }
    : null;

  const echo =
    utility
      ? await findEchoByPws(utility.pwsId, utility.name, zip, fetchImpl).catch(() => null)
      : null;

  if (echo) {
    utility = {
      ...echo.utility,
      city: utility?.city || echo.utility.city,
      zip,
      source: "echo"
    };
  }

  const fixtureMatch = utility ? FIXTURES_BY_PWS[utility.pwsId] : undefined;
  if (!utility && fixtureMatch) {
    utility = { ...fixtureMatch.utility, zip };
  }
  if (!utility) {
    return {
      error: "No public water system found for that ZIP in EPA SDWIS, ECHO, or UCMR 5 ZIP files.",
      status: 404
    };
  }
  const warehouse = warehouseResults(utility.pwsId);
  const measured = fixtureMatch ? fixtureMatch.results : warehouse;
  const compare = compareResults(measured);
  const extraNames = [
    ...(echo?.live.contaminantsInViolation3yr.map((c) => c.name) || []),
    ...(echo?.live.currentViolationContaminants.map((c) => c.name) || [])
  ];
  const packages = quotePackages(compare, extraNames);
  let narrative = templateNarrative({ utility, compare, packages });
  if (!process.env.VITEST) {
    const llm = await writeNarrative({ utility, compare, packages });
    if (llm) narrative = llm;
  }

  const live = echo?.live;
  const dataQuality: ReportResponse["dataQuality"] = live
    ? "live"
    : measured.length
      ? fixtureMatch
        ? "fixture"
        : "live"
      : "echo_partial";

  return {
    utility,
    compare,
    packages,
    narrative,
    disclaimer: DISCLAIMER,
    dataQuality,
    claimedFromCall: fixtureMatch ? fixtureMatch.claimedFromCall : undefined,
    epaLive: live,
    systems,
    period: fixtureMatch?.period || warehousePeriod(utility.pwsId),
    detectedCount: fixtureMatch?.detectedCount || measured.length,
    guidelineSet: fixtureMatch
      ? "EWG health guidelines (stricter than EPA MCLs)"
      : "Health guidelines vs EPA UCMR 5 (2023-2025) and SYR4 (2012-2019) warehouse files. Not a live ECHO concentration API."
  };
}

const hits = new Map<string, { n: number; t: number }>();

export function rateLimit(ip: string, limit = 20, windowMs = 10 * 60 * 1000): boolean {
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
