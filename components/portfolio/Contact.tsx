import { ArrowUpRight, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import type { NodeContent } from "@/data/portfolio";
import { Panel, R } from "./Panel";

type Props = Extract<NodeContent, { type: "contact" }>;

export function Contact({ headline, email, location, links }: Props) {
  return (
    <Panel title="Contact" meta={location}>
      <R i={2} as="p" className="statement">
        {headline}
      </R>
      <R i={3}>
        <a className="button" href={`mailto:${email}`}>
          <EnvelopeSimple size={18} aria-hidden />
          <span>Email me</span>
        </a>
      </R>
      <R i={4} className="mono-line">
        {email}
      </R>
      <R i={5} className="link-row">
        {links.map((l) => (
          <a key={l.label} className="link link--quiet" href={l.href} target="_blank" rel="noreferrer">
            <span>{l.label}</span>
            <ArrowUpRight size={14} aria-hidden />
          </a>
        ))}
      </R>
    </Panel>
  );
}
