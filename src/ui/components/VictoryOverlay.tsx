// End-of-match summary overlay: outcome, how it was won, final standings, and
// rematch / change-setup actions.

import { WIN_CITADEL, opponentOf } from '../../engine';
import type { GameState } from '../../engine';

export function VictoryOverlay({
  state,
  outcome,
  onRematch,
  onNewGame,
}: {
  state: GameState;
  outcome: 'win' | 'lose' | 'neutral';
  onRematch: () => void;
  onNewGame: () => void;
}) {
  if (state.status !== 'ended' || !state.winner) return null;

  const winner = state.winner;
  const loser = opponentOf(winner);
  const w = state.players[winner];
  const l = state.players[loser];
  const byAscension = w.citadel >= WIN_CITADEL;

  const title = outcome === 'win' ? 'Victory!' : outcome === 'lose' ? 'Defeat' : `${w.name} prevails`;

  return (
    <div className="victory-scrim" role="dialog" aria-modal="true" aria-label="Match results">
      <div className={`victory-panel outcome-${outcome}`}>
        <p className="victory-kicker">The siege is decided</p>
        <h2 className="victory-title">{title}</h2>
        <p className="victory-reason">
          <strong>{w.name}</strong> {byAscension ? `ascended with ${w.citadel} Essence` : `shattered ${l.name}'s Essence`} on turn{' '}
          {state.turn}.
        </p>

        <div className="victory-standings">
          <Standing name={w.name} citadel={w.citadel} ward={w.ward} winner />
          <Standing name={l.name} citadel={l.citadel} ward={l.ward} />
        </div>

        <div className="victory-actions">
          <button type="button" className="btn btn-primary" onClick={onRematch}>
            Rematch
          </button>
          <button type="button" className="btn" onClick={onNewGame}>
            Change setup
          </button>
        </div>
      </div>
    </div>
  );
}

function Standing({ name, citadel, ward, winner }: { name: string; citadel: number; ward: number; winner?: boolean }) {
  return (
    <div className={`standing ${winner ? 'standing-winner' : ''}`}>
      <span className="standing-name">
        {winner ? '♛ ' : ''}
        {name}
      </span>
      <span className="standing-stats">
        <span className="vital vital-citadel" title="Essence">✦ {citadel}</span>
        <span className="vital vital-ward" title="Aegis">⛨ {ward}</span>
      </span>
    </div>
  );
}
