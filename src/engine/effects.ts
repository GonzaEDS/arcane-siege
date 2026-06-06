// Effect operations. These mutate a *working copy* of GameState that the
// reducer has already deep-cloned, so the public reducer stays pure.
//
// Behaviour is transcribed from technical/EFFECT_GRAMMAR.md and the source
// quirks documented in data/rules.json. Bugs are made visible by emitting log
// events for every mutation instead of silently changing state.

import type { BuffKind, Effect, GameState, PlayerId, ProductionMode, ProductionModeSource } from './types';
import { WIN_CITADEL, LOSE_CITADEL } from './rules';

export type Emit = (type: string, message: string, data?: Record<string, unknown>, player?: PlayerId) => void;

export function opponentOf(id: PlayerId): PlayerId {
  return id === 'A' ? 'B' : 'A';
}

function clampMin0(n: number): number {
  return n < 0 ? 0 : n;
}

function productionModeFromSource(mode: ProductionModeSource): ProductionMode {
  switch (mode) {
    case 'bricks':
      return 'law';
    case 'crystals':
      return 'neutral';
    case 'swords':
      return 'chaos';
    case 'all':
      return 'all';
    case 'none':
      return 'none';
  }
}

/**
 * Check both citadels and end the game if a win/loss threshold is crossed.
 * Returns true if the game is over (so callers can short-circuit cleanly).
 */
export function checkWin(state: GameState, emit: Emit): boolean {
  if (state.status === 'ended') return true;
  const order: PlayerId[] = ['A', 'B'];
  for (const id of order) {
    const p = state.players[id];
    if (p.citadel >= WIN_CITADEL) {
      state.status = 'ended';
      state.winner = id;
      emit('game_end', `${p.name} reaches ${p.citadel} Citadel and wins.`, { reason: 'citadel_100' }, id);
      return true;
    }
  }
  for (const id of order) {
    const p = state.players[id];
    if (p.citadel <= LOSE_CITADEL) {
      const winner = opponentOf(id);
      state.status = 'ended';
      state.winner = winner;
      emit('game_end', `${p.name}'s Citadel falls to ${p.citadel}. ${state.players[winner].name} wins.`, { reason: 'citadel_0' }, winner);
      return true;
    }
  }
  return false;
}

/**
 * Apply normal/bypass damage to a defender. Honours the attacker's attack buff
 * and the defender's defence buff, consuming each as appropriate.
 */
function applyDamage(state: GameState, attackerId: PlayerId, amount: number, bypassWall: boolean, emit: Emit): void {
  const attacker = state.players[attackerId];
  const defenderId = opponentOf(attackerId);
  const defender = state.players[defenderId];

  let dmg = amount;
  if (attacker.buffs.attack) {
    dmg *= 2;
    attacker.buffs.attack = false;
    emit('buff_consume', `${attacker.name}'s attack empowerment doubles the strike to ${dmg}.`, { buff: 'attack' }, attackerId);
  }

  if (defender.buffs.defence) {
    defender.buffs.defence = false;
    emit('buff_consume', `${defender.name}'s defence empowerment negates ${dmg} damage.`, { buff: 'defence', negated: dmg }, defenderId);
    return;
  }

  if (bypassWall) {
    defender.citadel -= dmg;
    emit('damage', `${attacker.name} deals ${dmg} bypass damage to ${defender.name}'s Citadel (now ${defender.citadel}).`, { amount: dmg, bypass: true }, attackerId);
  } else {
    const absorbed = Math.min(defender.ward, dmg);
    const overflow = dmg - absorbed;
    defender.ward -= absorbed;
    defender.citadel -= overflow;
    emit(
      'damage',
      `${attacker.name} deals ${dmg} damage to ${defender.name}: Ward -${absorbed} (now ${defender.ward}), Citadel -${overflow} (now ${defender.citadel}).`,
      { amount: dmg, wardAbsorbed: absorbed, citadelOverflow: overflow, bypass: false },
      attackerId,
    );
  }

  checkWin(state, emit);
}

function applyRaiseCastle(state: GameState, casterId: PlayerId, amount: number, usesBuild: boolean, emit: Emit): void {
  const caster = state.players[casterId];
  let amt = amount;
  if (usesBuild && caster.buffs.build) {
    amt *= 2;
    caster.buffs.build = false;
    emit('buff_consume', `${caster.name}'s build empowerment doubles construction to ${amt}.`, { buff: 'build' }, casterId);
  }
  caster.citadel += amt;
  emit('raise_castle', `${caster.name} raises the Citadel by ${amt} (now ${caster.citadel}).`, { amount: amt }, casterId);
  checkWin(state, emit);
}

