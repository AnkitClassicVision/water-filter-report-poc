import type {
  CompareOutput,
  ContaminantResult,
  Exceedance,
  HealthGroupId,
  HealthGroupScore
} from "./types";

const LABELS: Record<HealthGroupId, string> = {
  cancer: "Cancer risk",
  liver: "Liver disease",
  developmental: "Childhood developmental risk",
  other: "Other health concerns"
};

export function foldOver(value: number, guideline: number): number {
  if (!(guideline > 0)) return 0;
  return value / guideline;
}

export function compareResults(results: ContaminantResult[]): CompareOutput {
  const exceedances: Exceedance[] = [];
  const withinGuideline: ContaminantResult[] = [];

  for (const row of results) {
    if (row.value > row.healthGuideline) {
      exceedances.push({ ...row, foldOver: foldOver(row.value, row.healthGuideline) });
    } else {
      withinGuideline.push(row);
    }
  }

  exceedances.sort((a, b) => b.foldOver - a.foldOver);

  const counts = new Map<HealthGroupId, string[]>();
  for (const row of exceedances) {
    const effects = row.healthEffects.length ? row.healthEffects : (["other"] as HealthGroupId[]);
    for (const id of effects) {
      const list = counts.get(id) ?? [];
      if (!list.includes(row.name)) list.push(row.name);
      counts.set(id, list);
    }
  }

  const topHealthGroups: HealthGroupScore[] = [...counts.entries()]
    .map(([id, contaminants]) => ({
      id,
      label: LABELS[id],
      contaminantCount: contaminants.length,
      contaminants
    }))
    .sort((a, b) => b.contaminantCount - a.contaminantCount)
    .slice(0, 3);

  return {
    reportedCount: results.length,
    overGuidelineCount: exceedances.length,
    exceedances,
    withinGuideline,
    topHealthGroups
  };
}
