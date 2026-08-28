"use client";

import { FormEvent, useMemo, useState } from "react";
import type { SearchHit } from "@/lib/types";

export default function HomePage() {
  const [zip, setZip] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [systems, setSystems] = useState<SearchHit[] | null>(null);

  async function runSearch(nextZip: string) {
    const z = nextZip.trim();
    if (!/^\d{5}$/.test(z)) {
      setError("Enter a 5-digit US ZIP.");
      return;
    }
    setError("");
    setLoading(true);
    setSystems(null);
    try {
      const res = await fetch(`/api/search?zip=${z}`);
      const data = (await res.json()) as { systems?: SearchHit[]; error?: string };
      if (!res.ok) {
        setError(data.error || "Search failed.");
        return;
      }
      setSystems(data.systems || []);
    } catch {
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void runSearch(zip);
  }

  const filtered = useMemo(() => {
    const list = systems || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) =>
      `${s.name} ${s.pwsId} ${s.city || ""} ${s.type}`.toLowerCase().includes(q)
    );
  }, [systems, query]);

  return (
    <main>
      <h1>Search your water. Buy a filter package.</h1>
      <p className="muted">
        Live EPA SDWIS/ECHO lookup by ZIP. Retail prices as of 28 Aug 2026. Not medical advice.
      </p>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          inputMode="numeric"
          name="zip"
          aria-label="ZIP code"
          placeholder="ZIP code"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          maxLength={5}
        />
        <button type="submit">{loading ? "Searching..." : "Search"}</button>
        <button type="button" className="secondary" onClick={() => void runSearch("80134")}>
          Try Parker, CO
        </button>
      </form>
      {error ? <p className="warn">{error}</p> : null}

      {systems ? (
        <>
          <h2>{systems.length} public water systems</h2>
          <input
            type="text"
            aria-label="Filter systems"
            placeholder="Filter by name, PWS ID, or type"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {filtered.length === 0 ? (
            <p>No systems match that filter.</p>
          ) : (
            <ul className="results">
              {filtered.map((s) => (
                <li key={s.pwsId}>
                  <a href={`/report/${s.zip}?pws=${encodeURIComponent(s.pwsId)}`}>
                    <strong>{s.name}</strong>
                  </a>
                  <div className="muted">
                    {s.pwsId} · {s.type} · pop {s.population.toLocaleString("en-US")} · health-based
                    violations {s.healthBasedViolations}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </main>
  );
}
