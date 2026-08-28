import { buildPathways, foldLabel, pfasOver } from "@/lib/assessment";
import { buildReport } from "@/lib/report";
import type { ReportResponse } from "@/lib/types";
import Link from "next/link";

function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function ReportPage({
  params,
  searchParams
}: {
  params: Promise<{ zip: string }>;
  searchParams: Promise<{ pws?: string }>;
}) {
  const { zip } = await params;
  const sp = await searchParams;
  const out = await buildReport(zip, { pwsId: sp.pws });

  if ("error" in out) {
    return (
      <main className="err">
        <h1>No report</h1>
        <p>{out.error}</p>
        <p>
          <Link href="/">Search another ZIP</Link>
        </p>
      </main>
    );
  }

  const report = out as ReportResponse;
  const city = report.utility.city || report.utility.name;
  const state = report.utility.state || "";
  const pathways = buildPathways(report.compare);
  const primary = pathways.filter((p) => ["cancer", "liver", "developmental"].includes(p.id));
  const secondary = pathways.filter((p) => ["immune", "genotoxic"].includes(p.id));
  const pfas = pfasOver(report.compare);
  const hasOccurrence = report.compare.reportedCount > 0;
  const over = report.compare.overGuidelineCount;
  const detected = report.detectedCount || report.compare.reportedCount;
  const within = Math.max(detected - over, 0);
  const years = report.period || "live EPA window";

  return (
    <article className="assessment">
      <p className="kicker">
        <span>Water health assessment {report.utility.pwsId}</span>
        <Link href="/">New search</Link>
      </p>
      <h1 className="place">
        {city}
        {state ? `, ${state}` : ""}
      </h1>
      <p className="lede">Of utility test data reviewed. Independent analysis of municipal drinking water.</p>

      <div className="meta-grid">
        <div>
          {hasOccurrence ? (
            <div className="scoreboard">
              <div className="stat">
                <span className="n">{over}</span>
                Out of range
                <small>Exceed at least one health-based guideline for long-term exposure.</small>
              </div>
              <div className="stat ok">
                <span className="n">{within}</span>
                Within range
                <small>Detected at levels below published health guidelines, or not in this sourced table.</small>
              </div>
              <div className="stat">
                <span className="n">{pfas.length}</span>
                PFAS compounds
                <small>
                  {pfas.length
                    ? pfas.map((r) => `${r.name.split("(")[0].trim()} (${foldLabel(r.foldOver)})`).join(" and ")
                    : "None over guidelines in this sourced table."}
                </small>
              </div>
              <div className="stat ok">
                <span className="n">{detected}</span>
                Analytes
                <small>Contaminants detected in the sourced window.</small>
              </div>
            </div>
          ) : (
            <div className="stat">
              <span className="n">EPA</span>
              Live identity only
              <small>
                No sourced occurrence table for this PWS. Fold-overs are not invented. EPA ECHO
                contaminants in violation are listed below.
              </small>
            </div>
          )}
        </div>
        <dl className="facts">
          <dt>Location</dt>
          <dd>
            {city}
            {state ? `, ${state}` : ""}
          </dd>
          <dt>Utility</dt>
          <dd>{report.utility.name}</dd>
          <dt>Period</dt>
          <dd>{years}</dd>
          <dt>Sources</dt>
          <dd>
            {hasOccurrence ? "U.S. EPA identity plus EWG health-guideline table" : "U.S. EPA SDWIS / ECHO"}
          </dd>
          <dt>Guideline set</dt>
          <dd>{report.guidelineSet || "EPA legal limits and ECHO violation flags only"}</dd>
        </dl>
      </div>

      {hasOccurrence ? (
        <p className="analytes">
          <b>{detected}</b> contaminants detected · {over} outside EWG health guidelines · EPA legal
          compliance is a separate fact
        </p>
      ) : null}

      {report.epaLive ? (
        <section>
          <h2>Live EPA ECHO status</h2>
          <p>
            Health flag: {report.epaLive.healthFlag || "n/a"}. Serious violator:{" "}
            {report.epaLive.seriousViolator || "n/a"}. Activity: {report.epaLive.activity || "n/a"}.
          </p>
          <p>
            Contaminants in violation (3 years):{" "}
            {report.epaLive.contaminantsInViolation3yr.length
              ? report.epaLive.contaminantsInViolation3yr.map((c) => c.name).join("; ")
              : "none listed"}
          </p>
          {report.epaLive.sources[1] ? (
            <p className="muted">
              <a href={report.epaLive.sources[1]}>EPA detailed facility report</a>
            </p>
          ) : null}
        </section>
      ) : null}

      <h2>Health risk pathways</h2>
      <p className="muted">What these exceedances are linked to. Fold-over vs EWG / CA PHG, not EPA MCL.</p>
      {primary.length === 0 ? (
        <p>No sourced health-guideline exceedances to group.</p>
      ) : (
        primary.map((p, i) => (
          <section className="pathway" key={p.id}>
            <div className="num">{String(i + 1).padStart(2, "0")}</div>
            <div>
              <h3>{p.label}</h3>
              <p className="muted">{p.blurb}</p>
              <p>
                <b>{p.rows.length}</b> linked contributors
              </p>
            </div>
            <table className="contrib">
              <tbody>
                {p.rows.slice(0, 8).map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{foldLabel(row.foldOver)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))
      )}

      {secondary.length > 0 ? (
        <>
          <h2>Secondary pathways</h2>
          <div className="routes">
            {secondary.map((p) => (
              <div className="route" key={p.id}>
                <div className="pct">{p.rows.length}</div>
                <div>{p.label}</div>
                <p className="muted">{p.rows.map((r) => `${r.name} ${foldLabel(r.foldOver)}`).join("; ")}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <h2>Exposure routes</h2>
      <p className="muted">Typical drinking-water split. Not measured at this tap.</p>
      <div className="routes">
        <div className="route">
          <div className="pct">~60%</div>
          Ingestion
          <p className="muted">Drinking, cooking, coffee, ice.</p>
        </div>
        <div className="route">
          <div className="pct">~25%</div>
          Dermal
          <p className="muted">Skin during showers, baths, hand washing.</p>
        </div>
        <div className="route">
          <div className="pct">~15%</div>
          Inhalation
          <p className="muted">Steam and aerosol in the shower.</p>
        </div>
      </div>

      <h2>Blind spots</h2>
      <p className="muted">
        Unregulated contaminants EPA does not require in the utility report. Not a test result for
        this ZIP.
      </p>
      <div className="blinds">
        <div>01 Microplastics</div>
        <div>02 Pharmaceuticals</div>
        <div>03 Bisphenol A (BPA)</div>
        <div>04 Hormones</div>
        <div>05 Pesticides</div>
        <div>06 Endocrine disruptors</div>
      </div>

      <section className="cta">
        <h2>Engineer your water</h2>
        <p>
          Diagnose. Treat. Verify. One system matched to this contaminant profile. Retail packages
          below. Checkout is on the seller site.
        </p>
      </section>

      <div className="packages">
        {report.packages.map((pkg) => (
          <article className="pack" key={pkg.id}>
            <h3>{pkg.label}</h3>
            <p>
              <strong>{money(pkg.priceUsd)}</strong>
            </p>
            <ul>
              {pkg.items.map((item) => (
                <li key={item.id}>
                  {item.name} · {money(item.priceUsd)}
                  {item.buyUrl ? (
                    <>
                      {" "}
                      <a href={item.buyUrl} rel="noopener noreferrer">
                        Buy
                      </a>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {report.systems && report.systems.length > 1 ? (
        <>
          <h2>Other systems in this ZIP</h2>
          <ul>
            {report.systems.slice(0, 12).map((s) => (
              <li key={s.pwsId}>
                <Link href={`/report/${zip}?pws=${encodeURIComponent(s.pwsId)}`}>{s.name}</Link>
                <span className="muted"> · {s.pwsId}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="disclaimer">{report.disclaimer}</p>
    </article>
  );
}
