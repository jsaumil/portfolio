import type { NodeContent } from "@/data/portfolio";
import { Panel, R } from "./Panel";

type Props = Extract<NodeContent, { type: "skills" }>;

export function Skills({ groups }: Props) {
  return (
    <Panel title="Skills" wide>
      <div className="skill-groups">
        {groups.map((g, k) => (
          <R i={2 + k} key={g.name} className="skill-group">
            <h3 className="meta">{g.name}</h3>
            <ul className="chips">
              {g.items.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </R>
        ))}
      </div>
    </Panel>
  );
}
