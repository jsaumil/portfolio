import { glslCommon } from "@/lib/uniforms";

/**
 * Glass node with a procedural circuit-board core, inspired by the reference:
 * a clear shell with fresnel rim, a fake environment band, a sharp specular
 * highlight, and a chip-like circuit plate that lights up on activation.
 */

export const nodeVertex = /* glsl */ `
  varying vec3 vViewNormal;
  varying vec3 vViewPos;
  varying vec3 vWorldPos;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    vec4 mv = viewMatrix * world;
    vViewPos = mv.xyz;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

export const nodeFragment = /* glsl */ `
  ${glslCommon}
  uniform float uActivation;
  uniform float uCompleted;
  uniform float uSeed;
  uniform float uDetail;
  uniform vec3 uBase;
  uniform vec3 uAccent;
  uniform vec3 uViolet;
  varying vec3 vViewNormal;
  varying vec3 vViewPos;
  varying vec3 vWorldPos;

  float line(float d, float w) { return smoothstep(w, w * .35, abs(d)); }

  // Procedural circuit traces: grid cells pick a straight, elbow or empty
  // trace; pads sit on cell centres; a chip sits in the middle.
  float circuit(vec2 p, float seed) {
    float r = length(p);
    vec2 g = p * 4.5;
    vec2 id = floor(g);
    vec2 f = fract(g) - .5;
    float h = hash21(id + seed * 17.);
    float h2 = hash21(id * 1.7 + seed * 5.);
    float w = .07;
    float t = 0.;
    if (h < .28) t = line(f.y, w) ;
    else if (h < .56) t = line(f.x, w);
    else if (h < .8) t = max(line(f.y, w) * step(0., f.x), line(f.x, w) * step(0., f.y));
    float pad = smoothstep(.16, .11, length(f)) - smoothstep(.1, .05, length(f));
    t = max(t, pad * step(.5, h2));
    // keep the traces out of the chip and inside the disc
    t *= smoothstep(.27, .33, max(abs(p.x), abs(p.y))) * smoothstep(.92, .78, r);

    // chip: outlined square with a fine inner grid
    vec2 q = abs(p);
    float box = max(q.x, q.y);
    float chip = line(box - .24, .025);
    vec2 cg = fract(p * 14.) - .5;
    float inner = step(box, .2) * (line(cg.x, .12) + line(cg.y, .12)) * .25;
    // pins around the chip
    float along = q.x > q.y ? p.y : p.x;
    float pins = step(box, .31) * step(.25, box) * line(fract(along * 10.) - .5, .18);
    return clamp(t + chip + inner + pins * .7, 0., 1.);
  }

  void main() {
    vec3 N = normalize(vViewNormal);
    vec3 V = normalize(-vViewPos);
    float ndv = clamp(dot(N, V), 0., 1.);
    float fres = pow(1. - ndv, 2.6);
    float act = uActivation;

    vec3 accent = mix(uBase, uAccent, smoothstep(0., .6, act));

    // Glass body: dark core, bright rim.
    vec3 col = uBase * (.025 + .6 * fres);

    // Fake environment reflection: a soft horizon band and a cool sky.
    vec3 R = reflect(-V, N);
    float band = smoothstep(.22, 0., abs(R.y - .08)) * .35 + smoothstep(.3, 1., R.y) * .18;
    col += uBase * band * (.4 + fres);

    // Key highlight (top-left, view space) and a small secondary glint.
    vec3 L = normalize(vec3(-.55, .65, .55));
    float spec = pow(max(dot(R, L), 0.), 90.) * 1.6;
    spec += pow(max(dot(R, normalize(vec3(.6, -.3, .7))), 0.), 220.) * .5;

    // Circuit plate, facing the viewer (like a chip suspended in the glass).
    vec2 p = N.xy;
    float c = uDetail > .5 ? circuit(p * 1.18, uSeed) : 0.;
    c *= smoothstep(.25, .7, ndv);
    float flick = .85 + .15 * sin(uTime * 2.3 + uSeed * 30.);
    col += accent * c * (.06 + .25 * uCompleted + 1.9 * act * flick);

    // Inner core glow.
    float core = pow(ndv, 7.);
    col += accent * core * (.03 + .8 * act);

    // Light rig (active nodes illuminate their neighbours) and the energy head.
    float lit = rigLight(vWorldPos);
    col += uAccent * fres * (lit * .9 + act * 1.1);
    col += uViolet * fres * uCompleted * (1. - act) * .35;

    float alpha = .06 + fres * .85 + c * (.25 + act) + core * act * .5 + spec;
    col += vec3(spec);

    // Everything not in focus steps back.
    col *= 1. - uFocus * .5 * (1. - act);

    float fog = fogFactor(-vViewPos.z);
    col = mix(col, uFogColor, fog);
    alpha *= 1. - fog * .8;
    gl_FragColor = vec4(col, clamp(alpha, 0., 1.));
  }
`;

/** Cheap variant for the instanced ambient nodes. */
export const ambientNodeVertex = /* glsl */ `
  attribute float aSeed;
  varying vec3 vViewNormal;
  varying vec3 vViewPos;
  varying vec3 vWorldPos;
  varying float vSeed;
  void main() {
    vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    vec4 mv = viewMatrix * world;
    vViewPos = mv.xyz;
    vViewNormal = normalize(mat3(viewMatrix) * mat3(modelMatrix) * mat3(instanceMatrix) * normal);
    vSeed = aSeed;
    gl_Position = projectionMatrix * mv;
  }
`;

export const ambientNodeFragment = /* glsl */ `
  ${glslCommon}
  uniform vec3 uBase;
  uniform vec3 uAccent;
  varying vec3 vViewNormal;
  varying vec3 vViewPos;
  varying vec3 vWorldPos;
  varying float vSeed;
  void main() {
    vec3 N = normalize(vViewNormal);
    vec3 V = normalize(-vViewPos);
    float ndv = clamp(dot(N, V), 0., 1.);
    float fres = pow(1. - ndv, 2.4);
    vec3 R = reflect(-V, N);
    float spec = pow(max(dot(R, normalize(vec3(-.55, .65, .55))), 0.), 60.);
    float pulse = .5 + .5 * sin(uTime * .6 + vSeed * 40.);
    float lit = rigLight(vWorldPos);
    vec3 col = uBase * (.03 + .5 * fres) + uAccent * fres * (lit * 1.2 + uFinale * .5) + vec3(spec) * .8;
    col += uAccent * pow(ndv, 8.) * (.08 * pulse + lit * .4 + uFinale * .4);
    float alpha = .05 + fres * .7 + spec;
    col *= 1. - uFocus * .55;
    float fog = fogFactor(-vViewPos.z);
    col = mix(col, uFogColor, fog);
    alpha *= 1. - fog * .85;
    gl_FragColor = vec4(col, clamp(alpha, 0., 1.));
  }
`;
