import { buildReport } from "@/lib/report";
import type { ReportResponse } from "@/lib/types";
import Link from "next/link";

function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fold(n: number): string {
  if (n >= 10) return `${n.toFixed(0)}x`;
  if (n >= 1) return `${n.toFixed(1)}x`;
  return n.toFixed(2);
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
      <main>
        <h1>No report</h1>
        <p>{out.error}</p>
        <p>
          <Link href="/">Search another ZIP</Link>
        </p>
      </main>
    );
  }

  const report = out as ReportResponse;
  const live = report.epaLive;

  return (
    <main>
      <p className="muted">
        <Link href="/">New search</Link>
      </p>
      <h1>{report.utility.name}</h1>
      <p className="muted">
        PWS {report.utility.pwsId} · ZIP {report.utility.zip} · live EPA {report.dataQuality}
        {report.utility.populationServed
          ? ` · pop ${report.utility.populationServed.toLocaleString("en-US")}`
          : ""}
      </p>

      {live ? (
        <>
          <h2>Live EPA ECHO status</h2>
          <p>
            Health flag: {live.healthFlag || "n/a"}. Serious violator: {live.seriousViolator || "n/a"}.
            Activity: {live.activity || "n/a"}.
          </p>
          <p>
            Contaminants in violation (3 years):{" "}
            {live.contaminantsInViolation3yr.length
              ? live.contaminantsInViolation3yr.map((c) => c.name).join("; ")
              : "none listed"}
          </p>
          {live.sources[1] ? (
            <p className="muted">
              <a href={live.sources[1]}>EPA detailed facility report</a>
            </p>
          ) : null}
        </>
      ) : (
        <p>ECHO live fields were not returned for this system. SDWIS identity is still live.</p>
      )}

      {report.compare.reportedCount > 0 ? (
        <>
          <p className="score">
            {report.compare.overGuidelineCount} of {report.compare.reportedCount} cited measured
            results sit outside health guidelines
          </p>
          {report.claimedFromCall ? <p className="muted">{report.claimedFromCall}</p> : null}
        </>
      ) : (
        <p className="muted">
          No sourced concentration table for this PWS. The EPA violation list above is the live
          result. Concentrations are not invented.
        </p>
      )}

      {report.narrative ? (
        <>
          <h2>{report.narrative.headline}</h2>
          <div dangerouslySetInnerHTML={{ __html: report.narrative.summaryHtml }} />
        </>
      ) : null}

      {report.compare.exceedances.length > 0 ? (
        <>
          <h2>Measured exceedances</h2>
          <table>
            <thead>
              <tr>
                <th>Contaminant</th>
                <th>Result</th>
                <th>Guideline</th>
                <th>Fold over</th>
              </tr>
            </thead>
            <tbody>
              {report.compare.exceedances.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>
                    {row.value} {row.unit}
                  </td>
                  <td>
                    {row.healthGuideline} {row.unit}
                    <div className="muted">{row.healthGuidelineSource}</div>
                  </td>
                  <td>{fold(row.foldOver)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      <h2>Filter packages for sale</h2>
      <p className="muted">
        Retail checkout happens on the seller site. Prices are public list prices dated 28 Aug 2026.
      </p>
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
                  {item.name} · {money(item.priceUsd)} · NSF {item.nsf.join(", ")}
                  {item.buyUrl ? (
                    <>
                      {" "}
                      <a href={item.buyUrl} rel="noopener noreferrer">
                        Buy
                      </a>
                    </>
                  ) : null}
                  {item.priceSource ? <div className="muted">{item.priceSource}</div> : null}
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
    </main>
  );
}
