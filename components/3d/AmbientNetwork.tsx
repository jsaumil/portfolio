"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  type InstancedMesh,
  Matrix4,
  ShaderMaterial,
  AdditiveBlending,
} from "three";
import { buildAmbientNetwork } from "@/lib/graph";
import { palette, shared } from "@/lib/uniforms";
import { ambientNodeFragment, ambientNodeVertex } from "./shaders/node";
import { linesFragment, linesVertex } from "./shaders/environment";

/**
 * The wider neural mesh the portfolio graph lives inside. One instanced draw
 * call for all glass nodes and one draw call for all connections.
 */
export function AmbientNetwork({ count }: { count: number }) {
  const net = useMemo(() => buildAmbientNetwork(count), [count]);
  const mesh = useRef<InstancedMesh>(null);

  const nodeGeometry = useMemo(() => {
    const g = new IcosahedronGeometry(1, 3);
    g.setAttribute("aSeed", new InstancedBufferAttribute(net.seeds, 1));
    return g;
  }, [net]);

  const nodeMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: ambientNodeVertex,
        fragmentShader: ambientNodeFragment,
        uniforms: { ...shared, uBase: { value: palette.silver }, uAccent: { value: palette.cyan } },
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  const lines = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(net.lines, 3));
    const m = new ShaderMaterial({
      vertexShader: linesVertex,
      fragmentShader: linesFragment,
      uniforms: { ...shared, uBase: { value: palette.silver }, uAccent: { value: palette.cyan } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      premultipliedAlpha: true,
    });
    return { geometry: g, material: m };
  }, [net]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const mat = new Matrix4();
    for (let i = 0; i < net.sizes.length; i++) {
      const s = net.sizes[i];
      mat.makeScale(s, s, s).setPosition(net.positions[i * 3], net.positions[i * 3 + 1], net.positions[i * 3 + 2]);
      m.setMatrixAt(i, mat);
    }
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [net]);

  return (
    <>
      <instancedMesh
        ref={mesh}
        args={[nodeGeometry, nodeMaterial, net.sizes.length]}
        frustumCulled={false}
        renderOrder={0}
      />
      <lineSegments geometry={lines.geometry} material={lines.material} frustumCulled={false} renderOrder={0} />
    </>
  );
}
