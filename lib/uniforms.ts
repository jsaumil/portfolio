import { Color, Vector3 } from "three";

/** Palette. One accent (cyan), one restrained secondary (violet). */
export const palette = {
  bg: new Color("#04060b"),
  bgNavy: new Color("#07101d"),
  silver: new Color("#c9d6e6"),
  cyan: new Color("#56d6ff"),
  cyanDeep: new Color("#2a8fff"),
  violet: new Color("#8f7dff"),
  white: new Color("#eef7ff"),
};

/**
 * Uniforms shared by reference across every custom material. Updated once per
 * frame by the light rig, so the whole scene reacts to the active node with a
 * single write.
 */
export const shared = {
  uTime: { value: 0 },
  uFogNear: { value: 12 },
  uFogFar: { value: 46 },
  uFogColor: { value: palette.bg.clone() },
  uKeyPos: { value: new Vector3() },
  uKeyIntensity: { value: 0 },
  uFillPos: { value: new Vector3() },
  uFillIntensity: { value: 0 },
  uKeyRadius: { value: 0.5 },
  uHead: { value: new Vector3() },
  uHeadIntensity: { value: 0 },
  uFocus: { value: 0 },
  uFinale: { value: 0 },
  uPixelRatio: { value: 1 },
};

/** GLSL helpers shared by every shader. */
export const glslCommon = /* glsl */ `
  uniform float uTime;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform vec3 uFogColor;
  uniform vec3 uKeyPos;
  uniform float uKeyIntensity;
  uniform vec3 uFillPos;
  uniform float uFillIntensity;
  uniform vec3 uHead;
  uniform float uHeadIntensity;
  uniform float uFocus;
  uniform float uFinale;

  float hash11(float p) { p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float hash21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float noise1(float x) { float i = floor(x); float f = fract(x); float u = f * f * (3. - 2. * f); return mix(hash11(i), hash11(i + 1.), u) * 2. - 1.; }
  float fogFactor(float depth) { return smoothstep(uFogNear, uFogFar, depth); }
  /** Soft light contribution from the active-node light rig. */
  float rigLight(vec3 worldPos) {
    float k = uKeyIntensity / (1. + pow(distance(worldPos, uKeyPos) * .45, 2.));
    float f = uFillIntensity / (1. + pow(distance(worldPos, uFillPos) * .45, 2.));
    float h = uHeadIntensity / (1. + pow(distance(worldPos, uHead) * 1.4, 2.));
    return k + f * .6 + h * .8;
  }
`;
