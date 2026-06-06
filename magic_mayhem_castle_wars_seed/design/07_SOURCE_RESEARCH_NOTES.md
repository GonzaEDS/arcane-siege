# Source Research Notes

Research sources are listed in `data/source_research_manifest.json`.

## Castle Wars baseline

Primary implementation data is from the public TTS Castle Wars repo and wiki:

- Quick-start rules: two players, win by castle 100 or opponent castle 0, alternate turns, play one card or discard up to three, worker/resource system, deck validation.
- Source code: exact initial stats, hand size, deck sizes, card data, turn order, production and effect resolution.

## Magic & Mayhem reference

Research confirms these pillars:

- Wizard casts spells and summons creatures.
- Mana replenishes through Places of Power and mana sprites.
- Portmanteau combines ingredients with Law/Neutral/Chaos talismans.
- Realms include Avalon, Greece and Albion.
- The visual identity used distinctive claymation / stop-motion cutscenes.
- First-island spell/creature lists include the spells and creatures used in `data/magic_mayhem_reference_spells_creatures.json`.

## Important limitation

I did not locate a single complete, official, easily extractable database of every Magic & Mayhem creature/spell/ingredient. The seed therefore includes verified lists from accessible walkthrough/reference sources plus a field for names that need manual verification.
