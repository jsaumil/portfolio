import { GithubLogo, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { NodeContent } from "@/data/portfolio";
import { Panel, R } from "./Panel";

type Props = Extract<NodeContent, { type: "project" }>;

export function Project({ name, domain, summary, stack, link }: Props) {
  return (
    <Panel title={name} meta={domain}>
      <R i={2} as="p" className="body">
        {summary}
      </R>
      <R i={3} as="ul" className="chips">
        {stack.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </R>
      <R i={4}>
        <a className="link" href={link.href} target="_blank" rel="noreferrer">
          <GithubLogo size={16} weight="regular" aria-hidden />
          <span>{link.label}</span>
          <ArrowUpRight size={14} weight="regular" aria-hidden />
        </a>
      </R>
    </Panel>
  );
}
