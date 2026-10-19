import { Vector3 } from "three";
import {
  graphEdges,
  graphNodes,
  pointOnSegment,
  ROOT,
  segments,
  stops,
} from "./graph";

/**
 * The journey timeline.
 *
 * Scroll is mapped to `u`, a continuous position measured in stops:
 * u = 0 is the intro shot, u = 1 is the first section, ... u = LAST is the
 * finale. Between two integer stops the local timeline is:
 *
 *   0 ........ HOLD ................ ARRIVE ...... 1
 *   dwell at A | travel along the edge(s) | settle at B, B activates
 *
 * Everything (camera, energy, node states, panels) is a pure function of u,
 * which is what makes the whole experience scrubbable and reversible.
 */

export const HOLD = 0.3;
export const ARRIVE = 0.8;
export const LAST = stops.length - 1;

/** Viewport heights of scroll per stop-to-stop segment. */
export const SEGMENT_VH = 170;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

const N = graphNodes.length;
const E = graphEdges.length;
const S = stops.length;

/** Mutable per-frame state. Written once per frame by `updateJourney`, read by
 * every 3D component and the DOM overlay. Never stored in React state. */
export const runtime = {
  /** Scroll target in stop units (set by the scroll hook). */
  target: 0,
  /** Damped journey position. */
  u: 0,
  segment: 0,
  travelT: 0,
  travelE: 0,
  /** Energy head. */
  head: new Vector3(),
  headIntensity: 0,
  headDirection: new Vector3(1, 0, 0),
  nodeActivation: new Float32Array(N),
  nodeCompleted: new Float32Array(N),
  nodeShock: new Float32Array(N),
  edgeProgress: new Float32Array(E),
  edgeForward: new Uint8Array(E).fill(1),
  edgeCompleted: new Float32Array(E),
  edgeBolt: new Float32Array(E),
  panelReveal: new Float32Array(S),
  panelDim: new Float32Array(S),
  intro: 1,
  finale: 0,
  /** 0..1, how strongly the camera is focused on a single node. */
  focus: 0,
  /** Stop currently in focus (for the HUD); -1 while travelling. */
  activeStop: 0,
  pointer: { x: 0, y: 0 },
  reducedMotion: false,
};

const tmp = new Vector3();
const leafParents = graphNodes
  .filter((n) => n.kind === "leaf" && n.parent)
  .map((n) => [n.index, graphNodes.findIndex((x) => x.id === n.parent)] as const);

