# Water filter report

Public ZIP search against live EPA drinking-water data, plus three retail filter packages.

Not medical advice. Checkout is on the seller site. Visitor ZIP codes are not stored.

## Live data

1. ZIP search uses EPA SDWIS via `https://waterviolations.org/api/v1/zip/{zip}` (public-domain EPA data, quarterly).
2. The selected PWS is enriched from EPA ECHO SDWA REST (`get_systems` + `get_qid`), including 3-year contaminants in violation.
3. Measured concentration tables are used only when a sourced fixture exists for that PWS (Parker `CO0118040`). Other ZIPs do not get invented ppb values.

## Prices (28 Aug 2026)

- Base: iSpring RCC7AK $198.80 (Amazon)
- Gold: RCC7AK + Sprite Slim-Line 2 $240.38
- Platinum: Aquasana Rhino WH-1000 $999 + RCC7AK $1,197.80

## Local

```bash
npm install && npm test && npm run dev
```
