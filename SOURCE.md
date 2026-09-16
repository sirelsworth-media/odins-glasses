# Source and reproducible build information

This document applies to Odin’s Glasses 1.31.0.

## Requirements

- Windows x64
- Node.js with npm
- The exact dependencies from `package-lock.json`

## Build

1. Install the locked dependency tree with `npm ci`.
2. Run all static, unit, data, and production-build checks with `npm run verify`.
3. Run the hidden Electron UI check with
   `npm run test:ui`.
4. Build the Windows installer and portable package with `npm run dist`.

The source package corresponding to a binary release must include at least:

- `main.cjs`, `preload.cjs`, `api.cjs`, `server/`, and `renderer/`;
- `scripts/`, including the data conversion and verification scripts;
- `assets/rathena-behavior/`, `assets/crafting-sources/`, and `assets/economy-sources/`;
- `package.json`, `package-lock.json`, `tsconfig.json`, and `vite.config.mjs`;
- `LICENSE`, `THIRD_PARTY_NOTICES.md`, `ASSET-LICENSES.md`, and this file.

Generated release directories, `node_modules`, local caches, screenshots, and
temporary image-generation inputs are not required to rebuild the software and
are excluded from the source archive.

The private birthday edition and its audio file are not part of the public
repository or normal release. They are unrelated to the reproducible standard
build and have no documented public redistribution license.

## Verification scope

`npm run verify` does not prove game-data correctness. It checks compilation,
data identity rules, security allowlisting, behavior isolation, item icon
coverage, and the production renderer build. RagnaDex values retain their
individual source status in the application.


NPC reference prices can be regenerated with `node scripts/import-npc-prices.cjs`. The importer uses the upstream schema Sell or floor(Buy/2), excludes NoSell entries and unspecified prices, and retains ID/Aegis identity. YAML duplicate keys in unrelated upstream records are read with last-key semantics (`json: true`). Original sources are unchanged.
