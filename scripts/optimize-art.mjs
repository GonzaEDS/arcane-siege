// Optimize raw FLUX PNGs (public/art/*.png) into small, deploy-friendly WebP
// files the app actually ships. Raw PNGs stay gitignored; the .webp outputs are
// committed. Run after generating/regenerating art:  npm run optimize
//
// Target widths are tuned to display size to keep the bundle tiny while staying
// crisp. Alpha (wizard cutouts) is preserved.

import { readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ART_DIR = path.join(ROOT, 'public/art');

function targetFor(id) {
  if (id === 'board-bg' || id === 'title-hero') return { width: 1600, quality: 78 };
  if (id === 'tex-parchment' || id === 'tex-stone') return { width: 640, quality: 78 };
  if (id.startsWith('emblem-')) return { width: 256, quality: 86 };
  if (id.startsWith('wizard-')) return { width: 768, quality: 86 };
  return { width: 512, quality: 80 }; // card art
}

async function main() {
  const files = (await readdir(ART_DIR)).filter((f) => f.endsWith('.png'));
  let totalIn = 0;
  let totalOut = 0;

  for (const file of files) {
    const id = file.replace(/\.png$/, '');
    const src = path.join(ART_DIR, file);
    const dest = path.join(ART_DIR, `${id}.webp`);
    const { width, quality } = targetFor(id);

    const inSize = (await stat(src)).size;
    await sharp(src)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toFile(dest);
    const outSize = (await stat(dest)).size;
    totalIn += inSize;
    totalOut += outSize;
    console.log(`· ${id.padEnd(16)} ${(inSize / 1024).toFixed(0).padStart(5)}KB -> ${(outSize / 1024).toFixed(0).padStart(4)}KB`);
  }

  console.log(`\n${files.length} images: ${(totalIn / 1e6).toFixed(1)}MB -> ${(totalOut / 1e6).toFixed(1)}MB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
