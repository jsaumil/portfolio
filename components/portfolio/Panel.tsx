import type { CSSProperties, ReactNode } from "react";

/**
 * A staggered line. Its reveal is derived in CSS from the stage's `--r`
 * (scrubbed by scroll) and its own index, so it animates in and back out
 * exactly with the scroll position.
 */
export function R({ i, children, className, as: Tag = "div" }: { i: number; children: ReactNode; className?: string; as?: "div" | "p" | "h2" | "h3" | "ul" | "li" }) {
  return (
    <Tag className={className ? `r ${className}` : "r"} style={{ "--i": i } as CSSProperties}>
      {children}
    </Tag>
  );
}

/** Glass panel floating beside a node. `data-anchor` is where the leader line lands. */
export function Panel({ title, meta, children, wide }: { title: string; meta?: string; children: ReactNode; wide?: boolean }) {
  return (
    <article className={wide ? "panel panel--wide" : "panel"} data-anchor>
      <div className="panel__sheen" aria-hidden />
      <header className="panel__head">
        {meta && (
          <R i={0} className="meta">
            {meta}
          </R>
        )}
        <R i={1} as="h2" className="panel__title">
          {title}
        </R>
      </header>
      <div className="panel__body">{children}</div>
    </article>
  );
}
