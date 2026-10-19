"use client";

import { graphEdges, graphNodes } from "@/lib/graph";
import type { Quality } from "@/lib/quality";
import { AmbientNetwork } from "./AmbientNetwork";
import { Energy } from "./Energy";
import { NetworkEdge } from "./NetworkEdge";
import { NetworkNode } from "./NetworkNode";
import { RootNameplate } from "./RootNameplate";

/** The portfolio graph, generated entirely from `data/portfolio.ts`. */
export function Network({ quality }: { quality: Quality }) {
  return (
    <group>
      <AmbientNetwork count={quality.ambientNodes} />
      {graphEdges.map((e) => (
        <NetworkEdge key={e.index} edge={e} quality={quality.tier === "low" ? "low" : "high"} />
      ))}
      {graphNodes.map((n) => (
        <NetworkNode
          key={n.id}
          node={n}
          segments={n.kind === "root" ? quality.sphereSegments + 16 : quality.sphereSegments}
        />
      ))}
      <Energy sparks={quality.sparks} />
      <RootNameplate />
    </group>
  );
}
