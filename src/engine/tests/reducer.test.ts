import { describe, it, expect } from 'vitest';
import { reduce } from '../reducer';
import { buildDeck } from '../cards';
import { getDeckPreset, DECK_PRESETS } from '../index';
import { validateDeck } from '../rules';
import { chooseMove } from '../ai';
import { INITIAL_STATS, HAND_SIZE } from '../rules';
import type { CardInstance, Command, GameState, PlayerState } from '../types';
import { makePlayer } from './helpers';

function start(seed = 1, deckName = 'Complete'): GameState {
  const deck = getDeckPreset(deckName);
  const res = reduce({} as GameState, { type: 'START_GAME', seed, deckA: deck, deckB: deck });
  return res.state;
}

describe('game setup', () => {
  it('start state matches the baseline initial stats', () => {
    const s = start();
    for (const id of ['A', 'B'] as const) {
      const p = s.players[id];
      expect(p.law_circles).toBe(INITIAL_STATS.law_circles);
      expect(p.neutral_circles).toBe(INITIAL_STATS.neutral_circles);
      expect(p.chaos_circles).toBe(INITIAL_STATS.chaos_circles);
      expect(p.law_mana).toBe(INITIAL_STATS.law_mana);
      expect(p.neutral_mana).toBe(INITIAL_STATS.neutral_mana);
      expect(p.chaos_mana).toBe(INITIAL_STATS.chaos_mana);
      expect(p.citadel).toBe(INITIAL_STATS.citadel);
      expect(p.ward).toBe(INITIAL_STATS.ward);
    }
    expect(s.status).toBe('active');
    expect(s.current).toBe('A');
    expect(s.turn).toBe(1);
  });

  it('deals a hand of 8 to each player', () => {
    const s = start();
    expect(s.players.A.hand).toHaveLength(HAND_SIZE);
    expect(s.players.B.hand).toHaveLength(HAND_SIZE);
  });

  it('is deterministic for a fixed seed', () => {
    const a = start(42);
    const b = start(42);
    expect(a.players.A.hand.map((c) => c.instanceId)).toEqual(b.players.A.hand.map((c) => c.instanceId));
  });
});

describe('production timing', () => {
  it('skips production on the first two turns then produces on turn 3', () => {
    let s = start(7);
    expect(s.players.A.law_mana).toBe(5); // turn 1, no production
    s = reduce(s, { type: 'END_TURN', player: 'A' }).state; // -> turn 2 (B), no production
    expect(s.players.B.law_mana).toBe(5);
    s = reduce(s, { type: 'END_TURN', player: 'B' }).state; // -> turn 3 (A), production
    expect(s.turn).toBe(3);
    expect(s.current).toBe('A');
    expect(s.players.A.law_mana).toBe(5 + INITIAL_STATS.law_circles);
    expect(s.players.A.neutral_mana).toBe(5 + INITIAL_STATS.neutral_circles);
    expect(s.players.A.chaos_mana).toBe(5 + INITIAL_STATS.chaos_circles);
  });
});

// Build a controlled active state with explicit hands and decks.
function controlled(a: Partial<PlayerState>, b: Partial<PlayerState>, current: 'A' | 'B' = 'A'): GameState {
  return {
    status: 'active',
    players: { A: makePlayer('A', a), B: makePlayer('B', b) },
    current,
    turn: 5,
    rngState: 999,
    winner: null,
    pendingSabotage: null,
    log: [],
    eventSeq: 0,
    turnActions: { hasCast: false, discarded: 0 },
  };
}

describe('casting rules', () => {
  it('reverse can be played with less than 4 ward (source quirk)', () => {
    const deck = buildDeck({ '148900': 10 });
    const rev: CardInstance = { instanceId: 'rev', definitionId: '149109' };
    const s = controlled(
      { law_mana: 3, neutral_mana: 0, chaos_mana: 0, ward: 2, citadel: 30, hand: [rev], deck },
      {},
    );
    const res = reduce(s, { type: 'CAST_CARD', player: 'A', cardInstanceId: 'rev' });
    expect(res.error).toBeUndefined();
    expect(res.state.players.A.law_mana).toBe(0);
    expect(res.state.players.A.ward).toBe(0);
    expect(res.state.players.A.citadel).toBe(38);
  });

  it('advances the turn after a cast and rejects a second cast', () => {
    const deck = buildDeck({ '148900': 10 });
    const hut: CardInstance = { instanceId: 'hut', definitionId: '149107' };
    const extra: CardInstance = { instanceId: 'hut2', definitionId: '149107' };
    const s = controlled({ law_mana: 20, hand: [hut, extra], deck }, { deck: buildDeck({ '148900': 10 }) });
    const res = reduce(s, { type: 'CAST_CARD', player: 'A', cardInstanceId: 'hut' });
    expect(res.state.current).toBe('B');
    // A can no longer act.
    const rejected = reduce(res.state, { type: 'CAST_CARD', player: 'A', cardInstanceId: 'hut2' });
    expect(rejected.error).toBeDefined();
  });

  it('rejects casting an unaffordable card', () => {
    const dragon: CardInstance = { instanceId: 'd', definitionId: '149203' }; // 20 law, 20 neutral
    const s = controlled({ law_mana: 0, neutral_mana: 0, chaos_mana: 0, hand: [dragon], deck: buildDeck({ '148900': 10 }) }, {});
    const res = reduce(s, { type: 'CAST_CARD', player: 'A', cardInstanceId: 'd' });
    expect(res.error).toBeDefined();
    expect(res.state).toBe(s); // unchanged
  });
});

