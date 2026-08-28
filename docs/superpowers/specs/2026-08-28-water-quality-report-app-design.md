# Water Quality Report + Filter Quote App

**Date:** 2026-08-28
**Status:** design for approval (plan mode, not built)
**Source:** Bee conversation `10176953`, 2026-08-28 15:56-16:08 ET. ASR labeled the other speaker `Unknown`. Ankit asked for the Patrick conversation about the app, water, product section, and report. Content matches that call.
**Transcript file:** `docs/source/bee-10176953-transcript.txt`

## Goal

Public website that turns a ZIP code into a consumer water-risk report and three NSF-aligned filter quotes. An LLM writes the report narrative from structured facts. Numbers come from public water data and a health-guideline table, not from the model.

## Definition of done (POC)

1. Visitor enters a US ZIP.
2. App resolves a public water system.
3. App compares recent contaminant results to health guidelines.
4. App shows a report with:
   - count over guidelines vs count reported
   - top three health-concern groups
   - each over-limit contaminant and how far it exceeds the guideline
   - exposure vectors: drinking, skin, inhalation
5. App shows three product packages and a simple quote.
6. Code lives in a public GitHub repo.
7. Site deploys to Vercel with no login wall.
8. Golden demo works for Parker, CO (the example from the call).

## Why it matters

Patrick needs a proof he can show, not a pitch. Ankit offered to whip up a POC so Patrick can take specs or a working demo to someone else.

## Current vs desired

- Current: 12-minute spoken workflow. Patrick said he would send a sample report. That file is not in this session.
- Desired: a public URL that runs the workflow for at least one real utility and shows the product section.

## Non-goals (POC)

- Payments, carts, tax, shipping
- Account login, SSO, or Vercel Deployment Protection
- Storing visitor addresses
- Live NSF certification API
- Scraping EWG (ToS and brittleness)
- Medical diagnosis language presented as fact
- Whole-US occurrence coverage on day one
- Patrick's dropship catalog until he supplies SKUs

## User flow

1. Landing: ZIP input. Optional "Try Parker, CO (80134)" button.
2. Loading: resolve utility, fetch or load results, compare, write report.
3. Report page with four sections:
   - Utility and data vintage
   - Scoreboard (N of M outside guidelines)
   - Top 3 health groups with short boilerplate
   - Contaminant table (name, result, guideline, fold-over, unit)
   - Exposure vectors
   - Disclaimer
4. Product section: Base / Gold / Platinum packages with NSF claim and placeholder quote.
5. Print/PDF of the same report.

## Data rules

Patrick described EPA ECHO as the source of truth, with EWG as a faster POC shortcut.

Hard constraint: EPA ECHO SDWA services return public water systems, violations, and enforcement. They do not return a two-year occurrence table with concentrations versus health guidelines. Patrick's Parker example ("13 of about 40 outside health guidelines") matches EWG-style health guidelines, which are often stricter than EPA MCLs. Parker WSD (`CO0118040`) can be in EPA MCL compliance and still exceed those health guidelines.

POC data strategy:

1. Resolve utility with EPA ECHO SDWA REST (`p_zip` or city/state).
2. Compare concentrations with a checked-in health-guideline table (MCL plus a stricter health guideline such as CA PHG / EPA HBWC / published EWG guideline, each labeled).
3. Seed Parker WSD from public CCR plus published tap-water figures so the demo is deterministic.
4. For other ZIPs in v1: resolve the utility live, then either use a seeded fixture if we have one, or show utility identity plus EPA violation status and a clear "occurrence table not yet loaded" state. Do not invent concentrations.

LLM may write prose from the JSON fact packet. LLM may not invent contaminant values, study counts, or NSF claims.

## Product packages (from the call)

ASR said "under sync RO" and "NSF41". Treat as under-sink reverse osmosis and NSF/ANSI 42/53/58 (and PFAS claims only when a listed cert exists).

- **Platinum:** whole-home filtration + under-sink RO
- **Gold:** under-sink RO + screw-in shower carbon filters
- **Base:** under-sink RO only

v1 catalog is a static JSON of placeholder dropship SKUs with NSF codes and contaminant coverage. Replace later with Patrick's list.

## LLM job

Input: structured JSON (utility, contaminants, exceedances, top health groups, product matches).
Output: consumer report markdown/HTML: headline, top-3 narrative, per-contaminant blurbs, exposure boilerplate, product rationale.
Fail closed: if the model is down, render the structured report without narrative.

## Legal / safety copy (required on every report)

Not medical advice. Not an EPA consumer confidence report. Data may lag. Health guidelines can be stricter than legal MCLs. Filter claims are only as good as the listed NSF standard. Visitor ZIP is not stored.

## Public site constraints

Ankit said the site can be public and needs no protection. Still:

- No API keys in git
- LLM key in Vercel env
- ZIP only, no full street address in v1
- Rate-limit the generate endpoint
- No Bee transcript on the public site

## Open inputs from Patrick

1. Sample report/template he said he would send (City of Parker).
2. Real dropship SKUs and NSF certs.
3. Which health-guideline set is canonical (EWG vs CA PHG vs EPA HBWC vs custom).

Until those arrive, the POC uses labeled fixtures and placeholder products.

## Decision residue

- Hardest decision: treat ECHO as utility lookup, not as the occurrence table.
- Rejected: scrape EWG for live national data; MCL-only comparison (would hide Patrick's 13-of-40 example); auth wall.
- Least-confident assumption: Parker "13 of ~40" can be reproduced closely enough from public sources without Patrick's file.
