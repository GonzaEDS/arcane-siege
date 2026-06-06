// Remove the background from generated art via fal.ai, producing a transparent
// PNG cutout (FLUX/Higgsfield output has no alpha). Overwrites the source image
// under public/art so the UI shows the subject with no rectangle.
//
//   npm run cutout -- --only wizard-a,wizard-b
//   npm run cutout -- --only wizard-a --model fal-ai/birefnet/v2

import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { falRun, downloadTo } from './fal.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ART_DIR = path.join(ROOT, 'public/art');

const DEFAULT_MODEL = 'fal-ai/imageutils/rembg';

function parseArgs(argv) {
  const a = { only: ['wizard-a', 'wizard-b'], model: DEFAULT_MODEL };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--only') a.only = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (k === '--model') a.model = argv[++i];
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
  console.log(`model=${args.model} · ids=${args.only.join(',')}\n`);

  for (const id of args.only) {
    const file = path.join(ART_DIR, `${id}.png`);
    if (!(await exists(file))) {
      console.log(`· missing ${id}`);
      continue;
    }
    process.stdout.write(`· cut  ${id} … `);
    try {
      const buf = await readFile(file);
      const image_url = `data:image/png;base64,${buf.toString('base64')}`;
      const result = await falRun(args.model, { image_url });
      const url = findImageUrl(result);
      if (!url) throw new Error(`no image url in result: ${JSON.stringify(result).slice(0, 200)}`);
      await downloadTo(url, file);
      console.log('done');
    } catch (err) {
      console.log(`FAILED (${err.message})`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
