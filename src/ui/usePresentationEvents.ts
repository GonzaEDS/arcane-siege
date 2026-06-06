// Presentation layer: translate engine GameEvents into short-lived, UI-only
// animation state. This never feeds back into the engine; it only reacts to the
// per-dispatch event batch surfaced by useGame.

import { useEffect, useRef, useState } from 'react';
import { opponentOf } from '../engine';
import type { PlayerId } from '../engine';
import type { EventBatch } from './useGame';

export type CWPulseType = 'damage' | 'build' | 'cost';

export interface CWPulse {
  type: CWPulseType;
  key: number;
  /** Magnitude for a floating number, if any. */
  amount?: number;
  sign?: '+' | '-';
}
export interface KeyedPulse {
  key: number;
}
export interface ResourcePulse {
  key: number;
  kind: 'gain' | 'drain' | 'production';
  mode?: string;
}
export interface ReturnPulse {
  key: number;
  definitionId?: string;
}
export interface LastCast {
  key: number;
  definitionId: string;
  cardInstanceId?: string;
  caster: PlayerId;
}

export interface PlayerPulses {
  citadel?: CWPulse;
  ward?: CWPulse;
  resource?: ResourcePulse;
  circles?: KeyedPulse;
  buff?: KeyedPulse;
  draw?: KeyedPulse;
  return?: ReturnPulse;
  protected?: KeyedPulse;
}

export interface PresentationState {
  lastCast: LastCast | null;
  pulses: Record<PlayerId, PlayerPulses>;
  sabotageTarget: PlayerId | null;
}

const EMPTY: PresentationState = {
  lastCast: null,
  pulses: { A: {}, B: {} },
  sabotageTarget: null,
};

type PulseField = keyof PlayerPulses;

const DURATIONS: Record<PulseField, number> = {
  citadel: 600,
  ward: 600,
  resource: 650,
  circles: 650,
  buff: 700,
  draw: 550,
  return: 850,
  protected: 800,
};

