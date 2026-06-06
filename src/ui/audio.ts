// Lightweight audio bus: pooled one-shot SFX + a looping music track. All
// playback respects the persisted volume/mute settings and the browser's
// autoplay policy (audio unlocks on the first user gesture). Everything
// degrades silently when a file is absent.

import sfxManifest from './audioManifest.json';

const SFX_IDS = new Set(sfxManifest as string[]);

interface Volumes {
  master: number;
  sfx: number;
  music: number;
  muted: boolean;
}

let volumes: Volumes = { master: 0.8, sfx: 0.9, music: 0.55, muted: false };
let unlocked = false;

const sfxBuffers = new Map<string, HTMLAudioElement>();
let musicEl: HTMLAudioElement | null = null;
let musicUrl: string | null = null;

function base(): string {
  return import.meta.env.BASE_URL;
}

function sfxGain(): number {
  return volumes.muted ? 0 : volumes.master * volumes.sfx;
}
function musicGain(): number {
  return volumes.muted ? 0 : volumes.master * volumes.music;
}

export function hasSfx(id: string): boolean {
  return SFX_IDS.has(id);
}

export function setVolumes(v: Volumes): void {
  volumes = v;
  if (musicEl) musicEl.volume = musicGain();
}

/** Called on the first user gesture so audio is allowed to start. */
export function unlockAudio(): void {
  if (unlocked) return;
  unlocked = true;
  if (musicEl && musicUrl && musicEl.paused) musicEl.play().catch(() => {});
}

export function playSfx(id: string, gainScale = 1): void {
  if (!hasSfx(id) || sfxGain() <= 0 || !unlocked) return;
  let buffer = sfxBuffers.get(id);
  if (!buffer) {
    buffer = new Audio(`${base()}audio/sfx/${id}.mp3`);
    buffer.preload = 'auto';
    sfxBuffers.set(id, buffer);
  }
  // Clone so the same sound can overlap with itself.
  const node = buffer.cloneNode() as HTMLAudioElement;
  node.volume = Math.max(0, Math.min(1, sfxGain() * gainScale));
  node.play().catch(() => {});
}

/**
 * Set (or clear) the looping music track by relative path under public/, e.g.
 * 'audio/music/battle.mp3'. We HEAD-check first so a missing user-provided
 * track doesn't spam media errors.
 */
export async function setMusic(relPath: string | null): Promise<void> {
  const url = relPath ? `${base()}${relPath}` : null;
  if (url === musicUrl) return;

  if (!musicEl) {
    musicEl = new Audio();
    musicEl.loop = true;
  }

  if (!url) {
    musicUrl = null;
    musicEl.pause();
    musicEl.removeAttribute('src');
    return;
  }

  try {
    const head = await fetch(url, { method: 'HEAD' });
    if (!head.ok) {
      musicUrl = null;
      musicEl.pause();
      musicEl.removeAttribute('src');
      return;
    }
  } catch {
    return;
  }

  musicUrl = url;
  musicEl.src = url;
  musicEl.volume = musicGain();
  if (unlocked) musicEl.play().catch(() => {});
}
