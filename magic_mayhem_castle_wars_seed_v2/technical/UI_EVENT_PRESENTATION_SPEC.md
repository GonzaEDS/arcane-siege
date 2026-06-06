# UI Event Presentation Spec

## Purpose

The v1 engine emits `GameEvent`s. V2 should use those events to drive player-facing presentation:

- Last-cast card.
- Movement cues.
- Citadel/Ward feedback.
- Resource pulses.
- Buff changes.
- Sabotage targeting.

This document maps events to UI behavior.

## Event Consumption Model

Recommended model:

1. UI dispatches a command.
2. Engine returns `{ state, events }`.
3. `useGame` appends events to the visible log.
4. V2 presentation layer observes new events by `seq`.
5. Presentation layer updates transient UI state.
6. Timers clean up transient pulses.

Do not derive animation from comparing entire previous/next game states unless event data is insufficient.

## Presentation State Shape

Example shape:

```ts
interface PresentationState {
  lastCast: LastCastPresentation | null;
  returnPulseByPlayer: Partial<Record<PlayerId, Pulse>>;
  drawPulseByPlayer: Partial<Record<PlayerId, Pulse>>;
  damagePulseByPlayer: Partial<Record<PlayerId, Pulse>>;
  buildPulseByPlayer: Partial<Record<PlayerId, Pulse>>;
  resourcePulseByPlayer: Partial<Record<PlayerId, Pulse>>;
  buffPulseByPlayer: Partial<Record<PlayerId, Pulse>>;
  presentedEventSeqs: Set<number>;
}
```

Keep this lightweight. It does not need to be serialized.

## Event Mapping

### `game_start`

Presentation:

- Reset last-cast.
- Reset all pulses.
- Optional board entrance.

### `turn_start`

Presentation:

- Highlight current player zone.
- Optional table turn marker.
- In hot-seat, respect pass gate before showing hand.

### `production_skipped`

Presentation:

- Show subtle "no production" cue.
- Do not pulse resources as if they increased.

### `production`

Presentation:

- Pulse resource counters for produced amounts.
- If event data includes mode, show mode cue:
  - `normal`: normal pulse.
  - `law` / `neutral` / `chaos`: stronger pulse on target resource.
  - `all`: all resource counters pulse strongly.
  - `none`: blocked/no-production cue.

### `draw`

Presentation:

- Pulse actor's Portmanteau draw stack.
- Animate card backs toward hand slots.
- Do not reveal hidden drawn cards in opponent/secret mode.

Current data:

```ts
{ drawn: number }
```

### `cast`

Presentation:

- Set `lastCast`.
- Show card in last-cast zone.
- Animate from hand if source position is available.
- Include caster name and card name.

Current data:

```ts
{
  definitionId: string;
  sourceName?: string;
}
```

Possible additive data if needed:

```ts
{
  definitionId: string;
  cardInstanceId?: string;
  sourceName?: string;
}
```

Adding `cardInstanceId` can help animate from a specific hand slot, but the UI can also infer from the clicked card before dispatch.

### `pay_ward`

Presentation:

- Pulse caster Ward as cost paid.
- Use different styling from damage to avoid implying opponent attack.

### `damage`

Presentation:

- If bypass: pulse/shake target Citadel.
- If normal and `wardAbsorbed > 0`: pulse target Ward.
- If `citadelOverflow > 0`: pulse/shake target Citadel.
- Optional floating damage number.

Current data:

```ts
{
  amount: number;
  wardAbsorbed?: number;
  citadelOverflow?: number;
  bypass: boolean;
}
```

Target:

- The event `player` is attacker/caster.
- Defender is `opponentOf(player)`.

### `raise_wall`

Presentation:

- Pulse caster Ward.
- Add temporary build glow.

Current data:

```ts
{ amount: number }
```

### `raise_castle`

Presentation:

- Pulse caster Citadel.
- Add tower/segment growth cue.

Current data:

```ts
{ amount: number }
```

### `add_resource`

Presentation:

- Pulse caster resource counters for nonzero gained resources.

Current data:

```ts
{ amount: { law: number; neutral: number; chaos: number } }
```

### `remove_resource`

Presentation:

- Pulse opponent resource counters negatively.
- Optional drain line from opponent to caster.

Current data:

```ts
{ amount: { law: number; neutral: number; chaos: number } }
```

### `resource_protected`

Presentation:

- Flash defender resource seal/buff badge.
- Show block cue.

### `add_worker`

Presentation:

- Pulse caster circle counters.
- Optional Place of Power glow.

### `steal_worker`

Presentation:

- Pulse opponent circle counters negatively.
- Pulse caster circle counters positively.

Current data:

```ts
{ stolen: { law: number; neutral: number; chaos: number } }
```

### `curse`

Presentation:

- Use last-cast zone plus multiple compact pulses:
  - Circle/resource drain.
  - Caster Citadel/Ward gain.
  - Opponent Citadel/Ward damage.
- Avoid a long cinematic chain.

### `add_buff`

Presentation:

- Pulse new buff badge.

Current data:

```ts
{ buff: BuffKind }
```

### `buff_consume`

Presentation:

- Flash consumed buff badge.
- Remove after engine state updates.

Current data:

```ts
{ buff: BuffKind }
```

### `remove_buffs`

Presentation:

- Flash opponent buff area.
- If all removed, dispel all active buff badges.

### `thief`

Presentation:

- Pulse caster resources positively.
- Pulse opponent resources negatively when removal occurs.
- If resource seal blocks removal, show resource_protected cue.

### `wain`

Presentation:

- Direct Citadel damage pulse on opponent.
- Citadel build pulse on caster.

### `sabotage_request`

Presentation:

- Show sabotage mode in last-cast/center.
- Highlight opponent hand as targetable for the caster.
- If AI is choosing, briefly highlight selected card if possible.

### `sabotage`

If reducer emits a separate sabotage resolution event, use it.

If not, presentation can use `SABOTAGE_SELECT` command context or returned events around return/draw.

Recommended additive event if missing:

```ts
{
  type: "sabotage_resolve",
  player: caster,
  data: {
    victim: PlayerId,
    targetCardInstanceId: string,
    replacementDraw: number
  }
}
```

Only add this if it simplifies UI without disrupting tests.

### `game_end`

Presentation:

- Victory banner.
- Winner Citadel ascendant glow or opponent Citadel collapse cue.
- Stop normal turn highlighting.

## Additive Event Improvements

If improving event data, prefer small additions:

- Include `cardInstanceId` on `cast`.
- Include target player id on events where target is otherwise inferred.
- Include before/after values for Citadel/Ward/resource if useful.

Example:

```ts
{
  type: "damage",
  player: "A",
  data: {
    target: "B",
    amount: 12,
    wardBefore: 10,
    wardAfter: 0,
    citadelBefore: 30,
    citadelAfter: 28,
    wardAbsorbed: 10,
    citadelOverflow: 2,
    bypass: false
  }
}
```

Do not change event names purely for aesthetics.

## Reduced Motion Mapping

When reduced motion is true:

- Still update last-cast.
- Still show pulses as simple highlight/fade.
- No travel paths.
- No shake.
- No long transitions.

## Debug Mode

Debug mode should continue showing:

- Source card name.
- Card id.
- Event payloads.
- RNG state if currently shown.

V2 presentation state can optionally show additional debug metadata, but this is not required.