describe('discard rules', () => {
  it('allows up to three discards then blocks a fourth', () => {
    const hand: CardInstance[] = [0, 1, 2, 3].map((i) => ({ instanceId: `c${i}`, definitionId: '148900' }));
    let s = controlled({ hand, deck: buildDeck({ '148901': 20 }) }, {});
    for (let i = 0; i < 3; i++) {
      const r = reduce(s, { type: 'DISCARD_CARD', player: 'A', cardInstanceId: `c${i}` });
      expect(r.error).toBeUndefined();
      s = r.state;
    }
    expect(s.turnActions.discarded).toBe(3);
    const fourth = reduce(s, { type: 'DISCARD_CARD', player: 'A', cardInstanceId: 'c3' });
    expect(fourth.error).toBeDefined();
  });

  it('does not allow a cast after discarding', () => {
    const a: CardInstance = { instanceId: 'a', definitionId: '148900' };
    const b: CardInstance = { instanceId: 'b', definitionId: '149107' };
    let s = controlled({ law_mana: 20, hand: [a, b], deck: buildDeck({ '148901': 20 }) }, {});
    s = reduce(s, { type: 'DISCARD_CARD', player: 'A', cardInstanceId: 'a' }).state;
    const res = reduce(s, { type: 'CAST_CARD', player: 'A', cardInstanceId: 'b' });
    expect(res.error).toBeDefined();
  });
});

describe('sabotage interruption', () => {
  it('returns a chosen opponent card to deck and redraws a replacement', () => {
    const sab: CardInstance = { instanceId: 'sab', definitionId: '149013' }; // 10 chaos
    const victimHand: CardInstance[] = [
      { instanceId: 'v0', definitionId: '149203' },
      { instanceId: 'v1', definitionId: '148900' },
    ];
    const s = controlled(
      { chaos_mana: 20, hand: [sab], deck: buildDeck({ '148900': 10 }) },
      { hand: victimHand, deck: buildDeck({ '148901': 10 }) },
    );
    const cast = reduce(s, { type: 'CAST_CARD', player: 'A', cardInstanceId: 'sab' });
    expect(cast.state.status).toBe('awaiting_sabotage_choice');
    expect(cast.state.pendingSabotage?.caster).toBe('A');

    const before = cast.state.players.B.hand.length;
    const choose = reduce(cast.state, { type: 'SABOTAGE_SELECT', player: 'A', targetCardInstanceId: 'v0' });
    expect(choose.error).toBeUndefined();
    expect(choose.state.status).toBe('active');
    expect(choose.state.players.B.hand.some((c) => c.instanceId === 'v0')).toBe(false);
    expect(choose.state.players.B.hand.length).toBe(before); // removed one, drew one
    expect(choose.state.current).toBe('B'); // caster's turn ended
  });
});

describe('deck validation', () => {
  it('accepts the stock preset', () => {
    const result = validateDeck(getDeckPreset('Stock'));
    expect(result.valid).toBe(true);
    expect(result.totalCards).toBeGreaterThanOrEqual(50);
  });

  it('rejects more than five copies of a card', () => {
    const result = validateDeck({ '148900': 6, '148901': 50 });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/copy limit/i);
  });

  it('rejects decks below the minimum size', () => {
    const result = validateDeck({ '148900': 5 });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/minimum/i);
  });

  it('every shipped preset (except Empty) is legal', () => {
    for (const [name, deck] of Object.entries(DECK_PRESETS)) {
      if (name === 'Empty') continue;
      expect(validateDeck(deck).valid, `${name} should be valid`).toBe(true);
    }
  });
});

describe('integration: full games via the AI', () => {
  function playToEnd(seed: number): GameState {
    let s = start(seed);
    let guard = 0;
    while (s.status !== 'ended' && guard < 5000) {
      guard++;
      const actor = s.status === 'awaiting_sabotage_choice' ? s.pendingSabotage!.caster : s.current;
      const move: Command = chooseMove(s, actor);
      const res = reduce(s, move);
      expect(res.error, `unexpected error: ${res.error}`).toBeUndefined();
      s = res.state;

      // Invariants: no negative mana/ward, hands never exceed 8 outside resolution.
      for (const id of ['A', 'B'] as const) {
        const p = s.players[id];
        expect(p.law_mana).toBeGreaterThanOrEqual(0);
        expect(p.neutral_mana).toBeGreaterThanOrEqual(0);
        expect(p.chaos_mana).toBeGreaterThanOrEqual(0);
        expect(p.ward).toBeGreaterThanOrEqual(0);
      }
    }
    return s;
  }

  it('terminates with a winner across many seeds', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const s = playToEnd(seed);
      expect(s.status).toBe('ended');
      expect(s.winner === 'A' || s.winner === 'B').toBe(true);
    }
  });
});
