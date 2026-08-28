# Water Quality Report App Implementation Plan

> **For Hermes:** Execute only after Ankit approves this plan. Do not create the GitHub repo, push, or deploy until that approval. Use this file as the yardstick.

**Goal:** Public Next.js site on Vercel that turns a ZIP into a water-risk report and three filter quotes, with LLM narrative over structured facts.

**Architecture:** Next.js App Router. Client ZIP form posts to `/api/report`. Server resolves the public water system via EPA ECHO SDWA REST, loads occurrence rows from a fixture (Parker first) or returns a partial live result, compares against a health-guideline table, matches a static NSF product catalog, then asks the LLM to write prose from that JSON. The page renders facts even if the LLM is down.

**Tech stack:** Next.js 15, TypeScript, Vercel serverless, Vercel AI SDK, xAI or OpenAI via env, Vitest, Playwright smoke.

**Spec:** `docs/superpowers/specs/2026-08-28-water-quality-report-app-design.md`

Wayfinder: skip. Destination is a single POC site. Decisions are in the spec. Work fits one implementation session after approval.

---

## Repo layout (create on execute)

```text
water-filter-report-poc/
  app/
    page.tsx
    report/[zip]/page.tsx
    api/report/route.ts
    api/health/route.ts
    layout.tsx
    globals.css
  lib/
    echo.ts
    compare.ts
    products.ts
    report-llm.ts
    types.ts
    disclaimer.ts
  data/
    guidelines.json
    fixtures/parker-co0118040.json
    catalog.json
  tests/
    compare.test.ts
    products.test.ts
    echo.test.ts
    api-report.test.ts
  playwright/
    smoke.spec.ts
  docs/
    ...
  .env.example
  README.md
  vercel.json
  package.json
```

Suggested public GitHub name: `water-filter-report-poc`. Confirm with Ankit before `gh repo create`.

---

## Units

| ID | Unit | Proof |
| --- | --- | --- |
| U1 | Types + health-guideline compare | `vitest tests/compare.test.ts` |
| U2 | Parker fixture reproduces scoreboard | fixture test: N-over and top-3 groups present |
| U3 | EPA ECHO ZIP -> PWS | mocked fetch test + one live smoke against Parker ZIP 80134 |
| U4 | NSF catalog match + 3 packages | `vitest tests/products.test.ts` |
| U5 | LLM narrative from JSON only | test rejects invented numbers; fallback without key |
| U6 | `/api/report` JSON contract | route handler test |
| U7 | UI: ZIP, report, products | Playwright: Parker demo path |
| U8 | GitHub public + Vercel public | live URL 200, unauthenticated, no secrets in repo |

---

### Task 1: Scaffold Next.js app

**Objective:** Empty runnable app with TypeScript and test runner.

**Files:**
- Create: `package.json`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `tsconfig.json`, `vitest.config.ts`, `.env.example`, `.gitignore`

**Step 1:** Create the app with `npx create-next-app@latest . --ts --app --eslint --src-dir=false --import-alias "@/*" --tailwind=false --yes` inside a new directory under `/home/ankit114/artifacts/water-filter-report-poc` **or** a fresh clone after repo create. Do not nest a second git repo over the docs already written; keep docs in the same tree.

**Step 2:** Add Vitest.

```bash
npm pkg set scripts.test="vitest run" && npm i -D vitest
```

**Step 3:** `npm test` on an empty `tests/sanity.test.ts` that asserts `1+1===2`. Expected: PASS.

**Step 4:** Commit locally only. No push until Ankit says so.

---

### Task 2: Domain types (U1 start)

**Objective:** One shared contract for the report JSON.

**Files:**
- Create: `lib/types.ts`
- Test: `tests/compare.test.ts` (types imported)

```ts
export type ContaminantResult = {
  name: string;
  cas?: string;
  value: number;
  unit: "ppb" | "ppm" | "ppt" | "pCi/L" | "mg/L";
  healthGuideline: number;
  healthGuidelineSource: string;
  mcl?: number | null;
  mclSource?: string;
  healthEffects: string[];
  exposure: Array<"consumption" | "dermal" | "inhalation">;
};

export type Utility = {
  pwsId: string;
  name: string;
  city?: string;
  state?: string;
  zip: string;
  source: "echo" | "fixture";
};

export type PackageId = "base" | "gold" | "platinum";
```

No extra fields "for later."

---

### Task 3: Compare engine (U1, U2)

**Objective:** Deterministic exceedance math. LLM never does this.

**Files:**
- Create: `lib/compare.ts`
- Create: `data/guidelines.json`
- Test: `tests/compare.test.ts`

**Step 1: failing tests**

