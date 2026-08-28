# Water filter report POC

Public ZIP-to-water-risk report and three NSF filter quotes.

Not medical advice. Not an EPA Consumer Confidence Report. Visitor ZIP codes are not stored.

## What it does

1. Visitor enters a US ZIP (or clicks Try Parker, CO).
2. The app compares cited contaminant results to labeled health guidelines.
3. It writes a consumer report and shows Base / Gold / Platinum placeholder quotes.

Parker, CO (`80134`, PWS `CO0118040`) uses a checked-in fixture from public CCR and published tap-water figures. Other ZIPs try EPA ECHO for the utility name. Occurrence tables are not invented. If no fixture exists, the report says so.

The LLM, when `LLM_API_KEY` is set, writes prose from the JSON fact packet. If the key is missing or the model invents numbers, the page uses a template.

## Local

```bash
npm install && npm test && npm run dev
```

Open `http://localhost:3000`.

## Env

Copy `.env.example` to `.env.local`. Do not commit secrets.

- `LLM_API_KEY` optional
- `LLM_MODEL` optional, default `grok-4-fast`
- `LLM_BASE_URL` optional, default `https://api.x.ai/v1`

## Data honesty

Patrick's spoken sample cited 13 of about 40 contaminants outside health guidelines. That file was not supplied. The Parker demo reports only cited public rows and prints that gap on the page.
