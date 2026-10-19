export type Tier = "high" | "medium" | "low";

export interface Quality {
  tier: Tier;
  mobile: boolean;
  dpr: [number, number];
  dust: number;
  ambientNodes: number;
  sparks: number;
  sphereSegments: number;
  postfx: "full" | "lite";
}

export function detectQuality(): Quality {
  if (typeof window === "undefined") return presets.high(false);
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 768;
  const mobile = coarse || narrow;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (mobile) return presets.low(true);
  if (cores <= 4 || mem <= 4) return presets.medium(false);
  return presets.high(false);
}

export const presets = {
  high: (mobile: boolean): Quality => ({
    tier: "high",
    mobile,
    dpr: [1, 2],
    dust: 900,
    ambientNodes: 150,
    sparks: 90,
    sphereSegments: 48,
    postfx: "full",
  }),
  medium: (mobile: boolean): Quality => ({
    tier: "medium",
    mobile,
    dpr: [1, 1.5],
    dust: 550,
    ambientNodes: 110,
    sparks: 60,
    sphereSegments: 36,
    postfx: "full",
  }),
  low: (mobile: boolean): Quality => ({
    tier: "low",
    mobile,
    dpr: [1, 1.5],
    dust: 260,
    ambientNodes: 70,
    sparks: 36,
    sphereSegments: 28,
    postfx: "lite",
  }),
};

export const downgrade = (q: Quality): Quality =>
  q.tier === "high" ? presets.medium(q.mobile) : presets.low(q.mobile);
