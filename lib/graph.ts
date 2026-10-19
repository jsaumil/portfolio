import { Vector3 } from "three";
import { journey, nodes, type PortfolioNode } from "@/data/portfolio";

/**
 * Pure data layer: turns the node list into a graph, the journey into stops,
 * and consecutive stops into traversable paths. No React, no rendering.
 */

export interface GraphNode extends PortfolioNode {
  index: number;
  vec: Vector3;
}

export interface GraphEdge {
  index: number;
  a: number;
  b: number;
  length: number;
}

export interface PathEdge {
  edge: number;
  /** true when travelling a -> b, false when b -> a. */
  forward: boolean;
  /** Distance along the whole path where this edge starts. */
  start: number;
  length: number;
}

export interface Segment {
  from: number; // stop index
  to: number;
  nodes: number[]; // node indices along the path
  /** Distance along the path at which each node in `nodes` is reached. */
  nodeDistances: number[];
  edges: PathEdge[];
  length: number;
}

export interface Stop {
  index: number;
  node: number;
  kind: "intro" | "section" | "finale";
  id: string;
}

const byId = new Map<string, number>();
export const graphNodes: GraphNode[] = nodes.map((n, index) => {
  byId.set(n.id, index);
  return { ...n, index, vec: new Vector3(...n.position) };
});

export const nodeIndex = (id: string) => {
  const i = byId.get(id);
  if (i === undefined) throw new Error(`Unknown node "${id}"`);
  return i;
};

export const ROOT = graphNodes.findIndex((n) => n.kind === "root");

// Edges: tree edges from `parent`, plus `links`. Deduplicated, undirected.
export const graphEdges: GraphEdge[] = [];
const edgeKey = new Map<string, number>();
const addEdge = (a: number, b: number) => {
  const key = a < b ? `${a}:${b}` : `${b}:${a}`;
  if (edgeKey.has(key) || a === b) return;
  const index = graphEdges.length;
  edgeKey.set(key, index);
  graphEdges.push({ index, a, b, length: graphNodes[a].vec.distanceTo(graphNodes[b].vec) });
};
for (const n of graphNodes) {
  if (n.parent) addEdge(nodeIndex(n.parent), n.index);
  n.links?.forEach((l) => addEdge(n.index, nodeIndex(l)));
}

const adjacency: number[][] = graphNodes.map(() => []);
for (const e of graphEdges) {
  adjacency[e.a].push(e.b);
  adjacency[e.b].push(e.a);
}

export const findEdge = (a: number, b: number) =>
  edgeKey.get(a < b ? `${a}:${b}` : `${b}:${a}`);

/** Shortest path by edge length (Dijkstra; the graph is tiny). */
function shortestPath(from: number, to: number): number[] {
  const dist = graphNodes.map(() => Infinity);
  const prev = graphNodes.map(() => -1);
  const done = graphNodes.map(() => false);
  dist[from] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < dist.length; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] === Infinity || u === to) break;
    done[u] = true;
    for (const v of adjacency[u]) {
      const e = graphEdges[findEdge(u, v)!];
      if (dist[u] + e.length < dist[v]) {
        dist[v] = dist[u] + e.length;
        prev[v] = u;
      }
    }
  }
  if (from !== to && prev[to] < 0) throw new Error(`No path between ${from} and ${to}`);
  const path = [to];
  while (path[0] !== from) path.unshift(prev[path[0]]);
  return path;
}

export const stops: Stop[] = [
  { index: 0, node: ROOT, kind: "intro", id: "intro" },
  ...journey.map((id, i) => ({ index: i + 1, node: nodeIndex(id), kind: "section" as const, id })),
  { index: journey.length + 1, node: ROOT, kind: "finale", id: "finale" },
];

