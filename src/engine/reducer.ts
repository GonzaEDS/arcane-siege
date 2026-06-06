// Pure, deterministic game reducer.
//
// reduce(state, command) -> { state, events, error? }
//
// The reducer never mutates its input; it deep-clones a working copy, applies
// the command, and returns the next immutable state together with the events
// emitted during the transition. Illegal commands return the original state
// plus an `error` string so bugs surface instead of corrupting state.

import type {
  Command,
  GameEvent,
  GameState,
  PlayerId,
  PlayerState,
  ProductionMode,
  ReducerResult,
} from './types';
import { buildDeck, canAfford, getCard } from './cards';
import { applyEffect, checkWin, type Emit } from './effects';
import { FIRST_PRODUCING_TURN, HAND_SIZE, INITIAL_STATS, TURN_RULES } from './rules';
import { shuffle } from './rng';

function clone<T>(value: T): T {
  return structuredClone(value);
}

function createPlayer(id: PlayerId, name: string): PlayerState {
  return {
    id,
    name,
    law_circles: INITIAL_STATS.law_circles,
    neutral_circles: INITIAL_STATS.neutral_circles,
    chaos_circles: INITIAL_STATS.chaos_circles,
    law_mana: INITIAL_STATS.law_mana,
    neutral_mana: INITIAL_STATS.neutral_mana,
    chaos_mana: INITIAL_STATS.chaos_mana,
    citadel: INITIAL_STATS.citadel,
    ward: INITIAL_STATS.ward,
    buffs: { attack: false, build: false, defence: false, resources: false },
    nextProduction: 'normal',
    hand: [],
    deck: [],
  };
}

/**
 * The engine keeps only a rolling window of recent events in state so that the
 * deep-cloned state stays small (the full history would make every command
 * O(n) to clone). The complete stream is still available via the per-command
 * `events` array returned by reduce().
 */
const MAX_LOG = 300;

function makeEmit(state: GameState, events: GameEvent[]): Emit {
  return (type, message, data, player) => {
    const event: GameEvent = {
      seq: state.eventSeq++,
      turn: state.turn,
      type,
      player,
      message,
      data,
    };
    state.log.push(event);
    if (state.log.length > MAX_LOG) {
      state.log.splice(0, state.log.length - MAX_LOG);
    }
    events.push(event);
  };
}

/** Move up to n cards from the top of the player's deck into their hand. */
function draw(player: PlayerState, n: number): number {
  let drawn = 0;
  for (let i = 0; i < n && player.deck.length > 0; i++) {
    const card = player.deck.shift()!;
    player.hand.push(card);
    drawn++;
  }
  return drawn;
}

function refillHand(player: PlayerState): number {
  return draw(player, Math.max(0, HAND_SIZE - player.hand.length));
}

/** Shuffle a player's deck in place, threading the RNG state. */
function shuffleDeck(state: GameState, player: PlayerState): void {
  const result = shuffle(player.deck, state.rngState);
  player.deck = result.items;
  state.rngState = result.state;
}

function returnToDeck(state: GameState, player: PlayerState, cardInstanceId: string, fromHand: PlayerState['hand']): void {
  const idx = fromHand.findIndex((c) => c.instanceId === cardInstanceId);
  if (idx === -1) return;
  const [card] = fromHand.splice(idx, 1);
  player.deck.push(card);
  shuffleDeck(state, player);
}

/** Apply start-of-turn production for the current player, honouring modes. */
function applyProduction(state: GameState, emit: Emit): void {
  const player = state.players[state.current];

  if (state.turn < FIRST_PRODUCING_TURN) {
    emit('production_skipped', `${player.name} generates no resources (first two turns of the game).`, { turn: state.turn }, state.current);
    return;
  }

  const mode: ProductionMode = player.nextProduction;
  const { law_circles: lc, neutral_circles: nc, chaos_circles: cc } = player;
  let gainLaw = 0;
  let gainNeutral = 0;
  let gainChaos = 0;

  switch (mode) {
    case 'normal':
      gainLaw = lc;
      gainNeutral = nc;
      gainChaos = cc;
      break;
    case 'law':
      gainLaw = lc + nc + cc;
      break;
    case 'neutral':
      gainNeutral = lc + nc + cc;
      break;
    case 'chaos':
      gainChaos = lc + nc + cc;
      break;
    case 'all':
      gainLaw = lc * 2;
      gainNeutral = nc * 2;
      gainChaos = cc * 2;
      break;
    case 'none':
      gainLaw = gainNeutral = gainChaos = 0;
      break;
  }

  player.law_mana += gainLaw;
  player.neutral_mana += gainNeutral;
  player.chaos_mana += gainChaos;
  player.nextProduction = 'normal';

  emit(
    'production',
    `${player.name} produces (+${gainLaw} Law, +${gainNeutral} Neutral, +${gainChaos} Chaos) [${mode}].`,
    { mode, gainLaw, gainNeutral, gainChaos },
    state.current,
  );
}

