"use client";

import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { graphNodes } from "@/lib/graph";
import { runtime } from "@/lib/journey";
import { shared } from "@/lib/uniforms";

const keyTarget = new Vector3();
const fillTarget = new Vector3();

/**
 * Light rig. Every custom material reads a "key" light (the most active node)
 * and a "fill" light (the runner-up: the node being left or approached).
 * As one node fades and the next rises, light hands over between them, which
 * gives the chain-reaction feel without any real-time shadowed lights.
 */
export function Lighting() {
  useFrame((_, delta) => {
    let k = -1;
    let f = -1;
    for (let i = 0; i < graphNodes.length; i++) {
      const a = runtime.nodeActivation[i];
      if (k < 0 || a > runtime.nodeActivation[k]) {
        f = k;
        k = i;
      } else if (f < 0 || a > runtime.nodeActivation[f]) f = i;
    }
    const damp = 1 - Math.exp(-delta * 9);
    const fin = runtime.finale;

    keyTarget.copy(graphNodes[k].vec);
    fillTarget.copy(graphNodes[f].vec);
    shared.uKeyPos.value.lerp(keyTarget, damp);
    shared.uFillPos.value.lerp(fillTarget, damp);
    shared.uKeyRadius.value += (graphNodes[k].size - shared.uKeyRadius.value) * damp;

    const keyI = runtime.nodeActivation[k] * (1 - fin * 0.3);
    const fillI = runtime.nodeActivation[f] * 0.8;
    shared.uKeyIntensity.value += (keyI - shared.uKeyIntensity.value) * damp;
    shared.uFillIntensity.value += (fillI - shared.uFillIntensity.value) * damp;
  }, -2);
  return null;
}
