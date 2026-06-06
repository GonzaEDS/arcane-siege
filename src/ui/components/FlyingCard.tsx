// A short-lived, position:fixed copy of a card that animates from a source rect
// (the cast hand slot) to a target rect (the central last-cast focus). Purely
// cosmetic; the engine has already resolved the move.

import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Card } from './Card';

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function rectOf(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

export function FlyingCard({
  definitionId,
  from,
  to,
  duration,
  onDone,
}: {
  definitionId: string;
  from: Rect;
  to: Rect;
  duration: number;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({
    position: 'fixed',
    left: from.left,
    top: from.top,
    width: from.width,
    transformOrigin: 'top left',
    transform: 'translate(0px, 0px) scale(1)',
    transition: 'none',
    zIndex: 1000,
    pointerEvents: 'none',
    filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.55))',
  });

  useLayoutEffect(() => {
    const dx = to.left - from.left;
    const dy = to.top - from.top;
    const scale = to.width / from.width;
    // Force a reflow so the initial style commits before the transition.
    void ref.current?.offsetWidth;
    const raf = requestAnimationFrame(() => {
      setStyle((s) => ({
        ...s,
        transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        transition: `transform ${duration}ms cubic-bezier(0.22, 0.78, 0.25, 1)`,
      }));
    });
    const timer = window.setTimeout(onDone, duration + 40);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} style={style} className="flying-card" aria-hidden>
      <Card card={{ instanceId: 'flying', definitionId }} compact />
    </div>
  );
}
