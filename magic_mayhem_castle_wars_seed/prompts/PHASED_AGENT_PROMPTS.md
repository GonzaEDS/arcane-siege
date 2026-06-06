# Phased Agent Prompts

## Phase 1 — Engine Skeleton

Read all seed data. Create TypeScript types for CardDefinition, PlayerState, GameState, Effect, Command, and GameEvent. Implement deterministic seeded shuffle. Do not build UI yet.

## Phase 2 — Rules Reducer

Implement START_GAME, END_TURN, CAST_CARD, DISCARD_CARD, and draw-to-hand-size. Match source rules: hand size 8, discard max 3, no resources first two turns, one cast per turn.

## Phase 3 — Effects

Implement all effect operations from `technical/EFFECT_GRAMMAR.md`: damage, bypass damage, build, add/remove resources, add/steal workers, buffs, allProduce, roadblock, curse, thief, sabotage, wain.

## Phase 4 — Tests

Turn every scenario in `data/test_scenarios.json` into Vitest cases. Add edge-case tests for every special action.

## Phase 5 — UI

Build a simple hot-seat UI: player panels, hand, cast/discard/end-turn controls, game log, win screen. No animation required.

## Phase 6 — Theme

Apply the retheme terms, dark mythic card frames, icons, and placeholder art. Do not use copyrighted source images.

## Phase 7 — AI

Add simple AI after hot-seat is complete. AI should choose among legal actions using a transparent heuristic score.
