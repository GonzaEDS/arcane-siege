# Cursor Master Prompt V2

You are Claude Opus acting as the lead UI/game-feel implementation agent for this repository.

Your task is to implement **Arcane Siege V2**, using the seed folder `magic_mayhem_castle_wars_seed_v2`.

V1 already implemented the deterministic game engine, data model, core effects, tests, local hot-seat mode, and simple AI. Your job is to evolve the player-facing board, readability, atmosphere, and animation while preserving the existing rules.

## Product Goal

Make Arcane Siege feel like a physical wizard duel table:

- Two players facing each other.
- Each player has a visible Citadel and Ward representation.
- Each player has visible Portmanteau piles: draw stack and return/recycle stack.
- The most recently cast card appears in a central or upper board focus area.
- The current player's hand is prominent and readable.
- Opponent hand visibility depends on mode.
- Card movement and board feedback make turns easy to follow.
- The visual identity should be original but more strongly inspired by Magic & Mayhem's mood: handmade mythic creatures, ritual objects, Law/Neutral/Chaos magic, Places of Power, Avalon/Greece/Albion atmosphere.

## Critical Source Of Truth

Use v1 seed and current implementation as the gameplay source of truth:

1. `magic_mayhem_castle_wars_seed/data/cards_v1_exact_mechanics_rethemed.json`
2. `magic_mayhem_castle_wars_seed/data/castle_wars_rules.json`
3. `magic_mayhem_castle_wars_seed/technical/EFFECT_GRAMMAR.md`
4. `src/engine/reducer.ts`
5. `src/engine/effects.ts`
6. `src/engine/types.ts`
7. Existing tests under `src/engine/tests/`

Do **not** change card numbers, costs, effects, starting stats, win conditions, hand size, deck constraints, turn rules, or discard rules.

## Implementation Principles

- Keep the engine deterministic and instant.
- Keep UI and engine separate.
- Drive UI presentation from `GameEvent` output and React-side state.
- Add richer event metadata only if necessary, and only in a backward-compatible way.
- Do not mutate engine state in UI components.
- Do not encode card effects in UI components.
- Preserve debug mode.
- Preserve reduced-motion support.
- Prefer small React components over expanding `App.tsx`.

## Required V2 Deliverables

1. New board layout with explicit zones:
   - Opponent status / hand / Portmanteau piles.
   - Central duel table with Citadel/Ward visuals and last-cast focus.
   - Current player status / hand / controls.

2. Hand visibility modes:
   - Versus AI: human hand face up, AI hand face down.
   - Local secret hot-seat: only active player's hand face up; pass gate protects hidden hands.
   - Local open-table: both hands face up for casual shared-screen play.

3. Citadel and Ward presentation:
   - Keep exact numeric values visible.
   - Add visual structures that change by current value.
   - Citadel should read as a fortress/tower/ritual stronghold.
   - Ward should read as a protective barrier, ring, wall, or sigil.

4. Portmanteau piles:
   - Show a draw stack and return/recycle stack per player.
   - Use original naming: Portmanteau, Return.
   - Do not imply a permanent discard pile if rules still reshuffle returned cards into deck.
   - It is acceptable to show a "recent return" visual pulse even though the card mechanically returns to the deck.

5. Last-cast focus:
   - When a card is cast, show it in a central focus slot while effects resolve visually.
   - Keep enough time for the player to see what happened.
   - Debug mode may show event payloads as it already does.

6. Animation and feedback:
   - Card cast: hand -> last-cast focus -> return/Portmanteau pulse.
   - Draw/refill: Portmanteau draw stack -> hand slot.
   - Discard/return: hand -> return/Portmanteau pulse.
   - Damage: Ward/Citadel pulse, crack, shake, or flash.
   - Build: Citadel/Ward rises, brightens, or gains segments.
   - Resource production: Law/Neutral/Chaos counters pulse.
   - Sabotage: target hand/card highlight and chosen card return animation.
   - Reduced motion: replace motion with simple state changes/fades.

7. Stronger visual direction:
   - Replace generic card glyph placeholders with original abstract talisman/silhouette art.
   - Make Law, Neutral, and Chaos visually distinct beyond letters.
   - Use a board/table surface that feels like ritual fantasy, not a generic dashboard.
   - Keep accessibility and readability ahead of decoration.

## Suggested File Strategy

Likely create or refactor toward:

- `src/ui/App.tsx` as orchestration only.
- `src/ui/components/Board.tsx`
- `src/ui/components/PlayerZone.tsx`
- `src/ui/components/CitadelWardView.tsx`
- `src/ui/components/PortmanteauPiles.tsx`
- `src/ui/components/LastCastZone.tsx`
- `src/ui/components/Hand.tsx`
- `src/ui/components/Card.tsx` updates for richer art frames.
- `src/ui/usePresentationEvents.ts` or similar for animation queue/state.
- `src/ui/styles.css` reorganized into board/card/animation sections, or split only if the project pattern supports it.

Do not introduce large dependencies unless clearly justified. CSS transitions, React state, and small helper components are enough for this phase.

## IP And Legal Guardrails

Do not use:

- Castle Wars card art.
- Magic & Mayhem art, logos, sprites, screenshots, music, UI chrome, models, or exact text.
- Magic Castles screenshots or assets.

Do use:

- Original silhouettes.
- Public-domain mythic vocabulary.
- Generic board-game layout patterns.
- Abstract handmade/clay/talisman visual motifs.
- The existing original retheme names.

## Acceptance Criteria

V2 is acceptable when:

- A new player can visually follow a turn without reading the log.
- It is clear whose turn it is.
- It is clear which card was just cast.
- It is clear where cards draw from and return to.
- Citadel and Ward status are readable both numerically and visually.
- Hand visibility matches selected mode.
- Basic animations make actions legible without slowing the game too much.
- Reduced motion works.
- `npm test` passes.
- `npm run build` passes.
