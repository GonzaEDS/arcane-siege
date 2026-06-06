// Reusable ElevenLabs Text-to-Sound-Effects client. No app logic here.
// Credentials come from env (load via `node --env-file=...`).

const BASE_URL = 'https://api.elevenlabs.io';

function apiKey() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('Missing ELEVENLABS_API_KEY (load with --env-file).');
  return key;
}

/**
 * Generate one sound effect and return the MP3 bytes (Buffer).
 * @param {string} text  The sound description.
 * @param {{ durationSeconds?: number|null, promptInfluence?: number, loop?: boolean,
 *           outputFormat?: string }} [opts]
 */
export async function generateSound(text, opts = {}) {
  const outputFormat = opts.outputFormat ?? 'mp3_44100_128';
  const body = {
    text,
    model_id: 'eleven_text_to_sound_v2',
    prompt_influence: opts.promptInfluence ?? 0.45,
    loop: opts.loop ?? false,
  };
  if (opts.durationSeconds != null) body.duration_seconds = opts.durationSeconds;

  const res = await fetch(`${BASE_URL}/v1/sound-generation?output_format=${outputFormat}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = '';
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`Sound generation failed (${res.status}): ${detail}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
