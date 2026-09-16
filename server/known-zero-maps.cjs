const KNOWN_UNRATED_MAPS = Object.freeze([
  { map_code: "nrd_fild01", name_en: "Nordfeld Plains", name_de: "Nordfeld-Grasland", map_kind: "field", region: "Nordfeld" },
  { map_code: "nrd_fild02", name_en: "Nordfeld Hills", name_de: "Nordfeld-Hügel", map_kind: "field", region: "Nordfeld" },
  { map_code: "nrd_dun01", name_en: "Nordfeld Cave 1F", name_de: "Nordfeld-Höhle 1. Ebene", map_kind: "dungeon", region: "Nordfeld" },
  { map_code: "nrd_dun02", name_en: "Nordfeld Cave 2F", name_de: "Nordfeld-Höhle 2. Ebene", map_kind: "dungeon", region: "Nordfeld" },
]);

function unratedMaps(existingCodes = []) {
  const existing = new Set(existingCodes);
  return KNOWN_UNRATED_MAPS.filter((map) => !existing.has(map.map_code)).map((map) => ({
    ...map,
    data_status: "map_only",
    source: "Zero Global client map and quest metadata · verified 2026-09-09",
  }));
}

module.exports = { KNOWN_UNRATED_MAPS, unratedMaps };
