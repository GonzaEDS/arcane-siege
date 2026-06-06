import type { MouseEvent } from 'react';
import { getCard, affordabilityReason, categoryOf, effectText } from '../../engine';
import type { CardInstance, PlayerState } from '../../engine';
import { schoolOf } from './CardArt';
import { CardArtFrame } from './CardArtFrame';
import { CardBack } from './CardBack';
import { Emblem, type EmblemKind } from './Emblem';

const CATEGORY_GLYPH: Record<string, string> = {
  Attack: '\u2694',
  Ward: '\u26E8',
  Citadel: '\u265C',
  'Place of Power': '\u269C',
  Boon: '\u2728',
  Hex: '\u2620',
  Production: '\u269B',
  Special: '\u2734',
};

interface CardProps {
  card: CardInstance;
  owner?: PlayerState;
  faceDown?: boolean;
  selected?: boolean;
  debug?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  /** Visual mode for the action the click performs. */
  intent?: 'cast' | 'discard' | 'sabotage' | 'none';
  /** Compact rendering for the last-cast focus / piles. */
  compact?: boolean;
  /** Allow the animated video clip in the art panel (last-cast focus only). */
  animated?: boolean;
}

function Pip({ kind, value }: { kind: EmblemKind; value: number }) {
  if (value <= 0) return null;
  const label = { law: 'Law', neutral: 'Neutral', chaos: 'Chaos', ward: 'Ward', citadel: 'Citadel' }[kind];
  return (
    <span className={`pip pip-${kind}`}>
      <Emblem kind={kind} size={17} title={`${label} cost ${value}`} />
      <span className="pip-val">{value}</span>
    </span>
  );
}

export function Card({ card, owner, faceDown, selected, debug, onClick, disabled, intent = 'cast', compact, animated }: CardProps) {
  if (faceDown) {
    return <CardBack size={compact ? 'small' : 'normal'} />;
  }

  const def = getCard(card.definitionId);
  const category = categoryOf(def);
  const school = schoolOf(def.cost_retheme);
  const reason = owner ? affordabilityReason(owner, def) : null;
  const unaffordable = intent === 'cast' && !!reason;
  const isDisabled = disabled || (intent === 'cast' && unaffordable);
  const isFree =
    def.cost_retheme.law_mana + def.cost_retheme.neutral_mana + def.cost_retheme.chaos_mana + def.cost_retheme.ward_level === 0;

  return (
    <button
      type="button"
      className={[
        'card',
        compact ? 'card-compact' : '',
        `card-cat-${category.replace(/\s+/g, '-').toLowerCase()}`,
        `card-school-${school}`,
        selected ? 'card-selected' : '',
        unaffordable ? 'card-unaffordable' : '',
        intent === 'discard' ? 'card-intent-discard' : '',
        intent === 'sabotage' ? 'card-intent-sabotage' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      disabled={isDisabled && intent !== 'discard'}
      title={reason ?? def.retheme_name}
    >
      <header className="card-plate">
        <span className={`card-cat card-cat-glyph-${category.replace(/\s+/g, '-').toLowerCase()}`} aria-hidden>
          {CATEGORY_GLYPH[category]}
        </span>
        <span className="card-name">{def.retheme_name}</span>
      </header>

      <div className="card-art-wrap">
        <CardArtFrame id={def.id} category={category} school={school} animated={animated} />
        <div className="card-cost">
          <Pip kind="law" value={def.cost_retheme.law_mana} />
          <Pip kind="neutral" value={def.cost_retheme.neutral_mana} />
          <Pip kind="chaos" value={def.cost_retheme.chaos_mana} />
          <Pip kind="ward" value={def.cost_retheme.ward_level} />
          {isFree ? <span className="pip pip-free">Free</span> : null}
        </div>
      </div>

      <div className="card-text-panel">
        <p className="card-text">{effectText(def)}</p>
      </div>

      <footer className="card-foot">
        <span className="card-type-label">{category}</span>
        {unaffordable ? <span className="card-need">{reason}</span> : null}
      </footer>

      {debug ? (
        <div className="card-debug" role="note">
          <strong>#{def.id}</strong> · {def.source_name}
          {def.magic_mayhem_reference ? <em> ← {def.magic_mayhem_reference}</em> : null}
        </div>
      ) : null}
    </button>
  );
}
