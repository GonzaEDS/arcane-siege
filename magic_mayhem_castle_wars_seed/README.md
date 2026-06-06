# Magic/Mayhem-style Castle Wars Seed

This folder is a programming-agent seed for building a web/card-game MVP: a Castle Wars-style two-player duel with exact baseline mechanics and a Magic & Mayhem-inspired retheme.

## Working title

**Arcane Siege: Portmanteau Duels**

The title is intentionally not **Magic & Mayhem** and not **Castle Wars**. Treat both as research references, not as brands to ship under.

## Core implementation directive

Build the playable engine first. Keep the baseline numeric mechanics exact before adding new design changes.

The included card data contains all 56 TTS Castle Wars cards with rethemed names and structured effects. The retheme maps Bricks/Crystals/Swords into Law/Neutral/Chaos mana and Castle/Wall into Citadel/Ward.

## Folder map

- `prompts/CURSOR_MASTER_PROMPT.md` — paste this into Cursor/Claude as the primary task prompt.
- `data/cards_v1_exact_mechanics_rethemed.json` — canonical card data for implementation.
- `data/castle_wars_rules.json` — canonical rules, starting stats, deck constraints, hand size, resource generation.
- `data/deck_presets_v1.json` — Stock Plus, Stock, Complete, Empty, Rush, Turtle, Burn deck presets.
- `design/` — product, mechanics, aesthetic and UX guidance.
- `technical/` — engine/state/effect/test specs.
- `checklists/` — implementation and review checklists.
- `legal_ip/SAFE_RETHEME_POLICY.md` — practical guardrails for not copying protected assets/branding.

## Non-goals for the first implementation pass

No online multiplayer, no blockchain, no card-creation UGC, no AI-generated final production art, no copyrighted art/audio/logo extraction, no balance innovations until unit tests prove the clone baseline works.

## Build order

1. Implement pure game engine and tests.
2. Render local hot-seat UI.
3. Add basic AI only after engine tests pass.
4. Add animation and theming after mechanics are stable.
5. Only then consider adaptation mechanics inspired by Magic & Mayhem.
