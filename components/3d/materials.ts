import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
  type IUniform,
} from "three";
import { palette, shared } from "@/lib/uniforms";
import { billboardFragment, billboardVertex } from "./shaders/fx";
import { boltFragment, boltVertex, edgeFragment, edgeVertex } from "./shaders/edge";
import { nodeFragment, nodeVertex } from "./shaders/node";

/** Material factories. Every material shares the global uniforms by reference. */

const withShared = (u: Record<string, IUniform>) => ({ ...shared, ...u });

export function createNodeMaterial(seed: number, detail: boolean) {
  return new ShaderMaterial({
    vertexShader: nodeVertex,
    fragmentShader: nodeFragment,
    uniforms: withShared({
      uActivation: { value: 0 },
      uCompleted: { value: 0 },
      uSeed: { value: seed },
      uDetail: { value: detail ? 1 : 0 },
      uBase: { value: palette.silver },
      uAccent: { value: palette.cyan },
      uViolet: { value: palette.violet },
    }),
    transparent: true,
    depthWrite: false,
  });
}

export function createEdgeMaterial(length: number) {
  return new ShaderMaterial({
    vertexShader: edgeVertex,
    fragmentShader: edgeFragment,
    uniforms: withShared({
      uProgress: { value: 0 },
      uForward: { value: 1 },
      uCompleted: { value: 0 },
      uBolt: { value: 0 },
      uLength: { value: length },
      uBase: { value: palette.silver },
      uAccent: { value: palette.cyan },
    }),
    transparent: true,
    depthWrite: false,
  });
}

export function createBoltMaterial(opts: {
  a: [number, number, number];
  b: [number, number, number];
  length: number;
  seed: number;
  amp: number;
  width: number;
  trail: number;
  color?: Color;
}) {
  return new ShaderMaterial({
    vertexShader: boltVertex,
    fragmentShader: boltFragment,
    uniforms: withShared({
      uA: { value: new Vector3(...opts.a) },
      uB: { value: new Vector3(...opts.b) },
      uForward: { value: 1 },
      uProgress: { value: 0 },
      uIntensity: { value: 0 },
      uSeed: { value: opts.seed },
      uAmp: { value: opts.amp },
      uWidth: { value: opts.width },
      uLength: { value: opts.length },
      uTrail: { value: opts.trail },
      uAccent: { value: opts.color ?? palette.cyan },
    }),
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    premultipliedAlpha: true,
  });
}

export function createBillboardMaterial(color: Color, mode: 0 | 1, scale: number) {
  return new ShaderMaterial({
    vertexShader: billboardVertex,
    fragmentShader: billboardFragment,
    uniforms: withShared({
      uColor: { value: color },
      uIntensity: { value: 0 },
      uMode: { value: mode },
      uRing: { value: 0 },
      uScale: { value: scale },
    }),
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    premultipliedAlpha: true,
  });
}

/* Shared geometries (created once, reused by every instance). */

export const quadGeometry = new PlaneGeometry(1, 1);
export const rodGeometry = new CylinderGeometry(1, 1, 1, 10, 1, true);

/** Ribbon of `samples` points along u in [0, 1], two vertices per sample. */
export function createRibbonGeometry(samples: number) {
  const g = new BufferGeometry();
  const u = new Float32Array(samples * 2);
  const side = new Float32Array(samples * 2);
  const pos = new Float32Array(samples * 2 * 3);
  const idx: number[] = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    u[i * 2] = u[i * 2 + 1] = t;
    side[i * 2] = -1;
    side[i * 2 + 1] = 1;
    if (i < samples - 1) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("aU", new BufferAttribute(u, 1));
  g.setAttribute("aSide", new BufferAttribute(side, 1));
  g.setIndex(idx);
  return g;
}

export const ribbonGeometry = createRibbonGeometry(160);
