# Cursor Master Prompt

You are Claude Opus 4.8 High Thinking acting as the lead engineer and game implementation agent for this repository.

Your task is to build a playable MVP from the seed folder `magic_mayhem_castle_wars_seed`.

## Product

Build a browser-playable, deterministic, local hot-seat, two-player card duel. It is mechanically based on Castle Wars and thematically rethemed as an original wizard duel inspired by Magic & Mayhem.

## Critical source of truth

Use these files as canonical:

1. `data/castle_wars_rules.json`
2. `data/cards_v1_exact_mechanics_rethemed.json`
3. `data/deck_presets_v1.json`
4. `technical/EFFECT_GRAMMAR.md`
5. `technical/STATE_MACHINE.md`
6. `data/test_scenarios.json`

Do not change card numbers, costs, effects, win conditions, starting stats, deck limits, hand size, or discard rules unless explicitly asked in a later balance phase.

## Deliverables

1. A pure TypeScript engine with deterministic shuffling.
2. Unit tests covering core rules and every special effect.
3. Local hot-seat UI that can complete a full match.
4. Clear card rendering with costs, names, and generated effect text.
5. Developer debug mode exposing source card name and engine events.
6. Optional simple AI after hot-seat mode works.

## Implementation order

Phase 1: Data import and TypeScript types.
Phase 2: Pure game engine reducer and seeded shuffle.
Phase 3: Effects engine, including buffs and edge cases.
Phase 4: Unit tests from `data/test_scenarios.json` and one test per card action type.
Phase 5: Minimal UI.
Phase 6: Visual polish and retheme.
Phase 7: Simple AI.

## Non-negotiables

- No copyrighted assets from Magic & Mayhem or Castle Wars.
- Do not use official logos, music, screenshots, sprites, models or card images.
- Keep the working title original.
- Keep UI and engine separate.
- Every card effect must be represented by data, not hardcoded in components.
- Game state must be serializable.
- Make bugs visible in dev logs instead of silently mutating state.

## Acceptance criteria

The project is acceptable when a user can start a game, use Stock decks, take turns, cast and discard cards, see resources update correctly, see ward/citadel damage resolve correctly, and win/lose by exact baseline conditions.
