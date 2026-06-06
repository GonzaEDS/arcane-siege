// Custom deck builder. Compose a deck from the 56 cards with per-card steppers
// (0–5), live validation against the engine's deck constraints (min 50, max
// 280, max 5 copies), search/sort/filter, and save to local custom decks.

import { useMemo, useState } from 'react';
import {
  CARD_DEFINITIONS,
  KNOWN_CARD_IDS,
  DECK_CONSTRAINTS,
  validateDeck,
  categoryOf,
  type CardCategory,
  type DeckList,
} from '../../engine';
import { Card } from './Card';
import type { CustomDecks } from '../useCustomDecks';

const CATEGORY_ORDER: CardCategory[] = ['Attack', 'Citadel', 'Ward', 'Place of Power', 'Production', 'Boon', 'Hex', 'Special'];

type SortKey = 'category' | 'cost' | 'name';

function costOf(id: string): number {
  const c = CARD_DEFINITIONS.find((d) => d.id === id)!.cost_retheme;
  return c.law_mana + c.neutral_mana + c.chaos_mana;
}

export function DeckBuilder({
  initialName,
  initialDeck,
  presets,
  customDecks,
  onSave,
  onDelete,
  onCancel,
}: {
  initialName?: string;
  initialDeck?: DeckList;
  presets: Record<string, DeckList>;
  customDecks: CustomDecks;
  onSave: (name: string, deck: DeckList) => void;
  onDelete: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName ?? '');
  const [deck, setDeck] = useState<DeckList>(() => ({ ...(initialDeck ?? {}) }));
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'All' | CardCategory>('All');
  const [sort, setSort] = useState<SortKey>('category');

  const total = useMemo(() => Object.values(deck).reduce((s, n) => s + (n || 0), 0), [deck]);
  const validation = useMemo(() => validateDeck(deck, KNOWN_CARD_IDS), [deck]);
  const distinct = useMemo(() => Object.values(deck).filter((n) => n > 0).length, [deck]);

  const presetNames = Object.keys(presets).filter((n) => Object.keys(presets[n]).length > 0);
  const customNames = Object.keys(customDecks);
  const isExistingCustom = !!name && customNames.includes(name);

  const cards = useMemo(() => {
    let list = [...CARD_DEFINITIONS];
    if (category !== 'All') list = list.filter((d) => categoryOf(d) === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (d) => d.retheme_name.toLowerCase().includes(q) || d.source_name.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      if (sort === 'name') return a.retheme_name.localeCompare(b.retheme_name);
      if (sort === 'cost') return costOf(a.id) - costOf(b.id) || a.retheme_name.localeCompare(b.retheme_name);
      // category
      const ca = CATEGORY_ORDER.indexOf(categoryOf(a));
      const cb = CATEGORY_ORDER.indexOf(categoryOf(b));
      return ca - cb || costOf(a.id) - costOf(b.id);
    });
    return list;
  }, [category, search, sort]);

  const setCount = (id: string, n: number) =>
    setDeck((d) => {
      const next = { ...d };
      const clamped = Math.max(0, Math.min(DECK_CONSTRAINTS.maxCopiesPerCard, n));
      if (clamped === 0) delete next[id];
      else next[id] = clamped;
      return next;
    });

  const loadFrom = (key: string) => {
    if (!key) return;
    const src = customDecks[key] ?? presets[key];
    if (src) setDeck({ ...src });
  };

  const canSave = validation.valid && name.trim().length > 0;

  return (
    <div className="builder">
      <div className="builder-bar">
        <button type="button" className="btn" onClick={onCancel}>
          ← Back
        </button>

        <input
          className="builder-name"
          placeholder="Deck name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
        />

        <label className="builder-load">
          <span>Load from</span>
          <select defaultValue="" onChange={(e) => { loadFrom(e.target.value); e.target.value = ''; }}>
            <option value="">choose…</option>
            {customNames.length ? (
              <optgroup label="Your decks">
                {customNames.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </optgroup>
            ) : null}
            <optgroup label="Presets">
              {presetNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </optgroup>
          </select>
        </label>

        <div className={`builder-total ${validation.valid ? 'ok' : 'bad'}`}>
          <strong>{total}</strong> cards
          <span className="builder-range">({DECK_CONSTRAINTS.minCards}–{DECK_CONSTRAINTS.maxCards}, {distinct} kinds)</span>
        </div>

        <div className="builder-actions">
          {isExistingCustom ? (
            <button type="button" className="btn btn-on" onClick={() => onDelete(name)}>
              Delete
            </button>
          ) : null}
          <button type="button" className="btn" onClick={() => setDeck({})}>
            Clear
          </button>
          <button type="button" className="btn btn-primary" disabled={!canSave} onClick={() => onSave(name.trim(), deck)}>
            Save deck
          </button>
        </div>
      </div>

      {!validation.valid && total > 0 ? (
        <ul className="builder-errors">
          {validation.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      ) : (
        <p className="builder-help">
          Click a card to add a copy (up to {DECK_CONSTRAINTS.maxCopiesPerCard}); use − / + to fine-tune. Name your deck and
          save — it becomes selectable for either wizard.
        </p>
      )}

      <div className="builder-filters">
        <input className="builder-search" placeholder="Search cards…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label>
          Type
          <select value={category} onChange={(e) => setCategory(e.target.value as 'All' | CardCategory)}>
            <option value="All">All</option>
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="category">Type</option>
            <option value="cost">Cost</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      <div className="builder-grid">
        {cards.map((def) => {
          const count = deck[def.id] ?? 0;
          return (
            <div className={`builder-tile ${count > 0 ? 'in-deck' : ''}`} key={def.id}>
              <Card
                card={{ instanceId: def.id, definitionId: def.id }}
                selected={count > 0}
                onClick={() => setCount(def.id, count + 1)}
              />
              {count > 0 ? <span className="builder-count">{count}</span> : null}
              <div className="builder-stepper">
                <button type="button" className="step" disabled={count === 0} onClick={() => setCount(def.id, count - 1)} aria-label={`Remove ${def.retheme_name}`}>
                  −
                </button>
                <span className="step-count">{count}</span>
                <button
                  type="button"
                  className="step"
                  disabled={count >= DECK_CONSTRAINTS.maxCopiesPerCard}
                  onClick={() => setCount(def.id, count + 1)}
                  aria-label={`Add ${def.retheme_name}`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
