import type { CompareOutput, Narrative, QuotePackage, Utility } from "./types";

type FactPacket = {
  utility: Utility;
  compare: CompareOutput;
  packages: QuotePackage[];
};

function numbersIn(text: string): string[] {
  return text.match(/\d+(?:\.\d+)?/g) ?? [];
}

function allowedNumbers(packet: FactPacket): Set<string> {
  const allowed = new Set<string>();
  const add = (n: number) => allowed.add(String(n));
  add(packet.compare.reportedCount);
  add(packet.compare.overGuidelineCount);
  for (const n of numbersIn(packet.utility.pwsId)) allowed.add(n);
  for (const n of numbersIn(packet.utility.zip)) allowed.add(n);
  for (const row of packet.compare.exceedances) {
    add(row.value);
    add(row.healthGuideline);
    add(Number(row.foldOver.toFixed(1)));
    add(Number(row.foldOver.toFixed(0)));
    if (row.mcl != null) add(row.mcl);
  }
  for (const pkg of packet.packages) add(pkg.priceUsd);
  for (const g of packet.compare.topHealthGroups) add(g.contaminantCount);
  return allowed;
}

export function narrativeHasInventedNumbers(html: string, packet: FactPacket): boolean {
  const allowed = allowedNumbers(packet);
  for (const n of numbersIn(html)) {
    if (!allowed.has(n)) return true;
  }
  return false;
}

export function templateNarrative(packet: FactPacket): Narrative {
  const { compare, utility } = packet;
  const top = compare.topHealthGroups
    .map((g) => `${g.label} (${g.contaminantCount})`)
    .join("; ");
  return {
    headline: `${utility.name}: ${compare.overGuidelineCount} of ${compare.reportedCount} cited contaminants sit outside health guidelines`,
    summaryHtml: `<p>${utility.name} (${utility.pwsId}) was compared against labeled health guidelines, which can be stricter than EPA legal limits. ${compare.overGuidelineCount} of ${compare.reportedCount} cited results exceed those guidelines.</p>`,
    topGroupsHtml: top
      ? `<p>Leading concern groups: ${top}.</p>`
      : "<p>No exceedance-linked health groups in this cited set.</p>",
    vectorsHtml:
      "<p>Typical exposure routes for drinking-water contaminants are consumption, skin contact, and inhalation of steam. Reduce those routes with point-of-use or whole-home treatment matched to the listed NSF standard.</p>"
  };
}

type ChatResult = { headline?: string; summaryHtml?: string; topGroupsHtml?: string; vectorsHtml?: string };

export async function writeNarrative(
  packet: FactPacket,
  opts?: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    fetchImpl?: typeof fetch;
  }
): Promise<Narrative | null> {
  const key = opts?.apiKey ?? process.env.LLM_API_KEY;
  if (!key) return null;

  const model = opts?.model ?? process.env.LLM_MODEL ?? "grok-4-fast";
  const baseUrl = (opts?.baseUrl ?? process.env.LLM_BASE_URL ?? "https://api.x.ai/v1").replace(/\/$/, "");
  const fetchImpl = opts?.fetchImpl ?? fetch;

  const body = {
    model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Use only facts in the JSON. If a study count is missing, do not invent one. Do not give medical advice. Return JSON with headline, summaryHtml, topGroupsHtml, vectorsHtml. Do not introduce numbers that are not in the JSON."
      },
      { role: "user", content: JSON.stringify(packet) }
    ]
  };

  const res = await fetchImpl(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = json.choices?.[0]?.message?.content ?? "";
  let parsed: ChatResult;
  try {
    parsed = JSON.parse(raw) as ChatResult;
  } catch {
    return null;
  }
  const narrative: Narrative = {
    headline: parsed.headline || templateNarrative(packet).headline,
    summaryHtml: parsed.summaryHtml || "",
    topGroupsHtml: parsed.topGroupsHtml || "",
    vectorsHtml: parsed.vectorsHtml || ""
  };
  const blob = `${narrative.headline} ${narrative.summaryHtml} ${narrative.topGroupsHtml} ${narrative.vectorsHtml}`;
  if (narrativeHasInventedNumbers(blob, packet)) return null;
  return narrative;
}
