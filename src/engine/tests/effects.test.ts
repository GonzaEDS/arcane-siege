import { describe, it, expect } from 'vitest';
import { applyCard, makeState } from './helpers';

// Card id reference (source -> retheme):
// 149002 Redcap Dart (Archer)          dmg 2 normal
// 149102 Troll Ram (Battering Ram)     dmg 9 normal
// 149001 Giant Bat Ambush (Ambush)     dmg 15 bypass
// 148907 Lightning                     dmg 22 normal
// 149203 Colchis Dragon (Dragon)       dmg 38 normal
// 149107 Wizard's Hut (House)          raise_castle 5
// 149112 Merlin's Tower (Tower)        raise_castle 10
// 149201 Overlord's Curse (Curse)
// 149014 Seven-League Raid (Thief)
// 149012 Tangle Vine Blockade (Roadblock) set opponent production none
// 149207 Places of Power Surge (Reward Workers) set self production all
// 148911 Bloodlust (Magic Weapons)     add_buff attack
// 148909 Iron Skin Masonry (Magic Bricks) add_buff build
// 148910 Magic Sphere (Magic Defence)  add_buff defence
// 149010 Portmanteau Seal (Protect Resources) add_buff resources
// 148914 Drain Law Mana (Remove Bricks) remove_resource law 8
// 149202 Unsummon Hexes (Dispel)       remove_buffs all
// 149113 Grail Transfer (Wain)         wain 6
// 149104 Bind Law Circle (Builder)     add_worker law 1
// 149103 Subvert Law Circle (Bribe Builder) steal_worker law 1
// 148900 Gather Law Mana (Add Bricks)  add_resource law 8

describe('damage resolution (test_scenarios.json)', () => {
  it('normal damage hits ward first', () => {
    const s = makeState({}, { ward: 10, citadel: 30 });
    applyCard(s, 'A', '149002'); // Redcap Dart, 2 normal
    expect(s.players.B.ward).toBe(8);
    expect(s.players.B.citadel).toBe(30);
  });

  it('overflow damage spills into citadel', () => {
    const s = makeState({}, { ward: 3, citadel: 30 });
    applyCard(s, 'A', '149102'); // Troll Ram, 9 normal
    expect(s.players.B.ward).toBe(0);
    expect(s.players.B.citadel).toBe(24);
  });

  it('bypass damage ignores ward', () => {
    const s = makeState({}, { ward: 20, citadel: 30 });
    applyCard(s, 'A', '149001'); // Giant Bat Ambush, 15 bypass
    expect(s.players.B.ward).toBe(20);
    expect(s.players.B.citadel).toBe(15);
  });

  it('attack buff doubles next attack only and is consumed', () => {
    const s = makeState({ buffs: { attack: true, build: false, defence: false, resources: false } }, { ward: 0, citadel: 40 });
    applyCard(s, 'A', '148907'); // Lightning 22 -> doubled 44
    expect(s.players.B.citadel).toBeLessThanOrEqual(0);
    expect(s.players.A.buffs.attack).toBe(false);
    expect(s.status).toBe('ended');
    expect(s.winner).toBe('A');
  });

  it('defence negates incoming attack and is consumed', () => {
    const s = makeState({}, { ward: 0, citadel: 30, buffs: { attack: false, build: false, defence: true, resources: false } });
    applyCard(s, 'A', '149203'); // Colchis Dragon 38, negated
    expect(s.players.B.citadel).toBe(30);
    expect(s.players.B.buffs.defence).toBe(false);
  });
});

describe('build & win conditions', () => {
  it('build buff doubles next build only', () => {
    const s = makeState({ citadel: 30, buffs: { attack: false, build: true, defence: false, resources: false } });
    applyCard(s, 'A', '149107'); // Wizard's Hut raise 5 -> 10
    expect(s.players.A.citadel).toBe(40);
    expect(s.players.A.buffs.build).toBe(false);
  });

  it('win by reaching 100 citadel', () => {
    const s = makeState({ citadel: 90 });
    applyCard(s, 'A', '149112'); // Merlin's Tower +10 -> 100
    expect(s.players.A.citadel).toBe(100);
    expect(s.status).toBe('ended');
    expect(s.winner).toBe('A');
  });

  it('lose when citadel reaches zero (sequential strikes)', () => {
    const s = makeState({}, { citadel: 10, ward: 0 });
    applyCard(s, 'A', '149102'); // Troll Ram 9 -> citadel 1
    expect(s.status).toBe('active');
    applyCard(s, 'A', '149002'); // Redcap Dart 2 -> citadel -1
    expect(s.players.B.citadel).toBeLessThanOrEqual(0);
    expect(s.status).toBe('ended');
    expect(s.winner).toBe('A');
  });
});

