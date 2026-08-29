# EPA warehouse files

Compact extracts. Not the raw EPA dumps.

- `ucmr5.json` from UCMR5_All.txt and UCMR5_ZIPCodes.txt (file date 2026-08-27).
- `ucmr4-haa.json` from UCMR4_All.txt HAA5/HAA9/HAA6Br (2018-2020). Georgia is in this file; it is not in SYR4 TTHM.
- `syr4-tthm.json`, `syr4-haa5.json`, `syr4-radium.json` from Six-Year Review 4 (2012-2019).
- `guidelines.json` health-guideline table used for fold-overs.

Rebuild: `python3 scripts/ingest-ucmr5.py` and `python3 scripts/ingest-syr4.py ...`

Source pages:
- https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule
- https://www.epa.gov/dwsixyearreview/six-year-review-4-compliance-monitoring-data-2012-2019
