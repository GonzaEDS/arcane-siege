// Original face-down card back: a Portmanteau seal with the Law/Neutral/Chaos
// triad. Uses generated FLUX art when available, else the built-in SVG seal.

import { useState } from 'react';
import { hasArt, artUrl } from '../art';

export function CardBack({ size = 'normal', label = 'Hidden card' }: { size?: 'normal' | 'small'; label?: string }) {
  const [failed, setFailed] = useState(false);

  if (hasArt('card-back') && !failed) {
    return (
      <div className={`card card-back card-back-art card-back-${size}`} aria-label={label} role="img">
        <img className="card-back-img" src={artUrl('card-back')} alt="" onError={() => setFailed(true)} />
      </div>
    );
  }

  return (
    <div className={`card card-back card-back-${size}`} aria-label={label} role="img">
      <svg viewBox="0 0 100 140" className="card-back-svg" aria-hidden>
        <defs>
          <radialGradient id="cb-glow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgba(110,168,216,0.35)" />
            <stop offset="100%" stopColor="rgba(110,168,216,0)" />
          </radialGradient>
        </defs>
        <rect x="6" y="6" width="88" height="128" rx="8" fill="url(#cb-glow)" />
        <rect x="10" y="10" width="80" height="120" rx="7" fill="none" stroke="rgba(230,179,92,0.55)" strokeWidth="2" />
        <circle cx="50" cy="62" r="30" fill="none" stroke="rgba(236,227,207,0.5)" strokeWidth="1.6" />
        <circle cx="50" cy="62" r="20" fill="none" stroke="rgba(236,227,207,0.3)" strokeWidth="1.2" strokeDasharray="4 5" />
        {/* triad nodes */}
        <circle cx="50" cy="36" r="6" fill="#7fb5ff" fillOpacity="0.85" />
        <circle cx="29" cy="76" r="6" fill="#cdb98f" fillOpacity="0.85" />
        <circle cx="71" cy="76" r="6" fill="#e0635a" fillOpacity="0.85" />
        <path d="M50 42 L50 62 L34 71 M50 62 L66 71" stroke="rgba(236,227,207,0.45)" strokeWidth="1.4" fill="none" />
      </svg>
    </div>
  );
}
