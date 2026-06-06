// Minimal fal.ai queue client. Auth header is "Authorization: Key <id>:<secret>"
// and FAL_KEY already holds "id:secret".

const QUEUE = 'https://queue.fal.run';

function auth() {
  const k = process.env.FAL_KEY;
  if (!k) throw new Error('Missing FAL_KEY (load with --env-file).');
  return `Key ${k}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Recursively find the first URL that looks like a video file. */
export function findVideoUrl(obj) {
  let found = null;
  const visit = (v) => {
    if (found) return;
    if (typeof v === 'string') {
      if (/^https?:\/\/.*\.(mp4|webm|mov)(\?|$)/i.test(v)) found = v;
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(visit);
      return;
    }
    if (v && typeof v === 'object') {
      // Prefer an explicit { url } on a "video" field.
      if (v.video && v.video.url) {
        found = v.video.url;
        return;
      }
      Object.values(v).forEach(visit);
    }
  };
  visit(obj);
  return found;
}

/**
 * Run a fal model through the queue: submit, poll, fetch result JSON.
 * @param {string} model  e.g. 'fal-ai/ltx-video-13b-distilled/image-to-video'
 * @param {object} input  model-specific input
 */
export async function falRun(model, input, opts = {}) {
  const pollMs = opts.pollMs ?? 4000;
  const maxPolls = opts.maxPolls ?? 150;

  const submit = await fetch(`${QUEUE}/${model}`, {
    method: 'POST',
    headers: { Authorization: auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const sj = await submit.json().catch(() => ({}));
  if (!submit.ok || !sj.request_id) {
    throw new Error(`submit failed (${submit.status}): ${JSON.stringify(sj).slice(0, 300)}`);
  }

  const statusUrl = sj.status_url ?? `${QUEUE}/${model}/requests/${sj.request_id}/status`;
  const responseUrl = sj.response_url ?? `${QUEUE}/${model}/requests/${sj.request_id}`;

  for (let i = 0; i < maxPolls; i++) {
    await sleep(pollMs);
    const st = await fetch(statusUrl, { headers: { Authorization: auth() } });
    const stj = await st.json().catch(() => ({}));
    if (stj.status === 'COMPLETED') {
      const r = await fetch(responseUrl, { headers: { Authorization: auth() } });
      return r.json();
    }
    if (stj.status === 'FAILED' || stj.status === 'ERROR') {
      throw new Error(`generation ${stj.status}: ${JSON.stringify(stj).slice(0, 300)}`);
    }
  }
  throw new Error('timed out waiting for fal generation');
}

export async function downloadTo(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (${res.status})`);
  const { writeFile } = await import('node:fs/promises');
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}
