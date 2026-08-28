import type { CompareOutput, Exceedance, HealthGroupId } from "./types";

export type Pathway = {
  id: HealthGroupId;
  label: string;
  blurb: string;
  rows: Array<{ name: string; foldOver: number }>;
};

const TITLE: Record<HealthGroupId, string> = {
  cancer: "Cancer Links",
  liver: "Kidney & Liver Toxicity",
  developmental: "Developmental Risks",
  immune: "Immune risks",
  genotoxic: "Genotoxic risks",
  other: "Other documented risks"
};

const BLURB: Record<HealthGroupId, string> = {
  cancer:
    "Carcinogenic contaminants can cause or promote uncontrolled cell growth anywhere in the body after long-term exposure.",
  liver:
    "Impairs the kidney's regulation of fluid, minerals and waste filtration. Liver detoxification declines and inflammation follows.",
  developmental:
    "Alters pre-conception, prenatal and post-natal growth and behavior. Pregnant individuals and children carry the highest risk.",
  immune: "Other documented immune risks from the same exceedance set.",
  genotoxic: "Other documented genotoxic risks from the same exceedance set.",
  other: "Other documented risks."
};

const ORDER: HealthGroupId[] = ["cancer", "liver", "developmental", "immune", "genotoxic", "other"];

export function foldLabel(n: number): string {
  if (n >= 10) return `${n.toFixed(0)}x`;
  if (n >= 1) return `${n.toFixed(1)}x`;
  return `${n.toFixed(2)}x`;
}

export function barWidth(foldOver: number, maxFold: number): number {
  if (!(maxFold > 0)) return 0;
  return Math.min(100, Math.max(6, (foldOver / maxFold) * 100));
}

export function buildPathways(compare: CompareOutput): Pathway[] {
  return ORDER.map((id) => {
    const rows = compare.exceedances
      .filter((row) => row.healthEffects.includes(id))
      .map((row: Exceedance) => ({ name: row.name, foldOver: row.foldOver }))
      .sort((a, b) => b.foldOver - a.foldOver);
    return {
      id,
      label: TITLE[id],
      blurb: BLURB[id],
      rows
    };
  }).filter((p) => p.rows.length > 0);
}

export function pfasOver(compare: CompareOutput): Exceedance[] {
  return compare.exceedances.filter((row) => /pfas|pfoa|pfos|pfhx|perfluoro/i.test(row.name));
}
