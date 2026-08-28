import { NextRequest, NextResponse } from "next/server";
import { rateLimit, searchZip } from "@/lib/report";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit. Try again later." }, { status: 429 });
  }
  const zip = req.nextUrl.searchParams.get("zip") || "";
  const out = await searchZip(zip);
  if ("error" in out) return NextResponse.json({ error: out.error }, { status: out.status });
  return NextResponse.json(out);
}
