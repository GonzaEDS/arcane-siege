# Animation And Feedback

## Animation Goal

Animations should make the game easier to follow:

- Where did the card come from?
- What card was cast?
- What did it affect?
- Where did the card go afterward?
- Did the Ward absorb damage?
- Did the Citadel change?
- Did resources or buffs change?

Animations should not become a slow spectacle after every click.

## Core Rule

The engine remains instant and deterministic.

Animation belongs in the UI:

- React-side state.
- CSS transitions/animations.
- Event-derived presentation queue.

Do not make game rules wait for animation completion.

## Required Animation Types

### 1. Cast Card

Flow:

1. Player clicks a castable card.
2. UI dispatches `CAST_CARD`.
3. Reducer returns events.
4. UI identifies the `cast` event and card id.
5. A visual copy of the card moves or fades from the hand slot to the last-cast zone.
6. Last-cast zone highlights.
7. Effect feedback plays.
8. Card visually returns to owner's Portmanteau return pulse.

Fallback:

- If exact source/target positions are hard to compute, use fade/scale transitions.

### 2. Draw / Refill

Flow:

1. Draw event occurs at turn transition/refill.
2. Portmanteau draw stack pulses.
3. Card backs or simple streaks move toward hand slots.
4. Hand updates to new cards.

Important:

- Do not reveal hidden opponent draw cards in secret modes.
- Face-down cards can animate as backs.

### 3. Discard / Return

Flow:

1. Player clicks a card in discard mode.
2. UI dispatches `DISCARD_CARD`.
3. Card moves from hand to return pulse.
4. Return pile/Portmanteau pulses.

Language:

- Prefer "Return" over "Discard" in fantasy-facing UI, while keeping debug/event names if already present.

### 4. Damage

Flow:

- Normal damage:
  - Ward visual pulses first.
  - If overflow happens, Citadel visual reacts second.
- Bypass damage:
  - Citadel visual reacts directly.
- Defence buff:
  - Barrier flash or cancel effect.

Feedback options:

- Short shake.
- Crack overlay.
- Bright pulse.
- Segment loss.
- Floating number.

Keep numeric values visible.

### 5. Build / Raise

Flow:

- Raise Ward: barrier grows, ring brightens, wall segment appears.
- Raise Citadel: tower rises, block appears, stronghold brightens.
- Build buff: larger/brighter build pulse.

### 6. Production

Flow:

- At turn start production, resource counters pulse.
- If production is redirected, the target resource has a stronger pulse.
- If production is denied, circles dim or show a blocked cue.

### 7. Buffs

Flow:

- Buff added: badge appears/pulses.
- Buff consumed: badge flashes then disappears.
- Resource seal block: seal badge flashes.

### 8. Sabotage

Flow:

1. Sabotage cast appears in last-cast zone.
2. Opponent hand becomes targetable.
3. Chosen card highlights.
4. Chosen card moves to return pulse.
5. Replacement draw animates from victim's Portmanteau.

Secret hand note:

- In modes where opponent hand is hidden, reveal only what rules allow during sabotage selection.

## Timing Guidelines

Default timings:

- Card move: 250-450ms.
- Damage/build pulse: 200-350ms.
- Last-cast linger: 800-1500ms.
- Draw streak/card-back move: 200-400ms.
- Buff pulse: 200-300ms.

Avoid chaining more than about 2 seconds of unavoidable animation for a normal action.

## Reduced Motion

When reduced motion is enabled:

- Disable card travel.
- Use instant updates or short opacity changes.
- Keep last-cast focus.
- Keep numeric/visual feedback readable.
- Do not use shake.

Implementation can continue using `document.documentElement.dataset.reducedMotion` or a cleaner React prop/context if refactored.

## Implementation Approaches

Preferred simple approach:

- Maintain a small presentation queue keyed by engine event `seq`.
- Add transient CSS classes to affected zones.
- Keep last cast in React state.
- Use `setTimeout` cleanup for short-lived effects.
- Respect reduced motion.

Avoid unless necessary:

- Heavy animation libraries.
- Canvas/WebGL.
- Physics systems.
- Rewriting the entire UI around an animation framework.

## Event Mapping Examples

- `cast` -> last-cast focus and cast movement.
- `draw` -> draw animation from Portmanteau to hand.
- `discard` -> hand to return pulse.
- `damage` -> Ward/Citadel reaction based on event payload.
- `raise_wall` -> Ward build.
- `raise_castle` -> Citadel build.
- `production` -> resource pulse.
- `production_skipped` -> no-production cue.
- `buff_consume` -> buff badge flash.
- `add_buff` -> buff badge appear.
- `sabotage_request` -> target mode cue.
- `game_end` -> victory treatment.

If an existing event lacks enough structured data for good feedback, add metadata in the reducer/effects while preserving existing tests and debug display.
