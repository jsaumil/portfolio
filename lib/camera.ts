import { Vector3 } from "three";
import { graphNodes, networkCenter, segments, stops } from "./graph";
import { ARRIVE, HOLD, LAST, runtime, smootherstep } from "./journey";

/**
 * Camera choreography. A pose for every stop is a function of `o`, the offset
 * from that stop in journey units (o in [ARRIVE - 1, HOLD]). That lets the
 * camera slowly orbit and push in while dwelling, and keeps travel continuous:
 * travel always blends P_a(HOLD) -> P_b(ARRIVE - 1).
 */

export interface Pose {
  pos: Vector3;
  look: Vector3;
}

export interface CameraLayout {
  mobile: boolean;
  aspect: number;
}

const UP = new Vector3(0, 1, 0);
const v1 = new Vector3();
const v2 = new Vector3();
const v3 = new Vector3();

function stopPose(stop: number, o: number, layout: CameraLayout, out: Pose) {
  const s = stops[stop];
  const node = graphNodes[s.node];
  // Narrow screens need more distance to fit the same content.
  const fit = layout.mobile ? 1.45 : Math.max(1, 1.5 / layout.aspect);

  if (s.kind === "intro") {
    const dolly = o * 2.2; // creep forward while the user starts to scroll
    // On portrait screens the network sits in the upper part, above the intro copy.
    out.look.copy(networkCenter).add(v1.set(0, layout.mobile ? -4.5 : -0.2, 0));
    out.pos
      .copy(networkCenter)
      .add(v1.set(layout.mobile ? 0.8 : 2.4, 3.4, (layout.mobile ? 27 : 23 * fit) - dolly));
    return out;
  }

  if (s.kind === "finale") {
    // Look below the root so it settles in the upper part of the frame,
    // clear of the end card's type.
    out.look.copy(node.vec).add(v1.set(0, layout.mobile ? -2.6 : -1.2, 0));
    out.pos.copy(node.vec).add(v1.set(0, 0.15 + o * 1.5, (7.6 - o * 5) * fit));
    return out;
  }

  const dir = v1.set(...(node.cameraDir ?? [0, 0.15, 1])).normalize();
  // Slight orbit while dwelling, scrubbed by scroll.
  dir.applyAxisAngle(UP, o * 0.45);
  const dist = node.size * 7 * (node.cameraDistance ?? 1) * fit * (1 - (o - (ARRIVE - 1)) * 0.07);
  out.pos.copy(node.vec).addScaledVector(dir, dist);

  const forward = v2.copy(node.vec).sub(out.pos).normalize();
  const right = v3.crossVectors(forward, UP).normalize();
  out.look.copy(node.vec);
  if (layout.mobile) {
    // Node sits in the upper third, panel below.
    out.look.addScaledVector(UP, -dist * 0.3);
  } else {
    // Panels on the left share the screen with the journey rail on the
    // right, so those nodes sit a little closer to centre.
    const side = node.panelSide === "left" ? -1 : 1;
    out.look.addScaledVector(right, side * dist * (side > 0 ? 0.3 : 0.2));
  }
  return out;
}

const a: Pose = { pos: new Vector3(), look: new Vector3() };
const b: Pose = { pos: new Vector3(), look: new Vector3() };
const lift = new Vector3();

/** Target camera pose for the current journey state. */
export function journeyPose(layout: CameraLayout, out: Pose) {
  const u = runtime.u;
  const seg = runtime.segment;
  const local = u - seg;

  if (local <= HOLD) return stopPose(seg, local, layout, out);
  if (local >= ARRIVE) return stopPose(Math.min(seg + 1, LAST), local - 1, layout, out);

  stopPose(seg, HOLD, layout, a);
  stopPose(seg + 1, ARRIVE - 1, layout, b);
  const e = runtime.travelE;
  const arc = Math.sin(Math.PI * e);

  out.pos.lerpVectors(a.pos, b.pos, e);
  // Pull back and rise mid-flight so the energy edge stays in frame.
  const len = segments[seg].length;
  lift
    .subVectors(a.pos, a.look)
    .add(v1.subVectors(b.pos, b.look))
    .normalize()
    .multiplyScalar(len * 0.16 * arc);
  out.pos.add(lift).addScaledVector(UP, len * 0.05 * arc);

  // Look follows the energy head mid-flight.
  out.look.lerpVectors(a.look, b.look, e).lerp(runtime.head, 0.55 * arc);
  return out;
}