/** End the current player's turn: refill, swap, increment, then start-of-turn. */
function advanceTurn(state: GameState, emit: Emit): void {
  if (state.status === 'ended') return;

  const finishing = state.players[state.current];
  const refilled = refillHand(finishing);
  if (refilled > 0) {
    emit('draw', `${finishing.name} draws ${refilled} to refill to ${finishing.hand.length}.`, { drawn: refilled }, state.current);
  }

  state.current = state.current === 'A' ? 'B' : 'A';
  state.turn += 1;
  state.turnActions = { hasCast: false, discarded: 0 };

  emit('turn_start', `Turn ${state.turn}: ${state.players[state.current].name} to act.`, { turn: state.turn }, state.current);
  applyProduction(state, emit);
}

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

function startGame(command: Extract<Command, { type: 'START_GAME' }>): ReducerResult {
  const events: GameEvent[] = [];

  const state: GameState = {
    status: 'active',
    players: {
      A: createPlayer('A', command.nameA ?? 'Wizard A'),
      B: createPlayer('B', command.nameB ?? 'Wizard B'),
    },
    current: 'A',
    turn: 1,
    rngState: command.seed | 0,
    winner: null,
    pendingSabotage: null,
    log: [],
    eventSeq: 0,
    turnActions: { hasCast: false, discarded: 0 },
  };

  const emit = makeEmit(state, events);

  state.players.A.deck = buildDeck(command.deckA);
  state.players.B.deck = buildDeck(command.deckB);
  shuffleDeck(state, state.players.A);
  shuffleDeck(state, state.players.B);

  draw(state.players.A, HAND_SIZE);
  draw(state.players.B, HAND_SIZE);

  emit('game_start', `Game begins. ${state.players.A.name} vs ${state.players.B.name}.`, { seed: command.seed });
  emit('turn_start', `Turn 1: ${state.players.A.name} to act.`, { turn: 1 }, 'A');
  applyProduction(state, emit);

  return { state, events };
}

function castCard(prev: GameState, command: Extract<Command, { type: 'CAST_CARD' }>): ReducerResult {
  const error = (msg: string): ReducerResult => ({ state: prev, events: [], error: msg });

  if (prev.status !== 'active') return error(`Cannot cast while game is ${prev.status}.`);
  if (command.player !== prev.current) return error('Not your turn.');
  if (prev.turnActions.hasCast) return error('You have already cast a card this turn.');
  if (prev.turnActions.discarded > 0) return error('You cannot cast after discarding this turn.');

  const player = prev.players[command.player];
  const card = player.hand.find((c) => c.instanceId === command.cardInstanceId);
  if (!card) return error('Card is not in your hand.');

  const def = getCard(card.definitionId);
  if (!canAfford(player, def)) return error(`Not enough mana to cast ${def.retheme_name}.`);

  const state = clone(prev);
  const events: GameEvent[] = [];
  const emit = makeEmit(state, events);
  const working = state.players[command.player];

  // Pay costs. Mana must be available (checked above); Ward is subtracted to a
  // floor of 0 and is intentionally not part of affordability (source quirk).
  working.law_mana -= def.cost_retheme.law_mana;
  working.neutral_mana -= def.cost_retheme.neutral_mana;
  working.chaos_mana -= def.cost_retheme.chaos_mana;
  if (def.cost_retheme.ward_level > 0) {
    const before = working.ward;
    working.ward = Math.max(0, working.ward - def.cost_retheme.ward_level);
    emit('pay_ward', `${working.name} pays Ward cost ${def.cost_retheme.ward_level} (Ward ${before} -> ${working.ward}).`, { cost: def.cost_retheme.ward_level }, command.player);
  }

  emit('cast', `${working.name} casts ${def.retheme_name}.`, { definitionId: def.id, cardInstanceId: card.instanceId, sourceName: def.source_name }, command.player);

  state.turnActions.hasCast = true;

  for (const eff of def.effects) {
    applyEffect(state, command.player, eff, emit);
    if (state.status === 'ended') break;
  }

  // The cast card returns to its owner's deck (then reshuffled), per source.
  if (state.status !== 'ended') {
    returnToDeck(state, working, card.instanceId, working.hand);
  }

  if (state.status === 'ended') return { state, events };
  if (state.status === 'awaiting_sabotage_choice') return { state, events };

  advanceTurn(state, emit);
  return { state, events };
}

