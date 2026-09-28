# Odin’s Glasses 1.33.0

This release connects purchasable items in the Item Lexicon with their known NPC vendors.

## Changes

- Shows matching NPC sellers, maps, coordinates, and NPC purchase prices for purchasable items.
- Copies the corresponding `/navi map x/y` command directly from a vendor entry.
- Adds 345 purchasable item references with 1,758 NPC shop links.
- Uses exact item ID and Aegis-name matching to prevent incorrect vendor assignments.
- Clearly marks rAthena shop and price references as not automatically verified for Zero Global.
- Keeps player-market prices excluded.
- Includes the vendor links in both the Windows application and Android companion.

The Windows installer and portable build are unsigned and may trigger a Microsoft SmartScreen warning. The Android APK is signed with the project’s persistent release key.
