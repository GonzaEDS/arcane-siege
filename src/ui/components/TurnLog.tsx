import { useEffect, useRef } from 'react';
import type { GameEvent } from '../../engine';

export function TurnLog({ log, debug }: { log: GameEvent[]; debug: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [log.length]);

  return (
    <div className="turn-log" aria-label="Turn log" aria-live="polite">
      <ul>
        {log.map((e) => (
          <li key={e.seq} className={`log-${e.type} ${e.player ? `log-player-${e.player}` : ''}`}>
            <span className="log-turn">T{e.turn}</span>
            <span className="log-msg">{e.message}</span>
            {debug && e.data ? <code className="log-data">{JSON.stringify(e.data)}</code> : null}
          </li>
        ))}
      </ul>
      <div ref={endRef} />
    </div>
  );
}
