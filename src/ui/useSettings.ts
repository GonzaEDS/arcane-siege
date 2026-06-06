// Persisted player preferences (audio volumes, accessibility, debug).

import { useCallback, useEffect, useState } from 'react';

export interface Settings {
  master: number; // 0..1
  sfx: number; // 0..1
  music: number; // 0..1
  muted: boolean;
  reducedMotion: boolean;
  debug: boolean;
}

const KEY = 'arcane-siege:settings:v1';

const DEFAULTS: Settings = {
  master: 0.8,
  sfx: 0.9,
  music: 0.55,
  muted: false,
  reducedMotion: false,
  debug: false,
};

function load(): Settings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => load());

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      // ignore write failures
    }
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  return { settings, update };
}
