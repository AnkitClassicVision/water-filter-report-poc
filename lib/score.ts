import type { CompareOutput, EpaLive } from "./types";

export type QualityBand = "good" | "watch" | "treat";

export type RiskProfile = {
  zip: string;
  pwsId: string;
  utilityName: string;
  quality: number;
  band: QualityBand;
  basis: "ewg+epa" | "epa-only";
  headline: string;
  drivers: string[];
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function bandFor(score: number): QualityBand {
  if (score >= 80) return "good";
  if (score >= 50) return "watch";
  return "treat";
}

function epaPenalty(epa?: EpaLive): { pts: number; notes: string[] } {
  if (!epa) return { pts: 0, notes: [] };
  const notes: string[] = [];
  let pts = 0;
  const health = (epa.healthFlag || "").toLowerCase();
  const sv = (epa.seriousViolator || "").toLowerCase();
  if (sv === "yes" || sv === "y") {
    pts += 20;
    notes.push("EPA serious violator");
  } else if (health === "yes" || health === "y") {
    pts += 12;
    notes.push("EPA health flag");
  }
  const n = epa.contaminantsInViolation3yr.length;
  if (n > 0) {
    const extra = Math.min(12, n * 2);
    pts += extra;
    notes.push(`EPA 3-year violation contaminants: ${n}`);
  }
  return { pts, notes };
}

export function scoreWaterQuality(
  zip: string,
  pwsId: string,
  utilityName: string,
  compare: CompareOutput,
  detectedCount: number | undefined,
  epa?: EpaLive
): RiskProfile {
  let score = 100;
  const drivers: string[] = [];
  const hasOccurrence = compare.reportedCount > 0;
  const basis: RiskProfile["basis"] = hasOccurrence ? "ewg+epa" : "epa-only";

  const epaHit = epaPenalty(epa);
  score -= epaHit.pts;
  drivers.push(...epaHit.notes);

  if (hasOccurrence && compare.overGuidelineCount > 0) {
    const detected = detectedCount || compare.reportedCount;
    const share = compare.overGuidelineCount / Math.max(detected, 1);
    const sharePts = Math.round(share * 30);
    score -= sharePts;
    drivers.push(`${compare.overGuidelineCount} of ${detected} over EWG health guidelines`);
    const ranked = [...compare.exceedances].sort((a, b) => b.foldOver - a.foldOver);
    for (const row of ranked) {
      score -= Math.min(8, Math.log10(Math.max(row.foldOver, 1)) * 2.2);
    }
    const worst = ranked[0];
    if (worst) drivers.push(`Highest fold-over: ${worst.name}`);
  } else if (!hasOccurrence) {
    drivers.push("No sourced occurrence table. Score is EPA-only.");
  } else {
    drivers.push("No EWG health-guideline exceedances in the sourced table.");
  }

  const quality = clamp(score);
  const band = bandFor(quality);
  const headline =
    band === "good"
      ? `${utilityName} in ${zip}: quality ${quality}/100. No major flags on this scorecard.`
      : band === "watch"
        ? `${utilityName} in ${zip}: quality ${quality}/100. Watch list. Treatment is optional but matched filters help.`
        : `${utilityName} in ${zip}: quality ${quality}/100. Treat. Health-guideline exceedances or EPA flags dominate.`;

  return {
    zip,
    pwsId,
    utilityName,
    quality,
    band,
    basis,
    headline,
    drivers: drivers.slice(0, 5)
  };
}
