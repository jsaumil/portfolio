import { ArrowUpRight, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { profile } from "@/data/portfolio";
import { graphNodes, stops } from "@/lib/graph";
import { SectionContent } from "./SectionContent";

/**
 * Readable fallback for browsers without WebGL. Same data, same panels,
 * laid out as a vertical path.
 */
export function StaticPortfolio() {
  return (
    <main className="static">
      <header className="static__hero">
        <p className="meta">{profile.roles.join(", ")}</p>
        <h1>{profile.name}</h1>
        <p className="intro__tagline">{profile.tagline}</p>
        <a className="button" href={`mailto:${profile.email}`}>
          <EnvelopeSimple size={18} aria-hidden />
          <span>Email me</span>
        </a>
      </header>
      <ol className="static__path">
        {stops.slice(1, -1).map((s) => {
          const node = graphNodes[s.node];
          return node.content ? (
            <li key={s.id} id={s.id} className="static__item">
              <SectionContent content={node.content} />
            </li>
          ) : null;
        })}
      </ol>
      <footer className="static__footer">
        <a className="link link--quiet" href={profile.github}>
          GitHub <ArrowUpRight size={14} aria-hidden />
        </a>
        <a className="link link--quiet" href={profile.linkedin}>
          LinkedIn <ArrowUpRight size={14} aria-hidden />
        </a>
        <a className="link link--quiet" href={profile.resume}>
          Resume <ArrowUpRight size={14} aria-hidden />
        </a>
      </footer>
    </main>
  );
}
