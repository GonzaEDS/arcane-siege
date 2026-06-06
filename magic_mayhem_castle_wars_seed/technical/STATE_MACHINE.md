# State Machine

## States

- `setup`
- `active`
- `awaiting_sabotage_choice`
- `ended`

## Active turn flow

1. `turn_start`
2. Apply production unless global turn count is 1 or 2.
3. Player chooses one of:
   - Cast one affordable card.
   - Discard 1 to 3 cards.
   - End turn.
4. Resolve card or discard.
5. Restore hand to 8 at end of turn.
6. Check win condition after every Citadel mutation.
7. Advance turn.

## Sabotage interruption

Sabotage creates an `awaiting_sabotage_choice` state. Current player chooses one card from opponent hand. That card returns to opponent deck, opponent draws one replacement, then turn advances.

## End state

Game ends immediately when any Citadel reaches 100+ or 0-.
