// Batch art generator for Arcane Siege. Builds prompts from the card data +
// extra assets (see art-direction.mjs), generates any that don't already exist,
// caches them under public/art, and writes an importable manifest of available
// ids. The engine/UI never depend on this — missing art falls back to SVG.
//
//   npm run art                          # generate missing
//   npm run art -- --force               # regenerate all
//   npm run art -- --only 149203,card-back
//   npm run art -- --tier max --resolution 2k
//   npm run art -- --probe               # check model ids without spending

import { writeFile, mkdir, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { generateImage, downloadTo, modelExists, TIER_MODELS } from './higgsfield.mjs';
import { buildJobs } from './art-direction.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public/art');
const MANIFEST_PATH = path.join(ROOT, 'src/ui/artManifest.json');

function parseArgs(argv) {
  const a = { tier: 'flex', resolution: '1k', aspect: '3:2', force: false, limit: null, only: null, probe: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const next = () => argv[++i];
    if (k === '--tier') a.tier = next();
    else if (k === '--resolution') a.resolution = next();
    else if (k === '--aspect') a.aspect = next();
    else if (k === '--limit') a.limit = parseInt(next(), 10);
    else if (k === '--only') a.only = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (k === '--force') a.force = true;
    else if (k === '--probe') a.probe = true;
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
  const files = (await readdir(OUT_DIR)).filter((f) => f.endsWith('.png'));
  const ids = files.map((f) => f.replace(/\.png$/, '')).sort();
  await writeFile(MANIFEST_PATH, JSON.stringify(ids, null, 2) + '\n');
  return ids.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });

  if (args.probe) {
    for (const [tier, model] of Object.entries(TIER_MODELS)) {
      const ok = await modelExists(model).catch((e) => `error: ${e.message}`);
      console.log(`${tier.padEnd(5)} ${model.padEnd(14)} -> ${ok}`);
    }
    return;
  }

  let jobs = await buildJobs();
  if (args.only) jobs = jobs.filter((j) => args.only.includes(j.id));
  if (args.limit != null) jobs = jobs.slice(0, args.limit);

  console.log(`tier=${args.tier} default ${args.resolution} ${args.aspect} · jobs=${jobs.length}\n`);
  let made = 0;
  let skipped = 0;
  let failed = 0;

  for (const job of jobs) {
    const dest = path.join(OUT_DIR, `${job.id}.png`);
    if (!args.force && (await exists(dest))) {
      console.log(`· skip ${job.id}`);
      skipped++;
      continue;
    }
    process.stdout.write(`· gen  ${job.id} … `);
    const opts = {
      tier: args.tier,
      resolution: job.resolution ?? args.resolution,
      aspectRatio: job.aspect ?? args.aspect,
    };

    let ok = false;
    for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
      try {
        const url = await generateImage(job.prompt, opts);
        await downloadTo(url, dest);
        ok = true;
      } catch (err) {
        if (attempt === 2) {
          console.log(`FAILED (${err.message})`);
          failed++;
        }
      }
    }
    if (ok) {
      console.log('done');
      made++;
      // Rewrite the manifest incrementally so the running app picks up art
      // progressively rather than only at the end of a long batch.
      await rewriteManifest();
    }
  }

  const total = await rewriteManifest();
  console.log(`\nmade ${made}, skipped ${skipped}, failed ${failed}. Manifest ids: ${total}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
