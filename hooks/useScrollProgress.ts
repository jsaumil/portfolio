"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { LAST, runtime, SEGMENT_VH } from "@/lib/journey";

let lenisInstance: Lenis | null = null;

/** Smooth scroll to an exact journey stop. */
export function scrollToStop(stop: number, immediate = false) {
  const y = (stop * SEGMENT_VH * window.innerHeight) / 100;
  if (lenisInstance) lenisInstance.scrollTo(y, { immediate, duration: Math.min(1.2 + Math.abs(stop - runtime.u) * 0.5, 4) });
  else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
}

/**
 * Lenis smooth scroll -> normalised progress -> journey target (in stops).
 * Writes to the mutable runtime only; never triggers React renders.
 */
export function useScrollProgress() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    runtime.reducedMotion = reduce;

    const lenis = new Lenis({
      lerp: reduce ? 1 : 0.085,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      syncTouch: false,
      autoRaf: true,
    });
    lenisInstance = lenis;

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? lenis.scroll / max : 0;
      runtime.target = Math.min(Math.max(p, 0), 1) * LAST;
    };
    update();
    lenis.on("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      lenis.off("scroll", update);
      window.removeEventListener("resize", update);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);
}
