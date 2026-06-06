// Core engine types for Arcane Siege: Portmanteau Duels.
//
// The engine is a pure deterministic state machine. UI dispatches commands;
// the reducer returns the next state plus a list of events. No UI code may
// mutate these structures directly.

export type PlayerId = 'A' | 'B';

export type ManaKind = 'law' | 'neutral' | 'chaos';
export type BuffKind = 'attack' | 'build' | 'defence' | 'resources';

/**
 * Production mode applied at the affected player's next turn start, then reset
 * to 'normal'. Mirrors the original "All Bricks / All Crystals / All Weapons /
 * Reward Workers / Roadblock" mechanics.
 *
 * - normal: each circle produces one matching mana.
 * - law:    all circles produce Law mana (source "All Bricks").
 * - neutral:all circles produce Neutral mana (source "All Crystals").
 * - chaos:  all circles produce Chaos mana (source "All Weapons").
 * - all:    every production amount is doubled (source "Reward Workers").
 * - none:   no production at all next turn (source "Roadblock").
 */
export type ProductionMode = 'normal' | 'law' | 'neutral' | 'chaos' | 'all' | 'none';

/** Cost expressed in the rethemed resource model. */
export interface CardCost {
  law_mana: number;
  neutral_mana: number;
  chaos_mana: number;
  ward_level: number;
}

/** Structured effect operations, as described in technical/EFFECT_GRAMMAR.md. */
export type Effect =
  | { op: 'add_resource'; target: 'self'; amount: { law: number; neutral: number; chaos: number } }
  | {
      op: 'remove_resource';
      target: 'opponent';
      amount: { law: number; neutral: number; chaos: number };
      blocked_by_resource_protection?: boolean;
    }
  | { op: 'set_next_production'; target: 'self' | 'opponent'; mode: ProductionModeSource }
  | { op: 'damage'; target: 'opponent'; amount: number; bypass_wall: boolean; delay_seconds?: number }
  | { op: 'raise_castle'; target: 'self'; amount: number; uses_build_buff?: boolean; delay_seconds?: number }
  | {
      op: 'raise_wall';
      target: 'self';
      amount: number;
      uses_build_buff?: boolean;
      bypass_animation?: boolean;
      delay_seconds?: number;
    }
  | {
      op: 'add_worker';
      target: 'self';
      amount: { law_circle: number; neutral_circle: number; chaos_circle: number };
    }
  | {
      op: 'steal_worker';
      from: 'opponent';
      to: 'self';
      amount: { law_circle: number; neutral_circle: number; chaos_circle: number };
      opponent_min_each: number;
    }
  | { op: 'curse'; target: 'opponent'; description?: string }
  | { op: 'add_buff'; target: 'self'; buff: BuffKind }
  | { op: 'remove_buffs'; target: 'opponent'; mode: 'all' | BuffKind }
  | { op: 'thief'; target: 'opponent'; amount_per_resource_max: number; note?: string }
  | { op: 'wain'; target: 'opponent'; amount: number; description?: string }
  | {
      op: 'sabotage';
      target: 'opponent';
      choice?: string;
      replacement_draw: number;
    };

/** Raw production mode tokens that appear in the card JSON. */
export type ProductionModeSource = 'bricks' | 'crystals' | 'swords' | 'all' | 'none';

/** A card definition loaded from data/cards.json. */
export interface CardDefinition {
  id: string;
  source_name: string;
  retheme_name: string;
  magic_mayhem_reference?: string;
  cost_retheme: CardCost;
  action: string;
  value: unknown;
  bypass_wall: boolean;
  delay_seconds?: number;
  effects: Effect[];
  implementation_status?: string;
}

/** A concrete card in a deck/hand. Instances reference a definition by id. */
export interface CardInstance {
  instanceId: string;
  definitionId: string;
}

export interface PlayerState {
  id: PlayerId;
  name: string;

  // Workers / circles (production engines).
  law_circles: number;
  neutral_circles: number;
  chaos_circles: number;

  // Mana pools.
  law_mana: number;
  neutral_mana: number;
  chaos_mana: number;

  // Fortress.
  citadel: number;
  ward: number;

  // One-shot buffs.
  buffs: Record<BuffKind, boolean>;

  // Production mode consumed at this player's next turn start.
  nextProduction: ProductionMode;

  hand: CardInstance[];
  deck: CardInstance[];
}

export type GameStatus = 'setup' | 'active' | 'awaiting_sabotage_choice' | 'ended';

export interface GameEvent {
  /** Monotonic index within a game, useful for the debug log. */
  seq: number;
  turn: number;
  type: string;
  player?: PlayerId;
  message: string;
  /** Optional structured payload for the debug panel. */
  data?: Record<string, unknown>;
}

export interface PendingSabotage {
  /** The player who cast Sabotage and must now choose. */
  caster: PlayerId;
  /** How many cards the victim redraws after the chosen card returns to deck. */
  replacementDraw: number;
}

export interface GameState {
  status: GameStatus;
  players: Record<PlayerId, PlayerState>;
  current: PlayerId;
  /** Global turn counter, starting at 1. Production is skipped on turns 1 and 2. */
  turn: number;
  /** Seeded RNG state; advanced on every shuffle for determinism. */
  rngState: number;
  winner: PlayerId | null;
  pendingSabotage: PendingSabotage | null;
  log: GameEvent[];
  /** Internal monotonic counter for event ordering. */
  eventSeq: number;
  /** Per-turn action bookkeeping (reset every turn start). */
  turnActions: {
    hasCast: boolean;
    discarded: number;
  };
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export type Command =
  | { type: 'START_GAME'; seed: number; deckA: DeckList; deckB: DeckList; nameA?: string; nameB?: string }
  | { type: 'CAST_CARD'; player: PlayerId; cardInstanceId: string }
  | { type: 'DISCARD_CARD'; player: PlayerId; cardInstanceId: string }
  | { type: 'END_TURN'; player: PlayerId }
  | { type: 'SABOTAGE_SELECT'; player: PlayerId; targetCardInstanceId: string };

/** A deck list maps a card definition id to a copy count. */
export type DeckList = Record<string, number>;

export interface ReducerResult {
  state: GameState;
  events: GameEvent[];
  /** Set when a command was rejected (illegal move). State is unchanged. */
  error?: string;
}
