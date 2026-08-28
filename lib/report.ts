import parker from "../data/fixtures/parker-co0118040.json";
import { compareResults } from "./compare";
import { DISCLAIMER, zipOk } from "./disclaimer";
import { findEchoByPws } from "./echo";
import { quotePackages } from "./products";
import { templateNarrative, writeNarrative } from "./report-llm";
import { getSdwisSystem, searchSystemsByZip } from "./sdwis";
import type { OccurrenceFixture, ReportResponse, SearchHit, Utility } from "./types";

const PARKER = parker as OccurrenceFixture;

const FIXTURES_BY_PWS: Record<string, OccurrenceFixture> = {
  [PARKER.utility.pwsId]: PARKER
};

export function getParkerFixture(): OccurrenceFixture {
  return PARKER;
}

function pickDefault(hits: SearchHit[]): SearchHit | null {
  return hits[0] || null;
}

export async function searchZip(
  zip: string,
  opts?: { fetchImpl?: typeof fetch }
): Promise<{ zip: string; systems: SearchHit[] } | { error: string; status: number }> {
  if (!zipOk(zip)) return { error: "ZIP must be 5 digits.", status: 400 };
  try {
    const systems = await searchSystemsByZip(zip, opts?.fetchImpl);
    return { zip, systems };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "ZIP search failed.", status: 502 };
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

  const chosen =
    systems.find((s) => opts?.pwsId && s.pwsId === opts.pwsId) ||
    pickDefault(systems);

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

  const fixture = utility ? FIXTURES_BY_PWS[utility.pwsId] : FIXTURES_BY_PWS[PARKER.utility.pwsId];
  if (!utility && fixture) {
    utility = { ...fixture.utility, zip };
  }
  if (!utility) {
    return {
      error: "No public water system found for that ZIP in EPA SDWIS/ECHO.",
      status: 404
    };
  }

  const measured = fixture && fixture.utility.pwsId === utility.pwsId ? fixture.results : [];
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
  const dataQuality: ReportResponse["dataQuality"] = live ? "live" : measured.length ? "fixture" : "echo_partial";

  return {
    utility,
    compare,
    packages,
    narrative,
    disclaimer: DISCLAIMER,
    dataQuality,
    claimedFromCall: fixture && fixture.utility.pwsId === utility.pwsId ? fixture.claimedFromCall : undefined,
    epaLive: live,
    systems
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
