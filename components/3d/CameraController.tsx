"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { type PerspectiveCamera, Vector3 } from "three";
import { journeyPose, type Pose } from "@/lib/camera";
import { runtime } from "@/lib/journey";

/**
 * Drives the camera from the journey. The target pose is a pure function of
 * scroll; on top of that we add a breathing drift and a little pointer
 * parallax, then critically damp towards it so fast scrolls stay smooth.
 */
export function CameraController({ mobile }: { mobile: boolean }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const target = useMemo<Pose>(() => ({ pos: new Vector3(), look: new Vector3() }), []);
  const look = useMemo(() => new Vector3(), []);
  const drift = useMemo(() => new Vector3(), []);
  const initialised = useMemo(() => ({ done: false }), []);

  useEffect(() => {
    camera.fov = mobile ? 52 : 38;
    camera.near = 0.05;
    camera.far = 200;
    camera.updateProjectionMatrix();
  }, [camera, mobile]);

  useEffect(() => {
    if (mobile) return;
    const onMove = (e: PointerEvent) => {
      runtime.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      runtime.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mobile]);

  useFrame((state, delta) => {
    journeyPose({ mobile, aspect: size.width / size.height }, target);

    const t = runtime.reducedMotion ? 0 : state.clock.elapsedTime;
    // Breathing drift: strongest on the wide intro shot, subtle elsewhere.
    const amp = 0.05 + runtime.intro * 0.35 + runtime.finale * 0.12;
    drift.set(Math.sin(t * 0.13) * amp, Math.sin(t * 0.17 + 1.3) * amp * 0.6, Math.cos(t * 0.11) * amp * 0.5);
    target.pos.add(drift);
    if (!mobile && !runtime.reducedMotion) {
      const p = 0.18 + runtime.intro * 0.5;
      target.pos.x += runtime.pointer.x * p;
      target.pos.y -= runtime.pointer.y * p * 0.6;
    }

    if (!initialised.done) {
      camera.position.copy(target.pos);
      look.copy(target.look);
      initialised.done = true;
    }
    const k = runtime.reducedMotion ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 4.5);
    camera.position.lerp(target.pos, k);
    look.lerp(target.look, k);
    camera.lookAt(look);
  }, -1);

  return null;
}
