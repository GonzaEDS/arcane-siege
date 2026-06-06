// Card catalog: loads the canonical JSON, indexes definitions, and provides
// affordability + human-readable effect text generated purely from data.

import cardsJson from '../data/cards.json';
import type { CardDefinition, CardInstance, DeckList, PlayerState } from './types';

export const CARD_DEFINITIONS = cardsJson as unknown as CardDefinition[];

const BY_ID = new Map<string, CardDefinition>();
for (const def of CARD_DEFINITIONS) {
  BY_ID.set(def.id, def);
}

export const KNOWN_CARD_IDS: ReadonlySet<string> = new Set(BY_ID.keys());

export function getCard(definitionId: string): CardDefinition {
  const def = BY_ID.get(definitionId);
  if (!def) {
    throw new Error(`Unknown card definition: ${definitionId}`);
  }
  return def;
}

export function tryGetCard(definitionId: string): CardDefinition | undefined {
  return BY_ID.get(definitionId);
}

/**
 * Expand a deck list into concrete card instances with deterministic ids.
 * Ids are stable so tests and serialization remain reproducible.
 */
export function buildDeck(deck: DeckList): CardInstance[] {
  const instances: CardInstance[] = [];
  for (const [definitionId, count] of Object.entries(deck)) {
    for (let i = 0; i < count; i++) {
      instances.push({ instanceId: `${definitionId}#${i}`, definitionId });
    }
  }
  return instances;
}

/** Affordability ignores Ward cost per the source baseline (see ENGINE_SPEC.md). */
export function canAfford(player: PlayerState, def: CardDefinition): boolean {
  const cost = def.cost_retheme;
  return (
    player.law_mana >= cost.law_mana &&
    player.neutral_mana >= cost.neutral_mana &&
    player.chaos_mana >= cost.chaos_mana
  );
}

/** Reason a card cannot currently be cast, or null if it is affordable. */
export function affordabilityReason(player: PlayerState, def: CardDefinition): string | null {
  const cost = def.cost_retheme;
  const missing: string[] = [];
  if (player.law_mana < cost.law_mana) missing.push(`Law ${player.law_mana}/${cost.law_mana}`);
  if (player.neutral_mana < cost.neutral_mana) missing.push(`Neutral ${player.neutral_mana}/${cost.neutral_mana}`);
  if (player.chaos_mana < cost.chaos_mana) missing.push(`Chaos ${player.chaos_mana}/${cost.chaos_mana}`);
  return missing.length ? `Need ${missing.join(', ')}` : null;
}

/** A short, accessible category used for the card-type icon/label. */
export type CardCategory =
  | 'Attack'
  | 'Ward'
  | 'Citadel'
  | 'Place of Power'
  | 'Boon'
  | 'Hex'
  | 'Production'
  | 'Special';

export function categoryOf(def: CardDefinition): CardCategory {
  switch (def.action) {
    case 'attack':
      return 'Attack';
    case 'buildWall':
      return 'Ward';
    case 'buildCastle':
      return 'Citadel';
    case 'addWorker':
      return 'Place of Power';
    case 'addResource':
      return 'Boon';
    case 'addBuff':
      return 'Boon';
    case 'allProduce':
      return 'Production';
    case 'removeResource':
    case 'stealWorker':
    case 'removeBuff':
      return 'Hex';
    case 'curse':
    case 'thief':
    case 'wain':
    case 'sabotage':
      return 'Special';
    default:
      return 'Special';
  }
}

const MANA_LABEL: Record<'law' | 'neutral' | 'chaos', string> = {
  law: 'Law',
  neutral: 'Neutral',
  chaos: 'Chaos',
};

/**
 * Generate readable effect text from the structured effect list. Effects are
 * the single source of truth; nothing here is hardcoded per card.
 */
export function effectText(def: CardDefinition): string {
  const parts: string[] = [];
  for (const eff of def.effects) {
    parts.push(describeEffect(eff, def));
  }
  return parts.join(' ');
}

function describeEffect(eff: CardDefinition['effects'][number], def: CardDefinition): string {
  switch (eff.op) {
    case 'add_resource': {
      const gains = manaList(eff.amount);
      return `Gain ${gains}.`;
    }
    case 'remove_resource': {
      const drains = manaList(eff.amount);
      return `Drain ${drains} from the enemy (blocked by a resource seal).`;
    }
    case 'set_next_production': {
      switch (eff.mode) {
        case 'bricks':
          return 'Your circles all produce Law mana next turn.';
        case 'crystals':
          return 'Your circles all produce Neutral mana next turn.';
        case 'swords':
          return 'Your circles all produce Chaos mana next turn.';
        case 'all':
          return 'Double all of your production next turn.';
        case 'none':
          return "Deny the enemy's production next turn.";
      }
      return '';
    }
    case 'damage': {
      const mode = eff.bypass_wall ? 'bypassing the Aegis' : 'to the Aegis, overflowing to the Essence';
      return `Deal ${eff.amount} damage ${mode}.`;
    }
    case 'raise_castle':
      return `Raise your Essence by ${eff.amount}.`;
    case 'raise_wall':
      return `Raise your Aegis by ${eff.amount}.`;
    case 'add_worker': {
      const circles = circleList(eff.amount);
      return `Bind ${circles}.`;
    }
    case 'steal_worker': {
      const circles = circleList(eff.amount);
      return `Steal ${circles} from the enemy (they keep at least 1 of each).`;
    }
    case 'curse':
      return "Overlord's Curse: steal 1 of each circle and resource, gain +1 Essence and +1 Aegis, and deal 1 direct and 1 normal damage.";
    case 'add_buff': {
      const label: Record<string, string> = {
        attack: 'double your next attack',
        build: 'double your next build',
        defence: 'negate the next attack against you',
        resources: 'block the next resource drain against you',
      };
      return `Empower: ${label[eff.buff]}.`;
    }
    case 'remove_buffs':
      return eff.mode === 'all' ? "Dispel all of the enemy's empowerments." : `Dispel the enemy's ${eff.mode} empowerment.`;
    case 'thief':
      return `Raid up to ${eff.amount_per_resource_max} of each enemy resource into your own pools.`;
    case 'wain':
      return `Deal ${eff.amount} direct Essence damage, then raise your Essence by ${eff.amount}.`;
    case 'sabotage':
      return `Force the enemy to return a chosen card to their deck and redraw ${eff.replacement_draw}.`;
  }
  void def;
  return '';
}

function manaList(amount: { law: number; neutral: number; chaos: number }): string {
  const parts: string[] = [];
  (['law', 'neutral', 'chaos'] as const).forEach((k) => {
    if (amount[k] > 0) parts.push(`${amount[k]} ${MANA_LABEL[k]}`);
  });
  return parts.length ? parts.join(', ') : 'nothing';
}

function circleList(amount: { law_circle: number; neutral_circle: number; chaos_circle: number }): string {
  const map: Array<[keyof typeof amount, string]> = [
    ['law_circle', 'Law'],
    ['neutral_circle', 'Neutral'],
    ['chaos_circle', 'Chaos'],
  ];
  const parts: string[] = [];
  for (const [key, label] of map) {
    if (amount[key] > 0) parts.push(`${amount[key]} ${label} circle${amount[key] > 1 ? 's' : ''}`);
  }
  return parts.length ? parts.join(', ') : 'no circles';
}
