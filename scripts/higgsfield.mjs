// Reusable Higgsfield (FLUX.2) image-generation client. No art-direction logic
// here — credentials come from env (load via `node --env-file=...`).

const BASE_URL = 'https://platform.higgsfield.ai';

// FLUX.2 tiers (model ids).
export const TIER_MODELS = {
  pro: 'flux-2',
  flex: 'flux-2-flex',
  max: 'flux-2-max',
};

export const RESOLUTIONS = ['1k', '2k'];
export const ASPECT_RATIOS = ['16:9', '4:3', '1:1', '3:4', '9:16', '2:3', '3:2', '2:1', '1:2', '4:5', '5:4'];

function authHeader() {
  const key = process.env.HIGGSFIELD_API_KEY;
  const secret = process.env.HIGGSFIELD_API_SECRET;
  if (!key || !secret) {
    throw new Error('Missing HIGGSFIELD_API_KEY / HIGGSFIELD_API_SECRET (load with --env-file).');
  }
  return `Key ${key}:${secret}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Generate one image and return its (temporary) URL.
 * @param {string} prompt
 * @param {{ tier?: 'pro'|'flex'|'max', model?: string, resolution?: string,
 *           aspectRatio?: string, pollMs?: number, maxPolls?: number }} [opts]
 */
export async function generateImage(prompt, opts = {}) {
  const model = opts.model ?? TIER_MODELS[opts.tier ?? 'flex'];
  if (!model) throw new Error(`Unknown tier '${opts.tier}'.`);
  const resolution = opts.resolution ?? '1k';
  const aspectRatio = opts.aspectRatio ?? '1:1';
  const pollMs = opts.pollMs ?? 2500;
  const maxPolls = opts.maxPolls ?? 80;

  const submit = await fetch(`${BASE_URL}/${model}`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, resolution, aspect_ratio: aspectRatio }),
  });
  const submitJson = await submit.json().catch(() => ({}));
  if (!submit.ok || !submitJson.request_id) {
    throw new Error(`Submit failed (${submit.status}): ${JSON.stringify(submitJson)}`);
  }

  const statusUrl = submitJson.status_url;
  for (let i = 0; i < maxPolls; i++) {
    await sleep(pollMs);
    const res = await fetch(statusUrl, { headers: { Authorization: authHeader() } });
    const json = await res.json().catch(() => ({}));
    if (json.status === 'completed') {
      const url = json.images?.[0]?.url;
      if (!url) throw new Error('Completed but no image URL returned.');
      return url;
    }
    if (['failed', 'nsfw', 'cancelled'].includes(json.status)) {
      // failed/nsfw are auto-refunded by Higgsfield.
      throw new Error(`Generation ${json.status}.`);
    }
  }
  throw new Error('Timed out waiting for generation.');
}

/** Download a URL to a local file path. */
export async function downloadTo(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}).`);
  const { writeFile } = await import('node:fs/promises');
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

/**
 * Lightweight model-existence probe that doesn't spend credits: POST /{model}
 * with {} — an existing model returns a validation error about a missing
 * prompt; a wrong id returns "Model not found".
 */
export async function modelExists(model) {
  const res = await fetch(`${BASE_URL}/${model}`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const json = await res.json().catch(() => ({}));
  const text = JSON.stringify(json).toLowerCase();
  if (text.includes('prompt')) return true;
  if (text.includes('not found')) return false;
  return res.status !== 404;
}
