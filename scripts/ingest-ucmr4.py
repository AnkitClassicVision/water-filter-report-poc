#!/usr/bin/env python3
"""Compact UCMR 4 HAA5/HAA9/HAA6Br detections + ZIP join."""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

SRC = Path("/tmp/epa-warehouse")
OUT = Path("/home/ankit114/artifacts/water-filter-report-poc/data/epa")
KEEP = {"HAA5", "HAA9", "HAA6Br"}


def num(x: str) -> float | None:
    x = (x or "").strip()
    if not x:
        return None
    try:
        return float(x)
    except ValueError:
        return None


def main() -> None:
    stats: dict[str, dict[str, dict]] = defaultdict(
        lambda: defaultdict(lambda: {"n": 0, "detects": 0, "sum": 0.0, "max": 0.0, "unit": ""})
    )
    meta: dict[str, dict] = {}
    with (SRC / "UCMR4_All.txt").open(encoding="latin-1", newline="") as f:
        header = f.readline().rstrip("\r\n").split("\t")
        idx = {name: i for i, name in enumerate(header)}
        for line in f:
            cols = line.rstrip("\r\n").split("\t")
            if len(cols) < len(header):
                continue
            contam = cols[idx["Contaminant"]].strip()
            if contam not in KEEP:
                continue
            pws = cols[idx["PWSID"]].strip().upper()
            sign = cols[idx["AnalyticalResultsSign"]].strip()
            value = num(cols[idx["AnalyticalResultValue"]])
            row = stats[pws][contam]
            row["n"] += 1
            row["unit"] = cols[idx["Units"]].strip()
            if sign == "=" and value is not None:
                row["detects"] += 1
                row["sum"] += value
                row["max"] = max(row["max"], value)
            if pws not in meta:
                meta[pws] = {
                    "name": cols[idx["PWSName"]].strip(),
                    "state": cols[idx["State"]].strip(),
                }

    zips: dict[str, list[str]] = defaultdict(list)
    seen: set[tuple[str, str]] = set()
    with (SRC / "UCMR4_ZIPCodes.txt").open(encoding="latin-1", newline="") as f:
        header = f.readline().rstrip("\r\n").split("\t")
        idx = {name: i for i, name in enumerate(header)}
        for line in f:
            cols = line.rstrip("\r\n").split("\t")
            if len(cols) < 2:
                continue
            pws = cols[idx["PWSID"]].strip().upper()
            zipc = cols[idx["ZIPCODE"]].strip()
            if len(zipc) != 5 or not zipc.isdigit():
                continue
            key = (zipc, pws)
            if key in seen:
                continue
            seen.add(key)
            zips[zipc].append(pws)

    detects: dict[str, list[dict]] = {}
    for pws, contams in stats.items():
        rows = []
        for name, s in contams.items():
            if s["detects"] == 0:
                continue
            rows.append(
                {
                    "name": name,
                    "mean": round(s["sum"] / s["detects"], 6),
                    "max": round(s["max"], 6),
                    "detects": s["detects"],
                    "samples": s["n"],
                    "unit": s["unit"],
                }
            )
        rows.sort(key=lambda r: r["max"], reverse=True)
        if rows:
            detects[pws] = rows

    payload = {
        "source": "EPA UCMR 4 occurrence data text files",
        "sourceUrl": "https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule",
        "period": "2018-2020",
        "notes": "HAA5/HAA9/HAA6Br quantified means only.",
        "pwsWithDetects": len(detects),
        "zipCount": len(zips),
        "meta": meta,
        "detects": detects,
        "zips": zips,
    }
    dest = OUT / "ucmr4-haa.json"
    dest.write_text(json.dumps(payload, separators=(",", ":")))
    print("wrote", dest, dest.stat().st_size, "pws", len(detects), "zips", len(zips))
    print("cobb", detects.get("GA0670003"))
    print("marietta", detects.get("GA0670005"))


if __name__ == "__main__":
    main()
