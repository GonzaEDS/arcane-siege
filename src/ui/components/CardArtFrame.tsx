// Picks the richest available art for a card: an animated clip (only where
// requested, e.g. the last-cast focus) → generated still → procedural SVG.
// Each step falls back gracefully if its asset is missing or fails to load.

import { useState } from 'react';
import { CardArt, type School } from './CardArt';
import type { CardCategory } from '../../engine';
import { hasArt, artUrl, hasVideo, videoUrl } from '../art';

export function CardArtFrame({
  id,
  category,
  school,
  animated,
}: {
  id: string;
  category: CardCategory;
  school: School;
  /** Allow playing the looping video clip (used in the last-cast focus only). */
  animated?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [vidFailed, setVidFailed] = useState(false);

  if (animated && hasVideo(id) && !vidFailed) {
    return (
      <div className={`card-art card-art-photo school-${school}`} aria-hidden>
        <video
          className="card-art-video"
          src={videoUrl(id)}
          poster={hasArt(id) ? artUrl(id) : undefined}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVidFailed(true)}
        />
      </div>
    );
  }

  if (hasArt(id) && !imgFailed) {
    return (
      <div className={`card-art card-art-photo school-${school}`} aria-hidden>
        <img className="card-art-img" src={artUrl(id)} alt="" loading="lazy" onError={() => setImgFailed(true)} />
      </div>
    );
  }
  return <CardArt category={category} school={school} />;
}
