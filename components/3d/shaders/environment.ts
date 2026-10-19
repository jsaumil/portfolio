import { glslCommon } from "@/lib/uniforms";

/** Sky dome: deep navy to near-black, a faint violet haze, very sparse stars. */
export const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 mv = modelViewMatrix * vec4(position, 1.);
    gl_Position = projectionMatrix * mv;
    gl_Position.z = gl_Position.w; // always at the far plane
  }
`;

export const skyFragment = /* glsl */ `
  ${glslCommon}
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uHaze;
  uniform vec3 uCyan;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    vec3 col = mix(uBottom, uTop, smoothstep(-.6, .7, d.y));
    // volumetric-feeling haze behind the network
    float haze = exp(-pow(length(d.xy - vec2(-.25, .15)) * 1.6, 2.)) * smoothstep(0., -.8, d.z);
    col += uHaze * haze * .035;
    float glow = exp(-pow(length(d.xy - vec2(.35, .05)) * 2.2, 2.)) * smoothstep(0., -.8, d.z);
    col += uCyan * glow * .03 * (1. + uFinale * 1.5);
    // sparse distant stars
    vec2 g = d.xy / (abs(d.z) + .6) * 220.;
    vec2 id = floor(g);
    float h = hash21(id);
    float star = step(.9965, h) * smoothstep(.45, .0, length(fract(g) - .5));
    star *= .35 + .3 * sin(uTime * (.5 + h * 2.) + h * 50.);
    col += vec3(.75, .85, 1.) * star * .45;
    gl_FragColor = vec4(col, 1.);
  }
`;

/** Faint perspective grid far below the network; glows under the key light. */
export const gridVertex = /* glsl */ `
  varying vec3 vWorldPos;
  varying float vDepth;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.);
    vWorldPos = world.xyz;
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

export const gridFragment = /* glsl */ `
  ${glslCommon}
  uniform vec3 uColor;
  uniform vec3 uAccent;
  varying vec3 vWorldPos;
  varying float vDepth;
  float gridLine(vec2 p, float scale) {
    vec2 g = abs(fract(p / scale - .5) - .5) / fwidth(p / scale);
    return 1. - min(min(g.x, g.y), 1.);
  }
  void main() {
    vec2 p = vWorldPos.xz;
    float major = gridLine(p, 4.);
    float minor = gridLine(p, 1.) * .35;
    float fade = exp(-length(p - vec2(0., -2.)) * .055);
    float lit = rigLight(vec3(vWorldPos.x, vWorldPos.y + 6., vWorldPos.z));
    float a = (major + minor) * fade * (.07 + lit * .35 + uFinale * .08);
    a *= 1. - fogFactor(vDepth) * .9;
    vec3 col = mix(uColor, uAccent, clamp(lit, 0., 1.));
    gl_FragColor = vec4(col * a, a);
  }
`;

/** Ambient network connections. Brighten near the light rig and energy head. */
export const linesVertex = /* glsl */ `
  varying vec3 vWorldPos;
  varying float vDepth;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.);
    vWorldPos = world.xyz;
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

export const linesFragment = /* glsl */ `
  ${glslCommon}
  uniform vec3 uBase;
  uniform vec3 uAccent;
  varying vec3 vWorldPos;
  varying float vDepth;
  void main() {
    float lit = rigLight(vWorldPos);
    float a = (.085 + lit * .45 + uFinale * .12) * (1. - uFocus * .5);
    a *= 1. - fogFactor(vDepth) * .9;
    vec3 col = mix(uBase, uAccent, clamp(lit + uFinale * .3, 0., 1.));
    gl_FragColor = vec4(col * a, a);
  }
`;
