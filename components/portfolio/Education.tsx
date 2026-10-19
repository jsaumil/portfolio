import type { NodeContent } from "@/data/portfolio";
import { Panel, R } from "./Panel";

type Props = Extract<NodeContent, { type: "education" }>;

export function Education({ institution, degree, period, location, focus }: Props) {
  return (
    <Panel title="Education" meta={period}>
      <R i={2} as="h3" className="lead">
        {degree}
      </R>
      <R i={3} className="sub">
        {institution}
      </R>
      <R i={4} className="facts">
        {location}
      </R>
      <R i={5} as="ul" className="chips">
        {focus.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </R>
    </Panel>
  );
}
