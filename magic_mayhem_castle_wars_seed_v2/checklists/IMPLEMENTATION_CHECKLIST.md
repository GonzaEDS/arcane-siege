# V2 Implementation Checklist

## Preparation

- [ ] Read `magic_mayhem_castle_wars_seed_v2/README.md`.
- [ ] Read all files under `magic_mayhem_castle_wars_seed_v2/design/`.
- [ ] Read all files under `magic_mayhem_castle_wars_seed_v2/technical/`.
- [ ] Inspect current `src/ui/App.tsx`.
- [ ] Inspect current `src/ui/styles.css`.
- [ ] Inspect current UI components.
- [ ] Confirm existing `npm test` passes before major changes.
- [ ] Confirm existing `npm run build` passes before major changes.

## Architecture

- [ ] Preserve pure engine behavior.
- [ ] Do not change card costs/effects/rules.
- [ ] Keep UI and engine separated.
- [ ] Extract board layout out of `App.tsx` if practical.
- [ ] Add or refactor components for board zones.
- [ ] Keep debug mode working.
- [ ] Keep reduced motion working.

## Board Layout

- [ ] Add opponent zone.
- [ ] Add current player zone.
- [ ] Add shared duel table zone.
- [ ] Add last-cast focus zone.
- [ ] Add visible Portmanteau draw stacks.
- [ ] Add visible return/recycle pulse zones.
- [ ] Add Citadel/Ward visual components.
- [ ] Preserve numeric Citadel/Ward/resources/circles.
- [ ] Preserve current action controls.

## Hand Visibility

- [ ] Versus AI shows human hand face up and AI hand face down.
- [ ] Local secret hot-seat shows only active player's hand.
- [ ] Pass gate protects hand visibility between local turns.
- [ ] Local open-table option shows both hands.
- [ ] Sabotage targeting works with visibility rules.

## Card Presentation

- [ ] Keep cards readable at current or improved size.
- [ ] Keep cost pips clear.
- [ ] Keep generated effect text clear.
- [ ] Keep affordability reason.
- [ ] Improve face-down card back.
- [ ] Add or improve original talisman/silhouette art panels.
- [ ] Preserve debug source card metadata.

## Animation

- [ ] Track last-cast card from events.
- [ ] Cast card appears in last-cast zone.
- [ ] Cast/return pile feedback exists.
- [ ] Draw pile feedback exists.
- [ ] Discard/return feedback exists.
- [ ] Ward damage feedback exists.
- [ ] Citadel damage feedback exists.
- [ ] Ward build feedback exists.
- [ ] Citadel build feedback exists.
- [ ] Resource production feedback exists.
- [ ] Buff add/consume feedback exists.
- [ ] Sabotage selection feedback exists.
- [ ] Reduced motion disables or simplifies movement.

## Visual Direction

- [ ] Board feels like a ritual table or physical duel surface.
- [ ] Citadel feels like a magical stronghold.
- [ ] Ward feels like a protective barrier/sigil/wall.
- [ ] Portmanteau feels like a magical container.
- [ ] Law/Neutral/Chaos have distinct visual treatments.
- [ ] No copied art, logos, screenshots, sprites, or UI chrome.
- [ ] Text contrast remains acceptable.

## Validation

- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Manual smoke test: Versus AI full game.
- [ ] Manual smoke test: local hot-seat turn handoff.
- [ ] Manual smoke test: local open-table mode.
- [ ] Manual smoke test: reduced motion.
- [ ] Manual smoke test: debug mode.
- [ ] Manual smoke test: reset/new game.
