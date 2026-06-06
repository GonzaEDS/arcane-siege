// Compact per-player Portmanteau: a draw stack (the deck, with count) and a
// return/recycle pulse. Returned/discarded cards reshuffle back into the deck,
// so this is never a permanent discard pile.

import { tryGetCard } from '../../engine';
import type { PlayerState } from '../../engine';
import type { KeyedPulse, ReturnPulse } from '../usePresentationEvents';

export function PortmanteauPiles({
  player,
  drawPulse,
  returnPulse,
}: {
  player: PlayerState;
  drawPulse?: KeyedPulse;
  returnPulse?: ReturnPulse;
}) {
  const returnedName = returnPulse?.definitionId ? tryGetCard(returnPulse.definitionId)?.retheme_name : undefined;

  return (
    <div className="portmanteau" aria-label={`${player.name} Portmanteau`}>
      <div className={`pm-draw ${drawPulse ? 'pm-draw-pulse' : ''}`} key={`draw-${drawPulse?.key ?? 'idle'}`} title="Portmanteau draw stack">
        <svg viewBox="0 0 64 64" className="pm-case" aria-hidden>
          <rect x="8" y="20" width="48" height="36" rx="5" className="pm-case-body" />
          <rect x="8" y="20" width="48" height="11" rx="5" className="pm-case-lid" />
          <rect x="28" y="31" width="8" height="9" rx="2" className="pm-case-clasp" />
        </svg>
        <span className="pm-count">{player.deck.length}</span>
        <span className="pm-label">Portmanteau</span>
      </div>

      <div
        className={`pm-return ${returnPulse ? 'pm-return-pulse' : ''}`}
        key={`ret-${returnPulse?.key ?? 'idle'}`}
        title="Cards return here and stir back into the Portmanteau"
      >
        <div className="pm-return-ring" aria-hidden />
        <span className="pm-label">{returnedName ?? 'Return'}</span>
      </div>
    </div>
  );
}
