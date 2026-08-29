# Water filter report

Public ZIP search against live EPA drinking-water data, plus three retail filter packages.

Not medical advice. Checkout is on the seller site. Visitor ZIP codes are not stored.

## Live data

1. ZIP search uses EPA SDWIS via waterviolations.org, then falls back to EPA UCMR 5 ZIP files.
2. The selected PWS is enriched from EPA ECHO (identity, health flag, 3-year contaminants in violation).
3. Nationwide concentrations come from compact EPA warehouse files: UCMR 5 (2023-2025 PFAS and lithium) and Six-Year Review 4 (2012-2019 TTHM, HAA5, combined radium). These are EPA files, not a live concentration API.
4. Parker `CO0118040` still uses the sourced EWG 2013-2024 table so the sample PDF layout stays intact. Other ZIPs use the EPA warehouse. No invented 13-of-38 counts.

## Prices (28 Aug 2026)

- Base: iSpring RCC7AK $198.80 (Amazon)
- Gold: RCC7AK + Sprite Slim-Line 2 $240.38
- Platinum: Aquasana Rhino WH-1000 $999 + RCC7AK $1,197.80

## Local

```bash
npm install && npm test && npm run dev
```
