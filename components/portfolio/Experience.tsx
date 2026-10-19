import type { NodeContent } from "@/data/portfolio";
import { Panel, R } from "./Panel";

type Props = Extract<NodeContent, { type: "experience" }>;

export function Experience({ roles }: Props) {
  return (
    <Panel title="Experience" wide>
      <div className="roles">
        {roles.map((role, k) => (
          <section className="role" key={role.company}>
            <R i={2 + k * 3} className="role__top">
              <h3 className="lead">{role.company}</h3>
              <span className="meta">{role.period}</span>
            </R>
            <R i={3 + k * 3} className="sub">
              {role.title}, {role.location}
            </R>
            <R i={4 + k * 3} as="p" className="body">
              {role.summary}
            </R>
          </section>
        ))}
      </div>
    </Panel>
  );
}
