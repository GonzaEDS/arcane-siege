# Quick Summary For Agent

You are implementing V2 of Arcane Siege.

V1 already works technically. Do not rebuild the game.

Your job:

- Improve playability and visual clarity.
- Make the board feel like a physical wizard duel table.
- Show Citadel and Ward as objects, not only meters.
- Show each player's Portmanteau draw/return zones.
- Show the most recently cast card clearly.
- Add light event-driven animations.
- Make the visual direction more original Magic & Mayhem-inspired: strange, mythic, handmade, clay-idol/talisman, Law/Neutral/Chaos.

Do not:

- Change rules.
- Change card balance.
- Copy Castle Wars / Magic Castles / Magic & Mayhem assets.
- Rewrite the engine.
- Add online multiplayer.
- Add a permanent discard pile unless rules are explicitly changed later.

Key current files:

- `src/ui/App.tsx`
- `src/ui/useGame.ts`
- `src/ui/styles.css`
- `src/ui/components/Card.tsx`
- `src/ui/components/PlayerPanel.tsx`
- `src/ui/components/TurnLog.tsx`
- `src/engine/reducer.ts`
- `src/engine/effects.ts`
- `src/engine/types.ts`

Best implementation path:

1. Refactor UI into board/player/hand/pile/last-cast components.
2. Add static v2 layout.
3. Add hand visibility modes.
4. Add last-cast presentation from `cast` events.
5. Add simple Portmanteau/draw/return feedback.
6. Add Citadel/Ward/resource/buff pulses.
7. Improve visual style and card art placeholders.
8. Run `npm test` and `npm run build`.
