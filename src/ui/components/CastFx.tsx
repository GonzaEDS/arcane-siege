// A short, category-flavored spell burst played over the last-cast card. Pure
// CSS/SVG — each card category animates "in its own way" (slash, ward ring,
// rising stronghold, hex smoke, etc.), tinted by the card's resource school.
// Re-keyed on every cast so it replays. Reduced-motion neutralizes it via the
// global rule.

import type { CardCategory } from '../../engine';
import type { School } from './CardArt';

const CATEGORY_GLYPH: Record<CardCategory, string> = {
  Attack: '\u2694',
  Ward: '\u26E8',
  Citadel: '\u265C',
  'Place of Power': '\u269C',
  Boon: '\u2728',
  Hex: '\u2620',
  Production: '\u269B',
  Special: '\u2734',
};

export function CastFx({ category, school, fxKey }: { category: CardCategory; school: School; fxKey: number }) {
  const slug = category.replace(/\s+/g, '-').toLowerCase();
  return (
    <div className={`cast-fx cast-fx-${slug} cast-school-${school}`} key={fxKey} aria-hidden>
      <span className="cast-fx-flash" />
      <span className="cast-fx-ring" />
      <span className="cast-fx-ring cast-fx-ring-2" />
      <span className="cast-fx-glyph">{CATEGORY_GLYPH[category]}</span>
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className={`cast-fx-spark cast-fx-spark-${i}`} />
      ))}
    </div>
  );
}
