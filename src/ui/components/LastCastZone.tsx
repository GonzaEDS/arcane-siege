// Shared focus for the most recently cast card. Crucial for following AI turns
// without reading the log.

import { getCard, categoryOf } from '../../engine';
import type { GameState } from '../../engine';
import { Card } from './Card';
import { schoolOf } from './CardArt';
import { CastFx } from './CastFx';
import type { LastCast } from '../usePresentationEvents';

export function LastCastZone({
  lastCast,
  state,
  sabotaging,
}: {
  lastCast: LastCast | null;
  state: GameState;
  sabotaging: boolean;
}) {
  if (sabotaging) {
    const caster = state.pendingSabotage ? state.players[state.pendingSabotage.caster].name : '';
    return (
      <div className="last-cast last-cast-sabotage" aria-live="polite">
        <span className="lc-caption">{caster} unleashes a Gorgon Stare</span>
        <div className="lc-sabotage-mark" aria-hidden>☉</div>
        <span className="lc-sub">Choose a card from the enemy hand to return.</span>
      </div>
    );
  }

  if (!lastCast) {
    return (
      <div className="last-cast last-cast-empty">
        <span className="lc-caption">The ritual table awaits</span>
        <div className="lc-empty-mark" aria-hidden>✶</div>
        <span className="lc-sub">The last cast spell will appear here.</span>
      </div>
    );
  }

  const def = getCard(lastCast.definitionId);
  const casterName = state.players[lastCast.caster].name;
  const category = categoryOf(def);
  const school = schoolOf(def.cost_retheme);

  return (
    <div className="last-cast" aria-live="polite">
      <span className="lc-caption">
        {casterName} casts <strong>{def.retheme_name}</strong>
      </span>
      <div className="lc-stage">
        <div className="lc-card-holder" key={lastCast.key}>
          <Card card={{ instanceId: `lastcast-${lastCast.key}`, definitionId: lastCast.definitionId }} compact animated />
        </div>
        <CastFx category={category} school={school} fxKey={lastCast.key} />
      </div>
    </div>
  );
}
