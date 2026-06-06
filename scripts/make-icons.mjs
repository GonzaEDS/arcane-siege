// Derive committed site icons from generated art:
//   public/favicon.png            (from art/app-icon.png)
//   public/apple-touch-icon.png   (from art/app-icon.png)
//   public/og-image.jpg           (social link preview, from art/title-hero.png)
// These outputs live in public/ root (committed & served). Run locally after
// generating app-icon / title-hero:  node scripts/make-icons.mjs

import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ART = path.join(ROOT, 'public/art');
const PUB = path.join(ROOT, 'public');

async function has(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const icon = path.join(ART, 'app-icon.png');
  const hero = path.join(ART, 'title-hero.png');

  if (await has(icon)) {
    await sharp(icon).resize(64, 64).png().toFile(path.join(PUB, 'favicon.png'));
    await sharp(icon).resize(180, 180).png().toFile(path.join(PUB, 'apple-touch-icon.png'));
    console.log('· favicon.png, apple-touch-icon.png');
  } else {
    console.log('! missing art/app-icon.png — skipping favicons');
  }

  if (await has(hero)) {
    await sharp(hero).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82 }).toFile(path.join(PUB, 'og-image.jpg'));
    console.log('· og-image.jpg');
  } else {
    console.log('! missing art/title-hero.png — skipping og-image');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
