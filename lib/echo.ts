import type { EpaLive, Utility } from "./types";

const ECHO_BASE = "https://echodata.epa.gov/echo/sdw_rest_services";
const QCOLS = "1,2,3,4,5,10,14,15,21,22,42,43,52,53,54,55,65";

export type EchoSystemRow = {
  PWSId?: string;
  PWSID?: string;
  PWSName?: string;
  CitiesServed?: string;
  StateCode?: string;
  ZipCodesServed?: string;
  PopulationServedCount?: number | string;
  PWSTypeCode?: string;
  PWSTypeDesc?: string;
  PWSActivityCode?: string;
  SeriousViolator?: string;
  HealthFlag?: string;
  SDWAContaminantsInViol3yr?: string | null;
  SDWAContaminantsInCurViol?: string | null;
  SDWAContaminants?: string | null;
  ViolationCategories?: string | null;
};

type EchoEnvelope = {
  Results?: {
    Message?: string;
    QueryRows?: string | number;
    QueryID?: string;
    Error?: { ErrorMessage?: string };
    Facilities?: EchoSystemRow[];
    Results?: EchoSystemRow[];
    WaterSystems?: EchoSystemRow[];
  };
};

export function parseCodedList(raw?: string | null): Array<{ code: string; name: string }> {
  if (!raw) return [];
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const eq = part.indexOf("=");
      if (eq === -1) return { code: "", name: part };
      return { code: part.slice(0, eq).trim(), name: part.slice(eq + 1).trim() };
    });
}

async function echoGet(path: string, params: Record<string, string>, fetchImpl: typeof fetch): Promise<EchoEnvelope> {
  const url = new URL(`${ECHO_BASE}.${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (!url.searchParams.has("output")) url.searchParams.set("output", "JSON");
  const res = await fetchImpl(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`ECHO HTTP ${res.status}`);
  return (await res.json()) as EchoEnvelope;
}

function rowsFrom(envelope: EchoEnvelope): EchoSystemRow[] {
  const r = envelope.Results;
  if (!r) return [];
  if (Array.isArray(r.WaterSystems)) return r.WaterSystems;
  if (Array.isArray(r.Facilities)) return r.Facilities;
  if (Array.isArray(r.Results)) return r.Results;
  return [];
}

export function toUtility(row: EchoSystemRow, zip: string): Utility {
  const pop = row.PopulationServedCount;
  return {
    pwsId: String(row.PWSId || row.PWSID || ""),
    name: row.PWSName || "Unknown public water system",
    city: row.CitiesServed || undefined,
    state: row.StateCode,
    zip,
    populationServed: typeof pop === "string" ? Number(pop) : pop,
    source: "echo"
  };
}

function pickCommunity(rows: EchoSystemRow[]): EchoSystemRow | null {
  if (!rows.length) return null;
  const active = rows.filter((row) => (row.PWSActivityCode || "A").toUpperCase() === "A");
  const pool0 = active.length ? active : rows;
  const community = pool0.filter((row) => {
    const code = (row.PWSTypeCode || "").toUpperCase();
    const desc = (row.PWSTypeDesc || "").toLowerCase();
    return code === "CWS" || desc.includes("community");
  });
  const pool = community.length ? community : pool0;
  return [...pool].sort((a, b) => Number(b.PopulationServedCount || 0) - Number(a.PopulationServedCount || 0))[0];
}

async function systemsForQuery(
  params: Record<string, string>,
  fetchImpl: typeof fetch
): Promise<EchoSystemRow[]> {
  const first = await echoGet("get_systems", { ...params, qcolumns: QCOLS }, fetchImpl);
  if (first.Results?.Error?.ErrorMessage) throw new Error(first.Results.Error.ErrorMessage);
  let rows = rowsFrom(first);
  const qid = first.Results?.QueryID;
  const queryRows = Number(first.Results?.QueryRows || 0);
  if (!rows.length && qid && queryRows > 0 && queryRows <= 200) {
    const page = await echoGet("get_qid", { qid, pageno: "1", qcolumns: QCOLS }, fetchImpl);
    rows = rowsFrom(page);
  }
  return rows;
}

export async function findUtilityByZip(
  zip: string,
  fetchImpl: typeof fetch = fetch
): Promise<Utility | null> {
  const rows = await systemsForQuery({ p_zip: zip }, fetchImpl);
  const picked = pickCommunity(rows);
  if (!picked) return null;
  return toUtility(picked, zip);
}

export async function findEchoByPws(
  pwsId: string,
  name: string,
  zip: string,
  fetchImpl: typeof fetch = fetch
): Promise<{ utility: Utility; live: EpaLive } | null> {
  const state = pwsId.slice(0, 2);
  const nameToken = name.split(/\s+/)[0] || name;
  const rows = await systemsForQuery({ p_st: state, p_fn: nameToken }, fetchImpl);
  const hit =
    rows.find((row) => String(row.PWSId || row.PWSID) === pwsId) ||
    rows.find((row) => (row.PWSName || "").toUpperCase() === name.toUpperCase()) ||
    null;
  if (!hit) return null;
  return {
    utility: toUtility(hit, zip),
    live: {
      healthFlag: hit.HealthFlag ?? null,
      seriousViolator: hit.SeriousViolator ?? null,
      activity: hit.PWSActivityCode ?? null,
      contaminantsInViolation3yr: parseCodedList(hit.SDWAContaminantsInViol3yr),
      currentViolationContaminants: parseCodedList(hit.SDWAContaminantsInCurViol),
      echoQuery: `p_st=${state}&p_fn=${encodeURIComponent(nameToken)}`,
      sources: [
        "https://echo.epa.gov/tools/web-services/facility-search-drinking-water",
        `https://echo.epa.gov/detailed-facility-report?fid=${pwsId}&sys=SDWIS`
      ]
    }
  };
}
