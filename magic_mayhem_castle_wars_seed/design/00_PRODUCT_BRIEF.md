# Product Brief

## Goal

Create a fast, satisfying two-player turn-based card duel where each wizard builds a Citadel, protects it with a Ward, gathers Law/Neutral/Chaos mana from Places of Power, and casts creatures/spells from a Portmanteau.

## MVP player promise

“In five minutes, I can understand the board, cast weird mythic spells, and either destroy my opponent’s citadel or raise mine to impossible height.”

## Core mode

Local hot-seat duel. Both players share the same device. The game is deterministic and testable.

## Secondary mode

Single-player versus simple AI once hot-seat is stable. The AI can be heuristic-based:

- Win immediately if possible.
- Prevent opponent win if possible.
- Play high-impact affordable card.
- Prefer worker/circle growth early.
- Discard unaffordable low-value cards.

## Tone

Dark mythic, strange, slightly comedic, “old PC fantasy box art meets stop-motion tabletop relics.”

## MVP success criteria

- A new player can finish a complete match without reading external rules.
- All 56 card mechanics are implemented.
- Rules and edge cases have automated tests.
- Retheme is coherent and does not depend on copyrighted assets.
