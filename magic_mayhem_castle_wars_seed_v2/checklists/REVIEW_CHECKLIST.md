# V2 Review Checklist

Use this checklist after implementation.

## Mechanics Safety

- [ ] Existing engine tests pass.
- [ ] Production build passes.
- [ ] No card costs changed.
- [ ] No card effects changed.
- [ ] No win conditions changed.
- [ ] No hand size/discard/turn rules changed.
- [ ] No accidental permanent discard pile added.
- [ ] AI still chooses legal moves.
- [ ] Hot-seat still functions.

## Board Clarity

- [ ] Current player is obvious.
- [ ] Last cast card is obvious.
- [ ] Citadel values are obvious.
- [ ] Ward values are obvious.
- [ ] Resource values are obvious.
- [ ] Hand visibility rules are obvious.
- [ ] Draw/return zones are understandable.
- [ ] Action controls are easy to find.
- [ ] The event log is helpful but not required to follow a normal turn.

## Visual Identity

- [ ] The UI feels more like a physical wizard duel table than v1.
- [ ] The board uses original visual language.
- [ ] Card backs are original.
- [ ] Card art placeholders are original.
- [ ] Citadel/Ward visuals are original.
- [ ] Law/Neutral/Chaos have distinct identities.
- [ ] The UI does not copy Castle Wars, Magic Castles, or Magic & Mayhem assets.
- [ ] The UI does not ship source screenshots, logos, sprites, music, or exact art.

## Animation Quality

- [ ] Cast animation/focus helps explain the action.
- [ ] Draw animation/feedback helps explain hand refill.
- [ ] Return animation/feedback avoids implying a permanent discard pile.
- [ ] Damage feedback distinguishes Ward absorption from Citadel damage.
- [ ] Build feedback distinguishes Ward gain from Citadel gain.
- [ ] Resource/buff feedback is visible but not noisy.
- [ ] Animations do not make the game feel sluggish.
- [ ] Reduced motion works.

## Accessibility

- [ ] Card buttons remain keyboard-accessible.
- [ ] Hidden cards have appropriate labels.
- [ ] Meters or values have accessible labels.
- [ ] Color is not the only resource indicator.
- [ ] Text contrast is readable.
- [ ] Reduced motion disables shake/travel animations.

## Mode Coverage

- [ ] Versus AI: human hand visible, AI hand hidden.
- [ ] Versus AI: AI casts are understandable through last-cast zone.
- [ ] Local secret hot-seat: pass gate prevents accidental hand reveal.
- [ ] Local secret hot-seat: active player's hand appears after pass gate.
- [ ] Local open-table: both hands visible.
- [ ] Sabotage works in all relevant modes.

## Debug And Developer Experience

- [ ] Debug card ids and source names still display only in debug mode.
- [ ] Event payloads still display in debug mode.
- [ ] Errors still surface visibly.
- [ ] Code is split into understandable components.
- [ ] `App.tsx` did not become significantly more monolithic.
- [ ] New presentation logic is isolated and documented enough to maintain.
