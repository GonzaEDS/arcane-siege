// Re-touch the cached background-removed frames (.tmp-frames/cut_*.png) to remove
// the leftover near-white halo along the silhouette, then rebuild the animated
// WebP. No API calls — operates on the frames produced by wizard-anim.mjs.
//
//   npm run wizard-clean                 # default peel/threshold
//   npm run wizard-clean -- --peel 3 --white 235
//
// "Peel" iterations clear pixels that are (a) on the alpha edge and (b) nearly
// pure white — i.e. background fringe — without touching the grey hair.

import { readdir, readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP_DIR = path.join(ROOT, '.tmp-frames');
const OUT_DIR = path.join(ROOT, 'public/art');

function parseArgs(argv) {
  const a = { erode: 2, peel: 1, white: 236, fps: 8, width: 420, out: 'wizard-a-idle', limit: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--erode') a.erode = parseInt(argv[++i], 10);
    else if (k === '--peel') a.peel = parseInt(argv[++i], 10);
    else if (k === '--white') a.white = parseInt(argv[++i], 10);
    else if (k === '--fps') a.fps = parseInt(argv[++i], 10);
    else if (k === '--width') a.width = parseInt(argv[++i], 10);
    else if (k === '--out') a.out = argv[++i];
    else if (k === '--limit') a.limit = parseInt(argv[++i], 10);
  }
  return a;
}

/** Separable morphological erosion of the alpha channel by `r` pixels.
 *  Removes the feathered background halo regardless of its colour. */
function erodeAlpha(data, width, height, channels, r) {
  if (r <= 0) return;
  const n = width * height;
  const a0 = new Uint8Array(n);
  for (let i = 0; i < n; i++) a0[i] = data[i * channels + 3];

  const tmp = new Uint8Array(n);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let m = 255;
      for (let dx = -r; dx <= r; dx++) {
        const xx = x + dx;
        const v = xx < 0 || xx >= width ? 0 : a0[row + xx];
        if (v < m) m = v;
      }
      tmp[row + x] = m;
    }
  }
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let m = 255;
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy;
        const v = yy < 0 || yy >= height ? 0 : tmp[yy * width + x];
        if (v < m) m = v;
      }
      data[(y * width + x) * channels + 3] = m;
    }
  }
}

async function defringe(buf, { erode, peel, white }) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // 1. Erode the matte to drop the soft halo.
  erodeAlpha(data, width, height, channels, erode);

  // 2. Peel any remaining pure-white opaque edge pixels.
  const A = (x, y) => data[(y * width + x) * channels + 3];
  for (let it = 0; it < peel; it++) {
    const clear = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * channels;
        if (data[i + 3] === 0) continue;
        if (!(data[i] >= white && data[i + 1] >= white && data[i + 2] >= white)) continue;
        const edge =
          (x > 0 && A(x - 1, y) < 24) ||
          (x < width - 1 && A(x + 1, y) < 24) ||
          (y > 0 && A(x, y - 1) < 24) ||
          (y < height - 1 && A(x, y + 1) < 24);
        if (edge) clear.push(i + 3);
      }
    }
    if (clear.length === 0) break;
    for (const idx of clear) data[idx] = 0;
  }

  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });

  let files = (await readdir(TMP_DIR)).filter((f) => /^cut_\d+\.png$/.test(f)).sort();
  if (args.limit != null) files = files.slice(0, args.limit);
  if (files.length === 0) throw new Error('no cached frames in .tmp-frames (run wizard-anim first)');

  const width = args.width;
  const height = Math.round(width * (1660 / 1244));
  console.log(`frames=${files.length} · erode=${args.erode}px peel=${args.peel} white>=${args.white} · ${width}x${height}\n`);

  const buffers = [];
  for (let i = 0; i < files.length; i++) {
    const raw = await readFile(path.join(TMP_DIR, files[i]));
    const cleaned = await defringe(raw, args);
    const norm = await sharp(cleaned)
      .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    buffers.push(norm);
    if ((i + 1) % 20 === 0) console.log(`· ${i + 1}/${files.length}`);
  }

  const dest = path.join(OUT_DIR, `${args.out}.webp`);
  await sharp(buffers, { join: { animated: true } })
    .webp({ delay: Math.round(1000 / args.fps), loop: 0, quality: 80, effort: 4 })
    .toFile(dest);

  const bytes = (await readFile(dest)).length;
  console.log(`\nWrote ${dest} (${(bytes / 1e6).toFixed(2)}MB, ${buffers.length} frames)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
