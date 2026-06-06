// A concise rules overlay for new players. Read-only; closes on backdrop click
// or the close button.

export function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="help-scrim" role="dialog" aria-modal="true" aria-label="How to play" onClick={onClose}>
      <div className="help-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="help-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 className="help-title">How to Duel</h2>

        <div className="help-grid">
          <section>
            <h3>Goal</h3>
            <p>
              Win by raising your own <strong>Essence</strong> to <strong>100</strong>, or by reducing your rival's
              Essence to <strong>0</strong>.
            </p>
          </section>

          <section>
            <h3>Mana &amp; circles</h3>
            <p>
              You wield three schools — <span className="hl-law">Law</span>, <span className="hl-neutral">Neutral</span>{' '}
              and <span className="hl-chaos">Chaos</span>. At the start of your turn each <em>circle</em> you hold makes 1
              matching mana (no production on the first two turns of the game). Cards cost mana.
            </p>
          </section>

          <section>
            <h3>Your turn</h3>
            <p>
              Either <strong>cast one card</strong> (click an affordable card) <em>or</em> <strong>return up to 3</strong>{' '}
              cards to your Portmanteau to cycle them — then <strong>End turn</strong>.
            </p>
          </section>

          <section>
            <h3>Aegis &amp; Essence</h3>
            <p>
              Attacks hit your <strong>Aegis</strong> (shield) first and overflow into <strong>Essence</strong>. Some
              spells <em>bypass</em> the Aegis and strike Essence directly.
            </p>
          </section>

          <section>
            <h3>Empowerments</h3>
            <p>
              One-shot boons: double your next attack or build, negate the next attack against you, or seal your mana
              against the next drain — each consumed when it triggers.
            </p>
          </section>

          <section>
            <h3>Modes</h3>
            <p>
              <strong>Versus AI</strong>, <strong>Secret hot-seat</strong> (one screen, a pass gate hides each hand on
              handover), or <strong>Open table</strong> (both hands shown). Build custom decks from the setup screen.
            </p>
          </section>
        </div>

        <button type="button" className="btn btn-primary help-ok" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