function discardCard(prev: GameState, command: Extract<Command, { type: 'DISCARD_CARD' }>): ReducerResult {
  const error = (msg: string): ReducerResult => ({ state: prev, events: [], error: msg });

  if (prev.status !== 'active') return error(`Cannot discard while game is ${prev.status}.`);
  if (command.player !== prev.current) return error('Not your turn.');
  if (prev.turnActions.hasCast) return error('You cannot discard after casting this turn.');
  if (prev.turnActions.discarded >= TURN_RULES.discardCardsPerTurnMax) {
    return error(`You may discard at most ${TURN_RULES.discardCardsPerTurnMax} cards per turn.`);
  }

  const player = prev.players[command.player];
  if (!player.hand.some((c) => c.instanceId === command.cardInstanceId)) {
    return error('Card is not in your hand.');
  }

  const state = clone(prev);
  const events: GameEvent[] = [];
  const emit = makeEmit(state, events);
  const working = state.players[command.player];

  const def = getCard(working.hand.find((c) => c.instanceId === command.cardInstanceId)!.definitionId);
  returnToDeck(state, working, command.cardInstanceId, working.hand);
  state.turnActions.discarded += 1;
  emit('discard', `${working.name} discards ${def.retheme_name} (${state.turnActions.discarded}/${TURN_RULES.discardCardsPerTurnMax}).`, { definitionId: def.id }, command.player);

  return { state, events };
}

function endTurn(prev: GameState, command: Extract<Command, { type: 'END_TURN' }>): ReducerResult {
  const error = (msg: string): ReducerResult => ({ state: prev, events: [], error: msg });
  if (prev.status !== 'active') return error(`Cannot end turn while game is ${prev.status}.`);
  if (command.player !== prev.current) return error('Not your turn.');

  const state = clone(prev);
  const events: GameEvent[] = [];
  const emit = makeEmit(state, events);
  emit('end_turn', `${state.players[command.player].name} ends their turn.`, {}, command.player);
  advanceTurn(state, emit);
  return { state, events };
}

function sabotageSelect(prev: GameState, command: Extract<Command, { type: 'SABOTAGE_SELECT' }>): ReducerResult {
  const error = (msg: string): ReducerResult => ({ state: prev, events: [], error: msg });
  if (prev.status !== 'awaiting_sabotage_choice' || !prev.pendingSabotage) {
    return error('No sabotage choice is pending.');
  }
  if (command.player !== prev.pendingSabotage.caster) return error('Only the sabotaging player may choose.');

  const victimId: PlayerId = command.player === 'A' ? 'B' : 'A';
  const victim = prev.players[victimId];
  if (!victim.hand.some((c) => c.instanceId === command.targetCardInstanceId)) {
    return error("Chosen card is not in the opponent's hand.");
  }

  const state = clone(prev);
  const events: GameEvent[] = [];
  const emit = makeEmit(state, events);
  const workingVictim = state.players[victimId];
  const replacement = state.pendingSabotage!.replacementDraw;

  const def = getCard(workingVictim.hand.find((c) => c.instanceId === command.targetCardInstanceId)!.definitionId);
  returnToDeck(state, workingVictim, command.targetCardInstanceId, workingVictim.hand);
  const drawn = draw(workingVictim, replacement);
  emit('sabotage_resolve', `${workingVictim.name}'s ${def.retheme_name} is returned to deck; they draw ${drawn}.`, { definitionId: def.id, drawn }, command.player);

  state.pendingSabotage = null;
  state.status = 'active';

  // Re-check win in case the board changed (defensive), then end the caster's turn.
  if (!checkWin(state, emit)) {
    advanceTurn(state, emit);
  }
  return { state, events };
}

export function reduce(state: GameState, command: Command): ReducerResult {
  switch (command.type) {
    case 'START_GAME':
      return startGame(command);
    case 'CAST_CARD':
      return castCard(state, command);
    case 'DISCARD_CARD':
      return discardCard(state, command);
    case 'END_TURN':
      return endTurn(state, command);
    case 'SABOTAGE_SELECT':
      return sabotageSelect(state, command);
  }
}
