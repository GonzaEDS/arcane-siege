# Effect Grammar

The JSON effect list is descriptive. Implement these operations.

## `add_resource`

Add specified resources to self. Values cannot go below 0.

## `remove_resource`

Remove specified resources from opponent. If opponent has `resources` buff, removal amount becomes zero and the buff is consumed.

## `set_next_production`

Modes:

- `bricks`/`law`: next production total becomes Law only.
- `crystals`/`neutral`: next production total becomes Neutral only.
- `swords`/`chaos`: next production total becomes Chaos only.
- `all`: next production doubles all three production amounts.
- `none`: target receives no production on next turn.

## `damage`

If attacker has attack buff, double amount and consume buff. If defender has defence buff, set damage to 0 and consume defence buff.

If `bypass_wall = false`, subtract Ward first and overflow to Citadel. If true, subtract Citadel directly.

## `raise_castle`

If caster has build buff, double amount and consume buff. Add to Citadel. Check win.

## `raise_wall`

If caster has build buff, double amount and consume buff. Add to Ward.

## `add_worker`

Add Law/Neutral/Chaos Circles to self.

## `steal_worker`

Add circles to self and subtract from opponent, but opponent cannot go below 1 in any circle type.

## `curse`

Composite effect:

- Steal 1 of each circle type, respecting opponent minimum 1.
- Remove 1 of each resource from opponent; add 1 of each to self.
- Add 1 Citadel to self; deal 1 direct Citadel damage to opponent.
- Add 1 Ward to self; deal 1 normal damage to opponent.

## `add_buff`

Set one of: `attack`, `build`, `defence`, `resources`.

## `remove_buffs`

Remove all or specified opponent buffs.

## `thief`

Gain up to 6 of each resource based on opponent current amounts, then remove up to 6 of each resource from opponent. Decide whether to preserve the source quirk with Protect Resources; default for clone mode is to preserve and document it.

## `wain`

Deal 6 bypass damage to opponent Citadel, then raise own Citadel by 6.

## `sabotage`

Current player selects one opponent hand card to return to opponent deck. Opponent draws one replacement. Turn advances after selection.
