// The player's avatar: a wizard at their place of power, wrapped in a dynamic
// Aegis force-field. Replaces the old SVG citadel/ward. The engine numbers are
// unchanged — "Essence" is the citadel value, "Aegis" is the ward value. The
// figure reacts to value tiers and to damage/build pulses; the Aegis bubble
// scales with the ward and flares when struck.

import { useState } from 'react';
import type { PlayerState } from '../../engine';
import type { CWPulse } from '../usePresentationEvents';
import { hasArt, artUrl } from '../art';

function essenceTier(v: number): string {
  if (v <= 0) return 'fallen';
  if (v < 30) return 'wounded';
  if (v < 60) return 'steady';
  if (v < 100) return 'strong';
  return 'ascendant';
}

function aegisTier(v: number): string {
  if (v <= 0) return 'none';
  if (v <= 10) return 'baseline';
  if (v <= 30) return 'strong';
  return 'exceptional';
}

export function WizardView({
  player,
  citadelPulse,
  wardPulse,
  position,
  castKey,
}: {
  player: PlayerState;
  citadelPulse?: CWPulse;
  wardPulse?: CWPulse;
  /** Screen side; the right-hand wizard is mirrored so both face center. */
  position: 'left' | 'right';
  /** Changes when this wizard casts, triggering a one-shot cast animation. */
  castKey?: number;
}) {
  const [failed, setFailed] = useState(false);
  const eTier = essenceTier(player.citadel);
  const aTier = aegisTier(player.ward);
  const artId = `wizard-${player.id.toLowerCase()}`;
  const hasWizard = hasArt(artId) && !failed;

  return (
    <div
      className={`wizard-view wz-${position} wz-${player.id.toLowerCase()} wz-e-${eTier} wz-a-${aTier} ${position === 'right' ? 'wz-flip' : ''}`}
      aria-label={`${player.name}: Essence ${player.citadel}, Aegis ${player.ward}`}
    >
      <div className="wz-floats" aria-hidden>
        {citadelPulse?.amount ? (
          <span key={`c${citadelPulse.key}`} className={`cw-float cw-float-citadel cw-float-${citadelPulse.type}`}>
            {citadelPulse.sign}
            {citadelPulse.amount}
          </span>
        ) : null}
        {wardPulse?.amount ? (
          <span key={`w${wardPulse.key}`} className={`cw-float cw-float-ward cw-float-${wardPulse.type}`}>
            {wardPulse.sign}
            {wardPulse.amount}
          </span>
        ) : null}
      </div>

      <div
        className={`wz-stage ${citadelPulse ? `wz-pulse-${citadelPulse.type}` : ''} ${wardPulse ? `wz-aegis-pulse-${wardPulse.type}` : ''} ${castKey != null ? `wz-casting-${position}` : ''}`}
        key={`${citadelPulse?.key ?? 'c'}-${wardPulse?.key ?? 'w'}-${castKey ?? 'x'}`}
      >
        <div className="wz-figure">
          {hasWizard ? (
            <img className="wz-img" src={artUrl(artId)} alt="" onError={() => setFailed(true)} />
          ) : (
            <svg className="wz-img wz-img-fallback" viewBox="0 0 100 140" aria-hidden>
              <path d="M50 14 q-16 0 -16 20 q0 10 6 16 l-14 70 h48 l-14 -70 q6 -6 6 -16 q0 -20 -16 -20Z" fill="currentColor" />
            </svg>
          )}
          <div className="wz-aegis" aria-hidden />
        </div>
      </div>

      <div className="cw-readout">
        <div className="cw-stat cw-stat-citadel" title="Essence">
          <span className="cw-stat-icon" aria-hidden>✦</span>
          <span className="cw-stat-num">{player.citadel}</span>
          <span className="cw-stat-label">Essence</span>
        </div>
        <div className="cw-stat cw-stat-ward" title="Aegis">
          <span className="cw-stat-icon" aria-hidden>⛨</span>
          <span className="cw-stat-num">{player.ward}</span>
          <span className="cw-stat-label">Aegis</span>
        </div>
      </div>
    </div>
  );
}
