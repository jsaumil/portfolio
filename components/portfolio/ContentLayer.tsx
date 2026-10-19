"use client";

import { ArrowCounterClockwise, ArrowUpRight, EnvelopeSimple, FilePdf, GithubLogo, LinkedinLogo } from "@phosphor-icons/react";
import { type CSSProperties, useEffect, useRef } from "react";
import { profile } from "@/data/portfolio";
import { graphNodes, stops } from "@/lib/graph";
import { LAST } from "@/lib/journey";
import { overlay } from "@/lib/overlay";
import { scrollToStop } from "@/hooks/useScrollProgress";
import { R } from "./Panel";
import { SectionContent } from "./SectionContent";

/**
 * Fixed HTML layer above the canvas. Nothing here re-renders while scrolling:
 * the 3D loop writes reveal values and the leader line straight to the DOM.
 */
export function ContentLayer() {
  const connector = useRef<SVGPathElement>(null);
  const connectorNode = useRef<SVGCircleElement>(null);
  const rail = useRef<HTMLElement>(null);

  useEffect(() => {
    overlay.connector = connector.current;
    overlay.connectorNode = connectorNode.current;
    overlay.rail = rail.current;
    return () => {
      overlay.connector = null;
      overlay.connectorNode = null;
      overlay.rail = null;
    };
  }, []);

  const stageRef = (k: number) => (el: HTMLElement | null) => {
    if (el) overlay.panels.set(k, el);
    else overlay.panels.delete(k);
  };
  const railRef = (k: number) => (el: HTMLElement | null) => {
    if (el) overlay.railItems.set(k, el);
    else overlay.railItems.delete(k);
  };

  return (
    <div className="layer">
      <svg className="connector" aria-hidden>
        <path ref={connector} pathLength={1} />
        <circle ref={connectorNode} r={2.5} />
      </svg>

      <header className="hud">
        <a href="#intro" className="wordmark" onClick={(e) => { e.preventDefault(); scrollToStop(0); }}>
          <span className="wordmark__mark" aria-hidden>SJ</span>
          <span className="wordmark__name">{profile.name}</span>
        </a>
        <nav className="hud__links" aria-label="Profiles">
          <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub">
            <GithubLogo size={18} />
          </a>
          <a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <LinkedinLogo size={18} />
          </a>
          <a href={profile.resume} target="_blank" rel="noreferrer" className="hud__resume">
            <FilePdf size={16} aria-hidden />
            <span>Resume</span>
          </a>
        </nav>
      </header>

      <nav ref={rail} className="rail" aria-label="Journey">
        <div className="rail__track" aria-hidden>
          <div className="rail__fill" />
        </div>
        <ol>
          {stops.slice(1, -1).map((s) => (
            <li key={s.id} ref={railRef(s.index)}>
              <button type="button" onClick={() => scrollToStop(s.index)}>
                <span className="rail__label">{graphNodes[s.node].title}</span>
                <span className="rail__tick" aria-hidden />
              </button>
            </li>
          ))}
          <li ref={railRef(LAST)}>
            <button type="button" onClick={() => scrollToStop(LAST)}>
              <span className="rail__label">{profile.firstName}</span>
              <span className="rail__tick rail__tick--root" aria-hidden />
            </button>
          </li>
        </ol>
      </nav>

      {/* Intro */}
      <section ref={stageRef(0)} className="stage stage--intro" aria-label="Introduction">
        <div className="intro">
          <h1 className="sr-only">
            {profile.name}, {profile.roles[0]}
          </h1>
          <R i={0} className="meta">
            {profile.roles[0]}, {profile.location}
          </R>
          <R i={1} as="p" className="intro__tagline">
            {profile.tagline}
          </R>
          <R i={2} className="intro__hint">
            <span className="intro__hint-line" aria-hidden />
            Scroll to travel the network
          </R>
        </div>
      </section>

      {/* Sections, generated from the journey */}
      {stops.slice(1, -1).map((s) => {
        const node = graphNodes[s.node];
        if (!node.content) return null;
        return (
          <section
            key={s.id}
            ref={stageRef(s.index)}
            className={`stage stage--${node.panelSide ?? "right"}`}
            aria-label={node.title}
            style={{ visibility: "hidden" } as CSSProperties}
          >
            <SectionContent content={node.content} />
          </section>
        );
      })}

      {/* Finale */}
      <section ref={stageRef(LAST)} className="stage stage--finale" aria-label="End of journey" style={{ visibility: "hidden" }}>
        <div className="finale">
          <R i={0} as="ul" className="finale__roles">
            {profile.roles.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </R>
          <R i={1} as="h2" className="finale__name">
            {profile.name}
          </R>
          <R i={2} as="p" className="finale__line">
            Every node leads back here. {profile.location}.
          </R>
          <R i={3} className="finale__actions">
            <a className="button" href={`mailto:${profile.email}`}>
              <EnvelopeSimple size={18} aria-hidden />
              <span>Email me</span>
            </a>
            <a className="link link--quiet" href={profile.github} target="_blank" rel="noreferrer">
              <span>GitHub</span>
              <ArrowUpRight size={14} aria-hidden />
            </a>
            <a className="link link--quiet" href={profile.linkedin} target="_blank" rel="noreferrer">
              <span>LinkedIn</span>
              <ArrowUpRight size={14} aria-hidden />
            </a>
            <button type="button" className="link link--quiet" onClick={() => scrollToStop(0)}>
              <ArrowCounterClockwise size={14} aria-hidden />
              <span>Travel again</span>
            </button>
          </R>
        </div>
      </section>
    </div>
  );
}
