# Card Presentation And Zones

## Card Presentation Goals

Cards should stay larger and readable, but feel more like magical artifacts.

Each card should show:

- Retheme name.
- Category/type.
- Law/Neutral/Chaos/Ward costs.
- Short rules/effect text.
- Affordability state.
- Optional original symbolic art panel.
- Debug-only source id and source name.

Do not hide rules clarity behind flavor.

## Card Frame Anatomy

Recommended card sections:

1. **Header**
   - Category medallion.
   - Retheme name.
   - Optional resource alignment accent.

2. **Art / Talisman Panel**
   - Original abstract SVG or CSS art.
   - Category/resource-specific.
   - Not copied from any source game.

3. **Cost Row**
   - Law / Neutral / Chaos / Ward pips.
   - Use color, label, and symbol.
   - Keep "Free" clear.

4. **Effect Text**
   - Generated from structured data.
   - Plain, exact, and readable.

5. **Footer**
   - Category.
   - Affordability reason when unavailable.
   - Debug source info only in debug mode.

## Suggested Category Visuals

- Attack: creature silhouette, fang/claw, projectile, flame, weapon-like mark.
- Ward: ring, wall segment, barrier stone, shield sigil.
- Citadel: tower, stronghold, raised plinth, masonry.
- Place of Power: standing stone, shrine, circle, altar.
- Boon: open hand, vessel, star, blessing mark.
- Hex: skull-like mask, thorn knot, broken sigil.
- Production: rotating circle, aligned runes, triad motif.
- Special: unique talisman, eye, portmanteau, grail, curse mark.

These can be CSS/SVG placeholders. They should look intentional.

## Zones

### Hand Zone

The hand remains the main interaction area.

Requirements:

- Current player's hand should be most prominent.
- Affordable cards should be visually actionable.
- Unaffordable cards should remain readable but subdued.
- Discard mode should be visibly different from cast mode.
- Hand cards should have stable slots to support draw/cast animations.

### Opponent Hand Zone

Requirements:

- Face-down cards should read as cards, not blank blocks.
- Hidden cards should still show card count.
- In sabotage choice state, targetable cards should reveal or highlight as needed by rules.
- In local open-table mode, both hands can be face up.

### Last-Cast Zone

This is a new major v2 zone.

Requirements:

- Show the card that was most recently cast.
- Show who cast it.
- Optional short caption: "Adept casts Manticore Volley".
- Let players understand AI turns without reading the log.
- Keep previous last cast visible until replaced, but avoid blocking gameplay.

### Portmanteau Draw Stack

This represents the player's deck.

Requirements:

- Show count.
- Show face-down stack or magical case.
- Draw/refill animations should originate here.
- Use "Portmanteau" naming.

### Return / Recycle Pulse

This represents the moment a played or discarded card returns to the owner's deck.

Important rule note:

Current mechanics return played and discarded cards to the owner's deck and reshuffle. There is no permanent discard pile.

Therefore:

- Do not label it "discard pile".
- Acceptable labels: "Return", "Returned", "Portmanteau Return", "Recycle".
- It can flash/pulse with the returned card briefly.
- It should not imply players can inspect a stable discard stack.

### Action Zone

Requirements:

- Cast by clicking affordable card.
- Discard mode toggle.
- End turn.
- Display discarded count.
- Indicate when a cast already happened and turn will pass.

V2 should keep actions simple. Do not add unnecessary menus.

## Face-Down Card Design

Face-down card backs should feel original:

- Portmanteau seal.
- Talisman pattern.
- Law/Neutral/Chaos triad.
- Dark parchment or leather back.
- No copied source pattern.

The card back should be visually distinct from disabled or unaffordable face-up cards.

## Affordability And Targeting

Affordability should use multiple cues:

- Outline or glow for castable.
- Subdued contrast for unaffordable.
- Text reason for missing resource.
- Cursor/button disabled state.

Targeting states:

- Discard mode: cards show return/discard intent.
- Sabotage mode: opponent cards show selectable target intent.
- AI turn: human controls disabled but board remains readable.

## Flavor Text

Optional v2 improvement:

- Add a short flavor subtitle or line if data is extended.
- Keep flavor separate from rules text.
- Do not let flavor obscure exact effects.

If adding flavor requires modifying card JSON, keep it additive:

```json
{
  "flavor_text": "A short original line."
}
```

Do not change existing costs/effects.
