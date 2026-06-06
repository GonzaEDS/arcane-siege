# Card Retheme Map

This is a readable version of `data/cards_v1_exact_mechanics_rethemed.json`.

| Source card | Retheme card | Cost Law/Neutral/Chaos/Ward | Exact action | Value | Bypass? |
|---|---|---:|---|---:|---|
| Add Bricks | Gather Law Mana | 0/5/0/0 | `addResource` | [8, 0, 0] | false |
| Add Crystals | Gather Neutral Mana | 0/5/0/0 | `addResource` | [0, 8, 0] | false |
| Add Weapons | Gather Chaos Mana | 0/5/0/0 | `addResource` | [0, 0, 8] | false |
| All Bricks | Align All to Law | 1/0/0/0 | `allProduce` | bricks | false |
| All Crystals | Align All to Neutrality | 0/1/0/0 | `allProduce` | crystals | false |
| All Weapons | Align All to Chaos | 0/0/1/0 | `allProduce` | swords | false |
| Ambush | Giant Bat Ambush | 0/0/20/0 | `attack` | 15 | true |
| Archer | Redcap Dart | 0/0/1/0 | `attack` | 2 | false |
| Babylon | Raise the Camelot Citadel | 28/0/0/0 | `buildCastle` | 30 | false |
| Battering Ram | Troll Ram | 7/0/0/0 | `attack` | 9 | false |
| Bomb | Brimstone Burst | 0/0/14/0 | `attack` | 18 | false |
| Bribe Builder | Subvert Law Circle | 22/0/0/0 | `stealWorker` | [1, 0, 0] | false |
| Bribe Mage | Subvert Neutral Circle | 0/22/0/0 | `stealWorker` | [0, 1, 0] | false |
| Bribe Recruit | Subvert Chaos Circle | 0/0/22/0 | `stealWorker` | [0, 0, 1] | false |
| Builder | Bind Law Circle | 8/0/0/0 | `addWorker` | [1, 0, 0] | false |
| Cannon | Manticore Volley | 0/0/16/0 | `attack` | 20 | false |
| Catapult | Brownie Stone-Cast | 10/0/0/0 | `attack` | 12 | false |
| Comet Strike | Judgement Star | 20/10/0/0 | `attack` | 30 | false |
| Conjure Wall | Tangle Vine Ward | 0/14/0/0 | `buildWall` | 20 | true |
| Curse | Overlord’s Curse | 18/18/18/0 | `curse` | 0 | true |
| Dispel | Unsummon Hexes | 2/2/2/0 | `removeBuff` | all | false |
| Dragon | Colchis Dragon | 20/20/0/0 | `attack` | 38 | false |
| Fence | Brownie Barricade | 5/0/0/0 | `buildWall` | 9 | false |
| Fire Archer | Elf Fire Arrow | 0/0/3/0 | `attack` | 5 | false |
| Giant Snowball | Hailstone Familiar | 6/6/0/0 | `attack` | 12 | false |
| Guards | Grail Knight Guard | 0/0/7/0 | `buildWall` | 12 | true |
| Hail Storm | Storm | 0/14/0/0 | `attack` | 18 | false |
| House | Wizard’s Hut | 5/0/0/0 | `buildCastle` | 5 | false |
| Knight | Skeleton Knight | 0/0/10/0 | `attack` | 12 | false |
| Large Wall | Iron Skin Rampart | 14/0/0/0 | `buildWall` | 20 | false |
| Lightning | Lightning | 0/20/0/0 | `attack` | 22 | false |
| Mage | Bind Neutral Circle | 0/8/0/0 | `addWorker` | [0, 1, 0] | false |
| Magic Bricks | Iron Skin Masonry | 0/16/0/0 | `addBuff` | build | false |
| Magic Defence | Magic Sphere | 0/10/0/0 | `addBuff` | defence | false |
| Magic Weapons | Bloodlust | 0/15/0/0 | `addBuff` | attack | false |
| Pixies | Fountain of Life | 0/18/0/0 | `buildCastle` | 22 | true |
| Platoon | Faun Mob | 0/0/7/0 | `attack` | 9 | false |
| Protect Resources | Portmanteau Seal | 0/0/4/0 | `addBuff` | resources | false |
| Quake | Gorgon Shockwave | 0/24/0/0 | `attack` | 27 | false |
| Ballista | Centaur Ballista | 4/0/4/0 | `attack` | 8 | false |
| Recruit | Bind Chaos Circle | 0/0/8/0 | `addWorker` | [0, 0, 1] | false |
| Remove Bricks | Drain Law Mana | 0/5/0/0 | `removeResource` | [8, 0, 0] | false |
| Remove Crystals | Drain Neutral Mana | 0/5/0/0 | `removeResource` | [0, 8, 0] | false |
| Remove Resources | Drain the Portmanteau | 5/5/5/0 | `removeResource` | [8, 8, 8] | false |
| Remove Weapons | Drain Chaos Mana | 0/5/0/0 | `removeResource` | [0, 0, 8] | false |
| Reverse | Reverse the Wards | 3/0/0/4 | `buildCastle` | 8 | true |
| Reward Workers | Places of Power Surge | 1/1/1/0 | `allProduce` | all | false |
| Roadblock | Tangle Vine Blockade | 0/0/8/0 | `allProduce` | none | false |
| Sabotage | Gorgon Stare Sabotage | 0/0/10/0 | `sabotage` | 0 | false |
| School | Hermetic Academy | 30/0/0/0 | `addWorker` | [1, 1, 1] | false |
| Tavern | Yeoric’s Tavern | 12/0/0/0 | `buildCastle` | 15 | false |
| Thief | Seven-League Raid | 0/0/17/0 | `thief` | 0 | false |
| Tower | Merlin’s Tower | 10/0/0/0 | `buildCastle` | 10 | false |
| Trojan Horse | Labyrinth Breach | 14/0/20/0 | `attack` | 28 | true |
| Wain | Grail Transfer | 10/0/0/0 | `wain` | 6 | true |
| Wall | Warding Circle | 4/0/0/0 | `buildWall` | 6 | false |
