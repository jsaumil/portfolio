/**
 * DOM handles the 3D loop writes to directly. Registered by the content
 * layer on mount; updated inside the render loop so HTML and WebGL move in
 * the same frame without React re-renders.
 */
export const overlay = {
  panels: new Map<number, HTMLElement>(),
  connector: null as SVGPathElement | null,
  connectorNode: null as SVGCircleElement | null,
  rail: null as HTMLElement | null,
  railItems: new Map<number, HTMLElement>(),
  root: null as HTMLElement | null,
};
