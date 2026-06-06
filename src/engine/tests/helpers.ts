// Test helpers for building controlled game states without going through a
// full game setup. Lets us assert exact baseline behaviour per effect.

import type { CardDefinition, GameEvent, GameState, PlayerId, PlayerState } from '../types';
import { applyEffect, type Emit } from '../effects';
import { getCard } from '../cards';

export function makePlayer(id: PlayerId, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    name: id === 'A' ? 'Wizard A' : 'Wizard B',
    law_circles: 2,
    neutral_circles: 2,
    chaos_circles: 2,
    law_mana: 5,
    neutral_mana: 5,
    chaos_mana: 5,
    citadel: 30,
    ward: 10,
    buffs: { attack: false, build: false, defence: false, resources: false },
    nextProduction: 'normal',
    hand: [],
    deck: [],
    ...overrides,
  };
}

export function makeState(a: Partial<PlayerState> = {}, b: Partial<PlayerState> = {}): GameState {
  return {
    status: 'active',
    players: { A: makePlayer('A', a), B: makePlayer('B', b) },
    current: 'A',
    turn: 3,
    rngState: 12345,
    winner: null,
    pendingSabotage: null,
    log: [],
    eventSeq: 0,
    turnActions: { hasCast: false, discarded: 0 },
  };
}

export function collectEmit(state: GameState): { emit: Emit; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const emit: Emit = (type, message, data, player) => {
    const event: GameEvent = { seq: state.eventSeq++, turn: state.turn, type, player, message, data };
    state.log.push(event);
    events.push(event);
  };
  return { emit, events };
}

/** Apply all effects of a card definition (by id) against a controlled state. */
export function applyCard(state: GameState, casterId: PlayerId, definitionId: string): GameEvent[] {
  const def: CardDefinition = getCard(definitionId);
  const { emit, events } = collectEmit(state);
  for (const eff of def.effects) {
    applyEffect(state, casterId, eff, emit);
    if (state.status === 'ended') break;
  }
  return events;
}
