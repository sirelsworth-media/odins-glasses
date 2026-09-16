# Contributing to Odin’s Glasses

Thank you for helping improve Odin’s Glasses. Keep changes small, explain the user
problem they solve, and include the checks needed to review them.

## Before submitting a change

1. Install the locked dependencies with `npm ci`.
2. Run `npm run verify`.
3. For interface changes, run `npm run test:ui` and check all three themes.
4. Describe the source and confidence of every new game-data field.

## Data contributions

Do not copy databases, prose, screenshots, sprites, videos, or tables from a
third party unless its terms explicitly allow redistribution. Public facts can
be recorded as individual claims with a source URL, observation date, server,
patch context, and verification status. A source that confirms one field does
not automatically confirm other fields for the same monster, item, or map.

Unknown values must remain unknown. Do not convert missing values into zero or
estimate player-market prices. Conflicting claims must stay visible until they
are resolved.

## Artwork contributions

Do not commit original game sprites or copied artwork. New illustrations must
be independently created and must include enough provenance for the project to
document their licensing. See `ASSET-LICENSES.md` for the current policy.

## Pull requests

Explain what changed, why it changed, and how it was tested. Update source and
license notices when a change introduces a dependency, dataset, or asset.
