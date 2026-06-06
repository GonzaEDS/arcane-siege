// A player's hand. Renders face up or face down per visibility, keeps stable
// card slots, and delegates clicks (with the clicked card's screen rect, for
// flight animations) to the parent. No game logic lives here.

import { Card } from './Card';
import type { CardInstance, PlayerState } from '../../engine';
import { rectOf, type Rect } from './FlyingCard';

export type HandIntent = 'cast' | 'discard' | 'sabotage' | 'none';

export function Hand({
  player,
  faceUp,
  intent,
  castable,
  disabled,
  onCardClick,
  debug,
  label,
}: {
  player: PlayerState;
  faceUp: boolean;
  intent: HandIntent;
  /** Instance ids that are currently castable (for selectable styling). */
  castable?: Set<string>;
  disabled?: boolean;
  onCardClick?: (instanceId: string, rect?: Rect) => void;
  debug?: boolean;
  label?: string;
}) {
  return (
    <div className={`hand ${faceUp ? 'hand-faceup' : 'hand-facedown'}`} aria-label={label ?? `${player.name} hand`}>
      {player.hand.map((c: CardInstance) =>
        faceUp ? (
          <div className="hand-slot" key={c.instanceId}>
            <Card
              card={c}
              owner={intent === 'cast' ? player : undefined}
              debug={debug}
              intent={intent}
              selected={intent === 'cast' && !!castable?.has(c.instanceId)}
              disabled={disabled || (intent === 'cast' && !castable?.has(c.instanceId)) || intent === 'none'}
              onClick={onCardClick ? (e) => onCardClick(c.instanceId, rectOf(e.currentTarget)) : undefined}
            />
          </div>
        ) : (
          <div className="hand-slot" key={c.instanceId}>
            <Card card={c} faceDown />
          </div>
        ),
      )}
    </div>
  );
}
