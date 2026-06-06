# Arcane Siege V2 Seed

This folder is the v2 programming-agent seed for improving **Arcane Siege: Portmanteau Duels** after the v1 engine-first MVP.

V1 proved the deterministic Castle Wars-style mechanics, card data, reducer, tests, hot-seat mode, and simple AI. V2 should not restart or rewrite that work. V2 is a presentation, playability, and atmosphere phase.

## V2 Goal

Turn the current functional card-game UI into a clearer, more physical wizard-duel table:

- Visible Citadel and Ward representations for both players.
- Visible Portmanteau draw/return piles.
- A central last-cast card focus area.
- Hand visibility modes for AI, local secret hot-seat, and local open-table play.
- Event-driven card movement and board feedback animations.
- A stronger original visual identity inspired by Magic & Mayhem's mood: strange handmade fantasy, clay-idol creature energy, Law/Neutral/Chaos magic, Places of Power, Avalon/Greece/Albion atmosphere.

## Critical Direction

Do **not** copy Castle Wars, Magic & Mayhem, or Magic Castles assets, names, UI chrome, screenshots, logos, sprites, sounds, or exact artwork.

Borrow the broad board-game readability pattern:

- Player zones facing each other.
- Player hand at the bottom.
- Opponent hand above or opposite.
- Piles visible on the board.
- A clear "last played / currently resolving" card area.
- Fortress/wall status shown as objects, not only meters.

Use original terms and art direction from v1:

- Citadel, not Castle.
- Ward, not Wall.
- Portmanteau, not Deck.
- Cast / Return, not Play / Discard.
- Law, Neutral, Chaos mana and circles.

## Folder Map

- `prompts/CURSOR_MASTER_PROMPT_V2.md` — paste this into Cursor/Claude as the primary v2 task prompt.
- `prompts/PHASED_AGENT_PROMPTS_V2.md` — staged prompts for smaller Claude passes.
- `design/00_V2_PRODUCT_BRIEF.md` — product goal and success criteria.
- `design/01_BOARD_LAYOUT_AND_INFORMATION_ARCHITECTURE.md` — board zones and information hierarchy.
- `design/02_VISUAL_DIRECTION_MAGIC_MAYHEM_INSPIRED.md` — original visual language inspired by Magic & Mayhem.
- `design/03_CARD_PRESENTATION_AND_ZONES.md` — hand, opponent hand, Portmanteau piles, last-cast zone.
- `design/04_ANIMATION_AND_FEEDBACK.md` — card movement and board feedback.
- `design/05_REFERENCE_LAYOUT_NOTES.md` — safe lessons from the provided reference layout.
- `design/06_PLAYABILITY_BALANCE_AND_METRICS.md` — playability and balance guidance without premature rebalancing.
- `technical/TECHNICAL_IMPLEMENTATION_SPEC.md` — implementation boundaries and likely file changes.
- `technical/UI_EVENT_PRESENTATION_SPEC.md` — how engine events should drive UI presentation.
- `checklists/IMPLEMENTATION_CHECKLIST.md` — v2 build checklist.
- `checklists/REVIEW_CHECKLIST.md` — v2 review checklist.
- `agent_notes/QUICK_SUMMARY_FOR_AGENT.md` — concise agent briefing.
- `agent_notes/AGENT_DODONT.md` — practical do/don't guidance.

## V2 Non-Goals

- No online multiplayer.
- No engine rewrite.
- No card balance changes.
- No rules changes.
- No copyrighted source assets.
- No new production art pipeline dependency.
- No permanent discard pile unless the rules are explicitly changed in a later phase.

## Required Validation

After v2 implementation:

1. `npm test` must still pass.
2. `npm run build` must still pass.
3. A full game must be playable in Versus AI mode.
4. A full game must be playable in local hot-seat mode.
5. Reduced motion must disable or simplify animations.
6. Debug mode must still expose card ids, source names, and event data.
