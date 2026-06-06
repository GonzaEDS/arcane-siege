# Technical Implementation Spec V2

## Current Codebase Assumptions

V1 is a React + Vite + TypeScript app.

Important current files:

- `src/ui/App.tsx` — current root UI and orchestration.
- `src/ui/useGame.ts` — thin React store around the pure engine.
- `src/ui/components/Card.tsx` — card rendering.
- `src/ui/components/PlayerPanel.tsx` — player status.
- `src/ui/components/TurnLog.tsx` — event log.
- `src/ui/styles.css` — current theme and layout.
- `src/engine/reducer.ts` — pure deterministic reducer.
- `src/engine/effects.ts` — effect implementation and events.
- `src/engine/types.ts` — game/event/card types.

## Boundary Rule

Do not rewrite the engine for presentation.

The engine should remain:

- Pure.
- Deterministic.
- Serializable.
- Instant.
- Testable.

V2 should add or refactor UI components and presentation state.

## Recommended Component Structure

The exact names can vary, but the UI should move toward this structure:

```text
src/ui/
  App.tsx
  useGame.ts
  usePresentationEvents.ts
  components/
    Board.tsx
    PlayerZone.tsx
    PlayerPanel.tsx
    Hand.tsx
    Card.tsx
    CardBack.tsx
    LastCastZone.tsx
    PortmanteauPiles.tsx
    CitadelWardView.tsx
    ActionBar.tsx
    TurnLog.tsx
```

### `App.tsx`

Responsibilities:

- Setup screen.
- Mode selection.
- Deck/seed selection.
- Debug/reduced motion state.
- Game dispatch.
- AI auto-play orchestration.
- Pass gate orchestration.
- High-level board props.

Should not become the main board markup file.

### `Board.tsx`

Responsibilities:

- Arrange opponent zone, shared duel table, player zone.
- Compute perspective.
- Pass visibility rules to hands.
- Include last-cast zone.
- Include Citadel/Ward visuals.

### `PlayerZone.tsx`

Responsibilities:

- Render player panel/status.
- Render hand.
- Render Portmanteau piles.
- Render action controls for active/current player where appropriate.

### `Hand.tsx`

Responsibilities:

- Render face-up/face-down hand.
- Handle card click by delegating to parent.
- Apply cast/discard/sabotage intent classes.
- Keep stable card-slot structure for animation.

### `LastCastZone.tsx`

Responsibilities:

- Show most recent cast card.
- Show caster name.
- Show short caption.
- Handle reduced-motion state.

### `PortmanteauPiles.tsx`

Responsibilities:

- Show draw stack count.
- Show return/recycle pulse.
- Provide animation origin/target markers.
- Use safe labels: Portmanteau, Return.

### `CitadelWardView.tsx`

Responsibilities:

- Show numeric Citadel and Ward.
- Show visual Citadel and Ward.
- React to damage/build presentation pulses.
- Preserve accessibility labels.

### `usePresentationEvents.ts`

Responsibilities:

- Consume `GameEvent[]` or newly returned events from `dispatch`.
- Track which event sequences have already been presented.
- Produce transient presentation state:
  - `lastCast`
  - `recentDraws`
  - `returnPulse`
  - `damagePulse`
  - `buildPulse`
  - `resourcePulse`
  - `buffPulse`
- Clean up short-lived effects using timers.
- Respect reduced motion.

Implementation may instead live inside `useGame` or `App` initially, but should be kept small and isolated.

## Event Metadata

Current events include:

- `seq`
- `turn`
- `type`
- `player`
- `message`
- `data`

This is enough for many v2 effects. If more data is needed, extend event `data` payloads additively.

Examples of useful metadata:

```ts
{
  definitionId: string;
  sourceName?: string;
}
```

```ts
{
  amount: number;
  wardAbsorbed?: number;
  citadelOverflow?: number;
  bypass?: boolean;
}
```

```ts
{
  drawn: number;
}
```

Do not remove or rename existing event types without updating tests and UI.

## Animation Implementation

Prefer:

- CSS transitions.
- CSS keyframes.
- Temporary class names.
- React state for last-cast and pulse markers.
- Stable DOM markers via `data-zone` attributes if useful.

Avoid:

- Large animation libraries.
- Absolute-position complexity before the static layout is stable.
- Engine-delayed commands.

If precise card travel is complex, implement a simpler v2.0:

- Hand card fades/scales out.
- Last-cast card fades/scales in.
- Return pile pulses.

This is acceptable if it is readable.

## State And Timing

Do not block gameplay while animation runs unless the UI would become confusing.

AI moves may need a small delay so players can see them:

- Current AI delay exists in `App.tsx`.
- Preserve or tune it.
- Avoid rapid multi-action skips that hide the last-cast zone.

Potential approach:

- On AI turns, dispatch one command at a time with a delay.
- Let last-cast and board pulses update between AI commands.

## Accessibility

Requirements:

- Maintain button semantics for cards or equivalent keyboard-accessible behavior.
- Keep numeric values visible.
- Avoid color-only resource communication.
- Preserve `aria-label`s for meters/status.
- Reduced motion must be honored.
- Hidden cards should have clear `aria-label` such as "Hidden card".

## Testing

V2 is mostly UI, but current test setup is engine-only. Minimum validation:

- `npm test`
- `npm run build`
- Manual smoke test:
  - Start Versus AI.
  - Cast a card.
  - Discard a card.
  - End turn.
  - Observe AI cast.
  - Trigger sabotage if possible.
  - Reset game.
  - Start local hot-seat.
  - Confirm pass gate and hidden hands.
  - Confirm local open-table mode if implemented.
  - Toggle reduced motion.
  - Toggle debug.

Optional later:

- Add React component tests if a test environment is introduced.
- Add visual regression screenshots if tooling is introduced.

Do not add heavy test infrastructure unless requested.

## Performance

The game is small. Avoid premature optimization.

Reasonable constraints:

- Keep event logs bounded as v1 already does.
- Keep presentation queue bounded.
- Avoid cloning large UI state on every frame.
- Avoid expensive layout measurement loops.

## Backward Compatibility

Preserve:

- Existing engine exports.
- Existing debug mode behavior.
- Existing game start/reset flows.
- Existing deck presets.
- Existing tests.

Add:

- New components.
- New CSS classes.
- Optional new additive event metadata.
- Optional new setup option for hand visibility.
