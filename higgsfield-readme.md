I have the full implementation. Here's a complete, **art-direction-agnostic** package you can drop into another project. The key design choice: the prompt templates are *removed* and replaced with a `jobs.json` of `{ id, prompt }` — so the model in the other project just produces prompts (its own art direction) and the helper handles all the Higgsfield mechanics.

I'm in Ask mode, so I can't create these files — copy them into the new project (or switch me to Agent mode there). Six pieces:

---

## 1. `scripts/higgsfield.mjs` — the reusable client (the core, art-agnostic)

```javascript
// Reusable Higgsfield image-generation client. No app/art-direction logic here.
// Credentials come from env (load via `node --env-file=.env.local`).

const BASE_URL = "https://platform.higgsfield.ai";

// FLUX.2 tiers (discovered model ids). Add others as needed.
export const TIER_MODELS = {
  pro: "flux-2",
  flex: "flux-2-flex",
  max: "flux-2-max",
};

// Valid enums (validated against the API):
export const RESOLUTIONS = ["1k", "2k"];
export const ASPECT_RATIOS = [
  "16:9", "4:3", "1:1", "3:4", "9:16", "2:3", "3:2", "2:1", "1:2", "4:5", "5:4",
];

function authHeader() {
  const key = process.env.HIGGSFIELD_API_KEY;
  const secret = process.env.HIGGSFIELD_API_SECRET;
  if (!key || !secret) {
    throw new Error("Missing HIGGSFIELD_API_KEY / HIGGSFIELD_API_SECRET.");
  }
  return `Key ${key}:${secret}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Generate one image and return its (temporary) URL.
 * @param {string} prompt
 * @param {{ tier?: "pro"|"flex"|"max", model?: string, resolution?: string,
 *           aspectRatio?: string, pollMs?: number, maxPolls?: number }} [opts]
 */
export async function generateImage(prompt, opts = {}) {
  const model = opts.model ?? TIER_MODELS[opts.tier ?? "pro"];
  if (!model) throw new Error(`Unknown tier '${opts.tier}'.`);
  const resolution = opts.resolution ?? "1k";
  const aspectRatio = opts.aspectRatio ?? "1:1";
  const pollMs = opts.pollMs ?? 2000;
  const maxPolls = opts.maxPolls ?? 60;

  const submit = await fetch(`${BASE_URL}/${model}`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, resolution, aspect_ratio: aspectRatio }),
  });
  const submitJson = await submit.json();
  if (!submit.ok || !submitJson.request_id) {
    throw new Error(`Submit failed: ${JSON.stringify(submitJson)}`);
  }

  const statusUrl = submitJson.status_url;
  for (let i = 0; i < maxPolls; i++) {
    await sleep(pollMs);
    const res = await fetch(statusUrl, { headers: { Authorization: authHeader() } });
    const json = await res.json();
    if (json.status === "completed") {
      const url = json.images?.[0]?.url;
      if (!url) throw new Error("Completed but no image URL returned.");
      return url;
    }
    if (["failed", "nsfw", "cancelled"].includes(json.status)) {
      // Note: failed/nsfw are auto-refunded by Higgsfield.
      throw new Error(`Generation ${json.status}.`);
    }
  }
  throw new Error("Timed out waiting for generation.");
}

/** Download a URL to a local file path. */
export async function downloadTo(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}).`);
  const { writeFile } = await import("node:fs/promises");
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

/** Convenience: generate + save in one call. */
export async function generateAndSave(prompt, dest, opts = {}) {
  const url = await generateImage(prompt, opts);
  await downloadTo(url, dest);
  return dest;
}
```

---

## 2. `scripts/generate-images.mjs` — the runner (reads jobs, caches, manifest, CLI)