export function updateJourney(u: number) {
  u = Math.min(Math.max(u, 0), LAST);
  runtime.u = u;

  const seg = Math.min(Math.floor(u), S - 2);
  const local = u - seg;
  const travelT = clamp01((local - HOLD) / (ARRIVE - HOLD));
  const travelE = smootherstep(travelT);
  runtime.segment = seg;
  runtime.travelT = travelT;
  runtime.travelE = travelE;

  const { nodeActivation, nodeCompleted, nodeShock, edgeProgress, edgeCompleted, edgeBolt } =
    runtime;
  nodeActivation.fill(0);
  nodeCompleted.fill(0);
  nodeShock.fill(0);
  edgeProgress.fill(0);
  edgeCompleted.fill(0);
  edgeBolt.fill(0);

  // Past segments: edges and pass-through nodes are completed.
  for (let s = 0; s < seg; s++) {
    for (const pe of segments[s].edges) {
      edgeCompleted[pe.edge] = 1;
      edgeProgress[pe.edge] = 1;
      runtime.edgeForward[pe.edge] = pe.forward ? 1 : 0;
    }
    for (let k = 1; k < segments[s].nodes.length - 1; k++) nodeCompleted[segments[s].nodes[k]] = 1;
  }

  // Current segment: the energy head leads the camera slightly so the target
  // node lights up as the camera settles.
  const cur = segments[seg];
  const headT = clamp01(easeInOutSine(clamp01(travelT * 1.08)));
  const d = headT * cur.length;
  pointOnSegment(cur, d, runtime.head);
  pointOnSegment(cur, Math.min(d + 0.05, cur.length), tmp);
  runtime.headDirection.subVectors(tmp, runtime.head);
  if (runtime.headDirection.lengthSq() > 1e-8) runtime.headDirection.normalize();
  const envelope = travelT > 0 && travelT < 1 ? Math.pow(Math.sin(Math.PI * Math.min(headT * 1.02, 1)), 0.35) : 0;
  runtime.headIntensity = cur.length > 0 ? envelope : 0;

  for (const pe of cur.edges) {
    const p = clamp01((d - pe.start) / pe.length);
    if (p > 0) {
      edgeProgress[pe.edge] = Math.max(edgeProgress[pe.edge] * edgeCompleted[pe.edge], p);
      runtime.edgeForward[pe.edge] = pe.forward ? 1 : 0;
      // Bolt lives on the edge the head is on, and lingers briefly behind it.
      const behind = d - (pe.start + pe.length);
      edgeBolt[pe.edge] = envelope * (behind > 0 ? Math.max(0, 1 - behind / 1.5) : 1);
    }
  }
  for (let k = 1; k < cur.nodes.length - 1; k++) {
    const n = cur.nodes[k];
    const nd = cur.nodeDistances[k];
    nodeActivation[n] = Math.max(nodeActivation[n], Math.exp(-Math.abs(d - nd) / 0.9) * envelope);
    if (d >= nd) nodeCompleted[n] = Math.max(nodeCompleted[n], smoothstep(nd, nd + 1.5, d));
  }

  // Stops: approaching -> active -> completed.
  runtime.activeStop = -1;
  let focus = 0;
  for (let k = 1; k < S; k++) {
    const n = stops[k].node;
    const arrive = k - 1 + ARRIVE; // u at which we arrive at stop k
    const approach = smoothstep(k - 1 + HOLD, arrive, u);
    const leave = k === LAST ? 0 : smoothstep(k + HOLD * 0.7, k + HOLD + 0.3, u);
    const active = smoothstep(arrive - 0.05, arrive + 0.04, u) * (1 - leave);
    const completed = k === LAST ? 0 : smoothstep(k + HOLD * 0.7, k + HOLD + 0.3, u);
    nodeActivation[n] = Math.max(nodeActivation[n], approach * 0.4, active);
    nodeCompleted[n] = Math.max(nodeCompleted[n], completed);
    const shock = (u - (arrive - 0.03)) / 0.22;
    if (shock > 0 && shock < 1) nodeShock[n] = shock;

    if (k < LAST) {
      const rise = smoothstep(arrive - 0.01, arrive + 0.1, u);
      const fall = 1 - smoothstep(k + 0.22, k + HOLD + 0.06, u);
      runtime.panelReveal[k] = rise * fall;
      runtime.panelDim[k] = smoothstep(k + 0.1, k + 0.24, u);
    }
    if (active > 0.5) runtime.activeStop = k;
    focus = Math.max(focus, active);
  }

  // Intro & finale.
  runtime.intro = 1 - smoothstep(0.04, 0.22, u);
  runtime.panelReveal[0] = runtime.intro;
  if (u < HOLD) runtime.activeStop = 0;
  const finale = smoothstep(LAST - 1 + 0.45, LAST, u);
  runtime.finale = finale;
  runtime.panelReveal[LAST] = smoothstep(LAST - 0.12, LAST - 0.02, u);
  if (u > LAST - 0.15) runtime.activeStop = LAST;
  runtime.focus = focus * (1 - finale);

  // The root is the source: always somewhat lit, strongest in intro and finale.
  nodeActivation[ROOT] = Math.max(nodeActivation[ROOT], 0.35 + 0.25 * runtime.intro, finale);

  // Leaves echo their parent.
  for (const [leaf, parent] of leafParents) {
    nodeActivation[leaf] = Math.max(nodeActivation[leaf], nodeActivation[parent] * 0.75);
    nodeCompleted[leaf] = Math.max(nodeCompleted[leaf], nodeCompleted[parent]);
  }

  // Finale: the whole network softly illuminates.
  if (finale > 0) {
    for (let i = 0; i < N; i++) {
      nodeActivation[i] = Math.max(nodeActivation[i], finale * 0.55);
    }
    for (let i = 0; i < E; i++) edgeCompleted[i] = Math.max(edgeCompleted[i], finale);
  }
}

/** Scroll offset (px) that lands exactly on a stop. */
export const stopScrollY = (stop: number, vh: number) => (stop * SEGMENT_VH * vh) / 100;
