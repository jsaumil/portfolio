"use client";

import { useFrame } from "@react-three/fiber";
import { memo, useLayoutEffect, useMemo, useRef } from "react";
import { type Mesh, Quaternion, Vector3 } from "three";
import { type GraphEdge, graphNodes } from "@/lib/graph";
import { runtime } from "@/lib/journey";
import { palette } from "@/lib/uniforms";
import {
  createBoltMaterial,
  createEdgeMaterial,
  ribbonGeometry,
  rodGeometry,
} from "./materials";

const Y = new Vector3(0, 1, 0);

/**
 * A glass rod between two nodes, plus two lightning filaments that only
 * exist while energy is travelling along it. All motion is scrubbed by the
 * journey runtime; nothing here loops on its own except the crackle.
 */
export const NetworkEdge = memo(function NetworkEdge({ edge, quality }: { edge: GraphEdge; quality: "high" | "low" }) {
  const a = graphNodes[edge.a];
  const b = graphNodes[edge.b];
  const rod = useRef<Mesh>(null);
  const boltA = useRef<Mesh>(null);
  const boltB = useRef<Mesh>(null);

  // Thicker rods near the root: visual hierarchy follows the tree.
  const radius = a.kind === "root" || b.kind === "root" ? 0.026 : a.kind === "leaf" || b.kind === "leaf" ? 0.011 : 0.018;

  const rodMat = useMemo(() => createEdgeMaterial(edge.length), [edge.length]);
  const bolts = useMemo(() => {
    const common = {
      a: a.position,
      b: b.position,
      length: edge.length,
    };
    return [
      createBoltMaterial({ ...common, seed: edge.index * 1.31 + 0.2, amp: 0.13, width: 0.018, trail: 1.4 }),
      createBoltMaterial({ ...common, seed: edge.index * 2.73 + 0.7, amp: 0.22, width: 0.01, trail: 0.9, color: palette.cyanDeep }),
    ];
  }, [a.position, b.position, edge.index, edge.length]);

  useLayoutEffect(() => {
    const m = rod.current;
    if (!m) return;
    const dir = new Vector3().subVectors(b.vec, a.vec);
    m.position.copy(a.vec).addScaledVector(dir, 0.5);
    m.quaternion.copy(new Quaternion().setFromUnitVectors(Y, dir.clone().normalize()));
    m.scale.set(radius, edge.length, radius);
  }, [a.vec, b.vec, edge.length, radius]);

  useFrame(() => {
    const i = edge.index;
    const progress = runtime.edgeProgress[i];
    const forward = runtime.edgeForward[i];
    const bolt = runtime.edgeBolt[i];
    const u = rodMat.uniforms;
    u.uProgress.value = progress;
    u.uForward.value = forward;
    u.uCompleted.value = runtime.edgeCompleted[i];
    u.uBolt.value = bolt;

    const live = bolt > 0.001;
    bolts.forEach((m, k) => {
      const mesh = k === 0 ? boltA.current : boltB.current;
      if (mesh) mesh.visible = live && (k === 0 || quality === "high");
      m.uniforms.uProgress.value = progress;
      m.uniforms.uForward.value = forward;
      m.uniforms.uIntensity.value = bolt;
    });
  });

  return (
    <>
      <mesh ref={rod} geometry={rodGeometry} material={rodMat} renderOrder={1} />
      <mesh ref={boltA} geometry={ribbonGeometry} material={bolts[0]} frustumCulled={false} visible={false} renderOrder={5} />
      <mesh ref={boltB} geometry={ribbonGeometry} material={bolts[1]} frustumCulled={false} visible={false} renderOrder={5} />
    </>
  );
});
