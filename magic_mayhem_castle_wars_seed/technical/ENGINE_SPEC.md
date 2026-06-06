# Engine Spec

## Principles

- The engine is a pure deterministic state machine.
- UI dispatches commands; engine returns next state plus events.
- No React component may directly mutate player stats.
- All card definitions are loaded from JSON.

## Types

```ts
type Resource = 'law_mana' | 'neutral_mana' | 'chaos_mana';
type Worker = 'law_circles' | 'neutral_circles' | 'chaos_circles';
type Buff = 'attack' | 'build' | 'defence' | 'resources';

type CardDefinition = {
  id: string;
  source_name: string;
  retheme_name: string;
  cost_retheme: { law_mana: number; neutral_mana: number; chaos_mana: number; ward_level: number };
  action: string;
  value: unknown;
  bypass_wall: boolean;
  effects: Effect[];
};
```

## Affordability

A card is affordable if the player has enough Law, Neutral, and Chaos mana. Preserve source behavior for Ward cost: affordability does not check Ward cost, but casting subtracts the Ward cost down to minimum 0.

## Draw model

Cards are instances, not definitions. Each instance has a unique `instanceId` and a `definitionId`.

Played and discarded cards return to the player's own deck, then the deck is shuffled in the source. For deterministic implementation, use seeded shuffle after return.
