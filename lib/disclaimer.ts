export const DISCLAIMER =
  "Not medical advice. Not an EPA Consumer Confidence Report. Health guidelines can be stricter than legal Maximum Contaminant Levels. A utility can be in legal compliance and still exceed the guidelines shown here. Nationwide concentrations come from EPA UCMR 5 (2023-2025) and Six-Year Review 4 (2012-2019) files, not a live concentration API. EPA SDWIS/ECHO data can lag. Filter claims are only as good as the listed NSF/ANSI standard. Package prices are public retail list prices dated on the product card. Checkout is on the seller site. Visitor ZIP codes are not stored.";

export function zipOk(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}
