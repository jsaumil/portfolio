"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction, type BloomEffect } from "postprocessing";
import { useMemo, useRef } from "react";
import { Vector2 } from "three";
import { LAST, runtime } from "@/lib/journey";

/**
 * Post-processing. Bloom does the heavy lifting for the glow; its intensity
 * swells briefly when the journey reaches the root in the finale.
 */
export function Effects({ mode }: { mode: "full" | "lite" }) {
  const bloom = useRef<BloomEffect>(null);
  const caOffset = useMemo(() => new Vector2(0.0004, 0.0003), []);

  useFrame(() => {
    if (!bloom.current) return;
    const arrival = Math.max(0, 1 - Math.abs(runtime.u - (LAST - 0.18)) / 0.16);
    const head = runtime.headIntensity * 0.15;
    bloom.current.intensity = 1.05 + head + arrival * arrival * 1.6 + runtime.finale * 0.25;
  });

  if (mode === "lite") {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom ref={bloom} mipmapBlur intensity={1} luminanceThreshold={0.62} luminanceSmoothing={0.25} radius={0.7} />
        <Vignette eskil={false} offset={0.25} darkness={0.75} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom ref={bloom} mipmapBlur intensity={1.05} luminanceThreshold={0.55} luminanceSmoothing={0.3} radius={0.78} />
      <ChromaticAberration offset={caOffset} radialModulation modulationOffset={0.35} blendFunction={BlendFunction.NORMAL} />
      <Vignette eskil={false} offset={0.22} darkness={0.78} />
      <Noise opacity={0.028} premultiply blendFunction={BlendFunction.SCREEN} />
    </EffectComposer>
  );
}
