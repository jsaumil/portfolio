"use client";

import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import { profile } from "@/data/portfolio";
import { graphNodes, ROOT } from "@/lib/graph";
import { runtime } from "@/lib/journey";
import { palette } from "@/lib/uniforms";
import { FONT_SANS } from "./NetworkNode";

type TextMesh = Mesh & { fillOpacity: number };

/**
 * The name, suspended inside the root node. Always faces the camera and
 * draws over the glass. Fades out as the finale's HTML end card arrives.
 */
export function RootNameplate() {
  const root = graphNodes[ROOT];
  const group = useRef<Group>(null);
  const name = useRef<TextMesh>(null);

  useFrame(() => {
    // Mid-journey the root is often in frame behind the subject; it stays a
    // faint watermark there so it never fights the panels. In the finale the
    // camera is close enough that the glass core would sit behind the letters,
    // so the HTML end card takes over the name.
    const out = 1 - runtime.finale;
    if (name.current) name.current.fillOpacity = (0.1 + 0.9 * runtime.intro) * (1 - runtime.focus * 0.6) * out;
    group.current?.scale.setScalar(1 - runtime.finale * 0.1);
  });

  return (
    <Billboard position={root.vec}>
      <group ref={group}>
        <Text
          ref={name}
          font={FONT_SANS}
          fontSize={0.5}
          letterSpacing={0.06}
          color={palette.white}
          anchorX="center"
          anchorY="middle"
          renderOrder={10}
          material-depthTest={false}
          material-toneMapped={false}
        >
          {profile.name.toUpperCase()}
        </Text>
      </group>
    </Billboard>
  );
}
