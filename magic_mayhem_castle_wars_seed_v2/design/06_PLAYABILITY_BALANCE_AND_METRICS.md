# Playability, Balance, And Metrics

## V2 Balance Principle

Do not rebalance card numbers in V2.

The current game intentionally preserves the Castle Wars-style baseline. That baseline is the control group. V2 should improve readability, feel, and playability first.

If matches feel better after UI improvements, some perceived balance issues may disappear because players understand the game better.

## What V2 Can Improve Without Rebalancing

### 1. Dead-Turn Clarity

If a player has no affordable cards, the UI should explain why:

- Which resources are missing.
- Which cards are close to being affordable.
- That discard/return is a useful option.

This can reduce frustration without changing costs.

### 2. Action Confidence

Players should know:

- Which cards are castable.
- What will happen when a card is cast.
- Whether discard mode is active.
- Whether the turn will pass after casting.

### 3. AI Turn Comprehension

AI turns should not feel like invisible state changes.

The last-cast zone and board feedback should show:

- What card AI cast.
- What it affected.
- What changed.

### 4. Preset Clarity

Deck presets should eventually communicate their personality:

- Stock: balanced baseline.
- Rush: aggressive/damage.
- Turtle: defensive/build.
- Burn: attack-heavy.
- Complete: broad sandbox.

V2 may add descriptions in setup if simple.

## Metrics To Collect Later

If adding lightweight simulation or debug metrics is in scope, track:

- Average turns per game.
- First-player win rate.
- Win rate by deck preset.
- Frequency of turns with zero affordable cards.
- Frequency of turns where player discards.
- Casts per game.
- Most-cast cards.
- Least-cast cards.
- Average Citadel/Ward values over time.
- Average game duration in real time.

Do not block V2 on building a full analytics system.

## Suggested Debug-Only Playtest Summary

Optional: after game end in debug mode, show:

- Winner.
- Turns.
- Cast count.
- Discard count.
- Number of no-affordable-card turns.
- Deck presets.
- Seed.

This can help future balance work without changing gameplay.

## When To Consider Balance Changes

Only consider changing card data after:

1. V2 UI makes the game easy to follow.
2. Multiple real playtests are done.
3. Metrics show repeated issues.
4. The team decides whether to remain a faithful baseline clone or create an adapted Arcane Siege mode.

Possible later balance/adaptation work:

- Tune deck presets before changing individual cards.
- Add optional adapted mode.
- Add Magic & Mayhem-inspired ingredients/realm modifiers.
- Add tutorial decks.
- Add beginner-friendly preset pairings.

## V2 Acceptance From A Playability Perspective

V2 is successful if:

- Players understand why they can or cannot cast.
- Players can follow AI turns visually.
- Players understand damage vs Ward absorption.
- Players understand Citadel-building as a win path.
- Players can see where cards draw from and return to.
- Players feel like they are playing a duel, not operating a test UI.
