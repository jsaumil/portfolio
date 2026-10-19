"use client";

import { useMemo } from "react";
import { AdditiveBlending, BackSide, ShaderMaterial } from "three";
import { networkCenter } from "@/lib/graph";
import { palette, shared } from "@/lib/uniforms";
import { gridFragment, gridVertex, skyFragment, skyVertex } from "./shaders/environment";

/** Sky dome and a faint data-grid floor far below the network. */
export function Backdrop() {
  const sky = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        uniforms: {
          ...shared,
          uTop: { value: palette.bgNavy },
          uBottom: { value: palette.bg },
          uHaze: { value: palette.violet },
          uCyan: { value: palette.cyan },
        },
        side: BackSide,
        depthWrite: false,
      }),
    [],
  );

  const grid = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: gridVertex,
        fragmentShader: gridFragment,
        uniforms: { ...shared, uColor: { value: palette.silver }, uAccent: { value: palette.cyan } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        premultipliedAlpha: true,
      }),
    [],
  );

  return (
    <>
      <mesh material={sky} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[150, 32, 16]} />
      </mesh>
      <mesh
        material={grid}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[networkCenter.x, -11, networkCenter.z]}
        renderOrder={-5}
      >
        <planeGeometry args={[140, 140]} />
      </mesh>
    </>
  );
}
