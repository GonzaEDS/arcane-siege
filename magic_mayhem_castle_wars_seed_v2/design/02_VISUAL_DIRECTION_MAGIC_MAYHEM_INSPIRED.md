# Visual Direction: Magic & Mayhem-Inspired, Original Execution

## Core Direction

V2 should feel more like:

- Old PC fantasy box art.
- Strange tabletop relics.
- Handmade/clay/idol creatures.
- Wizard duel ritual props.
- Mythic places of power.
- Slightly theatrical, slightly odd fantasy.

It should feel less like:

- A generic dark dashboard.
- A neutral web app.
- A direct Castle Wars or Magic & Mayhem clone.
- A collectible-card UI with polished modern fantasy art.

## What To Borrow As Inspiration

Borrow:

- Wizard duel framing.
- Law / Neutral / Chaos as strong visual identities.
- Summoned creatures as living spells.
- Ingredients, artifacts, talismans, and odd props.
- Places of Power as magical production sites.
- Avalon / Greece / Albion as mood-board realms.
- Stop-motion/clay creature energy.
- Tactile board-game object language.

Do not borrow:

- Official Magic & Mayhem UI.
- Official art, sprites, models, screenshots, logos, music, names, or text.
- Castle Wars or Magic Castles card artwork or UI chrome.

## Visual Pillars

### 1. Ritual Table

The board background should feel like a surface where wizards are casting:

- Dark wood.
- Worn leather.
- Smoky parchment.
- Stone inlay.
- Bronze trim.
- Chalk circles.
- Scattered talismans or abstract marks.

Avoid heavy detail that harms readability.

### 2. Handmade Cards

Cards should look like magical objects:

- Parchment or vellum body.
- Bronze/dark wood frame.
- Uneven but controlled edges.
- Type/category medallion.
- Cost pips as physical tokens or seals.
- Original abstract art panel.

The current larger card size is a strength. Keep cards readable.

### 3. Creature And Spell Identity

Replace generic glyph-only art with original symbolic panels:

- Creature silhouettes.
- Clay-idol shapes.
- Shadow puppets.
- Ritual icons.
- Abstract talisman diagrams.
- Simple SVG motifs generated from card category and resource alignment.

Do not require final production art. V2 can use procedural/SVG placeholders if they feel intentional.

### 4. Law / Neutral / Chaos

The three resources need more than letters.

Suggested original visual identities:

- **Law**: blue-white, angular runes, towers, straight lines, ordered masonry, star geometry.
- **Neutral**: ochre/green, circles, balance scales, alchemical vessels, standing stones, roots.
- **Chaos**: red/orange, jagged shapes, bone, flame, claws, broken spirals.

Keep labels visible for accessibility.

### 5. Citadel / Ward

Citadel and Ward should be board objects:

- Citadel: towers, stronghold, ritual fortress, stacked stone, or realm-specific shrine.
- Ward: shield ring, wall segments, arcane barrier stones, sigil circle.

The visuals should change with value, damage, and build events.

### 6. Portmanteau

The deck should become the Portmanteau:

- A magical case.
- A box with brass hinges.
- A bag or chest that cards emerge from.
- A tabletop prop that glows or stirs.

There should be a draw side and a return/recycle pulse area.

## Color Direction

Keep v1 palette roots:

- Basalt / dark stone.
- Smoky parchment.
- Aged bronze.
- Dark emerald.
- Moonlit blue.

Push distinct resource accents:

- Law: cool blue / white.
- Neutral: ochre / muted green / bone.
- Chaos: red / ember / blackened orange.

Avoid:

- Overly saturated rainbow UI.
- Huge gradients everywhere.
- Low-contrast text.
- Color-only resource communication.

## Typography

Current serif + system UI pairing is acceptable.

Improve by:

- Using serif for fantasy titles and card names.
- Using clean sans-serif for small numbers and controls.
- Keeping effect text readable above decoration.

Do not add remote fonts unless the project already supports them and licensing is clear. Prefer system fonts or bundled open-source fonts only if intentionally added.

## Realm Skins Later

Do not implement realm skins unless there is time after core v2.

Possible future skins:

- Avalon: misty woods, stone circles, green-gold magic.
- Greece: marble ruins, bronze, mythic beasts, sun-baked parchment.
- Albion: castles, bogs, old roads, Arthurian relics.

V2 can prepare CSS variables or component props for future skins, but should not overbuild.

## Readability Requirements

Every visual flourish must preserve:

- Numeric Citadel and Ward.
- Numeric mana and circles.
- Card cost readability.
- Card effect readability.
- Button/action clarity.
- Hidden/visible hand clarity.
- Reduced-motion support.