function applyRaiseWall(state: GameState, casterId: PlayerId, amount: number, usesBuild: boolean, emit: Emit): void {
  const caster = state.players[casterId];
  let amt = amount;
  if (usesBuild && caster.buffs.build) {
    amt *= 2;
    caster.buffs.build = false;
    emit('buff_consume', `${caster.name}'s build empowerment doubles the ward to ${amt}.`, { buff: 'build' }, casterId);
  }
  caster.ward += amt;
  emit('raise_wall', `${caster.name} raises the Ward by ${amt} (now ${caster.ward}).`, { amount: amt }, casterId);
}

/** Apply one effect against the working state. */
export function applyEffect(state: GameState, casterId: PlayerId, eff: Effect, emit: Emit): void {
  if (state.status === 'ended') return;
  const caster = state.players[casterId];
  const opponentId = opponentOf(casterId);
  const opponent = state.players[opponentId];

  switch (eff.op) {
    case 'add_resource': {
      caster.law_mana = clampMin0(caster.law_mana + eff.amount.law);
      caster.neutral_mana = clampMin0(caster.neutral_mana + eff.amount.neutral);
      caster.chaos_mana = clampMin0(caster.chaos_mana + eff.amount.chaos);
      emit('add_resource', `${caster.name} gathers mana (+${eff.amount.law} Law, +${eff.amount.neutral} Neutral, +${eff.amount.chaos} Chaos).`, { amount: eff.amount }, casterId);
      break;
    }

    case 'remove_resource': {
      if (opponent.buffs.resources) {
        opponent.buffs.resources = false;
        emit('resource_protected', `${opponent.name}'s resource seal blocks the drain and is consumed.`, { buff: 'resources' }, opponentId);
        break;
      }
      opponent.law_mana = clampMin0(opponent.law_mana - eff.amount.law);
      opponent.neutral_mana = clampMin0(opponent.neutral_mana - eff.amount.neutral);
      opponent.chaos_mana = clampMin0(opponent.chaos_mana - eff.amount.chaos);
      emit('remove_resource', `${caster.name} drains ${opponent.name} (-${eff.amount.law} Law, -${eff.amount.neutral} Neutral, -${eff.amount.chaos} Chaos).`, { amount: eff.amount }, casterId);
      break;
    }

    case 'set_next_production': {
      const targetId = eff.target === 'self' ? casterId : opponentId;
      const mode = productionModeFromSource(eff.mode);
      state.players[targetId].nextProduction = mode;
      emit('set_next_production', `${state.players[targetId].name}'s next production is set to "${mode}".`, { mode }, targetId);
      break;
    }

    case 'damage': {
      applyDamage(state, casterId, eff.amount, eff.bypass_wall, emit);
      break;
    }

    case 'raise_castle': {
      applyRaiseCastle(state, casterId, eff.amount, eff.uses_build_buff ?? false, emit);
      break;
    }

    case 'raise_wall': {
      applyRaiseWall(state, casterId, eff.amount, eff.uses_build_buff ?? false, emit);
      break;
    }

    case 'add_worker': {
      caster.law_circles += eff.amount.law_circle;
      caster.neutral_circles += eff.amount.neutral_circle;
      caster.chaos_circles += eff.amount.chaos_circle;
      emit('add_worker', `${caster.name} binds circles (+${eff.amount.law_circle} Law, +${eff.amount.neutral_circle} Neutral, +${eff.amount.chaos_circle} Chaos).`, { amount: eff.amount }, casterId);
      break;
    }

    case 'steal_worker': {
      const stolen = stealWorkers(state, casterId, eff.amount, eff.opponent_min_each, emit);
      emit('steal_worker', `${caster.name} subverts circles from ${opponent.name}.`, { stolen }, casterId);
      break;
    }

    case 'curse': {
      applyCurse(state, casterId, emit);
      break;
    }

    case 'add_buff': {
      caster.buffs[eff.buff] = true;
      emit('add_buff', `${caster.name} gains the ${eff.buff} empowerment.`, { buff: eff.buff }, casterId);
      break;
    }

    case 'remove_buffs': {
      if (eff.mode === 'all') {
        (Object.keys(opponent.buffs) as BuffKind[]).forEach((b) => (opponent.buffs[b] = false));
        emit('remove_buffs', `${caster.name} dispels all of ${opponent.name}'s empowerments.`, { mode: 'all' }, casterId);
      } else {
        opponent.buffs[eff.mode] = false;
        emit('remove_buffs', `${caster.name} dispels ${opponent.name}'s ${eff.mode} empowerment.`, { mode: eff.mode }, casterId);
      }
      break;
    }

    case 'thief': {
      applyThief(state, casterId, eff.amount_per_resource_max, emit);
      break;
    }

    case 'wain': {
      // Deal direct (bypass) Citadel damage, then raise own Citadel.
      opponent.citadel -= eff.amount;
      emit('wain', `${caster.name}'s Grail Transfer deals ${eff.amount} direct damage to ${opponent.name}'s Citadel (now ${opponent.citadel}).`, { amount: eff.amount }, casterId);
      if (checkWin(state, emit)) break;
      caster.citadel += eff.amount;
      emit('wain', `${caster.name}'s Citadel rises by ${eff.amount} (now ${caster.citadel}).`, { amount: eff.amount }, casterId);
      checkWin(state, emit);
      break;
    }

    case 'sabotage': {
      // Interruption is handled by the reducer; this op only flags the request.
      state.status = 'awaiting_sabotage_choice';
      state.pendingSabotage = { caster: casterId, replacementDraw: eff.replacement_draw };
      emit('sabotage_request', `${caster.name} must choose a card from ${opponent.name}'s hand.`, { replacementDraw: eff.replacement_draw }, casterId);
      break;
    }
  }
}

