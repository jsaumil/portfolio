"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, type Mesh, ShaderMaterial } from "three";
import { runtime } from "@/lib/journey";
import { palette, shared } from "@/lib/uniforms";
import { createBillboardMaterial, quadGeometry } from "./materials";
import { sparksFragment, sparksVertex } from "./shaders/fx";

/** The travelling energy head: a hot glow and a spray of sparks. */
export function Energy({ sparks }: { sparks: number }) {
  const head = useRef<Mesh>(null);
  const flare = useRef<Mesh>(null);
  const glowMat = useMemo(() => createBillboardMaterial(palette.white, 0, 0.9), []);
  const flareMat = useMemo(() => createBillboardMaterial(palette.cyan, 0, 3.2), []);

  const { geometry, material } = useMemo(() => {
    const g = new BufferGeometry();
    const rand = new Float32Array(sparks * 3);
    for (let i = 0; i < rand.length; i++) rand[i] = Math.random();
    g.setAttribute("position", new BufferAttribute(new Float32Array(sparks * 3), 3));
    g.setAttribute("aRand", new BufferAttribute(rand, 3));
    const m = new ShaderMaterial({
      vertexShader: sparksVertex,
      fragmentShader: sparksFragment,
      uniforms: {
        ...shared,
        uDir: { value: runtime.headDirection },
        uSize: { value: 70 * shared.uPixelRatio.value },
        uColor: { value: palette.white.clone().lerp(palette.cyan, 0.35) },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      premultipliedAlpha: true,
    });
    return { geometry: g, material: m };
  }, [sparks]);

  useFrame((state) => {
    const k = runtime.headIntensity;
    material.uniforms.uSize.value = 70 * state.gl.getPixelRatio();
    glowMat.uniforms.uIntensity.value = k * 2.2;
    flareMat.uniforms.uIntensity.value = k * 0.55;
    head.current?.position.copy(runtime.head);
    flare.current?.position.copy(runtime.head);
    if (head.current) head.current.visible = k > 0.001;
    if (flare.current) flare.current.visible = k > 0.001;
  });

  return (
    <>
      <mesh ref={head} geometry={quadGeometry} material={glowMat} frustumCulled={false} renderOrder={7} />
      <mesh ref={flare} geometry={quadGeometry} material={flareMat} frustumCulled={false} renderOrder={6} />
      <points geometry={geometry} material={material} frustumCulled={false} renderOrder={7} />
    </>
  );
}
