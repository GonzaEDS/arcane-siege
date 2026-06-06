# Test Plan

## Unit tests

- Start state equals rules JSON.
- Hand size is 8 after start.
- First two turns do not produce resources.
- Third turn produces resources.
- Normal damage, overflow damage, bypass damage.
- Every buff consumes at correct time.
- Resource protection behavior.
- Reverse ward cost quirk.
- Curse composite behavior.
- Sabotage interruption and replacement draw.
- Thief behavior with and without Protect Resources.
- Win by reaching 100 Citadel.
- Win by reducing opponent Citadel to 0.
- Deck validation: min 50, max 280, max 5 copies.

## Integration tests

- Simulate a complete game with deterministic decks.
- Simulate random legal play for 100 games; no invalid state, no negative values, no infinite loop.
- Verify both players can win from scripted sequences.

## Manual QA

- Every card has readable effect text.
- Disabled cards clearly show insufficient resource reason.
- End-turn and discard flow are understandable.
- Debug panel logs every state mutation.
