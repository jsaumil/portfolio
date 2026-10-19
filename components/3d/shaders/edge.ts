import { glslCommon } from "@/lib/uniforms";

/**
 * Glass rod between two nodes. Energy is scrubbed by `uProgress` (0..1 along
 * the travel direction): the rod lights up behind the head, with a hot spot
 * at the head and a trail that decays into a faint "completed" glow.
 * Geometry: unit cylinder along +Y (y in [-0.5, 0.5]), placed by the mesh matrix.
 */
export const edgeVertex = /* glsl */ `
  varying float vAlong;
  varying vec3 vViewNormal;
  varying vec3 vViewPos;
  varying vec3 vWorldPos;
  void main() {
    vAlong = position.y + .5;
    vec4 world = modelMatrix * vec4(position, 1.);
    vWorldPos = world.xyz;
    vec4 mv = viewMatrix * world;
    vViewPos = mv.xyz;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

export const edgeFragment = /* glsl */ `
  ${glslCommon}
  uniform float uProgress;
  uniform float uForward;
  uniform float uCompleted;
  uniform float uBolt;
  uniform float uLength;
  uniform vec3 uBase;
  uniform vec3 uAccent;
  varying float vAlong;
  varying vec3 vViewNormal;
  varying vec3 vViewPos;
  varying vec3 vWorldPos;
  void main() {
    vec3 N = normalize(vViewNormal);
    vec3 V = normalize(-vViewPos);
    float ndv = abs(dot(N, V));
    float fres = pow(1. - ndv, 1.6);

    float t = uForward > .5 ? vAlong : 1. - vAlong;
    float behind = (uProgress - t) * uLength; // world units behind the head
    float lit = step(0., behind) * step(.0001, uProgress);
    float trail = lit * exp(-behind * .7) * uBolt;
    float head = exp(-abs(behind) * 7.) * uBolt;
    float energy = trail * 1.6 + head * 4. + lit * .1 + uCompleted * .22;

    // A faint pulse that keeps travelling along completed connections.
    float flow = pow(.5 + .5 * sin((t * uLength - uTime * 1.6) * 2.2), 8.) * uCompleted * .35;

    vec3 glass = uBase * (.05 + .55 * fres);
    glass += uBase * rigLight(vWorldPos) * .25;
    vec3 col = glass + uAccent * (energy + flow) * (.5 + .5 * ndv) + vec3(1.) * head * 1.5;
    float alpha = .14 + fres * .45 + (energy + flow) * .8;
    col *= 1. - uFocus * .45 * (1. - min(energy, 1.));

    float fog = fogFactor(-vViewPos.z);
    col = mix(col, uFogColor, fog);
    alpha *= 1. - fog * .85;
    gl_FragColor = vec4(col, clamp(alpha, 0., 1.));
  }
`;

/**
 * Lightning ribbon: a jagged, crackling filament that lives just behind the
 * energy head. Positions are computed entirely on the GPU from the edge end
 * points, so one shared geometry serves every edge.
 */
export const boltVertex = /* glsl */ `
  ${glslCommon}
  attribute float aU;
  attribute float aSide;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform float uForward;
  uniform float uSeed;
  uniform float uAmp;
  uniform float uWidth;
  uniform float uLength;
  varying float vT;
  varying float vSide;
  varying float vDepth;
  void main() {
    vec3 start = uForward > .5 ? uA : uB;
    vec3 end = uForward > .5 ? uB : uA;
    vec3 dir = normalize(end - start);
    vec3 helper = abs(dir.y) < .95 ? vec3(0., 1., 0.) : vec3(1., 0., 0.);
    vec3 n1 = normalize(cross(dir, helper));
    vec3 n2 = cross(dir, n1);

    float s = aU * uLength;
    float tq = floor(uTime * 18.) / 18.; // crackle: the shape re-rolls ~18x a second
    float o1 = noise1(s * 2.2 + uSeed * 13. + tq * 6.) * .6 + noise1(s * 7. + tq * 11. + uSeed * 3.) * .3 + noise1(s * 19. + tq * 23.) * .14;
    float o2 = noise1(s * 2.6 + uSeed * 29. - tq * 5.) * .6 + noise1(s * 8. - tq * 9. + uSeed * 7.) * .3 + noise1(s * 21. - tq * 17.) * .14;
    float pin = smoothstep(0., .03, aU) * smoothstep(1., .97, aU);
    vec3 p = mix(start, end, aU) + (n1 * o1 + n2 * o2) * uAmp * pin;

    vec4 mv = viewMatrix * vec4(p, 1.);
    vec3 tv = normalize((viewMatrix * vec4(dir, 0.)).xyz);
    vec3 side = normalize(cross(tv, vec3(0., 0., 1.)));
    mv.xyz += side * aSide * uWidth;
    vT = aU;
    vSide = aSide;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

export const boltFragment = /* glsl */ `
  ${glslCommon}
  uniform float uProgress;
  uniform float uIntensity;
  uniform float uLength;
  uniform float uSeed;
  uniform float uTrail;
  uniform vec3 uAccent;
  varying float vT;
  varying float vSide;
  varying float vDepth;
  void main() {
    float behind = (uProgress - vT) * uLength;
    float vis = step(0., behind) * exp(-behind / uTrail) * uIntensity;
    float core = pow(1. - abs(vSide), 1.6);
    float flicker = .7 + .3 * hash11(floor(uTime * 30.) + uSeed * 91.);
    vec3 col = mix(uAccent, vec3(1.), core * core) * (1.4 + core * 2.6) * flicker;
    float a = vis * core;
    a *= 1. - fogFactor(vDepth) * .7;
    gl_FragColor = vec4(col * a, a);
  }
`;
