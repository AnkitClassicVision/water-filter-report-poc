import { buildReport } from "@/lib/report";
import type { ReportResponse } from "@/lib/types";
import Link from "next/link";

function money(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

function fold(n: number): string {
  if (n >= 10) return `${n.toFixed(0)}x`;
  if (n >= 1) return `${n.toFixed(1)}x`;
  return n.toFixed(2);
}

export default async function ReportPage({ params }: { params: Promise<{ zip: string }> }) {
  const { zip } = await params;
  const out = await buildReport(zip);

  if ("error" in out) {
    return (
      <main>
        <h1>No report</h1>
        <p>{out.error}</p>
        <p>
          <Link href="/">Try another ZIP</Link>
        </p>
      </main>
    );
  }

  const report = out as ReportResponse;

  return (
    <main>
      <p className="muted">
        <Link href="/">New ZIP</Link>
      </p>
      <h1>{report.utility.name}</h1>
      <p className="muted">
        PWS {report.utility.pwsId} · ZIP {report.utility.zip} · data {report.dataQuality}
      </p>
      <p className="score">
        {report.compare.overGuidelineCount} of {report.compare.reportedCount} cited
        contaminants sit outside health guidelines
      </p>
      {report.claimedFromCall ? <p className="muted">{report.claimedFromCall}</p> : null}

      {report.narrative ? (
        <>
          <h2>{report.narrative.headline}</h2>
          <div dangerouslySetInnerHTML={{ __html: report.narrative.summaryHtml }} />
          <div dangerouslySetInnerHTML={{ __html: report.narrative.topGroupsHtml }} />
        </>
      ) : null}

      <h2>Top concern groups</h2>
      {report.compare.topHealthGroups.length === 0 ? (
        <p>No exceedance groups in this cited set.</p>
      ) : (
        <ul>
          {report.compare.topHealthGroups.map((g) => (
            <li key={g.id}>
              <strong>{g.label}</strong>: {g.contaminants.join(", ")}
            </li>
          ))}
        </ul>
      )}

      <h2>Exceedances</h2>
      {report.compare.exceedances.length === 0 ? (
        <p>No cited results exceed the labeled health guidelines.</p>
      ) : (
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
      )}

      <h2>Exposure routes</h2>
      {report.narrative ? (
        <div dangerouslySetInnerHTML={{ __html: report.narrative.vectorsHtml }} />
      ) : (
        <p>Consumption, skin contact, and inhalation.</p>
      )}

      <h2>Filter packages</h2>
      <p className="muted">Placeholder dropship SKUs. NSF claims are catalog labels, not live cert lookups.</p>
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
                  {item.name} (NSF {item.nsf.join(", ")})
                </li>
              ))}
            </ul>
            <p>Covers: {pkg.covered.length ? pkg.covered.join("; ") : "none of the exceedances"}</p>
          </article>
        ))}
      </div>

      <p className="disclaimer">{report.disclaimer}</p>
    </main>
  );
}
