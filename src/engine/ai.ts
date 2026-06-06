// A small, deterministic greedy AI. It never reads hidden information beyond
// what the rules already expose to the acting player, and it always returns a
// legal command for the given state.

import type { Command, GameState, PlayerId } from './types';
import { getCard } from './cards';
import { castableCards, canDiscard } from './legal';
import { opponentOf } from './effects';
import { WIN_CITADEL } from './rules';

/** Estimate citadel damage a card would deal to the opponent right now. */
function estimateCitadelDamage(state: GameState, attacker: PlayerId, definitionId: string): number {
  const def = getCard(definitionId);
  const me = state.players[attacker];
  const foe = state.players[opponentOf(attacker)];
  let total = 0;
  for (const eff of def.effects) {
    if (eff.op === 'damage') {
      let dmg = eff.amount;
      if (me.buffs.attack) dmg *= 2;
      if (foe.buffs.defence) dmg = 0;
      total += eff.bypass_wall ? dmg : Math.max(0, dmg - foe.ward);
    } else if (eff.op === 'wain') {
      total += eff.amount;
    } else if (eff.op === 'curse') {
      total += 2;
    }
  }
  return total;
}

/** Estimate how much a card raises the caster's own citadel. */
function estimateCitadelGain(state: GameState, caster: PlayerId, definitionId: string): number {
  const def = getCard(definitionId);
  const me = state.players[caster];
  let total = 0;
  for (const eff of def.effects) {
    if (eff.op === 'raise_castle') total += me.buffs.build ? eff.amount * 2 : eff.amount;
    else if (eff.op === 'wain') total += eff.amount;
    else if (eff.op === 'curse') total += 1;
  }
  return total;
}

function scoreCard(state: GameState, player: PlayerId, definitionId: string): number {
  const def = getCard(definitionId);
  const foe = state.players[opponentOf(player)];
  const me = state.players[player];

  const dmg = estimateCitadelDamage(state, player, definitionId);
  const gain = estimateCitadelGain(state, player, definitionId);

  // Lethal moves get an overwhelming score.
  if (dmg > 0 && foe.citadel - dmg <= 0) return 100000;
  if (gain > 0 && me.citadel + gain >= WIN_CITADEL) return 100000;

  let score = dmg * 3 + gain * 3;

  for (const eff of def.effects) {
    switch (eff.op) {
      case 'add_buff':
        score += eff.buff === 'attack' || eff.buff === 'build' ? 6 : 4;
        break;
      case 'raise_wall':
        // Value ward more when under pressure.
        score += me.ward < 15 ? eff.amount * 0.8 : eff.amount * 0.2;
        break;
      case 'add_worker':
        score += 5;
        break;
      case 'set_next_production':
        score += eff.mode === 'all' ? 4 : 2;
        break;
      case 'remove_buffs':
        score += 1;
        break;
      case 'steal_worker':
      case 'thief':
      case 'remove_resource':
        score += 1.5;
        break;
      default:
        break;
    }
  }

  // Slightly prefer cheaper plays among equals to keep tempo.
  const cost = def.cost_retheme.law_mana + def.cost_retheme.neutral_mana + def.cost_retheme.chaos_mana;
  score -= cost * 0.05;
  return score;
}

export function chooseMove(state: GameState, player: PlayerId): Command {
  if (state.status === 'awaiting_sabotage_choice' && state.pendingSabotage?.caster === player) {
    const victim = state.players[opponentOf(player)];
    // Remove the victim's most expensive card as a rough proxy for value.
    let best = victim.hand[0];
    let bestCost = -1;
    for (const c of victim.hand) {
      const def = getCard(c.definitionId);
      const cost = def.cost_retheme.law_mana + def.cost_retheme.neutral_mana + def.cost_retheme.chaos_mana;
      if (cost > bestCost) {
        bestCost = cost;
        best = c;
      }
    }
    return { type: 'SABOTAGE_SELECT', player, targetCardInstanceId: best.instanceId };
  }

  const options = castableCards(state, player);
  if (options.length > 0) {
    let bestCard = options[0];
    let bestScore = -Infinity;
    for (const c of options) {
      const s = scoreCard(state, player, c.definitionId);
      if (s > bestScore) {
        bestScore = s;
        bestCard = c;
      }
    }
    // Only cast if it does something useful; otherwise cycle the hand instead.
    if (bestScore > 0) {
      return { type: 'CAST_CARD', player, cardInstanceId: bestCard.instanceId };
    }
  }

  // Nothing worth casting. Cycle dead cards (cheap unaffordable / low-value) so
  // the hand turns over while production accumulates; then end the turn.
  if (canDiscard(state, player)) {
    const hand = state.players[player].hand;
    if (hand.length > 0) {
      let worst = hand[0];
      let worstScore = Infinity;
      for (const c of hand) {
        const s = scoreCard(state, player, c.definitionId);
        if (s < worstScore) {
          worstScore = s;
          worst = c;
        }
      }
      return { type: 'DISCARD_CARD', player, cardInstanceId: worst.instanceId };
    }
  }

  return { type: 'END_TURN', player };
}
