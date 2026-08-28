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
      <main className="search-wrap">
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
  const years = report.period || "live EPA window";
  const chapterPhoto = ["/img/glass.jpg", "/img/kitchen.jpg", "/img/source.jpg"];

  return (
    <article>
      <header className="hero">
        <img src="/img/hero-tap.jpg" alt="Kitchen faucet running into a sink" />
        <div className="veil" />
        <div className="hero-copy">
          <Link className="nav" href="/">
            New search
          </Link>
          <h1 className="place">
            {city}
            {state ? `, ${state}` : ""}
          </h1>
          {hasOccurrence ? (
            <div className="stamp">
              {over} out of range
              <small>
                of {detected} detected · {years} · EWG health guidelines, not EPA MCLs
              </small>
            </div>
          ) : (
            <div className="stamp">
              EPA live
              <small>No sourced occurrence table. Fold-overs are not invented.</small>
            </div>
          )}
          <p>
            Independent read of {report.utility.name}. {report.utility.pwsId}.
          </p>
        </div>
      </header>

      <div className="film">
        <figure>
          <img src="/img/source.jpg" alt="High mountain water source" />
          <figcaption>Source water</figcaption>
        </figure>
        <figure>
          <img src="/img/glass.jpg" alt="Clear drinking glass of water" />
          <figcaption>Ingestion</figcaption>
        </figure>
        <figure>
          <img src="/img/shower.jpg" alt="Shower running" />
          <figcaption>Skin and steam</figcaption>
        </figure>
      </div>

      <div className="sheet">
        <dl className="facts">
          <div>
            <dt>Utility</dt>
            <dd>{report.utility.name}</dd>
          </div>
          <div>
            <dt>Period</dt>
            <dd>{years}</dd>
          </div>
          <div>
            <dt>Guideline set</dt>
            <dd>{report.guidelineSet || "EPA legal flags only"}</dd>
          </div>
          <div>
            <dt>PFAS over guidelines</dt>
            <dd>
              {hasOccurrence
                ? pfas.length
                  ? pfas.map((r) => `${r.name.split("(")[0].trim()} ${foldLabel(r.foldOver)}`).join("; ")
                  : "None in this sourced table"
                : "Not computed"}
            </dd>
          </div>
        </dl>

        {report.epaLive ? (
          <p>
            Live EPA ECHO: health flag {report.epaLive.healthFlag || "n/a"}; serious violator{" "}
            {report.epaLive.seriousViolator || "n/a"}. Contaminants in violation (3 years):{" "}
            {report.epaLive.contaminantsInViolation3yr.length
              ? report.epaLive.contaminantsInViolation3yr.map((c) => c.name).join("; ")
              : "none listed"}
            .{" "}
            {report.epaLive.sources[1] ? (
              <a href={report.epaLive.sources[1]}>EPA facility report</a>
            ) : null}
          </p>
        ) : null}

        {!hasOccurrence ? (
          <p className="gap-note">
            This ZIP has live EPA identity only. The 13-of-38 scoreboard exists when a sourced
            occurrence table is on file, as with Parker WSD.
          </p>
        ) : null}

        {primary.map((p, i) => (
          <section className={i % 2 ? "chapter reverse" : "chapter"} key={p.id}>
            <div className="photo">
              <img src={chapterPhoto[i] || "/img/glass.jpg"} alt="" />
            </div>
            <div>
              <h2>{p.label}</h2>
              <p className="muted">{p.blurb}</p>
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
            </div>
          </section>
        ))}

        {secondary.length > 0 ? (
          <p className="muted">
            Also grouped:{" "}
            {secondary
              .map((p) => `${p.label} (${p.rows.map((r) => foldLabel(r.foldOver)).join(", ")})`)
              .join(". ")}
          </p>
        ) : null}

        <h2>Where you meet the water</h2>
        <p className="muted">Typical drinking-water split. Not measured at this tap.</p>
        <div className="exposure">
          <figure>
            <img src="/img/glass.jpg" alt="Glass of water" />
            <figcaption>
              <strong>~60%</strong>
              Ingestion. Drinking, cooking, ice.
            </figcaption>
          </figure>
          <figure>
            <img src="/img/shower.jpg" alt="Shower" />
            <figcaption>
              <strong>~25%</strong>
              Skin. Showers, baths, hands.
            </figcaption>
          </figure>
          <figure>
            <img src="/img/hero-tap.jpg" alt="Running tap" />
            <figcaption>
              <strong>~15%</strong>
              Inhalation. Steam and aerosol.
            </figcaption>
          </figure>
        </div>

        <h2>What the utility report never tests</h2>
        <div className="blinds">
          <figure>
            <img src="/img/source.jpg" alt="" />
            <figcaption>Microplastics</figcaption>
          </figure>
          <figure>
            <img src="/img/kitchen.jpg" alt="" />
            <figcaption>Pharmaceuticals</figcaption>
          </figure>
          <figure>
            <img src="/img/glass.jpg" alt="" />
            <figcaption>BPA, hormones, pesticides</figcaption>
          </figure>
        </div>

        <section className="cta">
          <img src="/img/kitchen.jpg" alt="Kitchen interior" />
          <div className="veil" />
          <div className="cta-copy">
            <h2>Engineer your water</h2>
            <p>Diagnose. Treat. Verify. Retail packages below. Checkout is on the seller site.</p>
          </div>
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
      </div>
    </article>
  );
}
