# Phased Agent Prompts V2

Use these prompts if implementing V2 in smaller passes. Each phase should preserve passing tests and build.

## Phase 1 — UI Audit And Refactor Plan

Read:

- `magic_mayhem_castle_wars_seed_v2/README.md`
- `magic_mayhem_castle_wars_seed_v2/design/*`
- `magic_mayhem_castle_wars_seed_v2/technical/*`
- `src/ui/App.tsx`
- `src/ui/styles.css`
- `src/ui/components/*`
- `src/ui/useGame.ts`
- `src/engine/types.ts`
- `src/engine/reducer.ts`

Produce a short implementation plan. Identify which components to extract from `App.tsx`, which existing CSS can be reused, and where presentation state should live.

Do not edit files in this phase unless explicitly instructed.

## Phase 2 — Board Layout And Zones

Implement the v2 duel-table layout:

- Opponent zone.
- Central board zone.
- Current player zone.
- Last-cast focus slot.
- Portmanteau draw/return pile placeholders.
- Citadel/Ward visual components.

Preserve all existing gameplay controls and behavior. It is acceptable for the new visual zones to be static in this phase.

Run:

- `npm run build`
- `npm test`

## Phase 3 — Hand Visibility Modes

Add a local visibility setting:

- Versus AI: AI hand face down.
- Local secret hot-seat: active player's hand visible, inactive hand hidden; pass gate remains.
- Local open-table: both hands visible.

Keep the current hot-seat protection as the default for local play unless the UI clearly exposes the open-table option.

Run:

- `npm run build`
- `npm test`

## Phase 4 — Presentation Event Queue

Add React-side presentation state derived from `GameEvent`s:

- Track the most recent cast card.
- Track recent draw/return/cast/damage/build/resource events long enough to animate.
- Do not delay the engine reducer.
- Do not make engine state depend on animation completion.
- Use stable event sequence numbers to avoid double-playing animations.

Run:

- `npm run build`
- `npm test`

## Phase 5 — Card Movement Animations

Implement lightweight, reduced-motion-aware animations:

- Card cast: hand -> last-cast focus -> return pile pulse.
- Draw/refill: draw pile -> hand slot.
- Discard/return: hand -> return pile pulse.
- Sabotage: opponent hand highlight -> chosen card return pulse.

Prefer CSS transitions/classes and small React state helpers. Avoid heavy animation libraries unless there is a clear reason.

Run:

- `npm run build`
- `npm test`

## Phase 6 — Board Feedback Animations

Implement visual feedback for:

- Ward damage.
- Citadel damage.
- Ward build.
- Citadel build.
- Resource production.
- Buff added/consumed.

Animations should help players understand the move, not decorate every state change.

Run:

- `npm run build`
- `npm test`

## Phase 7 — Stronger Magic & Mayhem-Inspired Visual Identity

Improve the visual direction:

- Board as ritual table / mythic duel surface.
- Original Citadel and Ward visual motifs.
- Original talisman card frames.
- Original clay-idol/silhouette card art placeholders.
- Strong Law/Neutral/Chaos visual languages.
- Better Portmanteau pile treatment.

Do not copy source assets or UI chrome. Keep readability and accessibility.

Run:

- `npm run build`
- `npm test`

## Phase 8 — Review And Polish

Review against:

- `checklists/IMPLEMENTATION_CHECKLIST.md`
- `checklists/REVIEW_CHECKLIST.md`

Fix regressions. Verify both Versus AI and local hot-seat. Confirm reduced motion. Confirm debug mode.