function stealWorkers(
  state: GameState,
  casterId: PlayerId,
  amount: { law_circle: number; neutral_circle: number; chaos_circle: number },
  minEach: number,
  _emit: Emit,
): { law: number; neutral: number; chaos: number } {
  const caster = state.players[casterId];
  const opponent = state.players[opponentOf(casterId)];

  const stealOne = (
    requested: number,
    oppKey: 'law_circles' | 'neutral_circles' | 'chaos_circles',
  ): number => {
    const available = Math.max(0, opponent[oppKey] - minEach);
    const actual = Math.min(requested, available);
    opponent[oppKey] -= actual;
    caster[oppKey] += actual;
    return actual;
  };

  return {
    law: stealOne(amount.law_circle, 'law_circles'),
    neutral: stealOne(amount.neutral_circle, 'neutral_circles'),
    chaos: stealOne(amount.chaos_circle, 'chaos_circles'),
  };
}

function applyCurse(state: GameState, casterId: PlayerId, emit: Emit): void {
  const caster = state.players[casterId];
  const opponentId = opponentOf(casterId);
  const opponent = state.players[opponentId];

  // 1. Steal 1 of each circle type, respecting opponent minimum 1.
  const stolen = stealWorkers(state, casterId, { law_circle: 1, neutral_circle: 1, chaos_circle: 1 }, 1, emit);

  // 2. Remove 1 of each resource from opponent; add 1 of each to self.
  (['law_mana', 'neutral_mana', 'chaos_mana'] as const).forEach((key) => {
    opponent[key] = clampMin0(opponent[key] - 1);
    caster[key] += 1;
  });

  emit('curse', `${caster.name} curses ${opponent.name}: steals circles ${JSON.stringify(stolen)} and 1 of each resource.`, { stolen }, casterId);

  // 3. Add 1 Citadel to self; deal 1 direct Citadel damage to opponent.
  caster.citadel += 1;
  opponent.citadel -= 1;
  emit('curse', `${caster.name} +1 Citadel (now ${caster.citadel}); ${opponent.name} -1 direct Citadel (now ${opponent.citadel}).`, {}, casterId);
  if (checkWin(state, emit)) return;

  // 4. Add 1 Ward to self; deal 1 normal damage to opponent (ward first).
  caster.ward += 1;
  const absorbed = Math.min(opponent.ward, 1);
  opponent.ward -= absorbed;
  opponent.citadel -= 1 - absorbed;
  emit('curse', `${caster.name} +1 Ward (now ${caster.ward}); ${opponent.name} takes 1 normal damage (Ward ${opponent.ward}, Citadel ${opponent.citadel}).`, {}, casterId);
  checkWin(state, emit);
}

/**
 * Thief: gain up to N of each resource based on the opponent's CURRENT amounts,
 * then remove up to N of each from the opponent. The source grants the thief
 * resources before attempting removal, so a Resource Seal can leave the
 * opponent's pools intact while the thief still profits. This quirk is
 * preserved deliberately (clone mode) and logged.
 */
function applyThief(state: GameState, casterId: PlayerId, maxPer: number, emit: Emit): void {
  const caster = state.players[casterId];
  const opponentId = opponentOf(casterId);
  const opponent = state.players[opponentId];

  const keys = ['law_mana', 'neutral_mana', 'chaos_mana'] as const;
  const gained: Record<string, number> = {};
  for (const key of keys) {
    const g = Math.min(maxPer, opponent[key]);
    caster[key] += g;
    gained[key] = g;
  }
  emit('thief', `${caster.name} raids resources from ${opponent.name}: ${JSON.stringify(gained)}.`, { gained }, casterId);

  if (opponent.buffs.resources) {
    opponent.buffs.resources = false;
    emit('resource_protected', `${opponent.name}'s resource seal blocks the theft removal but the raid already profited (source quirk).`, { buff: 'resources' }, opponentId);
    return;
  }

  const removed: Record<string, number> = {};
  for (const key of keys) {
    const r = Math.min(maxPer, opponent[key]);
    opponent[key] = clampMin0(opponent[key] - r);
    removed[key] = r;
  }
  emit('thief', `${opponent.name} loses resources: ${JSON.stringify(removed)}.`, { removed }, casterId);
}
