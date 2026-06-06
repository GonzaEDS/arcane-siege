# Arcane Siege: Portmanteau Duels

A browser-playable, **deterministic**, local **hot-seat** (and vs-AI) two-wizard card
duel. The mechanics are a faithful clone of the Castle Wars baseline; the theme,
names, and art placeholders are original and inspired by Magic & Mayhem.

> Working title is intentionally original. No copyrighted assets, logos, audio,
> sprites, or screenshots from Magic & Mayhem or Castle Wars are used. Source
> card names are kept in data for QA only and surfaced through Debug mode.

## Quick start

```bash
npm install
npm run dev        # play at http://localhost:5173
npm test           # run the engine unit + integration tests
npm run build      # type-check + production build
npm run typecheck  # type-check only
```

## How to play

- Each wizard starts with **30 Citadel, 10 Ward**, and **2 circles + 5 mana** of
  each school (Law / Neutral / Chaos).
- On your turn you may **cast one card** *or* **discard 1–3 cards** to cycle, then
  the turn passes. You can also end the turn manually.
- Resources are generated at the **start of your turn**, except on the first two
  turns of the game.
- Normal damage hits **Ward** first and overflows to the **Citadel**; bypass
  damage hits the Citadel directly.
- **Win** by raising your Citadel to **100+**, or by reducing the opponent's
  Citadel to **0**.

Pick a table on the setup screen, choose decks, and a seed (the shuffle is fully
deterministic for a given seed):

- **Versus AI** — your hand is face up; the AI adept's hand stays hidden.
- **Secret hot-seat** — two players share one screen; a pass gate hides each
  hand on handover.
- **Open table** — both hands are face up, for learning and casual play.

Besides the built-in presets you can **build your own decks**: on the setup
screen choose "Build a new deck" (or ✎ to clone/edit a selected deck). The
builder enforces the deck rules live (50–280 cards, max 5 copies each) and saves
to your browser; custom decks then appear in both wizards' deck pickers.

The board is a ritual table: each wizard has a visual **Citadel** (a tower that
rises and brightens with value, cracks when damaged) and **Ward** (an arcane
barrier ring), plus a **Portmanteau** draw case and a **Return** pulse. The most
recently cast spell appears in the central **last-cast** focus so AI turns are
easy to follow. Cards that are cast or returned go back into the owner's deck and
reshuffle — there is no permanent discard pile.

## Architecture

The engine is a **pure, serializable, deterministic state machine** kept entirely
separate from the UI. React only dispatches commands and reads state.

```
src/
  data/                 # canonical JSON, copied verbatim from the seed
    cards.json          # 56 cards: exact costs/effects, rethemed names
    deck_presets.json   # Stock, Stock Plus, Complete, Rush, Turtle, Burn, ...
    rules.json          # baseline stats / constraints (reference)
    test_scenarios.json # scenario reference
  engine/
    types.ts            # state, cards, effects, commands
    rng.ts              # seeded mulberry32 + Fisher-Yates shuffle
    rules.ts            # baseline constants + deck validation
    cards.ts            # catalog, affordability, generated effect text
    effects.ts          # every effect op (damage, buffs, curse, thief, ...)
    reducer.ts          # reduce(state, command) -> { state, events, error? }
    legal.ts            # legal-move helpers (shared by UI + AI)
    ai.ts               # greedy deterministic AI
    tests/              # vitest: scenarios, per-action, full-game integration
  ui/                   # React presentation (no game logic lives here)
    App.tsx             # orchestration: setup, modes, AI loop, pass gate
    useGame.ts          # thin store; exposes per-dispatch event batches
    usePresentationEvents.ts  # turns GameEvents into transient animation state
    components/
      Board.tsx         # perspective + visibility + zone layout
      PlayerZone.tsx    # status panel + hand + Portmanteau piles
      CitadelWardView.tsx  # SVG fortress + ward, reacts to damage/build pulses
      LastCastZone.tsx  # central focus for the most recent cast
      PortmanteauPiles.tsx # draw case + return pulse
      Hand.tsx, Card.tsx, CardArt.tsx, CardBack.tsx
      PlayerPanel.tsx, ActionBar.tsx, TurnLog.tsx
```

### V2 presentation layer

The engine stays pure and instant; all animation is UI-only. `useGame` surfaces
the events from each dispatch as a batch, and `usePresentationEvents` maps them to
short-lived pulses (damage/build/resource/buff/draw/return) plus the last-cast
card, cleaning them up with timers. Nothing here feeds back into the engine, and
everything degrades to simple fades under the **Reduce motion** toggle. Card art
is original procedural SVG keyed to gameplay category and resource alignment
(Law cool-blue, Neutral ochre/bone, Chaos ember).

