# Honest EPA warehouse

## Truth

ECHO/SDWIS is live identity and violations for every ZIP. It does not store full concentrations.

Nationwide concentrations from EPA are warehouse files, not a live per-request API:

- UCMR 5 (2023-2025): 29 PFAS + lithium. Final dataset August 2026. Includes ZIP codes served.
- Six-Year Review 4 (2012-2019): compliance monitoring including TTHM, HAA5, radium, arsenic.

This build is labeled warehouse, not "live ECHO fold-overs."

## Ship now

1. Download UCMR 5 occurrence + ZIP file.
2. Keep detections at or above MRL. Average by PWS + contaminant.
3. Index ZIP -> PWS from UCMR5_ZIPCodes.
4. Compare to a frozen health-guideline table (EWG / CA PHG / EPA MCL), labeled.
5. Convert UCMR ug/L to ppt for PFAS.
6. If size allows, add SYR4 rads, THM, HAA, arsenic means.
7. Parker EWG 13-of-38 stays as the compiled health table for CO0118040. UCMR rows still attach.
8. Other ZIPs: EPA warehouse occurrence + ECHO identity. No invented 13-of-38.

## Do not claim

- 2013-2024 EWG window for non-Parker ZIPs.
- Live EPA API concentrations.
- Every small system has UCMR 5 (systems under 3,300 are a sample).