export function usePresentationEvents(batch: EventBatch | null, reducedMotion: boolean): PresentationState {
  const [pres, setPres] = useState<PresentationState>(EMPTY);
  const keyRef = useRef(0);
  const timers = useRef<number[]>([]);
  const lastHandled = useRef<number>(-1);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    if (!batch || batch.id === lastHandled.current) return;
    lastHandled.current = batch.id;

    const scale = reducedMotion ? 0.45 : 1;

    if (batch.reset) {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];
      setPres({ lastCast: null, pulses: { A: {}, B: {} }, sabotageTarget: null });
    }

    const nextKey = () => ++keyRef.current;
    const scheduled: Array<{ player: PlayerId; field: PulseField; key: number; duration: number }> = [];

    setPres((prev) => {
      const next: PresentationState = {
        lastCast: prev.lastCast,
        pulses: { A: { ...prev.pulses.A }, B: { ...prev.pulses.B } },
        sabotageTarget: prev.sabotageTarget,
      };

      const set = <F extends PulseField>(player: PlayerId, field: F, value: NonNullable<PlayerPulses[F]>) => {
        next.pulses[player][field] = value;
        const key = (value as { key: number }).key;
        scheduled.push({ player, field, key, duration: DURATIONS[field] * scale });
      };

      for (const e of batch.events) {
        const p = e.player as PlayerId | undefined;
        const foe = p ? opponentOf(p) : undefined;
        const data = (e.data ?? {}) as Record<string, unknown>;

        switch (e.type) {
          case 'cast':
            if (p) {
              next.lastCast = {
                key: nextKey(),
                definitionId: String(data.definitionId),
                cardInstanceId: data.cardInstanceId ? String(data.cardInstanceId) : undefined,
                caster: p,
              };
              next.sabotageTarget = null;
              // The played card recycles into the caster's Portmanteau.
              set(p, 'return', { key: nextKey(), definitionId: String(data.definitionId) });
            }
            break;

          case 'pay_ward':
            if (p) set(p, 'ward', { type: 'cost', key: nextKey(), amount: Number(data.cost ?? 0), sign: '-' });
            break;

          case 'damage':
            if (foe) {
              const bypass = Boolean(data.bypass);
              const amount = Number(data.amount ?? 0);
              const wardAbsorbed = Number(data.wardAbsorbed ?? 0);
              const citadelOverflow = Number(data.citadelOverflow ?? 0);
              if (bypass) set(foe, 'citadel', { type: 'damage', key: nextKey(), amount, sign: '-' });
              else if (citadelOverflow > 0) set(foe, 'citadel', { type: 'damage', key: nextKey(), amount: citadelOverflow, sign: '-' });
              if (!bypass && wardAbsorbed > 0) set(foe, 'ward', { type: 'damage', key: nextKey(), amount: wardAbsorbed, sign: '-' });
            }
            break;

          case 'raise_castle':
            if (p) set(p, 'citadel', { type: 'build', key: nextKey(), amount: Number(data.amount ?? 0), sign: '+' });
            break;
          case 'raise_wall':
            if (p) set(p, 'ward', { type: 'build', key: nextKey(), amount: Number(data.amount ?? 0), sign: '+' });
            break;

          case 'production':
            if (p) set(p, 'resource', { key: nextKey(), kind: 'production', mode: String(data.mode ?? 'normal') });
            break;
          case 'add_resource':
            if (p) set(p, 'resource', { key: nextKey(), kind: 'gain' });
            break;
          case 'remove_resource':
            if (foe) set(foe, 'resource', { key: nextKey(), kind: 'drain' });
            break;
          case 'thief':
            // Two events: caster gain, victim loss. Distinguish by data shape.
            if (p && 'gained' in data) set(p, 'resource', { key: nextKey(), kind: 'gain' });
            if (foe && 'removed' in data) set(foe, 'resource', { key: nextKey(), kind: 'drain' });
            break;

          case 'add_worker':
            if (p) set(p, 'circles', { key: nextKey() });
            break;
          case 'steal_worker':
            if (p) set(p, 'circles', { key: nextKey() });
            if (foe) set(foe, 'circles', { key: nextKey() });
            break;

          case 'curse':
            if (p) {
              set(p, 'citadel', { type: 'build', key: nextKey() });
              set(p, 'resource', { key: nextKey(), kind: 'gain' });
            }
            if (foe) {
              set(foe, 'citadel', { type: 'damage', key: nextKey() });
              set(foe, 'resource', { key: nextKey(), kind: 'drain' });
              set(foe, 'circles', { key: nextKey() });
            }
            break;

          case 'wain': {
            const amount = Number(data.amount ?? 0);
            if (foe) set(foe, 'citadel', { type: 'damage', key: nextKey(), amount, sign: '-' });
            if (p) set(p, 'citadel', { type: 'build', key: nextKey(), amount, sign: '+' });
            break;
          }

          case 'add_buff':
          case 'buff_consume':
            if (p) set(p, 'buff', { key: nextKey() });
            break;
          case 'remove_buffs':
            if (foe) set(foe, 'buff', { key: nextKey() });
            break;
          case 'resource_protected':
            // emitted with player = the protected (defending) player
            if (p) {
              set(p, 'protected', { key: nextKey() });
              set(p, 'buff', { key: nextKey() });
            }
            break;

          case 'draw':
            if (p) set(p, 'draw', { key: nextKey() });
            break;
          case 'discard':
            if (p) set(p, 'return', { key: nextKey(), definitionId: data.definitionId ? String(data.definitionId) : undefined });
            break;

          case 'sabotage_request':
            if (foe) next.sabotageTarget = foe;
            break;
          case 'sabotage_resolve':
            if (foe) {
              set(foe, 'return', { key: nextKey(), definitionId: data.definitionId ? String(data.definitionId) : undefined });
              if (Number(data.drawn ?? 0) > 0) set(foe, 'draw', { key: nextKey() });
            }
            next.sabotageTarget = null;
            break;

          case 'turn_start':
            next.sabotageTarget = null;
            break;

          default:
            break;
        }
      }

      return next;
    });

    // Schedule cleanup for each transient pulse (lastCast persists until replaced).
    for (const s of scheduled) {
      const t = window.setTimeout(() => {
        setPres((prev) => {
          const existing = prev.pulses[s.player][s.field] as { key: number } | undefined;
          if (!existing || existing.key !== s.key) return prev;
          const pulses = { ...prev.pulses, [s.player]: { ...prev.pulses[s.player] } };
          delete pulses[s.player][s.field];
          return { ...prev, pulses };
        });
      }, s.duration);
      timers.current.push(t);
    }
  }, [batch, reducedMotion]);

  return pres;
}
