// Project-specific art direction for Arcane Siege: Portmanteau Duels.
// Builds the { id, prompt, aspect, resolution } job list the runner consumes.
//
// Aesthetic bible: Magic & Mayhem + late-1990s fantasy-strategy box art — a
// retro dark fantasy look, hand-painted and slightly stop-motion/claymation,
// with strong Law / Neutral / Chaos colour identities. Original execution; no
// copyrighted art, logos, sprites or screenshots are referenced.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARDS_PATH = path.join(ROOT, 'src/data/cards.json');

// Shared style applied to every CARD subject. Kept consistent so the 56 cards
// read as one deck. "no text/border/frame" because our UI draws the frame.
const CARD_STYLE = [
  'retro dark fantasy trading-card illustration',
  'late 1990s PC fantasy game box art, hand-painted gouache and oil',
  'stop-motion clay-creature / shadow-puppet texture, tactile and handmade',
  'moody volumetric chiaroscuro lighting, deep shadows, single light source',
  'weathered, ornate, slightly grotesque and mythic',
  'one central subject, centered composition, dramatic dark vignette background',
  'muted earthy palette of smoky parchment, basalt and aged bronze',
  'painterly detail, no text, no words, no letters, no border, no frame, no UI, no watermark',
].join(', ');

const SCHOOL_LINE = {
  law: 'LAW magic palette: cool blue and silver-white, ordered geometry, towers, runes, marble, holy and disciplined mood',
  neutral: 'NEUTRAL magic palette: ochre, moss-green and bone, standing stones, alchemy, roots and balance, earthy druidic mood',
  chaos: 'CHAOS magic palette: ember red, blackened orange and bone, fire, jagged forms, claws and smoke, violent demonic mood',
  mixed: 'blended arcane palette of cool blue, ochre and ember red in balance',
};

const CATEGORY_FLAVOR = {
  Attack: 'a menacing attacking creature or hurled magical projectile, sense of violent motion',
  Ward: 'a glowing protective barrier — warding ring, sigil shield or arcane wall of force',
  Citadel: 'a towering ritual stronghold of stacked stone rising higher, arcane fortress',
  'Place of Power': 'a sacred place of power — standing stones, shrine or altar humming with bound energy',
  Boon: 'a benevolent ritual blessing — radiant talisman, alchemical vessel or offering',
  Hex: 'a sinister curse — cursed mask, thorn-knot or broken hex sigil, ominous dread',
  Production: 'an arcane production rite — glowing mana circles and aligned runes channeling power',
  Special: 'a strange unique magical rite or artifact of great power',
};

// Concrete subjects for the more abstract utility cards so they read as art.
const SUBJECT_OVERRIDE = {
  '148900': 'a wizard drawing raw law mana into a glowing reservoir of ordered light',
  '148901': 'a wizard gathering neutral mana into an alchemical vessel of green-gold light',
  '148902': 'a wizard hoarding chaos mana as embers and sparks swirl into a brazier',
  '149100': 'three glowing mana circles realigning into ordered law runes',
  '148903': 'three glowing mana circles realigning into balanced neutral runes',
  '149000': 'three glowing mana circles realigning into jagged chaos runes',
  '149103': 'a robed law adept being subverted away from an enemy summoning circle',
  '148904': 'a neutral adept being subverted away from an enemy summoning circle',
  '149004': 'a chaos acolyte being subverted away from an enemy summoning circle',
  '149104': 'a glowing law place of power binding a new circle of summoners',
  '148908': 'a glowing neutral place of power binding a new circle of summoners',
  '149011': 'a glowing chaos place of power binding a new circle of summoners',
  '149110': 'a hermetic academy of three summoning circles bound at once, scholarly arcana',
  '149207': 'three places of power surging with doubled energy simultaneously',
  '149012': 'thorned tangle-vines choking and denying an enemy mana circle',
  '148914': 'siphoning tendrils draining law mana from an enemy hoard',
  '148915': 'siphoning tendrils draining neutral mana from an enemy hoard',
  '148916': 'siphoning tendrils draining chaos mana from an enemy hoard',
  '149206': 'a magical travelling case torn open, all three mana types draining out',
  '149010': 'a sealed magical travelling case glowing with a protective ward',
  '148910': 'a shimmering protective sphere of force enveloping a wizard',
  '148909': 'stone and iron magically reinforcing a wall, masonry empowerment',
  '148911': 'a roaring berserk warrior wreathed in veins of fire, bloodlust empowerment',
  '149202': 'hostile hexes and enchantments unravelling into dissipating smoke, dispel magic',
  '148912': 'a glowing fountain of life restoring a stronghold, healing waters',
  '149113': 'a radiant grail transferring life essence between two distant strongholds',
  '149109': 'arcane wards reversed and folded inward to raise a stronghold, reversal spell',
  '149201': "an overlord's curse engulfing an enemy — draining circles, mana and life at once",
  '149014': 'a swift cloaked raider in seven-league boots stealing an enemy mana hoard',
  '149013': 'a petrifying gorgon stare sabotaging an enemy, turning a card to stone',
  '148913': 'a gorgon shockwave erupting across the ground, petrifying stare',
};

