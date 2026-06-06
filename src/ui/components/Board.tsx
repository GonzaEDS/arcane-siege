// Board orchestration: viewport-locked layout with two always-visible status
// bars, a central duel table, and a single shared hand that follows the active
// player. All game logic stays in the engine; this only arranges presentation
// and triggers the cosmetic card-flight animation.

import { useEffect, useRef, useState } from 'react';
import { castableCards, opponentOf } from '../../engine';
import type { GameEvent, GameState, PlayerId } from '../../engine';
import type { PresentationState } from '../usePresentationEvents';
import { PlayerPanel } from './PlayerPanel';
import { PortmanteauPiles } from './PortmanteauPiles';
import { Hand } from './Hand';
import { WizardView } from './WizardView';
import { LastCastZone } from './LastCastZone';
import { ActionBar } from './ActionBar';
import { TurnLog } from './TurnLog';
import { FlyingCard, rectOf, type Rect } from './FlyingCard';
import { hasArt, artUrl } from '../art';

export type Mode = 'ai' | 'secret' | 'open';

const boardBg = hasArt('board-bg')
  ? {
      backgroundImage: `linear-gradient(rgba(14,17,22,0.86), rgba(14,17,22,0.9)), url(${artUrl('board-bg')})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  : undefined;

const FLY_MS = 460;

export function Board({
  state,
  mode,
  presentation,
  debug,
  reducedMotion,
  log,
  discardMode,
  setDiscardMode,
  showPassGate,
  onPassContinue,
  onCast,
  onDiscard,
  onEndTurn,
  onSabotagePick,
}: {
  state: GameState;
  mode: Mode;
  presentation: PresentationState;
  debug: boolean;
  reducedMotion: boolean;
  log: GameEvent[];
  discardMode: boolean;
  setDiscardMode: (fn: (d: boolean) => boolean) => void;
  showPassGate: boolean;
  onPassContinue: () => void;
  onCast: (id: string) => void;
  onDiscard: (id: string) => void;
  onEndTurn: () => void;
  onSabotagePick: (id: string) => void;
}) {
  const sabotaging = state.status === 'awaiting_sabotage_choice';
  const ended = state.status === 'ended';
  const actor: PlayerId = sabotaging ? state.pendingSabotage!.caster : state.current;

  const humanControls = (pid: PlayerId) => (mode === 'ai' ? pid === 'A' : true);
  // The bottom status strip + hand follow the active player, so you see the
  // opponent's face-down hand on their turn. The wizard avatars, however, are
  // pinned by identity (A left, B right) below and never swap.
  const perspective: PlayerId = actor;
  const opponentId = opponentOf(perspective);
  const bottom = state.players[perspective];
  const top = state.players[opponentId];

  const humanSabotage = sabotaging && humanControls(actor);
  const canActBottom = state.status === 'active' && humanControls(perspective) && state.current === perspective;
  const canSeeBottomHand = mode === 'ai' ? perspective === 'A' : true;

  // --- Card-flight animation ---------------------------------------------
  const lastCastRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const sourceRectRef = useRef<Rect | null>(null);
  const flownKeyRef = useRef<number>(-1);
  const [flying, setFlying] = useState<{ definitionId: string; from: Rect; to: Rect; key: number } | null>(null);

  useEffect(() => {
    const lc = presentation.lastCast;
    if (!lc || reducedMotion) return;
    if (lc.key === flownKeyRef.current) return;
    flownKeyRef.current = lc.key;

    const target = lastCastRef.current;
    if (!target) return;
    const tw = rectOf(target);
    const to: Rect = { left: tw.left + tw.width / 2 - 69, top: tw.top + 22, width: 138, height: 196 };

    let from = sourceRectRef.current;
    if (!from && handRef.current) {
      const hr = rectOf(handRef.current);
      from = { left: hr.left + hr.width / 2 - 75, top: hr.top + 8, width: 150, height: 200 };
    }
    sourceRectRef.current = null;
    if (from) setFlying({ definitionId: lc.definitionId, from, to, key: lc.key });
  }, [presentation.lastCast?.key, reducedMotion]);

  const handleHandClick = (id: string, rect?: Rect) => {
    if (humanSabotage) {
      onSabotagePick(id);
      return;
    }
    if (rect) sourceRectRef.current = rect;
    if (discardMode) onDiscard(id);
    else onCast(id);
  };

  const castable = new Set(canActBottom && !discardMode ? castableCards(state, perspective).map((c) => c.instanceId) : []);

  // Bottom hand contents: the opponent's hand during a human sabotage choice,
  // otherwise the active player's own hand.
  const handPlayer = humanSabotage ? top : bottom;
  const handFaceUp = humanSabotage ? true : canSeeBottomHand && !showPassGate;
  const handIntent = humanSabotage ? 'sabotage' : discardMode ? 'discard' : 'cast';
  const handDisabled = humanSabotage ? false : !canActBottom;

  return (
    <main className="board" style={boardBg}>
      <div className="status-bar status-bar-top">
        <PlayerPanel player={top} active={state.current === opponentId && !ended} pulses={presentation.pulses[opponentId]} />
        <PortmanteauPiles player={top} drawPulse={presentation.pulses[opponentId].draw} returnPulse={presentation.pulses[opponentId].return} />
      </div>

      <section className="duel-table" aria-label="Duel table">
        <div className="duel-wz duel-wz-left">
          <WizardView
            player={state.players.A}
            position="left"
            citadelPulse={presentation.pulses.A.citadel}
            wardPulse={presentation.pulses.A.ward}
          />
        </div>

        <div className="duel-center">
          <div className="turn-caption">
            {ended ? (
              <span className="tc-actor">⚔ {state.players[state.winner!].name} prevails</span>
            ) : (
              <>
                <span className="tc-turn">Turn {state.turn}</span>
                <span className="tc-mark" aria-hidden>⚔</span>
                <span className="tc-actor">{state.players[actor].name}</span>
              </>
            )}
          </div>
          <div className="lc-target" ref={lastCastRef}>
            <LastCastZone lastCast={presentation.lastCast} state={state} sabotaging={sabotaging} />
          </div>
          <div className="duel-log">
            <TurnLog log={log} debug={debug} />
          </div>
        </div>

        <div className="duel-wz duel-wz-right">
          <WizardView
            player={state.players.B}
            position="right"
            citadelPulse={presentation.pulses.B.citadel}
            wardPulse={presentation.pulses.B.ward}
          />
        </div>
      </section>

      <div className="status-bar status-bar-bottom">
        <PlayerPanel player={bottom} active={canActBottom || humanSabotage} pulses={presentation.pulses[perspective]} />
        <PortmanteauPiles player={bottom} drawPulse={presentation.pulses[perspective].draw} returnPulse={presentation.pulses[perspective].return} />
      </div>

      <div className="hand-zone" ref={handRef}>
        {showPassGate ? (
          <div className="pass-gate">
            <h2>Pass the table to {bottom.name}</h2>
            <p>Keep your hand hidden from your opponent.</p>
            <button type="button" className="btn btn-primary" onClick={onPassContinue}>
              I am {bottom.name} — reveal my hand
            </button>
          </div>
        ) : (
          <>
            {humanSabotage ? (
              <p className="hand-banner">Choose a card from {top.name}'s hand to return to their Portmanteau.</p>
            ) : null}
            <Hand
              player={handPlayer}
              faceUp={handFaceUp}
              intent={handIntent}
              castable={castable}
              disabled={handDisabled}
              onCardClick={handleHandClick}
              debug={debug}
              label={`${handPlayer.name} hand`}
            />
            {/* Always rendered (disabled when it isn't your turn) so the
                bottom area keeps a constant height and the duel row never
                resizes between turns. */}
            <ActionBar
              canAct={canActBottom}
              discardMode={discardMode}
              hasCast={state.turnActions.hasCast}
              discarded={state.turnActions.discarded}
              sabotaging={sabotaging}
              onToggleDiscard={() => setDiscardMode((d) => !d)}
              onEndTurn={onEndTurn}
            />
          </>
        )}
      </div>

      {flying ? (
        <FlyingCard
          key={flying.key}
          definitionId={flying.definitionId}
          from={flying.from}
          to={flying.to}
          duration={FLY_MS}
          onDone={() => setFlying(null)}
        />
      ) : null}
    </main>
  );
}
