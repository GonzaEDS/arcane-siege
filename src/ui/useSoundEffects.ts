// Maps engine event batches to SFX. Mirrors usePresentationEvents but for audio.
// Sounds are de-duplicated per batch so composite effects (e.g. Curse) don't
// fire the same cue many times.

import { useEffect, useRef } from 'react';
import { getCard, categoryOf, type CardCategory } from '../engine';
import { playSfx } from './audio';
import type { EventBatch } from './useGame';

const CAST_SFX: Record<CardCategory, string> = {
  Attack: 'cast-attack',
  Ward: 'cast-ward',
  Citadel: 'cast-citadel',
  'Place of Power': 'cast-place-of-power',
  Boon: 'cast-boon',
  Hex: 'cast-hex',
  Production: 'cast-production',
  Special: 'cast-special',
};

export function useSoundEffects(batch: EventBatch | null): void {
  const handled = useRef(-1);

  useEffect(() => {
    if (!batch || batch.id === handled.current) return;
    handled.current = batch.id;

    const cues = new Set<string>();

    for (const e of batch.events) {
      const data = (e.data ?? {}) as Record<string, unknown>;
      switch (e.type) {
        case 'cast': {
          try {
            const cat = categoryOf(getCard(String(data.definitionId)));
            cues.add(CAST_SFX[cat]);
          } catch {
            cues.add('cast-special');
          }
          break;
        }
        case 'damage': {
          if (data.bypass || Number(data.citadelOverflow ?? 0) > 0) cues.add('impact-citadel');
          else if (Number(data.wardAbsorbed ?? 0) > 0) cues.add('impact-ward');
          break;
        }
        case 'raise_castle':
          cues.add('build-citadel');
          break;
        case 'raise_wall':
          cues.add('build-ward');
          break;
        case 'production':
        case 'add_resource':
          cues.add('mana-gain');
          break;
        case 'remove_resource':
        case 'thief':
          cues.add('drain');
          break;
        case 'add_buff':
        case 'buff_consume':
        case 'remove_buffs':
        case 'resource_protected':
          cues.add('buff');
          break;
        case 'curse':
          cues.add('curse');
          break;
        case 'add_worker':
        case 'steal_worker':
          cues.add('mana-gain');
          break;
        case 'wain':
          cues.add('impact-citadel');
          break;
        case 'draw':
          cues.add('draw');
          break;
        case 'discard':
          cues.add('return');
          break;
        case 'sabotage_request':
        case 'sabotage_resolve':
          cues.add('sabotage');
          break;
        case 'turn_start':
          cues.add('turn-start');
          break;
        case 'game_end':
          cues.add('win');
          break;
        default:
          break;
      }
    }

    // turn-start is a soft cue; don't let it stack with louder action cues.
    if (cues.size > 1) cues.delete('turn-start');

    for (const id of cues) playSfx(id);
  }, [batch]);
}
