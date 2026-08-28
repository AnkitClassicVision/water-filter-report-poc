import type { Utility } from "./types";

const ECHO_BASE = "https://echodata.epa.gov/echo/sdw_rest_services";

type EchoSystemRow = {
  PWSId?: string;
  PWSID?: string;
  PWSName?: string;
  CitiesServed?: string;
  StateCode?: string;
  ZipCodesServed?: string;
  PopulationServedCount?: number | string;
  PWSTypeCode?: string;
  PWSTypeDesc?: string;
};

type EchoEnvelope = {
  Results?: {
    Message?: string;
    QueryRows?: string | number;
    QueryID?: string;
    Error?: { ErrorMessage?: string };
    Facilities?: EchoSystemRow[];
    Results?: EchoSystemRow[];
  };
};

async function echoGet(path: string, params: Record<string, string>, fetchImpl: typeof fetch): Promise<EchoEnvelope> {
  const url = new URL(`${ECHO_BASE}.${path}`);
  url.searchParams.set("output", "JSON");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetchImpl(url.toString(), {
    headers: { Accept: "application/json" }
  });
  if (!res.ok) {
    throw new Error(`ECHO HTTP ${res.status}`);
  }
  return (await res.json()) as EchoEnvelope;
}

function rowsFrom(envelope: EchoEnvelope): EchoSystemRow[] {
  const r = envelope.Results;
  if (!r) return [];
  if (Array.isArray(r.Facilities)) return r.Facilities;
  if (Array.isArray(r.Results)) return r.Results;
  return [];
}

function toUtility(row: EchoSystemRow, zip: string): Utility {
  const pop = row.PopulationServedCount;
  return {
    pwsId: String(row.PWSId || row.PWSID || ""),
    name: row.PWSName || "Unknown public water system",
    city: row.CitiesServed,
    state: row.StateCode,
    zip,
    populationServed: typeof pop === "string" ? Number(pop) : pop,
    source: "echo"
  };
}

function pickCommunity(rows: EchoSystemRow[]): EchoSystemRow | null {
  if (!rows.length) return null;
  const community = rows.filter((row) => {
    const code = (row.PWSTypeCode || "").toUpperCase();
    const desc = (row.PWSTypeDesc || "").toLowerCase();
    return code === "CWS" || desc.includes("community");
  });
  const pool = community.length ? community : rows;
  return [...pool].sort((a, b) => {
    const pa = Number(a.PopulationServedCount || 0);
    const pb = Number(b.PopulationServedCount || 0);
    return pb - pa;
  })[0];
}

export async function findUtilityByZip(
  zip: string,
  fetchImpl: typeof fetch = fetch
): Promise<Utility | null> {
  const first = await echoGet("get_systems", { p_zip: zip }, fetchImpl);
  if (first.Results?.Error?.ErrorMessage) {
    throw new Error(first.Results.Error.ErrorMessage);
  }
  let rows = rowsFrom(first);
  const qid = first.Results?.QueryID;
  const queryRows = Number(first.Results?.QueryRows || 0);
  if (!rows.length && qid && queryRows > 0) {
    const page = await echoGet("get_qid", { qid }, fetchImpl);
    rows = rowsFrom(page);
  }
  const picked = pickCommunity(rows);
  if (!picked) return null;
  return toUtility(picked, zip);
}
