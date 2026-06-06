// Helpers for enumerating legal moves. Shared by the UI and the AI so neither
// duplicates rule logic.

import type { CardInstance, GameState, PlayerId } from './types';
import { canAfford, getCard } from './cards';
import { TURN_RULES } from './rules';

export function castableCards(state: GameState, playerId: PlayerId): CardInstance[] {
  if (state.status !== 'active' || state.current !== playerId) return [];
  if (state.turnActions.hasCast || state.turnActions.discarded > 0) return [];
  const player = state.players[playerId];
  return player.hand.filter((c) => canAfford(player, getCard(c.definitionId)));
}

export function canDiscard(state: GameState, playerId: PlayerId): boolean {
  if (state.status !== 'active' || state.current !== playerId) return false;
  if (state.turnActions.hasCast) return false;
  return state.turnActions.discarded < TURN_RULES.discardCardsPerTurnMax;
}

export function canCast(state: GameState, playerId: PlayerId): boolean {
  return castableCards(state, playerId).length > 0;
}
