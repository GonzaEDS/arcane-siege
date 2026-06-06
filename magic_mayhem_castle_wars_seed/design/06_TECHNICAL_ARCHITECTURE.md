# Technical Architecture

Recommended stack for fast Cursor implementation:

- Vite + React + TypeScript.
- Vitest for engine tests.
- Zustand or React reducer for UI state, but keep engine reducer pure.
- CSS modules or plain CSS variables for theming.
- No backend for MVP.

## Suggested directories

```txt
src/
  engine/
    types.ts
    cards.ts
    reducer.ts
    effects.ts
    rules.ts
    ai.ts
    tests/
  data/
    cards_v1_exact_mechanics_rethemed.json
    deck_presets_v1.json
  ui/
    components/
    screens/
    styles/
  app/
```

## Engine commands

- `START_GAME(seed, deckA, deckB)`
- `CAST_CARD(playerId, cardInstanceId)`
- `DISCARD_CARD(playerId, cardInstanceId)`
- `END_TURN(playerId)`
- `SABOTAGE_SELECT(playerId, targetCardInstanceId)`

## Determinism

Every shuffle must use seeded RNG. Tests should not depend on Math.random.
