import { glslCommon } from "@/lib/uniforms";

/**
 * Camera-facing quad used for halos (mode 0) and expanding shock rings
 * (mode 1). Billboarding is done in the vertex shader, so no per-frame
 * lookAt on the CPU.
 */
export const billboardVertex = /* glsl */ `
  uniform float uScale;
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vUv = position.xy * 2.;
    vec4 mv = modelViewMatrix * vec4(0., 0., 0., 1.);
    mv.xy += position.xy * uScale;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

export const billboardFragment = /* glsl */ `
  ${glslCommon}
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uMode;
  uniform float uRing; // ring progress 0..1 (mode 1)
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    float r = length(vUv);
    float a;
    if (uMode < .5) {
      a = exp(-r * r * 9.) * .9 + exp(-r * 4.) * .25;
      a *= smoothstep(1., .7, r);
    } else {
      float w = mix(.05, .015, uRing);
      a = smoothstep(w, 0., abs(r - .96)) * pow(1. - uRing, 2.2);
      a += smoothstep(.96, .2, r) * .05 * pow(1. - uRing, 2.);
    }
    a *= uIntensity * (1. - fogFactor(vDepth) * .8);
    gl_FragColor = vec4(uColor * a, a);
  }
`;

/** Sparks thrown off the energy head. Each particle has a looping life. */
export const sparksVertex = /* glsl */ `
  ${glslCommon}
  attribute vec3 aRand;
  uniform vec3 uDir;
  uniform float uSize;
  varying float vAlpha;
  void main() {
    float life = fract(uTime * (.7 + aRand.z * .9) + aRand.x * 7.);
    vec3 r = normalize(aRand * 2. - 1. + vec3(.0001));
    vec3 p = uHead + r * life * (.25 + aRand.y * .9) - uDir * life * (.6 + aRand.z) + vec3(0., -life * life * .5, 0.);
    vec4 mv = viewMatrix * vec4(p, 1.);
    gl_PointSize = uSize * (1. - life) * (.4 + aRand.y) / -mv.z;
    vAlpha = (1. - life) * uHeadIntensity;
    gl_Position = projectionMatrix * mv;
  }
`;

export const sparksFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - .5;
    float a = smoothstep(.5, 0., length(c)) * vAlpha;
    gl_FragColor = vec4(uColor * a * 2., a);
  }
`;

/**
 * Environmental dust. Drifts slowly, brightens and gets pulled into a gentle
 * swirl around the active node.
 */
export const dustVertex = /* glsl */ `
  ${glslCommon}
  attribute vec4 aRand;
  uniform float uSize;
  varying float vAlpha;
  varying float vLit;
  void main() {
    vec3 p = position;
    float t = uTime * (.05 + aRand.x * .08);
    p += vec3(sin(t + aRand.y * 6.28), cos(t * .8 + aRand.z * 6.28), sin(t * .6 + aRand.w * 6.28)) * (.4 + aRand.x);

    // swirl around the key light
    vec3 d = p - uKeyPos;
    float k = uKeyIntensity * exp(-dot(d, d) * .08);
    float ang = k * .6;
    p = uKeyPos + vec3(d.x * cos(ang) - d.z * sin(ang), d.y, d.x * sin(ang) + d.z * cos(ang));

    vec4 mv = viewMatrix * vec4(p, 1.);
    float twinkle = .6 + .4 * sin(uTime * (.4 + aRand.w) + aRand.y * 40.);
    vLit = rigLight(p);
    vAlpha = (.12 + .25 * aRand.x) * twinkle * (1. - fogFactor(-mv.z) * .7);
    gl_PointSize = uSize * (.5 + aRand.z * 1.5) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

export const dustFragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uAccent;
  varying float vAlpha;
  varying float vLit;
  void main() {
    vec2 c = gl_PointCoord - .5;
    float a = smoothstep(.5, .05, length(c)) * vAlpha * (1. + vLit * 1.5);
    vec3 col = mix(uBase, uAccent, clamp(vLit, 0., 1.));
    gl_FragColor = vec4(col * a, a);
  }
`;

/** Particles orbiting whichever node currently holds the key light. */
export const orbitVertex = /* glsl */ `
  ${glslCommon}
  attribute vec3 aRand;
  uniform float uRadius;
  uniform float uSize;
  varying float vAlpha;
  void main() {
    float ang = uTime * (.25 + aRand.x * .5) + aRand.y * 6.28;
    float tilt = (aRand.z - .5) * 2.2;
    float rad = uRadius * (1.25 + aRand.x * 1.4);
    vec3 o = vec3(cos(ang) * rad, sin(ang) * rad * sin(tilt), sin(ang) * rad * cos(tilt));
    vec3 p = uKeyPos + o;
    vec4 mv = viewMatrix * vec4(p, 1.);
    vAlpha = uKeyIntensity * (.35 + .65 * aRand.z) * (1. - uFinale);
    gl_PointSize = uSize * (.4 + aRand.y) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