### Commands

`START_GAME(seed, deckA, deckB)`, `CAST_CARD`, `DISCARD_CARD`, `END_TURN`,
`SABOTAGE_SELECT`. Each call returns the next immutable state plus the events
emitted during the transition. Illegal commands return the original state and an
`error` string — bugs surface in the log instead of corrupting state.

## Faithful-clone details & documented source quirks

- **Affordability ignores Ward cost**: casting still subtracts the Ward cost down
  to a floor of 0 (e.g. *Reverse the Wards* is castable below 4 Ward).
- **Thief** grants the caster resources *before* attempting removal, so a target's
  resource seal can leave their pools intact while the thief still profits. This
  source quirk is preserved deliberately and logged.
- **Buffs** are one-shot: attack doubles the next outgoing attack, build doubles
  the next construction, defence negates the next incoming attack, and the
  resource seal blocks the next drain — each consumed on use.
- Played and discarded cards return to the owner's deck and the deck is reshuffled
  (with the seeded RNG) for determinism.

## Tests

`npm test` covers: start state vs baseline, hand size, first-two-turn production
exception, normal/overflow/bypass damage, every buff and its consumption timing,
resource protection, the Reverse ward quirk, the Curse composite, Sabotage
interruption + replacement draw, Thief with/without protection, both win
conditions, deck validation (min 50 / max 280 / max 5 copies), and a full-game
integration run across many seeds that asserts termination and no invalid state.

## Generated art (FLUX via Higgsfield)

Card art, the card back, the board background, and the title hero are generated
with FLUX.2 and cached under `public/art/`. The art direction lives in
`scripts/art-direction.mjs`: one shared **retro dark-fantasy / late-90s box-art**
style plus per-school accents — **Law** (cool blue, ordered marble & runes),
**Neutral** (ochre/bone, standing stones & alchemy), **Chaos** (ember red, fire
& bone). Prompts are derived from the card data so the deck reads as one set.

```bash
# Credentials live in src/.env.local (gitignored):
#   HIGGSFIELD_API_KEY=...   HIGGSFIELD_API_SECRET=...
npm run art                       # generate any missing art (cached by id)
npm run art -- --force            # regenerate everything
npm run art -- --only 149203,card-back
npm run art -- --tier max --resolution 2k   # higher quality / cost
npm run art -- --probe            # check model ids without spending credits
```

Beyond card art it also generates **medallion emblems** for Law/Neutral/Chaos
(plus Ward/Citadel), used as the resource pips/badges/circles/vitals, and
**parchment/stone textures** for the cards and panels. Typography is the
self-hosted SIL-OFL pair **Cinzel** (engraved display: titles, names, numbers)
and **EB Garamond** (antique body/rules text).

The runner writes a manifest to `src/ui/artManifest.json`. The UI
(`src/ui/components/CardArtFrame.tsx`, `CardBack.tsx`) uses a generated image
when its id is in the manifest and **falls back to the procedural SVG** if the
id is missing or the image fails to load — so the game always renders, with or
without generated art. PNGs are gitignored (regenerate with `npm run art`).

## Sound & music

Sound effects are generated with **ElevenLabs** (text-to-sound) and cached under
`public/audio/sfx/`. They're driven by the same engine events as the visuals
(one cast cue per card category, impacts, builds, resource/buff cues, win/lose).

```bash
npm run sfx                 # generate missing SFX
npm run sfx -- --force      # regenerate all
npm run sfx -- --probe      # validate credentials
```

**Music is provided by you (Suno).** Drop two loops here and they play
automatically (menu vs. battle); if absent, the game is simply silent music-wise:

- `public/audio/music/menu.mp3`
- `public/audio/music/battle.mp3`

Volumes (master / SFX / music) and mute are in the header and setup screen and
persist via `localStorage` (`useSettings`).

## Animated cards (fal.ai)

Each card's still art can be animated into a short looping "living painting"
clip via **fal.ai** (image-to-video, LTX). Clips play in the central last-cast
focus when a card is cast; everything falls back to the still + CSS effects if a
clip is absent.

```bash
npm run video -- --only 149203   # one card (smoke test)
npm run video                    # all cards that have art
npm run video -- --model fal-ai/wan-i2v   # try another model
```

Clips are written to `public/video/<id>.mp4` (gitignored) with a committed
`src/ui/videoManifest.json`.

## Debug mode

Toggle **Debug** to reveal each card's original source name and id, structured
event payloads in the turn log, and the live RNG state.
