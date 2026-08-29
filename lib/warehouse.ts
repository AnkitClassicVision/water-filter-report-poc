import guidelines from "../data/epa/guidelines.json";
import ucmr4 from "../data/epa/ucmr4-haa.json";
import ucmr from "../data/epa/ucmr5.json";
import haa5 from "../data/epa/syr4-haa5.json";
import radium from "../data/epa/syr4-radium.json";
import tthm from "../data/epa/syr4-tthm.json";
import type { ContaminantResult, Exposure, HealthGroupId, Unit } from "./types";

type Detect = {
  name: string;
  mean: number;
  max: number;
  detects: number;
  samples: number;
  unit: string;
};

type Guide = {
  display: string;
  unit: Unit;
  fromUgL: number;
  healthGuideline: number;
  healthGuidelineSource: string;
  mcl: number | null;
  mclSource: string;
  healthEffects: HealthGroupId[];
  exposure: Exposure[];
};

const GUIDE = guidelines as Record<string, Guide>;

const UCMR_URL = "https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule";
const SYR4_URL = "https://www.epa.gov/dwsixyearreview/six-year-review-4-compliance-monitoring-data-2012-2019";

function norm(pwsId: string): string {
  return pwsId.trim().toUpperCase();
}

function mapDetect(row: Detect, sourceUrl: string, ugL: boolean): ContaminantResult | null {
  const g = GUIDE[row.name];
  if (!g) return null;
  const value = ugL ? row.mean * g.fromUgL : row.mean;
  return {
    name: g.display,
    value,
    unit: g.unit,
    healthGuideline: g.healthGuideline,
    healthGuidelineSource: g.healthGuidelineSource,
    mcl: g.mcl,
    mclSource: g.mclSource,
    healthEffects: g.healthEffects,
    exposure: g.exposure,
    sourceUrl
  };
}

export function pwsIdsForZip(zip: string): string[] {
  const ids = new Set<string>([
    ...((ucmr.zips as Record<string, string[]>)[zip] || []),
    ...((ucmr4.zips as Record<string, string[]>)[zip] || [])
  ]);
  return [...ids];
}

export function warehouseName(pwsId: string): string | undefined {
  const id = norm(pwsId);
  return (
    (ucmr.meta as Record<string, { name?: string }>)[id]?.name ||
    (ucmr4.meta as Record<string, { name?: string }>)[id]?.name
  );
}

export function warehouseResults(pwsId: string): ContaminantResult[] {
  const id = norm(pwsId);
  const rows: ContaminantResult[] = [];
  const seen = new Set<string>();

  const push = (mapped: ContaminantResult | null) => {
    if (!mapped || seen.has(mapped.name)) return;
    seen.add(mapped.name);
    rows.push(mapped);
  };

  for (const row of (ucmr.detects as Record<string, Detect[]>)[id] || []) {
    push(mapDetect(row, UCMR_URL, true));
  }
  for (const row of (ucmr4.detects as Record<string, Detect[]>)[id] || []) {
    push(mapDetect(row, UCMR_URL, true));
  }
  const tthmRow = (tthm.detects as Record<string, Detect>)[id];
  const haaRow = (haa5.detects as Record<string, Detect>)[id];
  const radRow = (radium.detects as Record<string, Detect>)[id];
  if (tthmRow) push(mapDetect(tthmRow, SYR4_URL, false));
  if (haaRow) push(mapDetect(haaRow, SYR4_URL, false));
  if (radRow) push(mapDetect(radRow, SYR4_URL, false));
  return rows;
}

export function warehousePeriod(pwsId: string): string {
  const id = norm(pwsId);
  const hasUcmr5 = Boolean((ucmr.detects as Record<string, Detect[]>)[id]?.length);
  const hasUcmr4 = Boolean((ucmr4.detects as Record<string, Detect[]>)[id]?.length);
  const hasSyr = Boolean(
    (tthm.detects as Record<string, Detect>)[id] ||
      (haa5.detects as Record<string, Detect>)[id] ||
      (radium.detects as Record<string, Detect>)[id]
  );
  const parts: string[] = [];
  if (hasUcmr5) parts.push("UCMR 5 2023-2025");
  if (hasUcmr4) parts.push("UCMR 4 2018-2020");
  if (hasSyr) parts.push("SYR4 2012-2019");
  return parts.length ? `EPA ${parts.join(" and ")}` : "EPA identity only";
}

export function warehouseCoverage(): { ucmr5Zips: number; ucmr4Zips: number; unionZips: number } {
  const a = new Set(Object.keys(ucmr.zips as Record<string, string[]>));
  const b = Object.keys(ucmr4.zips as Record<string, string[]>);
  const union = new Set(a);
  for (const z of b) union.add(z);
  return { ucmr5Zips: a.size, ucmr4Zips: b.length, unionZips: union.size };
}
