# Saumil Jain: Portfolio

A scroll-driven 3D network. The camera travels from node to node, energy runs
along the connecting edges, and each node opens a glass panel with its content.
It ends back at the root node, which carries the name.

## Run

```bash
bun install
bun run dev        # http://localhost:3000
bun run build && bun run start
bun run typecheck
```

## Stack

Next.js 16 (App Router), React Three Fiber 9, drei, postprocessing, Lenis, Geist.
Every material is a small custom GLSL shader, so the scene needs no textures
or model files.

## How it fits together

```
data/portfolio.ts        All content, node positions, journey order
lib/graph.ts             Nodes -> graph, journey -> stops, shortest paths, ambient mesh
lib/journey.ts           Scroll position (u, in stops) -> every node/edge/panel state
lib/camera.ts            Camera pose for any u (dwell orbit, travel arc, follow energy)
lib/uniforms.ts          Palette and uniforms shared by all shaders (light rig, fog, time)
hooks/useScrollProgress  Lenis -> runtime.target
components/3d/           Canvas, nodes, edges, lightning, particles, light rig, post fx
components/portfolio/    HTML panels (one per content type), HUD, journey rail
```

Everything visible is a pure function of the scroll position `u`, so the
journey scrubs both ways and stops exactly where you stop. Per-frame state
lives in a mutable `runtime` object. React never re-renders while you scroll.
The 3D loop writes panel reveal values (`--r`) and the leader line straight to
the DOM, in the same frame as the WebGL render.

## Adding a section

1. Add a node to `nodes` in `data/portfolio.ts` with a `position`, a `size`, a
   `parent` (or `links`) so it is connected, and a `content` block.
2. Add its id to `journey` where you want the camera to stop.

Camera poses, edge paths (found through the graph), panel timing and the
journey rail are generated. To add a new kind of content, add a variant to
`NodeContent`, a panel component in `components/portfolio/`, and a case in
`SectionContent.tsx`.

Useful per-node options: `panelSide` (`"left"` or `"right"`), `cameraDir`
(direction from the node to the camera) and `cameraDistance` (a multiplier).

## Performance

- Ambient nodes are one instanced draw call and their connections one line draw.
- Lightning, sparks, dust and billboards are computed in vertex shaders.
- Quality tiers (`lib/quality.ts`) adjust DPR, particle counts, geometry detail
  and post-processing. drei's `PerformanceMonitor` steps down a tier when frame
  rate drops.
- Without WebGL, a static version renders from the same data.
