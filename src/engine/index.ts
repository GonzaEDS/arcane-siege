// Public engine surface.

export * from './types';
export { reduce } from './reducer';
export { opponentOf } from './effects';
export {
  CARD_DEFINITIONS,
  KNOWN_CARD_IDS,
  getCard,
  tryGetCard,
  buildDeck,
  canAfford,
  affordabilityReason,
  categoryOf,
  effectText,
  type CardCategory,
} from './cards';
export {
  INITIAL_STATS,
  HAND_SIZE,
  TURN_RULES,
  FIRST_PRODUCING_TURN,
  WIN_CITADEL,
  LOSE_CITADEL,
  DECK_CONSTRAINTS,
  validateDeck,
  type DeckValidationResult,
} from './rules';
export { shuffle, nextRandom } from './rng';
export { chooseMove } from './ai';
export { castableCards, canDiscard, canCast } from './legal';

import deckPresetsJson from '../data/deck_presets.json';
import type { DeckList } from './types';

export const DECK_PRESETS = deckPresetsJson as unknown as Record<string, DeckList>;

export function getDeckPreset(name: string): DeckList {
  const preset = DECK_PRESETS[name];
  if (!preset) throw new Error(`Unknown deck preset: ${name}`);
  return preset;
}
