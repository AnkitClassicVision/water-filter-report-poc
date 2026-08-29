import guidelines from "../data/epa/guidelines.json";
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
  return (ucmr.zips as Record<string, string[]>)[zip] || [];
}

export function warehouseName(pwsId: string): string | undefined {
  return (ucmr.meta as Record<string, { name?: string }>)[pwsId]?.name;
}

export function warehouseResults(pwsId: string): ContaminantResult[] {
  const id = pwsId.toUpperCase();
  const rows: ContaminantResult[] = [];
  const ucmrRows = (ucmr.detects as Record<string, Detect[]>)[id] || [];
  for (const row of ucmrRows) {
    const mapped = mapDetect(row, UCMR_URL, true);
    if (mapped) rows.push(mapped);
  }
  const tthmRow = (tthm.detects as Record<string, Detect>)[id];
  const haaRow = (haa5.detects as Record<string, Detect>)[id];
  const radRow = (radium.detects as Record<string, Detect>)[id];
  if (tthmRow) {
    const mapped = mapDetect(tthmRow, SYR4_URL, false);
    if (mapped) rows.push(mapped);
  }
  if (haaRow) {
    const mapped = mapDetect(haaRow, SYR4_URL, false);
    if (mapped) rows.push(mapped);
  }
  if (radRow) {
    const mapped = mapDetect(radRow, SYR4_URL, false);
    if (mapped) rows.push(mapped);
  }
  return rows;
}

export function warehousePeriod(pwsId: string): string {
  const id = pwsId.toUpperCase();
  const hasUcmr = Boolean((ucmr.detects as Record<string, Detect[]>)[id]?.length);
  const hasSyr = Boolean(
    (tthm.detects as Record<string, Detect>)[id] ||
      (haa5.detects as Record<string, Detect>)[id] ||
      (radium.detects as Record<string, Detect>)[id]
  );
  if (hasUcmr && hasSyr) return "EPA UCMR 5 2023-2025 and SYR4 2012-2019";
  if (hasUcmr) return "EPA UCMR 5 2023-2025";
  if (hasSyr) return "EPA SYR4 2012-2019";
  return "EPA identity only";
}
