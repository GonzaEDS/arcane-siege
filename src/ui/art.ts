// Access to generated FLUX art. The manifest lists ids that have a PNG under
// public/art. Everything degrades gracefully: if an id is absent (or its image
// fails to load), the UI falls back to procedural SVG.

import manifest from './artManifest.json';
import videoManifest from './videoManifest.json';

const ART_IDS = new Set(manifest as string[]);
const VIDEO_IDS = new Set(videoManifest as string[]);

export function hasArt(id: string): boolean {
  return ART_IDS.has(id);
}

export function artUrl(id: string): string {
  // BASE_URL is '/' in dev and respects the configured base in builds.
  return `${import.meta.env.BASE_URL}art/${id}.png`;
}

export function hasVideo(id: string): boolean {
  return VIDEO_IDS.has(id);
}

export function videoUrl(id: string): string {
  return `${import.meta.env.BASE_URL}video/${id}.mp4`;
}
