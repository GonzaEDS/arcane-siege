// Volume / mute controls. Compact (header) shows a mute toggle + master slider;
// full (setup) shows master / SFX / music sliders.

import { playSfx } from '../audio';
import type { Settings } from '../useSettings';

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="vol">
      <span className="vol-label">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        aria-label={`${label} volume`}
      />
    </label>
  );
}

export function AudioControls({
  settings,
  update,
  compact,
}: {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  compact?: boolean;
}) {
  const toggleMute = () => {
    const next = !settings.muted;
    update({ muted: next });
    if (!next) setTimeout(() => playSfx('click'), 0);
  };

  if (compact) {
    return (
      <div className="audio-compact">
        <button type="button" className="icon-btn" onClick={toggleMute} aria-label={settings.muted ? 'Unmute' : 'Mute'} title={settings.muted ? 'Unmute' : 'Mute'}>
          {settings.muted ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(settings.master * 100)}
          onChange={(e) => update({ master: Number(e.target.value) / 100 })}
          aria-label="Master volume"
          className="vol-master"
        />
      </div>
    );
  }

  return (
    <div className="audio-full">
      <div className="audio-head">
        <span>Sound</span>
        <button type="button" className="btn" onClick={toggleMute}>
          {settings.muted ? '🔇 Muted' : '🔊 On'}
        </button>
      </div>
      <Slider label="Master" value={settings.master} onChange={(v) => update({ master: v })} />
      <Slider label="Effects" value={settings.sfx} onChange={(v) => update({ sfx: v })} />
      <Slider label="Music" value={settings.music} onChange={(v) => update({ music: v })} />
    </div>
  );
}
