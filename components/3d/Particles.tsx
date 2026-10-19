"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from "three";
import { networkCenter } from "@/lib/graph";
import { palette, shared } from "@/lib/uniforms";
import { dustFragment, dustVertex, orbitVertex, sparksFragment } from "./shaders/fx";

/**
 * Environmental dust (depth cue, reacts to the active node) and a small
 * cloud of motes orbiting whichever node currently holds the key light.
 */
export function Particles({ count }: { count: number }) {
  const dust = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(count * 3);
    const rand = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = networkCenter.x + (Math.random() - 0.5) * 44;
      pos[i * 3 + 1] = networkCenter.y + (Math.random() - 0.5) * 26;
      pos[i * 3 + 2] = networkCenter.z + (Math.random() - 0.5) * 40;
      for (let k = 0; k < 4; k++) rand[i * 4 + k] = Math.random();
    }
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aRand", new BufferAttribute(rand, 4));
    const m = new ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      uniforms: {
        ...shared,
        uSize: { value: 26 },
        uBase: { value: palette.silver },
        uAccent: { value: palette.cyan },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      premultipliedAlpha: true,
    });
    return { g, m };
  }, [count]);

  const orbit = useMemo(() => {
    const n = 70;
    const g = new BufferGeometry();
    const rand = new Float32Array(n * 3);
    for (let i = 0; i < rand.length; i++) rand[i] = Math.random();
    g.setAttribute("position", new BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute("aRand", new BufferAttribute(rand, 3));
    const m = new ShaderMaterial({
      vertexShader: orbitVertex,
      fragmentShader: sparksFragment,
      uniforms: {
        ...shared,
        uRadius: { value: 0.5 },
        uSize: { value: 30 },
        uColor: { value: palette.cyan.clone().lerp(palette.white, 0.4) },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      premultipliedAlpha: true,
    });
    return { g, m };
  }, []);

  useFrame((state) => {
    const dpr = state.gl.getPixelRatio();
    dust.m.uniforms.uSize.value = 26 * dpr;
    orbit.m.uniforms.uSize.value = 30 * dpr;
    orbit.m.uniforms.uRadius.value = shared.uKeyRadius.value;
  });

  return (
    <>
      <points geometry={dust.g} material={dust.m} frustumCulled={false} />
      <points geometry={orbit.g} material={orbit.m} frustumCulled={false} renderOrder={6} />
    </>
  );
}