function schoolOf(cost) {
  const l = cost.law_mana, n = cost.neutral_mana, c = cost.chaos_mana;
  if (!l && !n && !c) return 'neutral';
  const max = Math.max(l, n, c);
  const leaders = [l === max && 'law', n === max && 'neutral', c === max && 'chaos'].filter(Boolean);
  return leaders.length > 1 ? 'mixed' : leaders[0];
}

function categoryOf(action) {
  switch (action) {
    case 'attack': return 'Attack';
    case 'buildWall': return 'Ward';
    case 'buildCastle': return 'Citadel';
    case 'addWorker': return 'Place of Power';
    case 'addResource': return 'Boon';
    case 'addBuff': return 'Boon';
    case 'allProduce': return 'Production';
    case 'removeResource':
    case 'stealWorker':
    case 'removeBuff': return 'Hex';
    default: return 'Special';
  }
}

function cardPrompt(card) {
  const school = schoolOf(card.cost_retheme);
  const category = categoryOf(card.action);
  const subject = SUBJECT_OVERRIDE[card.id] ?? card.retheme_name;
  return `${subject}. ${CATEGORY_FLAVOR[category]}. ${SCHOOL_LINE[school]}. ${CARD_STYLE}.`;
}

// Circular medallion emblems used as resource/stat tokens across the UI. Drawn
// as coins so the dark square corners crop cleanly inside a round token.
const EMBLEM_STYLE =
  'circular engraved metal medallion coin, single bold centered sigil filling the coin, raised relief, worn patina, dark recessed rim, even studio lighting, retro dark fantasy game icon, symmetrical, no text, no letters, no watermark, plain dark background';

const EMBLEM_JOBS = [
  { id: 'emblem-law', prompt: `Emblem of LAW magic: an ordered geometric rune — a balanced star inside a ring of straight lines. Cool moonlit blue and tarnished silver. ${EMBLEM_STYLE}.` },
  { id: 'emblem-neutral', prompt: `Emblem of NEUTRAL magic: a standing-stone trilithon / balanced circle of roots and stone. Ochre, bone and moss-green on bronze. ${EMBLEM_STYLE}.` },
  { id: 'emblem-chaos', prompt: `Emblem of CHAOS magic: a jagged broken spiral with a flame-claw. Ember red and blackened iron. ${EMBLEM_STYLE}.` },
  { id: 'emblem-ward', prompt: `Emblem of a protective WARD: a layered shield within a warding ring. Moonlit blue on tarnished silver. ${EMBLEM_STYLE}.` },
  { id: 'emblem-citadel', prompt: `Emblem of a CITADEL: a crenellated tower / fortress keep. Aged bronze and stone. ${EMBLEM_STYLE}.` },
];

const TEXTURE_JOBS = [
  {
    id: 'tex-parchment',
    aspect: '1:1',
    prompt:
      'Seamless aged parchment / vellum texture, warm cream and tan, faint stains, foxing and fibers, soft even flat lighting, subtle, no objects, no text, no border, tileable background surface.',
  },
  {
    id: 'tex-stone',
    aspect: '1:1',
    prompt:
      'Seamless dark slate and aged leather texture with faint bronze veining, very low contrast, moody, even flat lighting, no objects, no text, no border, tileable background surface for UI panels.',
  },
];

