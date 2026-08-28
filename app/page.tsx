"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");

  function go(nextZip: string) {
    const z = nextZip.trim();
    if (!/^\d{5}$/.test(z)) {
      setError("Enter a 5-digit US ZIP.");
      return;
    }
    setError("");
    router.push(`/report/${z}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go(zip);
  }

  return (
    <main>
      <h1>Check your water. Get a filter quote.</h1>
      <p className="muted">
        Public EPA utility lookup. Health-guideline compare. Not medical advice.
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
        <button type="submit">Run report</button>
        <button type="button" className="secondary" onClick={() => go("80134")}>
          Try Parker, CO
        </button>
      </form>
      {error ? <p className="warn">{error}</p> : null}
    </main>
  );
}
