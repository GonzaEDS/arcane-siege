// Thin UI-side store around the pure engine. The UI only ever *dispatches*
// commands and *reads* state; it never mutates engine structures. We keep the
// full event stream here because the engine retains only a rolling window, and
// we surface the most recent per-dispatch batch so the presentation layer can
// drive animations without diffing whole states.

import { useCallback, useRef, useState } from 'react';
import { reduce } from '../engine';
import type { Command, GameEvent, GameState } from '../engine';

export interface EventBatch {
  id: number;
  events: GameEvent[];
  reset: boolean;
}

export interface GameStore {
  state: GameState | null;
  log: GameEvent[];
  error: string | null;
  lastBatch: EventBatch | null;
  dispatch: (command: Command) => GameState | null;
  reset: () => void;
}

export function useGame(): GameStore {
  const [state, setState] = useState<GameState | null>(null);
  const [log, setLog] = useState<GameEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastBatch, setLastBatch] = useState<EventBatch | null>(null);
  // A ref mirror of state so dispatch can be called several times synchronously
  // (e.g. an AI loop) without waiting for React re-renders.
  const stateRef = useRef<GameState | null>(null);
  const batchId = useRef(0);

  const dispatch = useCallback((command: Command): GameState | null => {
    const current = command.type === 'START_GAME' ? ({} as GameState) : stateRef.current;
    if (!current && command.type !== 'START_GAME') return stateRef.current;

    const result = reduce(current as GameState, command);
    if (result.error) {
      setError(result.error);
      return stateRef.current;
    }

    stateRef.current = result.state;
    setState(result.state);
    setError(null);

    const isReset = command.type === 'START_GAME';
    setLog((prev) => {
      const next = isReset ? result.events : [...prev, ...result.events];
      return next.length > 500 ? next.slice(next.length - 500) : next;
    });
    setLastBatch({ id: ++batchId.current, events: result.events, reset: isReset });

    return result.state;
  }, []);

  const reset = useCallback(() => {
    stateRef.current = null;
    setState(null);
    setLog([]);
    setError(null);
    setLastBatch(null);
  }, []);

  return { state, log, error, lastBatch, dispatch, reset };
}
