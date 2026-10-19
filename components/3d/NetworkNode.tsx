"use client";

import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import { AdditiveBlending, type Group, type Mesh, MeshBasicMaterial } from "three";
import type { GraphNode } from "@/lib/graph";
import { runtime } from "@/lib/journey";
import { palette } from "@/lib/uniforms";
import { createBillboardMaterial, createNodeMaterial, quadGeometry } from "./materials";

export const FONT_SANS = "/fonts/Geist-Medium.ttf";
export const FONT_MONO = "/fonts/GeistMono-Regular.ttf";

interface Props {
  node: GraphNode;
  segments: number;
}

/**
 * One portfolio node. States (idle / approaching / active / completed) are
 * read from the journey runtime every frame and pushed into uniforms; the
 * component itself never re-renders after mount.
 */
export const NetworkNode = memo(function NetworkNode({ node, segments }: Props) {
  const r = node.size;
  const isRoot = node.kind === "root";
  const hasLabel = node.kind === "section" || node.kind === "hub";

  const shellMat = useMemo(
    () => createNodeMaterial(node.index * 0.137 + 0.21, node.kind !== "leaf"),
    [node],
  );
  const haloMat = useMemo(() => createBillboardMaterial(palette.cyan, 0, r * 7), [r]);
  const coreMat = useMemo(() => createBillboardMaterial(palette.white, 0, r * 2.2), [r]);
  const shockMat = useMemo(() => createBillboardMaterial(palette.cyan, 1, r * 2), [r]);
  const ringMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: palette.silver,
        transparent: true,
        opacity: 0.1,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  const arcMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: palette.violet,
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  const group = useRef<Group>(null);
  const shell = useRef<Mesh>(null);
  const ring = useRef<Mesh>(null);
  const arc = useRef<Mesh>(null);
  const gyro = useRef<Group>(null);
  const label = useRef<Mesh & { fillOpacity: number }>(null);
  const seed = node.index * 1.7;

  useFrame((state) => {
    const t = runtime.reducedMotion ? 0 : state.clock.elapsedTime;
    const camDist = state.camera.position.distanceTo(node.vec);
    const i = node.index;
    const act = runtime.nodeActivation[i];
    const done = runtime.nodeCompleted[i];
    const shock = runtime.nodeShock[i];

    shellMat.uniforms.uActivation.value = act;
    shellMat.uniforms.uCompleted.value = done;

    // Idle breathing + a soft pulse when the energy arrives.
    const breathe = 1 + Math.sin(t * 0.9 + seed) * 0.012;
    const pulse = shock > 0 ? Math.sin(Math.PI * Math.min(shock * 2.2, 1)) * 0.08 : 0;
    shell.current?.scale.setScalar(r * (breathe + pulse));

    // The root's core stays restrained so the name inside it stays legible.
    const coreGain = isRoot ? 0.3 : 0.5;
    haloMat.uniforms.uIntensity.value = (0.05 + act * 0.55 + done * 0.06) * (isRoot ? 0.7 : 1);
    coreMat.uniforms.uIntensity.value = (0.1 + act + done * 0.12) * coreGain;
    shockMat.uniforms.uRing.value = shock;
    shockMat.uniforms.uIntensity.value = shock > 0 ? 1.2 : 0;
    shockMat.uniforms.uScale.value = r * (2 + shock * 5);

    ringMat.opacity = 0.05 + act * 0.55 + done * 0.06;
    ringMat.color.copy(palette.silver).lerp(palette.cyan, act);
    arcMat.opacity = act * 0.6 + done * 0.08;
    if (ring.current) {
      ring.current.rotation.z = t * 0.15 + seed;
      const s = 1 + act * 0.12;
      ring.current.scale.setScalar(s);
    }
    if (arc.current) arc.current.rotation.z = -t * 0.35 + seed;
    if (gyro.current) {
      gyro.current.rotation.y = t * 0.12;
      gyro.current.rotation.x = Math.sin(t * 0.2) * 0.2;
    }
    if (label.current) {
      // Labels guide the overview; they step aside once a panel takes over.
      const own = act > 0.6 ? 1 - (act - 0.6) / 0.4 : 1;
      // Fade out when the camera is close, otherwise the label balloons.
      const near = Math.min(Math.max((camDist - 5.5) / 5, 0), 1);
      const o = (0.35 + runtime.intro * 0.5) * own * near * (1 - runtime.focus * 0.6) * (1 - runtime.finale * 0.5);
      label.current.fillOpacity = o;
    }
  });

  return (
    <group ref={group} position={node.vec}>
      <mesh ref={shell} material={shellMat} renderOrder={2}>
        <sphereGeometry args={[1, segments, Math.round(segments * 0.75)]} />
      </mesh>
      <mesh material={coreMat} geometry={quadGeometry} renderOrder={3} frustumCulled={false} />
      <mesh material={haloMat} geometry={quadGeometry} renderOrder={1} frustumCulled={false} />
      <mesh material={shockMat} geometry={quadGeometry} renderOrder={4} frustumCulled={false} />

      {/* Orbital rings, tilted so they read as 3D from every camera angle. */}
      <group rotation={[1.15 + seed * 0.1, 0.3 + seed * 0.2, 0]}>
        <mesh ref={ring} material={ringMat}>
          <torusGeometry args={[r * 1.55, r * 0.008 + 0.003, 6, 96]} />
        </mesh>
        <mesh ref={arc} material={arcMat}>
          <torusGeometry args={[r * 1.75, r * 0.01 + 0.003, 6, 64, Math.PI * 0.55]} />
        </mesh>
      </group>

      {isRoot && (
        <group ref={gyro}>
          <mesh material={ringMat} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r * 1.9, 0.006, 6, 128]} />
          </mesh>
          <mesh material={ringMat} rotation={[0.4, 0.9, 0]}>
            <torusGeometry args={[r * 2.15, 0.005, 6, 128]} />
          </mesh>
          <mesh material={arcMat} rotation={[-0.5, -0.6, 0.3]}>
            <torusGeometry args={[r * 2.4, 0.008, 6, 96, Math.PI * 0.8]} />
          </mesh>
        </group>
      )}

      {hasLabel && (
        <Billboard position={[0, -r * 1.55 - 0.18, 0]}>
          <Text
            ref={label}
            font={FONT_MONO}
            fontSize={0.17}
            letterSpacing={0.18}
            color={palette.silver}
            anchorX="center"
            anchorY="top"
            fillOpacity={0.6}
            renderOrder={6}
            material-toneMapped={false}
            material-depthWrite={false}
          >
            {node.title.toUpperCase()}
          </Text>
        </Billboard>
      )}
    </group>
  );
});
