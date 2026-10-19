"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Vector3 } from "three";
import { graphNodes, stops } from "@/lib/graph";
import { LAST, runtime } from "@/lib/journey";
import { overlay } from "@/lib/overlay";

const world = new Vector3();
const edge = new Vector3();
const right = new Vector3();

/**
 * Binds the HTML content layer to the 3D scene: panel reveal values, the
 * leader line from the active node to its panel, subtle panel parallax, and
 * the journey rail. Runs after the camera has moved, before rendering.
 */
export function Overlay3DSync() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const last = useRef({ active: -2, railP: -1 });
  const vis = useMemo(() => new Map<number, boolean>(), []);
  // Panel anchor geometry. Offsets ignore transforms, so these only change
  // on resize; caching them avoids a forced layout every frame.
  const anchors = useMemo(() => new Map<number, { x: number; y: number; w: number }>(), []);
  const cachedSize = useRef("");

  useFrame(() => {
    const { panels, connector, connectorNode } = overlay;
    const mobile = size.width < 768;
    const sizeKey = `${size.width}x${size.height}`;
    if (cachedSize.current !== sizeKey) {
      anchors.clear();
      cachedSize.current = sizeKey;
    }
    let best = -1;
    let bestR = 0;

    panels.forEach((el, k) => {
      const r = runtime.panelReveal[k] ?? 0;
      const dim = runtime.panelDim[k] ?? 0;
      el.style.setProperty("--r", r.toFixed(4));
      el.style.setProperty("--dim", dim.toFixed(4));
      const visible = r > 0.002;
      if (vis.get(k) !== visible) {
        vis.set(k, visible);
        el.style.visibility = visible ? "visible" : "hidden";
        el.toggleAttribute("inert", !visible);
        el.setAttribute("aria-hidden", visible ? "false" : "true");
      }
      if (k > 0 && k < LAST && r > bestR) {
        bestR = r;
        best = k;
      }
    });

    // Leader line + parallax for the panel in focus.
    if (connector && connectorNode) {
      if (best > 0) {
        const el = panels.get(best)!;
        const node = graphNodes[stops[best].node];
        world.copy(node.vec).project(camera);
        const sx = (world.x * 0.5 + 0.5) * size.width;
        const sy = (-world.y * 0.5 + 0.5) * size.height;
        // Screen radius of the node, so the line starts at its surface.
        right.setFromMatrixColumn(camera.matrixWorld, 0);
        edge.copy(node.vec).addScaledVector(right, node.size * 1.25).project(camera);
        const rad = Math.abs((edge.x - world.x) * 0.5 * size.width);

        const side = node.panelSide === "left" ? -1 : 1;
        // Parallax: the panel drifts a little with its node.
        const px = mobile ? 0 : (sx - size.width * (side > 0 ? 0.33 : 0.67)) * 0.12;
        const py = mobile ? 0 : (sy - size.height * 0.5) * 0.1;
        el.style.setProperty("--px", `${px.toFixed(1)}px`);
        el.style.setProperty("--py", `${py.toFixed(1)}px`);

        let box = anchors.get(best);
        if (!box) {
          const anchor = el.querySelector<HTMLElement>("[data-anchor]") ?? el;
          box = { x: el.offsetLeft + anchor.offsetLeft, y: el.offsetTop + anchor.offsetTop, w: anchor.offsetWidth };
          anchors.set(best, box);
        }
        const ax = box.x + px + (mobile ? 28 : side > 0 ? 0 : box.w);
        const ay = box.y + py + (mobile ? 0 : 28);
        let d: string;
        if (mobile) {
          const y0 = sy + rad;
          d = `M ${sx.toFixed(1)} ${y0.toFixed(1)} L ${sx.toFixed(1)} ${((y0 + ay) / 2).toFixed(1)} L ${ax.toFixed(1)} ${((y0 + ay) / 2).toFixed(1)} L ${ax.toFixed(1)} ${ay.toFixed(1)}`;
        } else {
          const x0 = sx + rad * side;
          const elbow = x0 + (ax - x0) * 0.45;
          d = `M ${x0.toFixed(1)} ${sy.toFixed(1)} L ${elbow.toFixed(1)} ${sy.toFixed(1)} L ${elbow.toFixed(1)} ${ay.toFixed(1)} L ${ax.toFixed(1)} ${ay.toFixed(1)}`;
        }
        connector.setAttribute("d", d);
        const r = runtime.panelReveal[best];
        const draw = Math.min(r * 1.4, 1);
        connector.style.strokeDashoffset = `${(1 - draw).toFixed(4)}`;
        connector.style.opacity = `${Math.min(r * 2, 1) * (1 - (runtime.panelDim[best] ?? 0) * 0.5)}`;
        connectorNode.setAttribute("cx", ax.toFixed(1));
        connectorNode.setAttribute("cy", ay.toFixed(1));
        connectorNode.style.opacity = `${Math.max(0, draw - 0.85) / 0.15}`;
      } else {
        connector.style.opacity = "0";
        connectorNode.style.opacity = "0";
      }
    }

    // Journey rail.
    if (overlay.rail) {
      const p = runtime.u / LAST;
      if (Math.abs(p - last.current.railP) > 0.0005) {
        overlay.rail.style.setProperty("--p", p.toFixed(4));
        last.current.railP = p;
      }
      if (runtime.activeStop !== last.current.active) {
        overlay.railItems.forEach((el, k) => {
          el.toggleAttribute("data-active", k === runtime.activeStop);
          el.toggleAttribute("data-done", runtime.u > k + 0.3);
        });
        last.current.active = runtime.activeStop;
      }
    }
  }, 0);

  return null;
}
