import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Atkinson_Hyperlegible, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700", "800"]
});

const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "700"]
});

export const metadata: Metadata = {
  title: "Water health assessment",
  description: "ZIP to water-health assessment and NSF filter quote. Not medical advice."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {/*
THESIS: A water health assessment should feel like a home diagnostic you can sell from, not a dashboard of metric boxes. Photography of water in use carries the risk; numbers sit on the image.
OWN-WORLD: Wet-stone print insert. Cool river-slate ink on limestone ground. Full-bleed kitchen, glass, shower, and source photos. Bricolage Grotesque display, Atkinson Hyperlegible body. Rust only for out-of-range proof.
STORY: Visitor sees the town in water, believes the fold-overs because EPA vs EWG is labeled, then buys a package.
FIRST VIEWPORT: Full-bleed tap photo, town name large on the left, a single rust stamp with the out-of-range count on the photo, search link top-right. No four-up cards.
FORM: Marketing-executive photography report. Brief-pinned: imaging versus blocks. Seed: user-pinned.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
        */}
        {children}
      </body>
    </html>
  );
}
