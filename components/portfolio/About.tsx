import type { NodeContent } from "@/data/portfolio";
import { Panel, R } from "./Panel";

type Props = Extract<NodeContent, { type: "about" }>;

export function About({ statement, traits }: Props) {
  return (
    <Panel title="About">
      <R i={2} as="p" className="statement">
        {statement}
      </R>
      <R i={3} as="ul" className="chips chips--quiet">
        {traits.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </R>
    </Panel>
  );
}
