import type { BuffKind, PlayerState } from '../../engine';
import type { PlayerPulses } from '../usePresentationEvents';
import { Emblem } from './Emblem';

const BUFF_LABEL: Record<BuffKind, string> = {
  attack: 'Attack ×2',
  build: 'Build ×2',
  defence: 'Defence',
  resources: 'Seal',
};

const PRODUCTION_LABEL: Record<string, string> = {
  normal: 'Normal',
  law: '→ Law',
  neutral: '→ Neutral',
  chaos: '→ Chaos',
  all: 'Doubled',
  none: 'Denied',
};

function Resource({ label, kind, value }: { label: string; kind: 'law' | 'neutral' | 'chaos'; value: number }) {
  return (
    <div className="res" title={label}>
      <Emblem kind={kind} size={22} title={label} />
      <span className="res-value">{value}</span>
    </div>
  );
}

/**
 * A compact, always-visible status bar (one per player). No hand cards live
 * here — those are shown in the single shared hand zone.
 */
export function PlayerPanel({
  player,
  active,
  pulses,
}: {
  player: PlayerState;
  active: boolean;
  pulses?: PlayerPulses;
}) {
  const resourcePulse = pulses?.resource;
  const circlePulse = pulses?.circles;
  const buffPulse = pulses?.buff;
  const protectedPulse = pulses?.protected;

  const activeBuffs = (Object.keys(player.buffs) as BuffKind[]).filter((b) => player.buffs[b]);

  return (
    <section className={`player-panel ${active ? 'player-active' : ''}`} aria-label={`${player.name} status`}>
      <div className="pp-identity">
        <span className="pp-name">{player.name}</span>
        {active ? <span className="badge-turn">to act</span> : null}
        <span className="production-tag" title="Next production mode">
          {PRODUCTION_LABEL[player.nextProduction] ?? player.nextProduction}
        </span>
      </div>

      <div className="pp-vitals">
        <span className="vital vital-citadel" title="Essence">
          <Emblem kind="citadel" size={20} title="Essence" /> {player.citadel}
        </span>
        <span className="vital vital-ward" title="Aegis">
          <Emblem kind="ward" size={20} title="Aegis" /> {player.ward}
        </span>
      </div>

      <div
        className={`resources ${resourcePulse ? `resource-pulse resource-${resourcePulse.kind}` : ''}`}
        key={`res-${resourcePulse?.key ?? 'idle'}`}
        title="Law / Neutral / Chaos mana"
      >
        <Resource label="Law mana" kind="law" value={player.law_mana} />
        <Resource label="Neutral mana" kind="neutral" value={player.neutral_mana} />
        <Resource label="Chaos mana" kind="chaos" value={player.chaos_mana} />
      </div>

      <div className={`circles ${circlePulse ? 'circles-pulse' : ''}`} key={`circ-${circlePulse?.key ?? 'idle'}`} title="Circles (production)">
        <span className="circle circle-l"><Emblem kind="law" size={15} title="Law circles" /> {player.law_circles}</span>
        <span className="circle circle-n"><Emblem kind="neutral" size={15} title="Neutral circles" /> {player.neutral_circles}</span>
        <span className="circle circle-c"><Emblem kind="chaos" size={15} title="Chaos circles" /> {player.chaos_circles}</span>
      </div>

      <div
        className={`buffs ${buffPulse ? 'buffs-pulse' : ''} ${protectedPulse ? 'buffs-protected' : ''}`}
        key={`buff-${buffPulse?.key ?? protectedPulse?.key ?? 'idle'}`}
        title="Empowerments"
      >
        {activeBuffs.length ? (
          activeBuffs.map((b) => (
            <span key={b} className={`buff buff-${b}`}>
              {BUFF_LABEL[b]}
            </span>
          ))
        ) : (
          <span className="buff buff-none">no empowerments</span>
        )}
      </div>
    </section>
  );
}
