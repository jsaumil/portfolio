"use client";

import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { ACESFilmicToneMapping, Fog } from "three";
import { downgrade, type Quality } from "@/lib/quality";
import { palette, shared } from "@/lib/uniforms";
import { Backdrop } from "./Backdrop";
import { CameraController } from "./CameraController";
import { Effects } from "./Effects";
import { JourneyDriver } from "./JourneyDriver";
import { Lighting } from "./Lighting";
import { Network } from "./Network";
import { Overlay3DSync } from "./Overlay3DSync";
import { Particles } from "./Particles";

interface Props {
  initialQuality: Quality;
  onReady: () => void;
}

export default function PortfolioScene({ initialQuality, onReady }: Props) {
  const [quality, setQuality] = useState(initialQuality);

  return (
    <Canvas
      dpr={quality.dpr}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{ position: [0, 4, 26], fov: 38 }}
      onCreated={({ scene, gl }) => {
        scene.background = palette.bg;
        scene.fog = new Fog(palette.bg, shared.uFogNear.value, shared.uFogFar.value);
        shared.uPixelRatio.value = gl.getPixelRatio();
        // Wait a couple of frames so text and shaders are compiled before revealing.
        requestAnimationFrame(() => requestAnimationFrame(onReady));
      }}
    >
      <PerformanceMonitor
        flipflops={2}
        onDecline={() => setQuality((q) => (q.tier === "low" ? q : downgrade(q)))}
      />
      <AdaptiveDpr pixelated={false} />
      <JourneyDriver />
      <Lighting />
      <CameraController mobile={quality.mobile} />
      <Suspense fallback={null}>
        <Backdrop />
        <Network quality={quality} />
        <Particles count={quality.dust} />
      </Suspense>
      <Overlay3DSync />
      <Effects mode={quality.postfx} />
    </Canvas>
  );
}
