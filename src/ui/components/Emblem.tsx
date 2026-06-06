// A small circular medallion token. Uses a generated FLUX emblem coin when
// available, otherwise a colored letter token. Used for mana pips, resource
// badges, circles and the citadel/ward vitals so the whole UI shares one
// visual language. Accessible: every emblem carries a label.

import { hasArt, artUrl } from '../art';

export type EmblemKind = 'law' | 'neutral' | 'chaos' | 'ward' | 'citadel';

const FALLBACK: Record<EmblemKind, string> = {
  law: 'L',
  neutral: 'N',
  chaos: 'C',
  ward: '\u26E8',
  citadel: '\u265C',
};

export function Emblem({ kind, size = 18, title, className = '' }: { kind: EmblemKind; size?: number; title?: string; className?: string }) {
  const id = `emblem-${kind}`;
  const dim = { width: size, height: size, fontSize: Math.round(size * 0.6) };

  if (hasArt(id)) {
    return (
      <span
        className={`emblem emblem-${kind} ${className}`}
        style={{ ...dim, backgroundImage: `url(${artUrl(id)})` }}
        role="img"
        aria-label={title ?? kind}
        title={title}
      />
    );
  }
  return (
    <span className={`emblem emblem-fallback emblem-${kind} ${className}`} style={dim} role="img" aria-label={title ?? kind} title={title}>
      {FALLBACK[kind]}
    </span>
  );
}
