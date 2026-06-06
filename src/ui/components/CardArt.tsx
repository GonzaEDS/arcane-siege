// Original, procedural talisman/silhouette art for cards. Pure SVG, no external
// assets. Motif is chosen by gameplay category; tint follows resource alignment
// (set by a CSS class on the wrapper). Nothing here is copied from any source.

import type { CardCategory } from '../../engine';

export type School = 'law' | 'neutral' | 'chaos' | 'mixed';

function Motif({ category }: { category: CardCategory }) {
  const stroke = 'currentColor';
  const common = { fill: 'none', stroke, strokeWidth: 2.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

  switch (category) {
    case 'Attack':
      // Fang / jagged projectile.
      return (
        <g {...common}>
          <path d="M50 8 L62 40 L50 34 L38 40 Z" fill={stroke} fillOpacity={0.22} />
          <path d="M50 34 L50 78" />
          <path d="M30 58 L50 70 L70 58" />
          <path d="M24 44 L34 50 M76 44 L66 50" />
        </g>
      );
    case 'Ward':
      // Layered shield ring / sigil.
      return (
        <g {...common}>
          <circle cx="50" cy="46" r="30" fillOpacity={0.1} fill={stroke} />
          <circle cx="50" cy="46" r="20" />
          <path d="M50 18 L50 74 M22 46 L78 46" strokeOpacity={0.6} />
        </g>
      );
    case 'Citadel':
      // Tower with crenellations.
      return (
        <g {...common}>
          <path d="M30 78 L30 36 L36 36 L36 28 L44 28 L44 36 L56 36 L56 28 L64 28 L64 36 L70 36 L70 78 Z" fill={stroke} fillOpacity={0.18} />
          <path d="M42 78 L42 56 L58 56 L58 78" />
          <path d="M50 44 L50 50" />
        </g>
      );
    case 'Place of Power':
      // Trilithon standing stones.
      return (
        <g {...common}>
          <rect x="26" y="34" width="12" height="44" rx="3" fill={stroke} fillOpacity={0.16} />
          <rect x="62" y="34" width="12" height="44" rx="3" fill={stroke} fillOpacity={0.16} />
          <rect x="22" y="22" width="56" height="12" rx="3" fill={stroke} fillOpacity={0.22} />
          <circle cx="50" cy="58" r="6" />
        </g>
      );
    case 'Boon':
      // Vessel with rising star.
      return (
        <g {...common}>
          <path d="M50 10 l5 10 11 1 -8 8 2 11 -10 -6 -10 6 2 -11 -8 -8 11 -1 Z" fill={stroke} fillOpacity={0.22} />
          <path d="M34 52 q16 18 32 0 l-4 22 q-12 6 -24 0 Z" fill={stroke} fillOpacity={0.1} />
        </g>
      );
    case 'Hex':
      // Thorn knot / broken sigil mask.
      return (
        <g {...common}>
          <path d="M30 30 L70 70 M70 30 L30 70" />
          <circle cx="50" cy="50" r="24" strokeDasharray="6 7" />
          <circle cx="50" cy="50" r="6" fill={stroke} fillOpacity={0.3} />
        </g>
      );
    case 'Production':
      // Triad circle with three nodes.
      return (
        <g {...common}>
          <circle cx="50" cy="50" r="26" />
          <circle cx="50" cy="24" r="6" fill={stroke} fillOpacity={0.3} />
          <circle cx="27" cy="64" r="6" fill={stroke} fillOpacity={0.3} />
          <circle cx="73" cy="64" r="6" fill={stroke} fillOpacity={0.3} />
          <path d="M50 30 L50 50 L31 60 M50 50 L69 60" strokeOpacity={0.6} />
        </g>
      );
    case 'Special':
    default:
      // Watching eye within a talisman diamond.
      return (
        <g {...common}>
          <path d="M50 18 L80 50 L50 82 L20 50 Z" fill={stroke} fillOpacity={0.1} />
          <path d="M30 50 q20 -18 40 0 q-20 18 -40 0 Z" />
          <circle cx="50" cy="50" r="7" fill={stroke} fillOpacity={0.5} />
        </g>
      );
  }
}

export function CardArt({ category, school }: { category: CardCategory; school: School }) {
  return (
    <div className={`card-art school-${school}`} aria-hidden>
      <svg viewBox="0 0 100 92" className="card-art-svg" role="img">
        <Motif category={category} />
      </svg>
    </div>
  );
}

/** Choose the dominant resource school from a card's cost, for tinting art. */
export function schoolOf(cost: { law_mana: number; neutral_mana: number; chaos_mana: number }): School {
  const { law_mana: l, neutral_mana: n, chaos_mana: c } = cost;
  if (l === 0 && n === 0 && c === 0) return 'neutral';
  const max = Math.max(l, n, c);
  const leaders = [l === max ? 'law' : '', n === max ? 'neutral' : '', c === max ? 'chaos' : ''].filter(Boolean);
  if (leaders.length > 1) return 'mixed';
  return leaders[0] as School;
}
