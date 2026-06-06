// Animate each card's still art into a short looping "living painting" clip via
// fal.ai (image-to-video), cached under public/video. The UI plays the clip in
// the last-cast focus when present and falls back to the still otherwise.
//
//   npm run video -- --only 149203            # one card (good for a smoke test)
//   npm run video                             # all cards with art, missing only
//   npm run video -- --force --only 149203
//   npm run video -- --model fal-ai/wan-i2v   # try a different model
//
// Default model is LTX (fast/cheap). Override with --model if needed.

import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { falRun, findVideoUrl, downloadTo } from './fal.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ART_DIR = path.join(ROOT, 'public/art');
const OUT_DIR = path.join(ROOT, 'public/video');
const MANIFEST_PATH = path.join(ROOT, 'src/ui/videoManifest.json');
const CARDS_PATH = path.join(ROOT, 'src/data/cards.json');

const DEFAULT_MODEL = 'fal-ai/ltx-video-13b-distilled/image-to-video';

const MOTION =
  'Subtle living-painting motion: gentle parallax, drifting smoke and embers, flickering magical light, ' +
  'slow breathing of the creature, faint particles. Cinematic, atmospheric, seamless loop, keep composition stable, dark fantasy.';

function parseArgs(argv) {
  const a = { force: false, only: null, model: DEFAULT_MODEL, limit: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--force') a.force = true;
    else if (k === '--only') a.only = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (k === '--model') a.model = argv[++i];
    else if (k === '--limit') a.limit = parseInt(argv[++i], 10);
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
  const files = (await readdir(OUT_DIR).catch(() => [])).filter((f) => f.endsWith('.mp4'));
  const ids = files.map((f) => f.replace(/\.mp4$/, '')).sort();
  await writeFile(MANIFEST_PATH, JSON.stringify(ids, null, 2) + '\n');
  return ids.length;
}

async function dataUri(file) {
  const buf = await readFile(file);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });

  const cards = JSON.parse(await readFile(CARDS_PATH, 'utf8'));
  let ids = cards.map((c) => c.id);
  if (args.only) ids = ids.filter((id) => args.only.includes(id));
  if (args.limit != null) ids = ids.slice(0, args.limit);

  console.log(`model=${args.model} · jobs=${ids.length}\n`);
  let made = 0;
  let skipped = 0;
  let failed = 0;

  for (const id of ids) {
    const dest = path.join(OUT_DIR, `${id}.mp4`);
    const art = path.join(ART_DIR, `${id}.png`);
    if (!args.force && (await exists(dest))) {
      console.log(`· skip ${id}`);
      skipped++;
      continue;
    }
    if (!(await exists(art))) {
      console.log(`· no-art ${id}`);
      continue;
    }
    process.stdout.write(`· gen  ${id} … `);
    try {
      const image_url = await dataUri(art);
      const result = await falRun(args.model, {
        prompt: MOTION,
        image_url,
        // Common LTX/i2v knobs; ignored by models that don't use them.
        num_frames: 121,
        aspect_ratio: 'auto',
        resolution: '480p',
        loop: true,
      });
      const url = findVideoUrl(result);
      if (!url) throw new Error(`no video url in result: ${JSON.stringify(result).slice(0, 200)}`);
      await downloadTo(url, dest);
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
