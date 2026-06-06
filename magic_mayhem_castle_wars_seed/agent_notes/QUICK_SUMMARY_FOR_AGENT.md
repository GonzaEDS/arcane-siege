# Quick Summary for Agent

You are building a deterministic, browser-playable MVP of a Castle Wars-like duel, rethemed as wizard combat inspired by Magic & Mayhem.

Do not invent new balance yet. Implement the exact baseline values from `data/cards_v1_exact_mechanics_rethemed.json` and `data/castle_wars_rules.json`.

The game loop:

1. Two players/wizards each start with 2 Law Circles, 2 Neutral Circles, 2 Chaos Circles; 5 of each mana; 30 Citadel; 10 Ward.
2. Each player has a Portmanteau deck and a hand of 8 cards.
3. On a turn, the player may either cast one card or discard up to 3 cards. They may also end turn manually.
4. Resource generation happens at the start of a player's turn, but not during the first two turns of the game.
5. Normal damage hits Ward first; overflow hits Citadel. Bypass damage hits Citadel directly.
6. Win if your Citadel reaches 100 or the opponent's Citadel reaches 0.

Prioritize a pure, testable engine. UI is secondary.