```ts
import { describe, it, expect } from "vitest";
import { compareResults } from "../lib/compare";

describe("compareResults", () => {
  it("counts exceedances and fold-over", () => {
    const out = compareResults([
      {
        name: "Arsenic",
        value: 2,
        unit: "ppb",
        healthGuideline: 0.004,
        healthGuidelineSource: "EWG",
        mcl: 10,
        healthEffects: ["cancer"],
        exposure: ["consumption"],
      },
      {
        name: "Nitrate",
        value: 0.05,
        unit: "ppm",
        healthGuideline: 0.14,
        healthGuidelineSource: "EWG",
        mcl: 10,
        healthEffects: ["developmental"],
        exposure: ["consumption"],
      },
    ]);
    expect(out.reportedCount).toBe(2);
    expect(out.overGuidelineCount).toBe(1);
    expect(out.exceedances[0].name).toBe("Arsenic");
    expect(out.exceedances[0].foldOver).toBeCloseTo(500);
  });

  it("ranks top 3 health groups by contaminant count", () => {
    const out = compareResults([
      { name: "PFOA", value: 5, unit: "ppt", healthGuideline: 0.09, healthGuidelineSource: "x", healthEffects: ["cancer", "developmental"], exposure: ["consumption"] },
      { name: "Arsenic", value: 2, unit: "ppb", healthGuideline: 0.004, healthGuidelineSource: "x", healthEffects: ["cancer"], exposure: ["consumption"] },
      { name: "Radium", value: 6, unit: "pCi/L", healthGuideline: 0.05, healthGuidelineSource: "x", healthEffects: ["cancer"], exposure: ["consumption"] },
    ]);
    expect(out.topHealthGroups[0].id).toBe("cancer");
    expect(out.topHealthGroups.length).toBeLessThanOrEqual(3);
  });
});
```

**Step 2:** Run `npx vitest run tests/compare.test.ts`. Expected: FAIL, module missing.

**Step 3:** Implement `compareResults` only. Fold-over = value / healthGuideline when guideline > 0. Ignore non-detects if value is null.

**Step 4:** Re-run. Expected: PASS.

---

### Task 4: Parker fixture (U2)

**Objective:** Golden demo that matches Patrick's spoken example closely enough to demo.

**Files:**
- Create: `data/fixtures/parker-co0118040.json`
- Test: `tests/parker-fixture.test.ts`

Fixture must include:

- `pwsId`: `CO0118040`
- `name`: Parker Water & Sanitation District
- `demoZip`: `80134`
- `results`: public, sourced rows with `sourceUrl` on each or on the file
- `notes`: data vintage

Acceptance, not a lie: if public sources cannot reproduce "13 of ~40", store the real counts we can cite and put Patrick's 13/40 in `claimedFromCall` so the UI can say "Patrick's sample report cited 13 of ~40; this demo uses N of M from public sources." Do not fake 13.

**Step 1:** Write the fixture from public CCR / published tap-water pages. Cite URLs in the JSON.

**Step 2:** Test that `compareResults(fixture.results)` returns `reportedCount >= 1` and `topHealthGroups` includes at least one of `cancer`, `liver`, `developmental` when those effects are in the fixture.

---

### Task 5: EPA ECHO client (U3)

**Objective:** ZIP -> public water system. No key.

**Files:**
- Create: `lib/echo.ts`
- Test: `tests/echo.test.ts`

Endpoint (confirm at execute; do not invent if it 404s):

`GET https://echodata.epa.gov/echo/sdw_rest_services.get_systems?output=JSON&p_zip={zip}`

**Step 1:** Mock `fetch` to return one community water system. Assert `pwsId` and name map.

**Step 2:** If ZIP has multiple systems, pick community water system with largest population served. If none, return a structured error `no_utility`.

**Step 3 (live, optional in CI):** skip unless `RUN_LIVE_ECHO=1`. Live check: ZIP `80134` should include `CO0118040` or a Parker system. If live EPA is down, fixture path still works.

Do not log full street addresses. ZIP only.

---

### Task 6: Product catalog and matcher (U4)

**Objective:** Three packages from NSF coverage vs exceedances.

**Files:**
- Create: `data/catalog.json`
- Create: `lib/products.ts`
- Test: `tests/products.test.ts`

Catalog shape:

```json
{
  "items": [
    {
      "id": "ro-undersink-1",
      "name": "Placeholder under-sink RO",
      "placeholder": true,
      "nsf": ["58", "53"],
      "treats": ["arsenic", "pfoa", "pfos", "nitrate", "radium"],
      "slot": "undersink_ro",
      "priceUsd": 799
    }
  ],
  "packages": {
    "base": ["undersink_ro"],
    "gold": ["undersink_ro", "shower_carbon"],
    "platinum": ["whole_home", "undersink_ro"]
  }
}
```

