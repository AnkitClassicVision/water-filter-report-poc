import type { QualityBand } from "@/lib/score";

export function QualityGauge({ value, band }: { value: number; band: QualityBand }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);
  const color = band === "good" ? "#1f6b4a" : band === "watch" ? "#b45309" : "#9a3412";
  return (
    <svg className="gauge" viewBox="0 0 140 140" role="img" aria-label={`Water quality ${value} of 100. 100 is no issues.`}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="color-mix(in oklab, #1c2a32 14%, #d9e0e4)" strokeWidth="12" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="66" textAnchor="middle" className="gauge-n">
        {value}
      </text>
      <text x="70" y="86" textAnchor="middle" className="gauge-l">
        of 100
      </text>
    </svg>
  );
}
