// Batch SFX generator (ElevenLabs). Caches MP3s under public/audio/sfx and
// writes an importable manifest of available ids. The UI degrades silently if a
// sound is missing.
//
//   npm run sfx                       # generate missing
//   npm run sfx -- --force            # regenerate all
//   npm run sfx -- --only cast-attack,win
//   npm run sfx -- --probe            # validate credentials with one tiny call

import { writeFile, mkdir, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { generateSound } from './elevenlabs.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public/audio/sfx');
const MANIFEST_PATH = path.join(ROOT, 'src/ui/audioManifest.json');

// A spell-duel sound palette. Keep them short, dry and game-ready.
const STYLE = 'dark fantasy video game sound effect, dry, punchy, no music, mono';

const SFX = [
  // Cast sounds, one per card category, so each card type sounds distinct.
  { id: 'cast-attack', d: 1.4, t: `aggressive arcane attack spell being hurled, sharp whoosh and crackle, ${STYLE}` },
  { id: 'cast-ward', d: 1.4, t: `protective ward spell rising, shimmering crystalline barrier forming, ${STYLE}` },
  { id: 'cast-citadel', d: 1.6, t: `heavy stone fortress blocks rising and locking into place, deep rumble, ${STYLE}` },
  { id: 'cast-place-of-power', d: 1.6, t: `ancient place of power awakening, resonant magical hum with stone scrape, ${STYLE}` },
  { id: 'cast-boon', d: 1.4, t: `benevolent blessing spell, warm rising chime and gentle magical sparkle, ${STYLE}` },
  { id: 'cast-hex', d: 1.5, t: `sinister hex curse cast, dark whoosh with low ominous swell, ${STYLE}` },
  { id: 'cast-production', d: 1.4, t: `arcane runes channeling energy, layered magical drone and tick, ${STYLE}` },
  { id: 'cast-special', d: 1.6, t: `mysterious powerful ritual artifact activating, otherworldly shimmer, ${STYLE}` },

  // Impacts & structure.
  { id: 'impact-ward', d: 1.0, t: `magic projectile hitting a crystalline shield, bright deflecting clang, ${STYLE}` },
  { id: 'impact-citadel', d: 1.2, t: `heavy impact cracking stone fortress wall, debris crumble, ${STYLE}` },
  { id: 'build-citadel', d: 1.4, t: `stone tower growing taller, blocks stacking with magical reinforcement, ${STYLE}` },
  { id: 'build-ward', d: 1.2, t: `magical barrier strengthening, energy shield charging up, ${STYLE}` },

  // Resources & status.
  { id: 'mana-gain', d: 1.0, t: `collecting magical mana, soft sparkling crystalline pickup chime, ${STYLE}` },
  { id: 'drain', d: 1.2, t: `magical energy being siphoned and drained away, descending whoosh, ${STYLE}` },
  { id: 'buff', d: 1.0, t: `empowering enchantment, quick rising magical power-up, ${STYLE}` },
  { id: 'curse', d: 1.6, t: `dark overlord curse descending, evil choir-like swell and whoosh, ${STYLE}` },

  // Cards & turn flow.
  { id: 'draw', d: 0.7, t: `single playing card drawn and snapping into hand, paper flick, ${STYLE}` },
  { id: 'return', d: 0.7, t: `card sliding back onto a deck, soft paper whoosh, ${STYLE}` },
  { id: 'sabotage', d: 1.4, t: `petrifying gorgon stare, stone-grinding magical sabotage with hiss, ${STYLE}` },
  { id: 'turn-start', d: 0.8, t: `soft mystical chime marking the start of a turn, single bell shimmer, ${STYLE}` },

  // UI & outcomes.
  { id: 'click', d: 0.5, t: `subtle UI click on an ornate fantasy interface, soft wooden tick, ${STYLE}` },
  { id: 'error', d: 0.5, t: `gentle negative error buzz for an invalid action, low dull thud, ${STYLE}` },
  { id: 'win', d: 2.6, t: `triumphant victory fanfare sting, heroic brass and shimmer, short, dark fantasy game` },
  { id: 'lose', d: 2.4, t: `somber defeat sting, descending mournful tones, short, dark fantasy game` },
];

function parseArgs(argv) {
  const a = { force: false, only: null, probe: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--force') a.force = true;
    else if (k === '--probe') a.probe = true;
    else if (k === '--only') a.only = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
  }
  return a;
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function rewriteManifest() {
  const files = (await readdir(OUT_DIR)).filter((f) => f.endsWith('.mp3'));
  const ids = files.map((f) => f.replace(/\.mp3$/, '')).sort();
  await writeFile(MANIFEST_PATH, JSON.stringify(ids, null, 2) + '\n');
  return ids.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });

  if (args.probe) {
    const buf = await generateSound('soft wooden UI click', { durationSeconds: 0.5 });
    console.log(`probe ok: received ${buf.length} bytes of mp3`);
    return;
  }

  let jobs = SFX;
  if (args.only) jobs = SFX.filter((j) => args.only.includes(j.id));

  console.log(`jobs=${jobs.length}\n`);
  let made = 0;
  let skipped = 0;
  let failed = 0;

  for (const job of jobs) {
    const dest = path.join(OUT_DIR, `${job.id}.mp3`);
    if (!args.force && (await exists(dest))) {
      console.log(`· skip ${job.id}`);
      skipped++;
      continue;
    }
    process.stdout.write(`· gen  ${job.id} … `);
    try {
      const buf = await generateSound(job.t, { durationSeconds: job.d, promptInfluence: 0.5 });
      await writeFile(dest, buf);
      console.log('done');
      made++;
      await rewriteManifest();
    } catch (err) {
      console.log(`FAILED (${err.message})`);
      failed++;
    }
  }

  const total = await rewriteManifest();
  console.log(`\nmade ${made}, skipped ${skipped}, failed ${failed}. Manifest ids: ${total}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
