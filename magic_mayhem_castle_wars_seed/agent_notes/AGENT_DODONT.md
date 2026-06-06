# Agent Do / Do Not

## Do

- Use TypeScript types for game state, cards, effects, and commands.
- Keep the engine pure: a reducer/action model with deterministic input/output.
- Add tests for all card actions before polishing UI.
- Keep source names in data for QA, but display retheme names by default.
- Keep all numbers exact unless a later explicit balance phase changes them.
- Add a visible debug panel in dev mode showing original source card name, cost, and effect.

## Do not

- Do not use Magic & Mayhem logos, screenshots, music, ripped sprites, claymation cutscenes, or official names in public-facing branding.
- Do not change values because they “feel wrong” during implementation.
- Do not implement online multiplayer before hot-seat mode works.
- Do not couple UI to effect logic.
- Do not hardcode card effects in React components; resolve effects through the engine.
- Do not skip test cases for special cards like Curse, Thief, Sabotage, Reverse, Roadblock, Magic Defence, Magic Bricks, and Magic Weapons.
