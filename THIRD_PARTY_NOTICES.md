# Third-party notices

Odin’s Glasses is an unofficial fan project and is not affiliated with Gravity,
Gravity Game Unite, or the rAthena project.

## RagnaDex

The application obtains monster, item, drop, spawn, normal-dungeon, and MVP
reference data at runtime from the RagnaDex Open API:

https://ragnadex.com/en/api/

RagnaDex explicitly permits use in tools under the condition that RagnaDex is
named and that the upstream origin is passed along. Its data is described as a
combination of game-client data, rAthena data under GPL-3.0, and community
contributions. Each field can carry its own Zero verification status. Zero
Hunter preserves this distinction and does not treat every reference value as
confirmed for Ragnarok Zero Global.

## rAthena

Copyright (C) rAthena Development Team and contributors.
License: GPL-3.0-or-later.

Included and modified sources:

- `assets/rathena-behavior/`
- `assets/crafting-sources/`
- `assets/economy-sources/` (NPC price references; fixed upstream revision and importer included)

Those directories contain upstream revisions, complete license texts,
modification notices, editable source inputs, and rebuild information. Zero
Hunter's own source code is distributed under GPL-3.0-or-later as the
conservative compatibility choice.

## Runtime libraries

- React and React DOM: MIT License.
- Electron: MIT License; packaged Electron distributions also include Chromium
  and third-party license notices.

The application build must retain Electron's `LICENSE.electron.txt` and
`LICENSES.chromium.html` files. Development tools are not redistributed as
standalone products; their package licenses remain in the locked dependency
tree.

## Prontera.info

As of Odin’s Glasses 1.28.0, Prontera.info is not queried or displayed by the
application. Earlier internal builds used its dungeon and boss endpoints.
Those calls and remote images were removed because no explicit API reuse
license was identified during the project review.

## Ragnarok notice

Ragnarok Online and related names, characters, and game content are associated
with their respective rights holders, especially Gravity Co., Ltd. and Lee
Myoungjin (studio DTDS). Their marks and underlying intellectual property are
not licensed by the Odin’s Glasses GPL license.

## Money Helper and skills (1.29.0)

Money Helper derives expected gross NPC revenue from RagnaDex drop probabilities and identity-matched rAthena reference prices. Prices are not Zero Global verified; unknown values remain unknown. Map population products are not hourly income. No player-market prices are used.

The class and skill reference loads https://ragnadex.com/api/skills.json. RagnaDex identifies its sources as rAthena and community data. Quest status and per-level reference values retain their source status; the UI does not label them as independently verified.
