#!/usr/bin/env python3
"""Compact EPA UCMR 5 into JSON the Next app can ship.

Source: UCMR5_All.txt + UCMR5_ZIPCodes.txt from
https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule
"""

from __future__ import annotations

import json
import math
from collections import defaultdict
from pathlib import Path

SRC = Path("/tmp/epa-warehouse")
OUT = Path("/home/ankit114/artifacts/water-filter-report-poc/data/epa")


def num(x: str) -> float | None:
    x = (x or "").strip()
    if not x:
        return None
    try:
        return float(x)
    except ValueError:
        return None


def ingest_all(path: Path) -> tuple[dict, dict]:
    # pws -> contaminant -> stats
    stats: dict[str, dict[str, dict]] = defaultdict(
        lambda: defaultdict(lambda: {"n": 0, "detects": 0, "sum": 0.0, "max": 0.0, "unit": "", "name": ""})
    )
    meta: dict[str, dict] = {}
    with path.open(encoding="latin-1", newline="") as f:
        header = f.readline().rstrip("\r\n").split("\t")
        idx = {name: i for i, name in enumerate(header)}
        for line in f:
            cols = line.rstrip("\r\n").split("\t")
            if len(cols) < len(header):
                continue
            pws = cols[idx["PWSID"]].strip().upper()
            contam = cols[idx["Contaminant"]].strip()
            sign = cols[idx["AnalyticalResultsSign"]].strip()
            value = num(cols[idx["AnalyticalResultValue"]])
            unit = cols[idx["Units"]].strip()
            row = stats[pws][contam]
            row["n"] += 1
            row["unit"] = unit
            row["name"] = contam
            if sign == "=" and value is not None:
                row["detects"] += 1
                row["sum"] += value
                row["max"] = max(row["max"], value)
            if pws not in meta:
                meta[pws] = {
                    "name": cols[idx["PWSName"]].strip(),
                    "state": cols[idx["State"]].strip(),
                    "size": cols[idx["Size"]].strip(),
                }
    return stats, meta


def ingest_zips(path: Path) -> dict[str, list[str]]:
    zips: dict[str, list[str]] = defaultdict(list)
    with path.open(encoding="latin-1", newline="") as f:
        header = f.readline().rstrip("\r\n").split("\t")
        idx = {name: i for i, name in enumerate(header)}
        seen: set[tuple[str, str]] = set()
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
    return zips


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    stats, meta = ingest_all(SRC / "UCMR5_All.txt")
    zips = ingest_zips(SRC / "UCMR5_ZIPCodes.txt")

    detects: dict[str, list[dict]] = {}
    tested: dict[str, int] = {}
    for pws, contams in stats.items():
        tested[pws] = sum(c["n"] for c in contams.values())
        rows = []
        for contam, s in contams.items():
            if s["detects"] == 0:
                continue
            mean = s["sum"] / s["detects"]
            rows.append(
                {
                    "name": contam,
                    "mean": round(mean, 8),
                    "max": round(s["max"], 8),
                    "detects": s["detects"],
                    "samples": s["n"],
                    "unit": s["unit"],
                }
            )
        rows.sort(key=lambda r: r["max"], reverse=True)
        if rows:
            detects[pws] = rows

    payload = {
        "source": "EPA UCMR 5 occurrence data text files",
        "sourceUrl": "https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule",
        "period": "2023-2025",
        "vintage": "UCMR5_All.txt dated 2026-08-27",
        "notes": "Means are of quantified results (sign =). Non-detects are omitted from the mean. Units are as EPA reported (ug/L).",
        "pwsCount": len(meta),
        "pwsWithDetects": len(detects),
        "zipCount": len(zips),
        "meta": meta,
        "detects": detects,
        "tested": tested,
        "zips": zips,
    }
    out = OUT / "ucmr5.json"
    out.write_text(json.dumps(payload, separators=(",", ":")))
    print("wrote", out, "bytes", out.stat().st_size)
    print("pws", len(meta), "withDetects", len(detects), "zips", len(zips))
    print("parker", detects.get("CO0118040"))


if __name__ == "__main__":
    main()
