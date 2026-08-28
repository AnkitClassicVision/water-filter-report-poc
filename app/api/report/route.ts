import { NextRequest, NextResponse } from "next/server";
import { buildReport, rateLimit } from "@/lib/report";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit. Try again later." }, { status: 429 });
  }
  let zip = "";
  try {
    const body = (await req.json()) as { zip?: string };
    zip = String(body.zip || "").trim();
  } catch {
    return NextResponse.json({ error: "Expected JSON { zip }." }, { status: 400 });
  }
  const out = await buildReport(zip);
  if ("error" in out) {
    return NextResponse.json({ error: out.error }, { status: out.status });
  }
  return NextResponse.json(out);
}
