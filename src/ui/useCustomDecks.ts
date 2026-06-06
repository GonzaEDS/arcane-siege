// Player-created decks, persisted in localStorage. Custom decks live alongside
// the built-in presets and can be selected for either wizard.

import { useCallback, useEffect, useState } from 'react';
import type { DeckList } from '../engine';

const KEY = 'arcane-siege:custom-decks:v1';

export type CustomDecks = Record<string, DeckList>;

function load(): CustomDecks {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as CustomDecks) : {};
  } catch {
    return {};
  }
}

export function useCustomDecks() {
  const [decks, setDecks] = useState<CustomDecks>(() => load());

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(decks));
    } catch {
      // Ignore quota / private-mode write failures.
    }
  }, [decks]);

  const saveDeck = useCallback((name: string, list: DeckList) => {
    // Drop zero-count entries so the stored deck stays clean.
    const clean: DeckList = {};
    for (const [id, n] of Object.entries(list)) if (n > 0) clean[id] = n;
    setDecks((d) => ({ ...d, [name]: clean }));
  }, []);

  const deleteDeck = useCallback((name: string) => {
    setDecks((d) => {
      const next = { ...d };
      delete next[name];
      return next;
    });
  }, []);

  return { decks, saveDeck, deleteDeck };
}
