import type { SearchHit } from "./types";

export type SdwisSystem = {
  pwsid: string;
  name: string;
  population: number;
  source?: string;
  type: string;
  violations: number;
  health_based: number;
  city?: string;
  state?: string;
  zip?: string;
  activity?: string;
  url?: string;
};

function asHit(row: SdwisSystem, zip: string): SearchHit {
  return {
    pwsId: row.pwsid,
    name: row.name,
    type: row.type || "Unknown",
    population: Number(row.population || 0),
    city: row.city,
    state: row.state,
    zip: row.zip || zip,
    healthBasedViolations: Number(row.health_based || 0),
    totalViolations: Number(row.violations || 0),
    source: "sdwis"
  };
}

export async function searchSystemsByZip(
  zip: string,
  fetchImpl: typeof fetch = fetch
): Promise<SearchHit[]> {
  const res = await fetchImpl(`https://waterviolations.org/api/v1/zip/${zip}`, {
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`SDWIS ZIP search HTTP ${res.status}`);
  const data = (await res.json()) as { systems?: SdwisSystem[] };
  const hits = (data.systems || []).map((row) => asHit(row, zip));
  return hits.sort((a, b) => {
    const ac = a.type.toLowerCase().includes("community") ? 1 : 0;
    const bc = b.type.toLowerCase().includes("community") ? 1 : 0;
    if (bc !== ac) return bc - ac;
    return b.population - a.population;
  });
}

export async function getSdwisSystem(
  pwsId: string,
  fetchImpl: typeof fetch = fetch
): Promise<SdwisSystem | null> {
  const res = await fetchImpl(`https://waterviolations.org/api/v1/system/${pwsId}`, {
    headers: { Accept: "application/json" }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`SDWIS system HTTP ${res.status}`);
  return (await res.json()) as SdwisSystem;
}
