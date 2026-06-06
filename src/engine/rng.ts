// Deterministic, serializable pseudo-random number generator.
//
// We deliberately avoid Math.random so that every shuffle is reproducible from
// a single integer seed. The RNG state is stored in GameState.rngState and is
// advanced explicitly, which keeps the engine pure and testable.

/** Advance a 32-bit state and return the next state. (mulberry32 core.) */
export function nextState(state: number): number {
  // Keep the state within 32 unsigned bits.
  return (state + 0x6d2b79f5) | 0;
}

/** Produce a float in [0, 1) from a given state without mutating anything. */
export function floatFromState(state: number): number {
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export interface NextRandom {
  value: number; // in [0, 1)
  state: number; // advanced state to thread forward
}

/** Pure single draw: returns a value and the next state. */
export function nextRandom(state: number): NextRandom {
  const advanced = nextState(state);
  return { value: floatFromState(advanced), state: advanced };
}

export interface ShuffleResult<T> {
  items: T[];
  state: number;
}

/**
 * Fisher-Yates shuffle that threads the RNG state. Returns a new array; the
 * input is not mutated. Deterministic for a given starting state.
 */
export function shuffle<T>(input: readonly T[], state: number): ShuffleResult<T> {
  const items = input.slice();
  let s = state;
  for (let i = items.length - 1; i > 0; i--) {
    const r = nextRandom(s);
    s = r.state;
    const j = Math.floor(r.value * (i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return { items, state: s };
}
