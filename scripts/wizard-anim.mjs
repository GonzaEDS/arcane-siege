// Turn a folder of idle-animation frames (white background) into a single
// transparent, looping animated WebP for a wizard:
//   1. downscale each frame
//   2. remove the background via fal.ai (subject segmentation)
//   3. join the transparent frames into one animated WebP (sharp)
//
//   npm run wizard-anim -- --limit 6           # quick pipeline test
//   npm run wizard-anim                         # full run (all frames)
//   npm run wizard-anim -- --every 2 --fps 4    # subsample
//
// Output: public/art/<out>.webp  (default out = wizard-a-idle)

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { falRun, downloadTo } from './fal.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRAMES_DIR = path.join(ROOT, 'frames_8fps');
const OUT_DIR = path.join(ROOT, 'public/art');
const TMP_DIR = path.join(ROOT, '.tmp-frames');

const REMBG_MODEL = 'fal-ai/imageutils/rembg';

function parseArgs(argv) {
  const a = { limit: null, every: 1, fps: 8, width: 420, out: 'wizard-a-idle' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--limit') a.limit = parseInt(argv[++i], 10);
    else if (k === '--every') a.every = parseInt(argv[++i], 10);
    else if (k === '--fps') a.fps = parseInt(argv[++i], 10);
    else if (k === '--width') a.width = parseInt(argv[++i], 10);
    else if (k === '--out') a.out = argv[++i];
  }
  return a;
}

function findImageUrl(obj) {
  let found = null;
  const visit = (v) => {
    if (found) return;
    if (typeof v === 'string') {
      if (/^https?:\/\/.*\.(png|webp|jpg|jpeg)(\?|$)/i.test(v)) found = v;
      return;
    }
    if (Array.isArray(v)) return v.forEach(visit);
    if (v && typeof v === 'object') {
      if (v.image && v.image.url) {
        found = v.image.url;
        return;
      }
      Object.values(v).forEach(visit);
    }
  };
  visit(obj);
  return found;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });

  let frames = (await readdir(FRAMES_DIR)).filter((f) => /\.png$/i.test(f)).sort();
  frames = frames.filter((_, i) => i % args.every === 0);
  if (args.limit != null) frames = frames.slice(0, args.limit);

  const width = args.width;
  const height = Math.round(width * (1660 / 1244));
  console.log(`frames=${frames.length} · ${width}x${height} · ${args.fps}fps · out=${args.out}\n`);

  const buffers = [];
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    process.stdout.write(`· ${String(i + 1).padStart(3)}/${frames.length} ${f} … `);
    try {
      const raw = await readFile(path.join(FRAMES_DIR, f));
      const small = await sharp(raw).resize({ width }).png().toBuffer();
      const image_url = `data:image/png;base64,${small.toString('base64')}`;
      const result = await falRun(REMBG_MODEL, { image_url });
      const url = findImageUrl(result);
      if (!url) throw new Error('no image url');
      const tmp = path.join(TMP_DIR, `cut_${String(i).padStart(4, '0')}.png`);
      await downloadTo(url, tmp);
      // Normalize to identical canvas so the frames can be joined.
      const norm = await sharp(await readFile(tmp))
        .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      buffers.push(norm);
      console.log('ok');
    } catch (err) {
      console.log(`FAILED (${err.message})`);
    }
  }

  if (buffers.length === 0) throw new Error('no frames processed');

  const dest = path.join(OUT_DIR, `${args.out}.webp`);
  await sharp(buffers, { join: { animated: true } })
    .webp({ delay: Math.round(1000 / args.fps), loop: 0, quality: 80, effort: 4 })
    .toFile(dest);

  const { size } = await sharp(dest).metadata().then(async () => ({ size: (await readFile(dest)).length }));
  console.log(`\nWrote ${dest} (${(size / 1e6).toFixed(2)}MB, ${buffers.length} frames)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