export const segments: Segment[] = stops.slice(0, -1).map((s, i) => {
  const path = shortestPath(s.node, stops[i + 1].node);
  const edges: PathEdge[] = [];
  const nodeDistances = [0];
  let length = 0;
  for (let k = 0; k < path.length - 1; k++) {
    const ei = findEdge(path[k], path[k + 1])!;
    const e = graphEdges[ei];
    edges.push({ edge: ei, forward: e.a === path[k], start: length, length: e.length });
    length += e.length;
    nodeDistances.push(length);
  }
  return { from: i, to: i + 1, nodes: path, nodeDistances, edges, length };
});

/** Point on a segment path at distance `d`. */
export function pointOnSegment(seg: Segment, d: number, out: Vector3) {
  if (seg.edges.length === 0) return out.copy(graphNodes[seg.nodes[0]].vec);
  for (let k = 0; k < seg.edges.length; k++) {
    const pe = seg.edges[k];
    if (d <= pe.start + pe.length || k === seg.edges.length - 1) {
      const t = Math.min(Math.max((d - pe.start) / pe.length, 0), 1);
      return out.lerpVectors(graphNodes[seg.nodes[k]].vec, graphNodes[seg.nodes[k + 1]].vec, t);
    }
  }
  return out;
}

export const networkCenter = graphNodes
  .reduce((acc, n) => acc.add(n.vec), new Vector3())
  .divideScalar(graphNodes.length);

/* ------------------------------------------------------------------------ */
/* Ambient network: procedural filler nodes that make the graph feel like   */
/* part of a much larger neural mesh. Deterministic (seeded).               */
/* ------------------------------------------------------------------------ */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface AmbientNetwork {
  positions: Float32Array; // xyz per node
  sizes: Float32Array;
  seeds: Float32Array;
  lines: Float32Array; // xyz xyz per segment
}

export function buildAmbientNetwork(count: number, seed = 7): AmbientNetwork {
  const rand = mulberry32(seed);
  const pts: Vector3[] = [];
  const main = graphNodes.map((n) => n.vec);
  let guard = 0;
  while (pts.length < count && guard++ < count * 40) {
    // Ellipsoidal shell around the network, denser further out so the
    // foreground stays readable.
    const u = rand() * 2 - 1;
    const th = rand() * Math.PI * 2;
    const r = Math.pow(rand(), 0.55);
    const s = Math.sqrt(1 - u * u);
    const p = new Vector3(s * Math.cos(th) * 19 * r, u * 11 * r, s * Math.sin(th) * 16 * r - 2);
    if (main.some((m) => m.distanceTo(p) < 1.6)) continue;
    if (pts.some((q) => q.distanceTo(p) < 1.15)) continue;
    pts.push(p);
  }
  const positions = new Float32Array(pts.length * 3);
  const sizes = new Float32Array(pts.length);
  const seeds = new Float32Array(pts.length);
  pts.forEach((p, i) => {
    p.toArray(positions, i * 3);
    sizes[i] = 0.06 + Math.pow(rand(), 3) * 0.16;
    seeds[i] = rand();
  });

  // Connect each ambient node to its 2 nearest neighbours, and the main nodes
  // into the mesh so the portfolio graph is embedded rather than floating.
  const segs: number[] = [];
  const seen = new Set<string>();
  const link = (a: Vector3, b: Vector3, key: string) => {
    if (seen.has(key)) return;
    seen.add(key);
    segs.push(a.x, a.y, a.z, b.x, b.y, b.z);
  };
  pts.forEach((p, i) => {
    const near = pts
      .map((q, j) => ({ j, d: q.distanceTo(p) }))
      .filter((x) => x.j !== i && x.d < 4.2)
      .sort((x, y) => x.d - y.d)
      .slice(0, 2);
    near.forEach(({ j }) => link(p, pts[j], i < j ? `${i}-${j}` : `${j}-${i}`));
  });
  main.forEach((m, mi) => {
    pts
      .map((q, j) => ({ j, d: q.distanceTo(m) }))
      .sort((x, y) => x.d - y.d)
      .slice(0, graphNodes[mi].kind === "root" ? 4 : 2)
      .forEach(({ j }) => link(m, pts[j], `m${mi}-${j}`));
  });

  return { positions, sizes, seeds, lines: new Float32Array(segs) };
}