```javascript
// Batch runner. Reads jobs [{ id, prompt }] from a JSON file, generates any
// that don't already exist, and writes a manifest of available ids.
//
//   npm run images                       # generate missing
//   npm run images -- --force            # regenerate all
//   npm run images -- --only a,b         # specific ids
//   npm run images -- --tier max --aspect 4:3 --resolution 2k

import { readFile, writeFile, mkdir, readdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { generateImage, downloadTo } from "./higgsfield.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const JOBS_PATH = path.join(ROOT, "art/jobs.json");        // [{ id, prompt }]
const OUT_DIR = path.join(ROOT, "public/art");             // images land here
const MANIFEST_PATH = path.join(ROOT, "public/art/manifest.json");

function parseArgs(argv) {
  const a = { tier: "pro", resolution: "1k", aspect: "1:1", force: false, limit: null, only: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i], next = () => argv[++i];
    if (k === "--tier") a.tier = next();
    else if (k === "--resolution") a.resolution = next();
    else if (k === "--aspect") a.aspect = next();
    else if (k === "--limit") a.limit = parseInt(next(), 10);
    else if (k === "--only") a.only = next().split(",").map((s) => s.trim()).filter(Boolean);
    else if (k === "--force") a.force = true;
  }
  return a;
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function rewriteManifest() {
  const files = (await readdir(OUT_DIR)).filter((f) => f.endsWith(".png"));
  const ids = files.map((f) => f.replace(/\.png$/, "")).sort();
  await writeFile(MANIFEST_PATH, JSON.stringify(ids, null, 2) + "\n");
  return ids.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });

  const jobs = JSON.parse(await readFile(JOBS_PATH, "utf8"));
  let targets = jobs;
  if (args.only) targets = jobs.filter((j) => args.only.includes(j.id));
  if (args.limit != null) targets = targets.slice(0, args.limit);

  console.log(`tier=${args.tier} ${args.resolution} ${args.aspect} · jobs=${targets.length}\n`);
  let made = 0, skipped = 0, failed = 0;

  for (const job of targets) {
    const dest = path.join(OUT_DIR, `${job.id}.png`);
    if (!args.force && (await exists(dest))) { console.log(`· skip ${job.id}`); skipped++; continue; }
    process.stdout.write(`· gen  ${job.id} … `);
    try {
      const url = await generateImage(job.prompt, {
        tier: args.tier, resolution: args.resolution, aspectRatio: args.aspect,
      });
      await downloadTo(url, dest);
      console.log("done"); made++;
    } catch (err) {
      console.log(`FAILED (${err.message})`); failed++;
    }
  }

  const total = await rewriteManifest();
  console.log(`\nmade ${made}, skipped ${skipped}, failed ${failed}. Manifest: ${total}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

---

## 3. `art/jobs.json` — where the model puts ITS art direction (no templates baked in)

```json
[
  { "id": "example_one", "prompt": "REPLACE WITH YOUR PROMPT — full art direction goes here" },
  { "id": "example_two", "prompt": "Another subject, another prompt" }
]
```

This is the seam: in the other project, whatever produces content just appends `{ id, prompt }` entries here (or generates this file programmatically). The helper never imposes a style.

---

## 4. `.env.local` (gitignored — never commit)

```bash
HIGGSFIELD_API_KEY=your-api-key-id
HIGGSFIELD_API_SECRET=your-api-key-secret
```

Add to `.gitignore`:

```gitignore
.env*.local
```

---

## 5. `package.json` script

```json
{
  "scripts": {
    "images": "node --env-file=.env.local scripts/generate-images.mjs"
  }
}
```

Requires **Node 20+** (for `--env-file` and global `fetch`). No dependencies.

---

## 6. Optional UI integration (Next.js/React) — generic

If you want the same "use generated image, else fallback" pattern:

```tsx
import manifest from "@/public/art/manifest.json"; // or wherever you write it
const ART_IDS = new Set(manifest as string[]);

export function Art({ id, alt, fallback }: { id: string; alt: string; fallback: React.ReactNode }) {
  return ART_IDS.has(id) ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/art/${id}.png`} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  ) : (
    <>{fallback}</>
  );
}
```

---

## What the model needs to "learn" (drop this in an `AGENTS.md` / `HIGGSFIELD.md`)

> **Higgsfield image API**
> - Base: `https://platform.higgsfield.ai`; auth header `Authorization: Key {KEY}:{SECRET}`.
> - **Async**: `POST /{model_id}` with `{ prompt, resolution, aspect_ratio }` → `{ request_id, status_url }`. Poll `status_url` until `status: "completed"` → `images[0].url`. Then **download** (URLs expire ~7 days).
> - Statuses: `queued`, `in_progress`, `completed`, `failed`, `nsfw`, `cancelled`. **`failed` and `nsfw` are auto-refunded.**
> - FLUX.2 model ids: `flux-2` (Pro), `flux-2-flex` (Flex), `flux-2-max` (Max).
> - `resolution`: `1k` | `2k`. `aspect_ratio`: `16:9, 4:3, 1:1, 3:4, 9:16, 2:3, 3:2, 2:1, 1:2, 4:5, 5:4`.
> - To use: add `{ id, prompt }` objects to `art/jobs.json`, run `npm run images`. Images cache by `id` (won't regenerate unless `--force`); a `manifest.json` of available ids is written for the app.
> - **Model discovery tip**: to check if a model id exists without spending, `POST /{candidate}` with `{}` — an existing model returns a `prompt is required` validation error; a wrong one returns `Model not found`.

---

### Summary of what's portable vs. left out
- **Portable (included):** the API client, async submit/poll/download, tier/resolution/aspect handling, caching, manifest, CLI flags, env handling, the UI fallback pattern, and the API reference notes.
- **Left out (project-specific):** the `STYLE_PREAMBLE` / per-subject prompt templates — replaced by the `jobs.json` seam so each project supplies its own art direction.

Want me to also sketch a variant where `jobs.json` is generated by a function (e.g., derived from your other project's data model) instead of a static file? Or if you tell me the other project's framework, I can tailor the integration snippet. And when you're ready to actually scaffold this in that project, switch me to Agent mode there.