// Wizard avatars (concept / candidate board pieces). Two visually distinct
// sides so the duel reads clearly: an azure Law-leaning sage vs an ember
// Chaos-leaning warlock. Shown standing at their Place of Power inside a ward.
const WIZARD_JOBS = [
  {
    id: 'wizard-a',
    aspect: '3:4',
    prompt:
      'Full-body character portrait of a wise elder sorcerer in azure and silver runed robes, holding a glowing crystal staff, calm confident idle stance, clear three-quarter view facing toward the RIGHT side of the frame. Dramatic cool-blue rim lighting on the figure. Plain flat neutral gray studio backdrop, even lighting, no scene, no ground, no props, no cast shadow, no shield bubble — a cleanly isolated subject for cutout. Dark fantasy, late-1990s PC fantasy box art, hand-painted gouache, no text, no UI, no border.',
  },
  {
    id: 'wizard-b',
    aspect: '3:4',
    prompt:
      'Full-body character portrait of a menacing hooded warlock in dark crimson and blackened-iron runed robes, channeling embers from a clawed staff, threatening idle stance, clear three-quarter view facing toward the RIGHT side of the frame. Dramatic ember-red rim lighting on the figure. Plain flat neutral gray studio backdrop, even lighting, no scene, no ground, no props, no cast shadow, no shield bubble — a cleanly isolated subject for cutout. Dark fantasy, late-1990s PC fantasy box art, hand-painted gouache, no text, no UI, no border.',
  },
];

// App icon / logo mark (also the source for favicon + apple-touch + OG image).
const ICON_JOBS = [
  {
    id: 'app-icon',
    aspect: '1:1',
    prompt:
      'App icon logo mark: an ornate aged-bronze arcane medallion bearing a triad of three gemstones — cool moonlit blue, ochre, and ember red — set within a glowing engraved ring, on a deep near-black background. Bold, clean, centered, symmetrical, readable at small sizes. Retro dark fantasy, hand-painted, no text, no letters.',
  },
];

// Non-card assets that benefit from generation.
const EXTRA_JOBS = [
  {
    id: 'card-back',
    aspect: '3:4',
    prompt:
      'Ornate back of a fantasy card: a wizard\'s portmanteau — a leather-and-bronze travelling case — bearing a central triad emblem of three gemstones (cool blue, ochre, ember red) within an arcane circle. Symmetrical, centered, intricate engraving. ' +
      CARD_STYLE +
      '. No people, decorative pattern only.',
  },
  {
    id: 'board-bg',
    aspect: '16:9',
    resolution: '2k',
    prompt:
      "Top-down view of a dark wizard's ritual duelling table: worn dark wood and stone inlay, faint chalk summoning circles, scattered talismans, bone runes and low candle glow, empty in the centre. Atmospheric, subtle, low contrast so foreground UI stays readable. " +
      'retro dark fantasy, hand-painted, moody, muted earthy palette, no text, no characters, no border, no watermark.',
  },
  {
    id: 'title-hero',
    aspect: '16:9',
    resolution: '2k',
    prompt:
      'Epic retro dark fantasy key art: two opposing wizards face each other across a ritual table in a storm-lit stone hall, arcane towers and glowing wards behind them, three colours of magic clashing (cool blue law, ochre neutral, ember red chaos). Late 1990s PC fantasy game box art, hand-painted gouache, dramatic chiaroscuro, cinematic, no text, no logo, no watermark.',
  },
];

export async function buildJobs() {
  const cards = JSON.parse(await readFile(CARDS_PATH, 'utf8'));
  const cardJobs = cards.map((card) => ({
    id: card.id,
    aspect: '3:2',
    prompt: cardPrompt(card),
  }));
  return [...cardJobs, ...EXTRA_JOBS, ...EMBLEM_JOBS, ...TEXTURE_JOBS, ...WIZARD_JOBS, ...ICON_JOBS];
}
