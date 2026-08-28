import catalog from "../data/catalog.json";
import type { CatalogItem, CompareOutput, PackageId, QuotePackage } from "./types";

const LABELS: Record<PackageId, string> = {
  base: "Base: under-sink reverse osmosis",
  gold: "Gold: under-sink RO + shower filter",
  platinum: "Platinum: whole-home + under-sink RO"
};

function norm(name: string): string {
  return name.trim().toLowerCase();
}

function itemCovers(item: CatalogItem, contaminant: string): boolean {
  const n = norm(contaminant);
  return item.treats.some((t) => n.includes(t) || t === n);
}

export function quotePackages(compare: CompareOutput, extraNames: string[] = []): QuotePackage[] {
  const items = catalog.items as CatalogItem[];
  const names = [...new Set([...compare.exceedances.map((e) => e.name), ...extraNames])];
  const ids: PackageId[] = ["base", "gold", "platinum"];
  return ids.map((id) => {
    const slots = catalog.packages[id] as CatalogItem["slot"][];
    const pkgItems = slots
      .map((slot) => items.find((item) => item.slot === slot))
      .filter((item): item is CatalogItem => Boolean(item));
    const covered = names.filter((name) => pkgItems.some((item) => itemCovers(item, name)));
    const uncovered = names.filter((name) => !covered.includes(name));
    return {
      id,
      label: LABELS[id],
      items: pkgItems,
      priceUsd: Number(pkgItems.reduce((sum, item) => sum + item.priceUsd, 0).toFixed(2)),
      covered,
      uncovered
    };
  });
}
