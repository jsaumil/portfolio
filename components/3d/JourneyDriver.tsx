"use client";

import { useFrame } from "@react-three/fiber";
import { runtime, updateJourney } from "@/lib/journey";
import { shared } from "@/lib/uniforms";

/**
 * First thing every frame: damp the journey position towards the scroll
 * target and recompute all derived state. Every other component reads the
 * result, so the whole scene stays in lockstep with the scroll position.
 */
export function JourneyDriver() {
  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const lambda = runtime.reducedMotion ? 30 : 6.5;
    runtime.u += (runtime.target - runtime.u) * (1 - Math.exp(-lambda * dt));
    if (Math.abs(runtime.target - runtime.u) < 1e-5) runtime.u = runtime.target;
    updateJourney(runtime.u);

    shared.uTime.value = runtime.reducedMotion ? 0 : state.clock.elapsedTime;
    shared.uHead.value.copy(runtime.head);
    shared.uHeadIntensity.value = runtime.headIntensity;
    shared.uFocus.value = runtime.focus;
    shared.uFinale.value = runtime.finale;
  }, -3);
  return null;
}