describe('special cards', () => {
  it('curse applies the full composite effect', () => {
    const s = makeState(
      { law_circles: 2, neutral_circles: 2, chaos_circles: 2, law_mana: 5, neutral_mana: 5, chaos_mana: 5, citadel: 30, ward: 10 },
      { law_circles: 2, neutral_circles: 2, chaos_circles: 2, law_mana: 5, neutral_mana: 5, chaos_mana: 5, citadel: 30, ward: 10 },
    );
    applyCard(s, 'A', '149201');
    // Circles: A +1 each, B -1 each (min 1).
    expect([s.players.A.law_circles, s.players.A.neutral_circles, s.players.A.chaos_circles]).toEqual([3, 3, 3]);
    expect([s.players.B.law_circles, s.players.B.neutral_circles, s.players.B.chaos_circles]).toEqual([1, 1, 1]);
    // Resources: A +1 each, B -1 each.
    expect([s.players.A.law_mana, s.players.A.neutral_mana, s.players.A.chaos_mana]).toEqual([6, 6, 6]);
    expect([s.players.B.law_mana, s.players.B.neutral_mana, s.players.B.chaos_mana]).toEqual([4, 4, 4]);
    // Citadel: A +1 -> 31; B -1 direct -> 29. Ward: A +1 -> 11; B 1 normal absorbed -> ward 9.
    expect(s.players.A.citadel).toBe(31);
    expect(s.players.A.ward).toBe(11);
    expect(s.players.B.citadel).toBe(29);
    expect(s.players.B.ward).toBe(9);
  });

  it('thief gains then removes up to 6 of each resource', () => {
    const s = makeState({ law_mana: 5, neutral_mana: 5, chaos_mana: 5 }, { law_mana: 5, neutral_mana: 5, chaos_mana: 5 });
    applyCard(s, 'A', '149014');
    expect([s.players.A.law_mana, s.players.A.neutral_mana, s.players.A.chaos_mana]).toEqual([10, 10, 10]);
    expect([s.players.B.law_mana, s.players.B.neutral_mana, s.players.B.chaos_mana]).toEqual([0, 0, 0]);
  });

  it('thief preserves the source quirk against a resource seal', () => {
    const s = makeState(
      { law_mana: 5, neutral_mana: 5, chaos_mana: 5 },
      { law_mana: 5, neutral_mana: 5, chaos_mana: 5, buffs: { attack: false, build: false, defence: false, resources: true } },
    );
    applyCard(s, 'A', '149014');
    // Thief still profits, opponent keeps resources, seal consumed.
    expect([s.players.A.law_mana, s.players.A.neutral_mana, s.players.A.chaos_mana]).toEqual([10, 10, 10]);
    expect([s.players.B.law_mana, s.players.B.neutral_mana, s.players.B.chaos_mana]).toEqual([5, 5, 5]);
    expect(s.players.B.buffs.resources).toBe(false);
  });

  it('resource drain is blocked by a resource seal', () => {
    const s = makeState({}, { law_mana: 5, buffs: { attack: false, build: false, defence: false, resources: true } });
    applyCard(s, 'A', '148914'); // Drain Law Mana 8
    expect(s.players.B.law_mana).toBe(5);
    expect(s.players.B.buffs.resources).toBe(false);
  });

  it('resource drain removes mana to a floor of zero', () => {
    const s = makeState({}, { law_mana: 5 });
    applyCard(s, 'A', '148914'); // Drain Law Mana 8 > 5
    expect(s.players.B.law_mana).toBe(0);
  });

  it('roadblock sets the opponent next production to none', () => {
    const s = makeState();
    applyCard(s, 'A', '149012');
    expect(s.players.B.nextProduction).toBe('none');
  });

  it('reward workers sets self next production to all', () => {
    const s = makeState();
    applyCard(s, 'A', '149207');
    expect(s.players.A.nextProduction).toBe('all');
  });

  it('wain deals direct damage then raises own citadel', () => {
    const s = makeState({ citadel: 30 }, { citadel: 30 });
    applyCard(s, 'A', '149113');
    expect(s.players.B.citadel).toBe(24);
    expect(s.players.A.citadel).toBe(36);
  });

  it('wain that kills does not raise own citadel afterwards', () => {
    const s = makeState({ citadel: 30 }, { citadel: 6 });
    applyCard(s, 'A', '149113');
    expect(s.players.B.citadel).toBeLessThanOrEqual(0);
    expect(s.players.A.citadel).toBe(30);
    expect(s.winner).toBe('A');
  });
});

describe('buffs, workers and resources', () => {
  it('each empowerment card sets the correct buff', () => {
    const attack = makeState();
    applyCard(attack, 'A', '148911');
    expect(attack.players.A.buffs.attack).toBe(true);

    const build = makeState();
    applyCard(build, 'A', '148909');
    expect(build.players.A.buffs.build).toBe(true);

    const defence = makeState();
    applyCard(defence, 'A', '148910');
    expect(defence.players.A.buffs.defence).toBe(true);

    const resources = makeState();
    applyCard(resources, 'A', '149010');
    expect(resources.players.A.buffs.resources).toBe(true);
  });

  it('dispel removes all opponent buffs', () => {
    const s = makeState({}, { buffs: { attack: true, build: true, defence: true, resources: true } });
    applyCard(s, 'A', '149202');
    expect(s.players.B.buffs).toEqual({ attack: false, build: false, defence: false, resources: false });
  });

  it('add_worker binds a circle to self', () => {
    const s = makeState({ law_circles: 2 });
    applyCard(s, 'A', '149104');
    expect(s.players.A.law_circles).toBe(3);
  });

  it('steal_worker respects the opponent minimum of 1', () => {
    const s = makeState({ law_circles: 2 }, { law_circles: 1 });
    applyCard(s, 'A', '149103');
    expect(s.players.B.law_circles).toBe(1);
    expect(s.players.A.law_circles).toBe(2);
  });

  it('steal_worker takes one when the opponent has a surplus', () => {
    const s = makeState({ law_circles: 2 }, { law_circles: 3 });
    applyCard(s, 'A', '149103');
    expect(s.players.B.law_circles).toBe(2);
    expect(s.players.A.law_circles).toBe(3);
  });

  it('add_resource grants mana to self', () => {
    const s = makeState({ law_mana: 5 });
    applyCard(s, 'A', '148900');
    expect(s.players.A.law_mana).toBe(13);
  });
});
