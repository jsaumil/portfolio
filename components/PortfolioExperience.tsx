"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ContentLayer } from "@/components/portfolio/ContentLayer";
import { StaticPortfolio } from "@/components/portfolio/StaticPortfolio";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { stops } from "@/lib/graph";
import { LAST, SEGMENT_VH } from "@/lib/journey";
import { detectQuality, type Quality } from "@/lib/quality";

// Three.js is large; load it after first paint.
const PortfolioScene = dynamic(() => import("@/components/3d/PortfolioScene"), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function PortfolioExperience() {
  const [quality, setQuality] = useState<Quality | null>(null);
  const [webgl, setWebgl] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Client-only capability checks; runs once after hydration.
    const ok = hasWebGL();
    setWebgl(ok);
    if (ok) setQuality(detectQuality());
  }, []);

  if (!webgl) return <StaticPortfolio />;
  return <Journey quality={quality} ready={ready} onReady={() => setReady(true)} />;
}

function Journey({ quality, ready, onReady }: { quality: Quality | null; ready: boolean; onReady: () => void }) {
  useScrollProgress();

  return (
    <>
      <div className={ready ? "canvas canvas--ready" : "canvas"} aria-hidden>
        {quality && <PortfolioScene initialQuality={quality} onReady={onReady} />}
      </div>

      <div className={ready ? "loader loader--done" : "loader"} aria-hidden>
        <div className="loader__line" />
        <p className="meta">Connecting nodes</p>
      </div>

      <ContentLayer />

      {/* Scroll track. Anchors make every stop linkable (/#projects etc.). */}
      <main className="track" style={{ height: `calc(${LAST * SEGMENT_VH}vh + 100vh)` }}>
        {stops.map((s) => (
          <span key={s.id} id={s.id} className="track__anchor" style={{ top: `${s.index * SEGMENT_VH}vh` }} />
        ))}
      </main>
    </>
  );
}
