# Board Layout And Information Architecture

## Design Intent

V2 should borrow the broad clarity of classic two-player card/board-game layouts without copying any specific UI:

- Opponent information at the top.
- Player information and hand at the bottom.
- Shared duel space in the middle.
- Draw/return piles visible near each player.
- Last cast card visible in a shared focus area.
- Fortress protection represented physically.

The board should feel like a ritual table, not a generic app dashboard.

## Recommended Desktop Layout

```text
+------------------------------------------------------------------+
| Header: title, mode, seed, debug, reduced motion, reset           |
+------------------------------------------------------------------+
| Opponent zone                                                     |
| [Opponent status] [Opponent hand] [Opponent Portmanteau piles]     |
+------------------------------------------------------------------+
| Shared duel table                                                 |
|                                                                  |
|   Opponent Citadel/Ward visual       Last Cast / Resolving Card   |
|                                                                  |
|   Recent event text or compact cue   Player Citadel/Ward visual   |
|                                                                  |
+------------------------------------------------------------------+
| Player zone                                                       |
| [Player status] [Player hand] [Player Portmanteau piles/actions]   |
+------------------------------------------------------------------+
```

Alternative layouts are allowed if they preserve the same information hierarchy.

## Board Zones

### Header Zone

Must include:

- Game title.
- Current mode.
- Seed.
- Debug toggle.
- Reduced motion toggle.
- Reset/new game action.

Should not dominate the screen.

### Opponent Zone

Must include:

- Opponent name.
- Citadel number.
- Ward number.
- Law/Neutral/Chaos mana and circles.
- Buffs.
- Hand count.
- Deck/Portmanteau count.
- Opponent hand cards, face up or face down depending on mode.
- Opponent Portmanteau piles.

### Shared Duel Table

Must include:

- Opponent Citadel/Ward visual.
- Player Citadel/Ward visual.
- Last cast card focus.
- Optional compact action caption such as "Adept casts Manticore Volley".
- Optional visual travel paths between zones.

The shared table is where the duel should feel alive.

### Player Zone

Must include:

- Player name.
- Citadel number.
- Ward number.
- Law/Neutral/Chaos mana and circles.
- Buffs.
- Current player hand.
- Cast/discard/end-turn controls.
- Player Portmanteau piles.

## Citadel And Ward Visuals

### Citadel

Citadel should be both numeric and visual.

Possible original representations:

- Fortress silhouette made of simple SVG blocks.
- Tower segments that rise as Citadel increases.
- Ritual stronghold on a base plinth.
- Realm-specific citadel variants later: Avalon, Greece, Albion.

Value mapping:

- 0 or less: broken / fallen.
- 1-29: damaged / low.
- 30: baseline.
- 31-59: stable.
- 60-99: imposing.
- 100+: ascendant / victory.

### Ward

Ward should be both numeric and visual.

Possible original representations:

- Arcane ring around the Citadel.
- Floating barrier stones.
- Warding wall segments.
- Sigil shield with intensity based on value.

Value mapping:

- 0: no barrier.
- 1-10: baseline protection.
- 11-30: strong barrier.
- 31+: exceptional barrier.

## Hand Visibility Rules

### Versus AI

- Human player hand: face up.
- AI hand: face down.
- Last cast card from AI: face up when cast.

### Local Secret Hot-Seat

- Active player hand: face up.
- Inactive player hand: face down.
- Pass gate appears on turn change before revealing the new active player's hand.
- Avoid accidentally revealing hidden cards during animation.

### Local Open-Table

- Both hands face up.
- Useful for learning and casual shared-screen play.
- Should be selectable and clearly labeled.

## Last Cast Zone

The last cast zone is central to v2.

When a card is cast:

1. The card appears or moves into the last-cast zone.
2. The effect is shown through board feedback.
3. The card remains visible briefly.
4. The card visually returns to the owner's Portmanteau/return pulse.
5. The last-cast zone may continue to show a smaller "last cast" memory until another card is cast.

The last-cast zone should not block the player's hand permanently.

## Portmanteau Piles

Each player should have:

- Draw Portmanteau stack.
- Return/Recycle pulse area.

Important: under current rules, played and discarded cards return to the owner's deck and the deck is reshuffled. This is not a traditional permanent discard pile.

Therefore:

- Avoid calling it "discard pile" in the shipped UI.
- Use "Return", "Returned to Portmanteau", "Portmanteau stirs", or similar.
- It is fine to show the most recently returned card as a short-lived visual memory.

## Information Priority

Highest priority:

1. Whose turn it is.
2. What card was just cast.
3. What changed: Citadel, Ward, resources, buffs, hand.
4. What actions the current player can take.

Lower priority:

- Full event log.
- Debug payloads.
- Exact source-card metadata.
- RNG state.

The event log should become supporting evidence, not the main way to understand a turn.
