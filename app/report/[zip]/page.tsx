import { QualityGauge } from "@/app/QualityGauge";
import { barWidth, buildPathways, foldLabel, pfasOver } from "@/lib/assessment";
import { buildReport } from "@/lib/report";
import { scoreWaterQuality } from "@/lib/score";
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
  const pfas = pfasOver(report.compare);
  const hasOccurrence = report.compare.reportedCount > 0;
  const over = report.compare.overGuidelineCount;
  const detected = report.detectedCount || report.compare.reportedCount;
  const within = Math.max(detected - over, 0);
  const years = report.period || "live EPA window";
  const maxFold = Math.max(...report.compare.exceedances.map((r) => r.foldOver), 1);
  const ranked = [...report.compare.exceedances].sort((a, b) => b.foldOver - a.foldOver);
  const profile = scoreWaterQuality(
    zip,
    report.utility.pwsId,
    report.utility.name,
    report.compare,
    report.detectedCount,
    report.epaLive
  );
  const epaClean =
    report.epaLive &&
    /^(no|n)?$/i.test((report.epaLive.healthFlag || "no").trim()) &&
    /^(no|n)?$/i.test((report.epaLive.seriousViolator || "no").trim());
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
        <section className="profile">
          <QualityGauge value={profile.quality} band={profile.band} />
          <div>
            <h2>Risk profile for {zip}</h2>
            <p>{profile.headline}</p>
            <p className="muted">
              100 is best: no EWG health-guideline exceedances and no EPA health/serious flags.
              Basis: {profile.basis}. Band: {profile.band}.
            </p>
            <ul>
              {profile.drivers.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        </section>

        <div className="andons">
          <div className={epaClean ? "lamp go" : "lamp wait"}>
            <b>{epaClean ? "EPA legal" : "EPA watch"}</b>
            <span>
              Health flag {report.epaLive?.healthFlag || "n/a"}. Serious violator{" "}
              {report.epaLive?.seriousViolator || "n/a"}.
            </span>
          </div>
          <div className={hasOccurrence && over > 0 ? "lamp stop" : "lamp go"}>
            <b>{hasOccurrence && over > 0 ? "Health guide fail" : "Health guide"}</b>
            <span>
              {hasOccurrence
                ? `${over} of ${detected} over EWG guidelines`
                : "No sourced health-guideline table for this PWS"}
            </span>
          </div>
        </div>

        {hasOccurrence ? (
          <div
            className="mix"
            role="img"
            aria-label={`${over} of ${detected} out of range`}
          >
            <span className="mix-bad" style={{ flex: over }} />
            <span className="mix-ok" style={{ flex: within }} />
          </div>
        ) : (
          <p className="gap-note">
            This ZIP has live EPA identity only. The 13-of-38 scoreboard exists when a sourced
            occurrence table is on file, as with Parker WSD.
          </p>
        )}

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

        {ranked.length > 0 ? (
          <>
            <h2>What is out, longest bar is worst</h2>
            <ol className="board">
              {ranked.map((row) => (
                <li key={row.name}>
                  <span className="name">{row.name}</span>
                  <span className="track">
                    <span className="fill" style={{ width: `${barWidth(row.foldOver, maxFold)}%` }} />
                  </span>
                  <span className="x">{foldLabel(row.foldOver)}</span>
                </li>
              ))}
            </ol>
          </>
        ) : null}

        {report.epaLive?.sources[1] ? (
          <p className="muted">
            <a href={report.epaLive.sources[1]}>EPA detailed facility report</a>
          </p>
        ) : null}

        {primary.map((p, i) => (
          <section className={i % 2 ? "chapter reverse" : "chapter"} key={p.id}>
            <div className="photo">
              <img src={chapterPhoto[i] || "/img/glass.jpg"} alt="" />
            </div>
            <div>
              <h2>{p.label}</h2>
              <ol className="board">
                {p.rows.slice(0, 8).map((row) => (
                  <li key={row.name}>
                    <span className="name">{row.name}</span>
                    <span className="track">
                      <span className="fill" style={{ width: `${barWidth(row.foldOver, maxFold)}%` }} />
                    </span>
                    <span className="x">{foldLabel(row.foldOver)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ))}

        <h2>Where you meet the water</h2>
        <p className="muted">Typical drinking-water split. Not measured at this tap.</p>
        <div className="exposure">
          <figure>
            <img src="/img/glass.jpg" alt="Glass of water" />
            <figcaption>
              <strong>~60%</strong>
              Ingestion
            </figcaption>
          </figure>
          <figure>
            <img src="/img/shower.jpg" alt="Shower" />
            <figcaption>
              <strong>~25%</strong>
              Skin
            </figcaption>
          </figure>
          <figure>
            <img src="/img/hero-tap.jpg" alt="Running tap" />
            <figcaption>
              <strong>~15%</strong>
              Steam
            </figcaption>
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
