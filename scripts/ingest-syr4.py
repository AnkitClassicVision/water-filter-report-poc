#!/usr/bin/env python3
"""Compact one SYR4 analyte file to PWS means of DETECT==1 rows."""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path


def ingest(path: Path, display_name: str, unit_out: str) -> dict:
    stats: dict[str, dict] = defaultdict(lambda: {"n": 0, "detects": 0, "sum": 0.0, "max": 0.0, "name": display_name})
    meta: dict[str, dict] = {}
    with path.open(encoding="latin-1", newline="") as f:
        header = [c.strip('"') for c in f.readline().rstrip("\r\n").split("\t")]
        idx = {name: i for i, name in enumerate(header)}
        for line in f:
            cols = line.rstrip("\r\n").split("\t")
            if len(cols) < len(header):
                continue
            pws = cols[idx["PWSID"]].strip().strip('"').upper()
            detect = cols[idx["DETECT"]].strip().strip('"')
            raw = cols[idx["VALUE"]].strip().strip('"')
            row = stats[pws]
            row["n"] += 1
            if detect == "1" and raw:
                try:
                    val = float(raw)
                except ValueError:
                    continue
                row["detects"] += 1
                row["sum"] += val
                row["max"] = max(row["max"], val)
            if pws not in meta:
                meta[pws] = {
                    "name": cols[idx["SYSTEM_NAME"]].strip().strip('"'),
                    "state": cols[idx["STATE_CODE"]].strip().strip('"'),
                }
    detects = {}
    for pws, s in stats.items():
        if s["detects"] == 0:
            continue
        detects[pws] = {
            "name": display_name,
            "mean": round(s["sum"] / s["detects"], 6),
            "max": round(s["max"], 6),
            "detects": s["detects"],
            "samples": s["n"],
            "unit": unit_out,
        }
    return {
        "source": "EPA Six-Year Review 4 compliance monitoring 2012-2019",
        "sourceUrl": "https://www.epa.gov/dwsixyearreview/six-year-review-4-compliance-monitoring-data-2012-2019",
        "period": "2012-2019",
        "pwsWithDetects": len(detects),
        "detects": detects,
    }


if __name__ == "__main__":
    src = Path(sys.argv[1])
    name = sys.argv[2]
    unit = sys.argv[3]
    dest = Path(sys.argv[4])
    payload = ingest(src, name, unit)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(payload, separators=(",", ":")))
    print("wrote", dest, dest.stat().st_size, "detects", payload["pwsWithDetects"])
    print("parker", payload["detects"].get("CO0118040"))
