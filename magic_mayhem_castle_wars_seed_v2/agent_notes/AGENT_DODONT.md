# Agent Do / Don't

## Do

- Read the v2 master prompt first.
- Preserve the existing engine.
- Keep gameplay rules exact.
- Improve board readability.
- Make the last cast card obvious.
- Make Citadel and Ward visually present.
- Use Portmanteau terminology.
- Treat returned cards as returning to deck/recycle, not a permanent discard pile.
- Keep hand visibility mode-specific.
- Use original art direction.
- Respect reduced motion.
- Run tests and build after changes.
- Keep components small and understandable.

## Don't

- Do not copy the reference screenshot.
- Do not copy Castle Wars, Magic Castles, or Magic & Mayhem UI chrome.
- Do not use official art, logos, sprites, screenshots, music, or exact text.
- Do not rename the game to Magic & Mayhem or Castle Wars.
- Do not change card stats or effects.
- Do not alter win conditions.
- Do not make animations part of engine state.
- Do not block the reducer on animation completion.
- Do not hide important numbers behind decorative visuals.
- Do not rely only on color for resources.
- Do not remove debug mode.
- Do not make `App.tsx` more monolithic.

## Acceptable Compromises

If precise card travel is too complex:

- Use fade/scale from hand to last-cast.
- Pulse the Portmanteau return zone.
- Add exact travel later.

If full visual redesign is too large:

- Prioritize board zones, last-cast focus, Citadel/Ward visuals, and hand visibility first.
- Improve card art placeholders after the layout works.

If event metadata is insufficient:

- Add small, backward-compatible fields to event `data`.
- Preserve event names and existing behavior.