Matcher: a package "covers" an exceedance if any item in it lists that contaminant in `treats`. Quote = sum of item prices. Mark uncovered contaminants on the quote.

ASR "NSF41" is not a planning input. Use NSF/ANSI 42, 53, 58, 401, and a PFAS claim only when `nsf` lists a real standard.

---

### Task 7: LLM report writer (U5)

**Objective:** Narrative from JSON. No new numbers.

**Files:**
- Create: `lib/report-llm.ts`
- Create: `lib/disclaimer.ts`
- Test: `tests/report-llm.test.ts`

Prompt rules:

- System: "Use only facts in the JSON. If a study count is missing, do not invent one. Do not give medical advice."
- User: the compare JSON + utility + packages.
- Output: `{ headline, summaryHtml, topGroupsHtml, vectorsHtml }`
- If `process.env.LLM_API_KEY` is missing, return `null` and let UI use templates.

**Step 1:** Unit test with a fake provider that records the prompt and returns fixed HTML.

**Step 2:** Guard: if model output contains a number that is not in the JSON, discard narrative and fall back.

Provider: Vercel AI SDK. Model from `LLM_MODEL` env. Default `grok-4-fast` or whatever Ankit pins at execute. Do not hardcode a paid model without Ankit's choice.

---

### Task 8: API route (U6)

**Objective:** One POST endpoint.

**Files:**
- Create: `app/api/report/route.ts`
- Create: `app/api/health/route.ts`
- Test: `tests/api-report.test.ts`

`POST /api/report` body: `{ zip: string }`
`200` body:

```ts
{
  utility: Utility;
  compare: CompareOutput;
  packages: QuotePackage[];
  narrative: Narrative | null;
  disclaimer: string;
  dataQuality: "fixture" | "echo_partial" | "live";
}
```

Rules:

- ZIP must be 5 digits.
- `80134` always can complete via Parker fixture even if ECHO fails.
- Rate limit: in-memory 10 req / IP / 10 min on the serverless instance (best-effort).
- Never echo the LLM key.

`GET /api/health` returns `{ ok: true }`.

---

### Task 9: UI (U7)

**Objective:** Two screens. Plain, readable, not a marketing toy.

**Files:**
- Modify: `app/page.tsx`
- Create: `app/report/[zip]/page.tsx`
- Create: `app/layout.tsx` metadata title `Water quality report POC`

Landing:

- H1: Check your water. Get a filter quote.
- ZIP field + Submit
- Button: Try Parker, CO
- One-line: Public EPA utility lookup. Health-guideline compare. Not medical advice.

Report:

- Utility name and PWS ID
- Scoreboard: "N of M contaminants outside health guidelines"
- Top 3 groups
- Table of exceedances (name, value, guideline, fold-over)
- Exposure vectors
- Three quote cards
- Disclaimer
- Print CSS

No Bee names. No Patrick/Ankit copy on the public page.

---

### Task 10: Playwright smoke (U7)

**Files:**
- Create: `playwright/smoke.spec.ts`

```ts
test("Parker demo produces a report", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /parker/i }).click();
  await expect(page.getByText(/health guidelines/i)).toBeVisible();
  await expect(page.getByText(/platinum|gold|base/i)).toBeVisible();
});
```

Run: `npx playwright test`. Expected: PASS locally.

---

### Task 11: README, env, privacy (U8 prep)

**Files:**
- Create: `README.md`
- Create: `.env.example`

```text
LLM_API_KEY=
LLM_MODEL=
LLM_BASE_URL=
```

README must say: public POC, no auth, ZIP not stored, not medical advice, fixture vs live data.

---

### Task 12: GitHub + Vercel (U8), gated

Do this only after Ankit says: "create the public repo and deploy".

```bash
gh repo create water-filter-report-poc --public --source=. --remote=origin --push
```

Then Vercel project, public, Deployment Protection off for this project only, env `LLM_API_KEY` set from a secret manager into Vercel env (never printed).

Verify:

```bash
curl -sS -o /tmp/wfr.html -w "%{http_code}" https://<prod-url>/
```

Expect 200 without auth cookies. Fetch `/api/health`. Confirm `.env` is not in git.

Rollback: `vercel rollback` and `gh repo delete` only with explicit approval.

---

## Verification (after execute)

- `npx vitest run` all unit tests pass
- Playwright Parker path pass
- Unauthenticated GET `/` is 200
- Report JSON for 80134 has utility, compare, three packages
- `rg -n "LLM_API_KEY|sk-|xai-" --glob '!.env.example'` empty in repo
- Ad-hoc docs verifier already run on this plan

## Execution offer

Plan is saved. Implementation, GitHub create, and Vercel deploy stay stopped until Ankit approves.
