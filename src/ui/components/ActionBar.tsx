// Current-player controls: cast happens by clicking a hand card, so this bar
// covers discard-mode toggle, discard count, and end turn.

import { TURN_RULES } from '../../engine';

export function ActionBar({
  canAct,
  discardMode,
  hasCast,
  discarded,
  sabotaging,
  onToggleDiscard,
  onEndTurn,
}: {
  canAct: boolean;
  discardMode: boolean;
  hasCast: boolean;
  discarded: number;
  sabotaging: boolean;
  onToggleDiscard: () => void;
  onEndTurn: () => void;
}) {
  return (
    <div className="actions-wrap">
      <div className="actions">
        <button
          type="button"
          className={`btn ${discardMode ? 'btn-on' : ''}`}
          disabled={!canAct || hasCast}
          onClick={onToggleDiscard}
        >
          {discardMode ? 'Returning…' : 'Return mode'}
        </button>
        <span className="discard-count">
          Returned {discarded}/{TURN_RULES.discardCardsPerTurnMax}
        </span>
        <button type="button" className="btn btn-primary" disabled={!canAct || sabotaging} onClick={onEndTurn}>
          End turn
        </button>
      </div>
      <p className="hint">
        {!canAct
          ? 'Watch the duel unfold…'
          : hasCast
          ? 'You have acted — the turn will pass.'
          : discardMode
          ? 'Click cards to return them to your Portmanteau (up to 3), then end your turn.'
          : 'Click an affordable card to cast it, or switch to Return mode.'}
      </p>
    </div>
  );
}
