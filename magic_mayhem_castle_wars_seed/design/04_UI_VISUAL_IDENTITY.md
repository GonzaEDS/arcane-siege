# UI and Visual Identity

## MVP UI layout

Desktop first, responsive later.

Top half: opponent panel.
Center: two citadel/ward meters facing each other with turn log.
Bottom half: current player panel and hand.
Right side: resources, circle production, buffs.
Left side: deck, discard/return, end turn, rule tooltip.

## Card frame

Each card should show:

- Retheme name.
- Cost pips: Law, Neutral, Chaos, and Ward if applicable.
- Type icon: Summon, Ward, Hex, Boon, Attack, Place of Power.
- Short effect text generated from structured data.
- Debug tooltip with original source card and exact effect.

## Style direction

- Backgrounds: smoky parchment, basalt, dark emerald, aged bronze, moonlit blue.
- Card art placeholders: abstract silhouettes, original glyphs, clay-idol shapes.
- Fonts: use free web-safe or open-source fonts only.
- Motion: subtle ritual sparks, ward pulses, paper-card movement.

## Accessibility

- Never rely only on color to identify resource type.
- Use icons, labels, and numeric costs.
- Provide reduced-motion option.
- Use high contrast for card cost and affordance states.
