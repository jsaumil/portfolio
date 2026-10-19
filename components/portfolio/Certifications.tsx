import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { NodeContent } from "@/data/portfolio";
import { Panel, R } from "./Panel";

type Props = Extract<NodeContent, { type: "certifications" }>;

export function Certifications({ items }: Props) {
  return (
    <Panel title="Certifications">
      <div className="certs">
        {items.map((c, k) => (
          <R i={2 + k} key={c.name} className="cert">
            <div>
              <h3 className="lead lead--sm">{c.name}</h3>
              <p className="sub">{c.issuer}</p>
            </div>
            <a className="link link--quiet" href={c.link.href} target="_blank" rel="noreferrer" aria-label={`${c.link.label}: ${c.name}`}>
              <span>{c.link.label}</span>
              <ArrowUpRight size={14} aria-hidden />
            </a>
          </R>
        ))}
      </div>
    </Panel>
  );
}
