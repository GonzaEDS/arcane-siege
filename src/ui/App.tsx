import { useEffect, useState } from 'react';
import { useGame } from './useGame';
import { usePresentationEvents } from './usePresentationEvents';
import { useCustomDecks } from './useCustomDecks';
import { useSettings, type Settings as SettingsType } from './useSettings';
import { useSoundEffects } from './useSoundEffects';
import { setVolumes, setMusic, unlockAudio, playSfx } from './audio';
import { DECK_PRESETS, chooseMove } from '../engine';
import type { DeckList, GameState, PlayerId } from '../engine';
import { Board, type Mode } from './components/Board';
import { DeckBuilder } from './components/DeckBuilder';
import { AudioControls } from './components/AudioControls';
import { VictoryOverlay } from './components/VictoryOverlay';
import { hasArt, artUrl } from './art';

const setupBg = hasArt('title-hero')
  ? {
      backgroundImage: `linear-gradient(rgba(13,16,21,0.78), rgba(13,16,21,0.92)), url(${artUrl('title-hero')})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  : undefined;

const SELECTABLE_DECKS = Object.keys(DECK_PRESETS).filter((n) => Object.keys(DECK_PRESETS[n]).length > 0);

const MODE_LABEL: Record<Mode, string> = {
  ai: 'Versus AI',
  secret: 'Secret hot-seat',
  open: 'Open table',
};

interface BuilderSeed {
  name?: string;
  deck?: DeckList;
}

export function App() {
  const game = useGame();
  const { decks: customDecks, saveDeck, deleteDeck } = useCustomDecks();
  const { settings, update } = useSettings();
  const [mode, setMode] = useState<Mode>('ai');
  const [deckA, setDeckA] = useState('Stock');
  const [deckB, setDeckB] = useState('Stock');
  const [seed, setSeed] = useState(12345);
  const [discardMode, setDiscardMode] = useState(false);
  const [passGate, setPassGate] = useState<PlayerId | null>(null);
  const [builder, setBuilder] = useState<BuilderSeed | null>(null);

  const debug = settings.debug;
  const reducedMotion = settings.reducedMotion;
  const setDebug = (b: boolean) => update({ debug: b });
  const setReducedMotion = (b: boolean) => update({ reducedMotion: b });

  const state = game.state;
  const presentation = usePresentationEvents(game.lastBatch, reducedMotion);
  useSoundEffects(game.lastBatch);

  const resolveDeck = (name: string): DeckList => customDecks[name] ?? DECK_PRESETS[name] ?? {};

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reducedMotion ? 'true' : 'false';
  }, [reducedMotion]);

  // Keep the audio bus in sync with persisted volume settings.
  useEffect(() => {
    setVolumes({ master: settings.master, sfx: settings.sfx, music: settings.music, muted: settings.muted });
  }, [settings.master, settings.sfx, settings.music, settings.muted]);

  // Unlock audio on the first user gesture (browser autoplay policy).
  useEffect(() => {
    const handler = () => unlockAudio();
    window.addEventListener('pointerdown', handler, { once: true });
    return () => window.removeEventListener('pointerdown', handler);
  }, []);

  // Switch music between the menu and the battle depending on whether a game
  // is in progress. Files are user-supplied (Suno); missing tracks are a no-op.
  useEffect(() => {
    setMusic(state ? 'audio/music/battle.mp3' : 'audio/music/menu.mp3');
  }, [!!state]);

  // Audible feedback for rejected commands.
  useEffect(() => {
    if (game.error) playSfx('error');
  }, [game.error]);

  // Outcome sting when a match ends (win for you / neutral, lose only in vs-AI).
  useEffect(() => {
    if (!state || state.status !== 'ended') return;
    const lost = mode === 'ai' && state.winner === 'B';
    playSfx(lost ? 'lose' : 'win');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.status]);

  // Expose generated textures as CSS variables (used by cards & panels).
  useEffect(() => {
    const root = document.documentElement;
    if (hasArt('tex-parchment')) root.style.setProperty('--parchment-tex', `url(${artUrl('tex-parchment')})`);
    if (hasArt('tex-stone')) root.style.setProperty('--stone-tex', `url(${artUrl('tex-stone')})`);
  }, []);

  const aiControls = (pid: PlayerId) => mode === 'ai' && pid === 'B';

  // AI auto-play loop: one command at a time with a small delay so the
  // last-cast zone and pulses are visible between AI actions.
  useEffect(() => {
    if (!state || state.status === 'ended') return;
    const actor: PlayerId = state.status === 'awaiting_sabotage_choice' ? state.pendingSabotage!.caster : state.current;
    if (aiControls(actor)) {
      // A slower cadence so players can follow the AI's plays on the table.
      const handle = setTimeout(() => game.dispatch(chooseMove(state, actor)), reducedMotion ? 250 : 1000);
      return () => clearTimeout(handle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode, reducedMotion]);

  // Secret hot-seat: gate the table when the active human changes.
  useEffect(() => {
    if (!state || mode !== 'secret' || state.status !== 'active') return;
    setDiscardMode(false);
    setPassGate(state.current);
  }, [state?.current, state?.status, mode]);

  function startGame(seedOverride?: number) {
    setDiscardMode(false);
    setPassGate(null);
    game.dispatch({
      type: 'START_GAME',
      seed: (seedOverride ?? seed) | 0,
      deckA: resolveDeck(deckA),
      deckB: resolveDeck(deckB),
      nameA: mode === 'ai' ? 'You' : 'Wizard A',
      nameB: mode === 'ai' ? 'Adept (AI)' : 'Wizard B',
    });
  }

  function rematch() {
    const fresh = Math.floor(Math.random() * 1_000_000);
    setSeed(fresh);
    startGame(fresh);
  }

  if (!state && builder) {
    return (
      <DeckBuilder
        initialName={builder.name}
        initialDeck={builder.deck}
        presets={DECK_PRESETS}
        customDecks={customDecks}
        onSave={(name, deck) => {
          saveDeck(name, deck);
          setDeckA(name);
          setBuilder(null);
        }}
        onDelete={(name) => {
          deleteDeck(name);
          if (deckA === name) setDeckA('Stock');
          if (deckB === name) setDeckB('Stock');
          setBuilder(null);
        }}
        onCancel={() => setBuilder(null)}
      />
    );
  }

  if (!state) {
    return (
      <Setup
        mode={mode}
        setMode={setMode}
        deckA={deckA}
        setDeckA={setDeckA}
        deckB={deckB}
        setDeckB={setDeckB}
        seed={seed}
        setSeed={setSeed}
        debug={debug}
        setDebug={setDebug}
        reducedMotion={reducedMotion}
        setReducedMotion={setReducedMotion}
        settings={settings}
        update={update}
        customDeckNames={Object.keys(customDecks)}
        onNewDeck={() => setBuilder({})}
        onEditDeck={(deckName) => {
          const isCustom = !!customDecks[deckName];
          setBuilder({ name: isCustom ? deckName : '', deck: resolveDeck(deckName) });
        }}
        onStart={startGame}
      />
    );
  }

  const showPassGate =
    mode === 'secret' &&
    state.status === 'active' &&
    passGate !== null &&
    passGate === state.current &&
    !aiControls(state.current);

  return (
    <div className="game">
      <Header
        state={state}
        mode={mode}
        debug={debug}
        setDebug={setDebug}
        reducedMotion={reducedMotion}
        setReducedMotion={setReducedMotion}
        settings={settings}
        update={update}
        onReset={game.reset}
      />

      {game.error ? (
        <div className="error-banner" role="alert">
          {game.error}
        </div>
      ) : null}

      <Board
        state={state}
        mode={mode}
        presentation={presentation}
        debug={debug}
        reducedMotion={reducedMotion}
        log={game.log}
        discardMode={discardMode}
        setDiscardMode={setDiscardMode}
        showPassGate={showPassGate}
        onPassContinue={() => setPassGate(null)}
        onCast={(id) => game.dispatch({ type: 'CAST_CARD', player: state.current, cardInstanceId: id })}
        onDiscard={(id) => game.dispatch({ type: 'DISCARD_CARD', player: state.current, cardInstanceId: id })}
        onEndTurn={() => {
          setDiscardMode(false);
          game.dispatch({ type: 'END_TURN', player: state.current });
        }}
        onSabotagePick={(id) =>
          state.pendingSabotage &&
          game.dispatch({ type: 'SABOTAGE_SELECT', player: state.pendingSabotage.caster, targetCardInstanceId: id })
        }
      />

      {state.status === 'ended' ? (
        <VictoryOverlay
          state={state}
          outcome={mode === 'ai' ? (state.winner === 'A' ? 'win' : 'lose') : 'neutral'}
          onRematch={rematch}
          onNewGame={game.reset}
        />
      ) : null}
    </div>
  );
}

function Header({
  state,
  mode,
  debug,
  setDebug,
  reducedMotion,
  setReducedMotion,
  settings,
  update,
  onReset,
}: {
  state: GameState | null;
  mode: Mode;
  debug: boolean;
  setDebug: (b: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (b: boolean) => void;
  settings: SettingsType;
  update: (patch: Partial<SettingsType>) => void;
  onReset: () => void;
}) {
  return (
    <header className="app-header">
      <div className="title">
        <h1>Arcane Siege</h1>
        <span className="subtitle">Portmanteau Duels</span>
      </div>
      <div className="header-controls">
        <AudioControls settings={settings} update={update} compact />
        <span className="mode-tag">{MODE_LABEL[mode]}</span>
        {debug && state ? <code className="seed-tag">rng {state.rngState}</code> : null}
        <label className="toggle">
          <input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} />
          Reduce motion
        </label>
        <label className="toggle">
          <input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
          Debug
        </label>
        <button type="button" className="btn" onClick={onReset}>
          New game
        </button>
      </div>
    </header>
  );
}

function Setup(props: {
  mode: Mode;
  setMode: (m: Mode) => void;
  deckA: string;
  setDeckA: (s: string) => void;
  deckB: string;
  setDeckB: (s: string) => void;
  seed: number;
  setSeed: (n: number) => void;
  debug: boolean;
  setDebug: (b: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (b: boolean) => void;
  settings: SettingsType;
  update: (patch: Partial<SettingsType>) => void;
  customDeckNames: string[];
  onNewDeck: () => void;
  onEditDeck: (deckName: string) => void;
  onStart: () => void;
}) {
  const {
    mode,
    setMode,
    deckA,
    setDeckA,
    deckB,
    setDeckB,
    seed,
    setSeed,
    debug,
    setDebug,
    reducedMotion,
    setReducedMotion,
    settings,
    update,
    customDeckNames,
    onNewDeck,
    onEditDeck,
    onStart,
  } = props;

  const labelA = mode === 'ai' ? 'Your deck' : 'Wizard A deck';
  const labelB = mode === 'ai' ? 'AI deck' : 'Wizard B deck';

  const renderOptions = () => (
    <>
      {customDeckNames.length ? (
        <optgroup label="Your decks">
          {customDeckNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </optgroup>
      ) : null}
      <optgroup label="Presets">
        {SELECTABLE_DECKS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </optgroup>
    </>
  );

  return (
    <div className="setup" style={setupBg}>
      <div className="setup-card">
        <h1 className="setup-title">Arcane Siege</h1>
        <p className="setup-sub">Portmanteau Duels — a two-wizard siege of mana and wards.</p>

        <fieldset className="setup-group">
          <legend>Table</legend>
          <div className="seg seg-3">
            <button className={`seg-btn ${mode === 'ai' ? 'seg-on' : ''}`} onClick={() => setMode('ai')} type="button">
              Versus AI
            </button>
            <button className={`seg-btn ${mode === 'secret' ? 'seg-on' : ''}`} onClick={() => setMode('secret')} type="button">
              Secret hot-seat
            </button>
            <button className={`seg-btn ${mode === 'open' ? 'seg-on' : ''}`} onClick={() => setMode('open')} type="button">
              Open table
            </button>
          </div>
          <p className="seg-hint">
            {mode === 'ai'
              ? 'Play against a simple AI adept. Its hand stays hidden.'
              : mode === 'secret'
              ? 'Two players, one screen. A pass gate hides each hand on handover.'
              : 'Two players, both hands visible. Best for learning.'}
          </p>
        </fieldset>

        <div className="setup-decks">
          <label className="field">
            <span>{labelA}</span>
            <div className="deck-pick">
              <select value={deckA} onChange={(e) => setDeckA(e.target.value)}>{renderOptions()}</select>
              <button type="button" className="btn deck-edit" title="Edit / clone this deck" onClick={() => onEditDeck(deckA)}>
                ✎
              </button>
            </div>
          </label>
          <label className="field">
            <span>{labelB}</span>
            <div className="deck-pick">
              <select value={deckB} onChange={(e) => setDeckB(e.target.value)}>{renderOptions()}</select>
              <button type="button" className="btn deck-edit" title="Edit / clone this deck" onClick={() => onEditDeck(deckB)}>
                ✎
              </button>
            </div>
          </label>
        </div>

        <button type="button" className="btn deck-new" onClick={onNewDeck}>
          + Build a new deck
        </button>

        <label className="field field-seed">
          <span>Seed (deterministic shuffle)</span>
          <div className="seed-row">
            <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} />
            <button type="button" className="btn" onClick={() => setSeed(Math.floor(Math.random() * 1_000_000))}>
              Randomize
            </button>
          </div>
        </label>

        <AudioControls settings={settings} update={update} />

        <div className="setup-toggles">
          <label className="toggle">
            <input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
            Developer debug mode
          </label>
          <label className="toggle">
            <input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} />
            Reduce motion
          </label>
        </div>

        <button type="button" className="btn btn-primary btn-start" onClick={onStart}>
          Begin the siege
        </button>
      </div>
    </div>
  );
}
