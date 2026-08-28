# Parker v5 Water Health Assessment: source map

**Date:** 2026-08-28
**Example file:** `Water_Health_Assessment_Parker_v5.pdf`
**Question:** Can each ZIP get this 2-page report from live EPA data?

## Verdict

The PDF is an EWG Tap Water Database report for Parker WSD, restyled. The fold-overs match EWG, not EPA MCLs.[1]

Live EPA can identify the utility and legal compliance. Live EPA APIs cannot, by themselves, produce the 13-of-38 health-guideline scoreboard.

To clone this output per ZIP: live EPA for who the system is, plus a multi-year occurrence table compared to a published health-guideline set (EWG and/or CA PHG). Label both.

## What the PDF actually is

Cover: Parker, Colorado. Parker Water & Sanitation District. Period 2013-2024. Sources line: U.S. EPA / EWG records. 12 years. 38 analytes detected. 13 out of range. 25 within range. 2 PFAS over guidelines: PFHxS 300x, PFOA 3.9x.

EWG Parker WSD page uses the same period 2013-2024 and the same utility name.[1]

EWG lists exactly 13 contaminants "times above EWG's Health Guideline" on that page. That is the PDF "13 OUT OF RANGE" count.[1]

## Fold-over check (PDF vs EWG Parker page)

These PDF numbers appear on EWG for PWS `CO0118040`:[1]

- Arsenic 52x (utility 0.208 ppb, EWG guideline 0.004 ppb, legal limit 10 ppb)
- HAA9 146x (8.78 ppb vs 0.06 ppb)
- Radium combined 57x (2.84 pCi/L vs 0.05 pCi/L)
- TTHMs 49x (7.28 ppb vs 0.15 ppb)
- Bromodichloromethane 38x (2.28 ppb vs 0.06 ppb)
- Dibromoacetic acid 29x (0.860 ppb vs 0.03 ppb)
- HAA5 30x (3.01 ppb vs 0.1 ppb)
- Dichloroacetic acid 7.1x (1.41 ppb vs 0.2 ppb)
- Chloroform 4.3x (1.70 ppb vs 0.4 ppb)
- PFOA 3.9x (0.350 ppt vs 0.09 ppt)
- PFHxS 300x (0.300 ppt vs 0.001 ppt)
- Trichloroacetic acid 6.4x (0.641 ppb vs 0.1 ppb)
- Dibromochloromethane 23x (on EWG; PDF groups it under cancer "also linked")

Guidelines are CA PHG or EWG one-in-a-million cancer levels, not EPA MCLs.[1]

## What live EPA actually says for Parker

ECHO detailed facility report for `CO0118040`: active community water system, surface water, population served 75,949.[2]

EWG, citing EPA ECHO for April-June 2024, says Parker tap water was in compliance with federal health-based drinking water standards.[1]

ECHO compliance for Parker is not an MCL-exceedance story. Recent SDWA items include monitoring/reporting and Lead and Copper Rule Revisions reporting, not the 146x HAA9 health-guideline math.[2]

Parker WSD 2026 CCR reports TTHM average 16.29 ppb vs EPA MCL 80 ppb, and HAA5 4.69 ppb vs MCL 60 ppb. Those are legal-limit rows, not EWG fold-overs.[5]

So a ZIP can be "EPA compliant" and still show 13 out of range on this template. The PDF is designed that way.

## PDF block to source

1. Location / utility / period
   Live EPA SDWIS/ECHO plus ZIP search. Period 2013-2024 is EWG's compiled window, not an ECHO field.[1][2][6]

2. Scoreboard 13 / 25 / 38
   EWG contaminant list vs EWG health guidelines. Not ECHO QueryRows. Not SDWA violation count (Parker had 19 total violations on the SDWIS wrapper, mostly not health-based).[1]

3. PFAS 300x / 3.9x
   EWG PFHxS and PFOA vs EWG guidelines. EPA UCMR 5 is the live federal PFAS/lithium occurrence set (2023-2025 samples, final dataset August 2026). UCMR units are ug/L. UCMR does not apply EWG 0.001 ppt PFHxS math.[1][3][4]

4. Cancer / kidney-liver / developmental lists
   Same EWG rows, grouped by EWG "potential effect" / CA PHG endpoints. EPA does not ship this grouping in ECHO.[1]

5. Exposure 60 / 25 / 15
   Boilerplate, not measured at the tap. Keep as labeled assumptions. [unverified] as a utility-specific split.

6. Blind spots (microplastics, pharmaceuticals, BPA, hormones, pesticides, endocrine disruptors)
   Narrative about unregulated contaminants. EPA UCMR is the official unregulated monitoring program, but UCMR 5 is PFAS and lithium, not those six bullets.[4]

7. Sell CTA from $35/month
   Product, not EPA. Retail catalog is separate.

## Can every ZIP be live EPA?

Utility identity: yes, live EPA.[6]

Legal compliance / violation contaminants: yes, live EPA ECHO/SDWIS.[2][6]

This exact 2-page health-guideline report: not from ECHO alone.

Paths that stay honest:

- A. Live EPA identity + compliance, plus EWG-style occurrence only where we have a sourced table. Other ZIPs show EPA live and do not invent 13/38.
- B. Compile EPA UCMR text files + state CCR/occurrence + a frozen health-guideline table (CA PHG + labeled EWG guidelines). Reproduce fold-overs ourselves. Heavy, but EPA-rooted concentrations.
- C. Scrape EWG per PWS. Matches the PDF. Fragile and against the earlier no-scrape rule.

Recommend A now for the site template, B if Patrick needs nationwide fold-overs.

## Rebuild implication

The website can look like this PDF. Parker can show these EWG-matched numbers with the EWG URL on the page. Other ZIPs can show live EPA utility + ECHO contaminants in violation, and a clear gap where occurrence vs health guideline is missing.

Do not print 13 out of 38 for a ZIP unless that count is computed from a sourced occurrence table.

## Sources

[1] https://www.ewg.org/tapwater/system.php?pws=CO0118040 — EWG Tap Water Database Parker WSD
[2] https://echo.epa.gov/detailed-facility-report?fid=CO0118040&sys=SDWIS — EPA ECHO Parker WSD DFR
[3] https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule — EPA UCMR occurrence data
[4] https://www.epa.gov/dwucmr/fifth-unregulated-contaminant-monitoring-rule — EPA UCMR 5
[5] https://pwsd.org/DocumentCenter/View/4534/2026-Consumer-Confidence-Report-PDF — Parker WSD 2026 CCR
[6] https://echo.epa.gov/tools/web-services — EPA ECHO web services
