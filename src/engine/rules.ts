// Canonical baseline constants and deck validation.
//
// These mirror data/rules.json (transcribed from the TTS Castle Wars baseline)
// and must not be changed outside an explicit balance phase.

export const INITIAL_STATS = {
  law_circles: 2,
  neutral_circles: 2,
  chaos_circles: 2,
  law_mana: 5,
  neutral_mana: 5,
  chaos_mana: 5,
  citadel: 30,
  ward: 10,
} as const;

export const HAND_SIZE = 8;

export const TURN_RULES = {
  playCardsPerTurn: 1,
  discardCardsPerTurnMax: 3,
  canPlayAfterDiscard: false,
  canDiscardAfterPlay: false,
} as const;

/** Production is generated at the start of a turn, but not on global turns 1 & 2. */
export const FIRST_PRODUCING_TURN = 3;

export const WIN_CITADEL = 100;
export const LOSE_CITADEL = 0;

export const DECK_CONSTRAINTS = {
  minCards: 50,
  maxCards: 280,
  maxCopiesPerCard: 5,
} as const;

export interface DeckValidationResult {
  valid: boolean;
  errors: string[];
  totalCards: number;
}

import type { DeckList } from './types';

/** Validate a deck list against min/max size and per-card copy limits. */
export function validateDeck(deck: DeckList, knownCardIds?: ReadonlySet<string>): DeckValidationResult {
  const errors: string[] = [];
  let total = 0;

  for (const [id, count] of Object.entries(deck)) {
    if (!Number.isInteger(count) || count < 0) {
      errors.push(`Card ${id} has an invalid copy count: ${count}`);
      continue;
    }
    if (count > DECK_CONSTRAINTS.maxCopiesPerCard) {
      errors.push(`Card ${id} exceeds the ${DECK_CONSTRAINTS.maxCopiesPerCard}-copy limit (has ${count}).`);
    }
    if (knownCardIds && count > 0 && !knownCardIds.has(id)) {
      errors.push(`Card ${id} is not a known card definition.`);
    }
    total += count;
  }

  if (total < DECK_CONSTRAINTS.minCards) {
    errors.push(`Deck has ${total} cards; minimum is ${DECK_CONSTRAINTS.minCards}.`);
  }
  if (total > DECK_CONSTRAINTS.maxCards) {
    errors.push(`Deck has ${total} cards; maximum is ${DECK_CONSTRAINTS.maxCards}.`);
  }

  return { valid: errors.length === 0, errors, totalCards: total };
}
