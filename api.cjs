const { npcPrice } = require('./server/npc-prices.cjs');
const RAGNADEX = "https://ragnadex.com/api";
const { fetchJson, cached } = require("./server/http.cjs");
const { createApiHandler } = require("./server/router.cjs");
const { behaviorFor } = require("./server/behavior.cjs");
const { unratedMaps } = require("./server/known-zero-maps.cjs");

// Direct observations from the Zero Global client take precedence over reference data.
const GLOBAL_EXP = {
  1019: { base: 315, job: 63, evidence: "Zero Global: 472 / 94 EXP bei 150%-Event" },
  1174: { base: 237, job: 47, evidence: "Zero Global: 355 / 70 EXP bei 150%-Event" },
};
const GLOBAL_MONSTER_OVERRIDES = {
  1037: {
    defense: 131, magicDefense: 15,
    elementModifiers: { Neutral: 100, Water: 150, Earth: 150, Fire: 150, Wind: 150, Poison: 0, Holy: 75, Shadow: 75, Ghost: 75, Undead: 75 },
    evidence: "Zero-Global-Client · DEF/MDEF und Elementwerte bestätigt · 03.09.2026",
  },
  1139: {
    defense: 117, magicDefense: 0,
    elementModifiers: { Neutral: 100, Water: 100, Earth: 25, Fire: 150, Wind: 90, Poison: 150, Holy: 100, Shadow: 100, Ghost: 100, Undead: 100 },
    evidence: "Zero-Global-Client · DEF/MDEF und Elementwerte bestätigt · 03.09.2026",
  },
};
const MONSTER_SIZE_ORDER = { Small: 0, Medium: 1, Large: 2 };
const WEAPON_TYPES = new Set(["Weapon", "Bow", "Dagger", "Sword", "Mace", "Katar", "Book", "Knuckle", "Whip", "Instrument", "One-Handed Axe", "Two-Handed Axe", "One-Handed Spear", "Two-Handed Spear", "One-Handed Staff", "Two-Handed Staff", "Two-Handed Sword"]);
const ARMOR_TYPES = new Set(["Armor", "Garment", "Helm", "Helmet", "Headgear", "Shield", "Shoes", "Accessory", "Accessory (Right)", "Accessory (Left)"]);

function numberOrNull(value) {
  return value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
}

async function ragnadexMonsters() {
  return cached("ragnadex:monsters:v1", 60 * 60 * 1000, () => fetchJson(`${RAGNADEX}/monsters.json`), { persistent: true, staleWhileRevalidate: true });
}

async function ragnadexItems() {
  return cached("ragnadex:items:v1", 60 * 60 * 1000, () => fetchJson(`${RAGNADEX}/items.json`), { persistent: true, staleWhileRevalidate: true });
}

async function ragnadexMvps() {
  return cached("ragnadex:mvps:v1", 60 * 60 * 1000, () => fetchJson(`${RAGNADEX}/mvp.json`), { persistent: true, staleWhileRevalidate: true });
}

function normalizeElement(element) {
  return element === "Dark" ? "Shadow" : element || "Neutral";
}

function normalizeAttribute(value) {
  const aliases = {
    Detector: "Detects Hidden", Mvp: "MVP", IgnoreMagic: "Immune to Magic", IgnoreMelee: "Immune to Melee",
    IgnoreMisc: "Immune to Misc", IgnoreRanged: "Immune to Ranged", KnockBackImmune: "Cannot Be Knocked Back", FixedItemDrop: "Fixed Item Drop",
    Aggressive: "Aggressive", Boss: "Boss", "Cast Sensor": "Cast Sensor (Idle)", "Can Move": "Can Move",
  };
  return aliases[value] || value;
}

function normalizeSpawns(raw) {
  const found = new Map();
  for (const location of raw.fundorte || []) {
    const perMap = location.je_karte && typeof location.je_karte === "object" ? Object.entries(location.je_karte) : [];
    if (perMap.length) {
      for (const [code, count] of perMap) found.set(code, { code, name: location.name || location.name_de || code, count: numberOrNull(count), count_kind: "RagnaDex/rAthena estimate" });
      continue;
    }
    for (const code of location.karten || []) found.set(code, { code, name: location.name || location.name_de || code, count: numberOrNull(location.anzahl), count_kind: "RagnaDex/rAthena estimate" });
  }
  return [...found.values()];
}

function normalizeMonster(raw, itemsById) {
  const id = Number(raw.id);
  const observation = GLOBAL_EXP[id];
  const globalOverride = GLOBAL_MONSTER_OVERRIDES[id];
  const zeroFields = new Set(Array.isArray(raw.zero_felder) ? raw.zero_felder : []);
  const expVerifiedByRagnaDex = zeroFields.has("basis_exp") && zeroFields.has("job_exp");
  const hp = Number(raw.hp || 0);
  const baseExp = observation?.base ?? Number(raw.basis_exp || 0);
  const jobExp = observation?.job ?? Number(raw.job_exp || 0);
  return {
    monster_id: id, name_en: raw.name || raw.aegis || `Monster #${id}`, aegis_name: raw.aegis || String(id),
    level: Number(raw.level || 0), hp, base_exp: baseExp, job_exp: jobExp,
    exp_per_hp: hp > 0 ? baseExp / hp : 0, total_exp_per_hp: hp > 0 ? (baseExp + jobExp) / hp : 0,
    element: normalizeElement(raw.element), element_level: Number(raw.element_level || 1), element_modifiers: globalOverride?.elementModifiers || raw.elementtabelle || null,
    race: raw.race || "Unknown", size: raw.size || "Unknown", image_url: "",
    defense: numberOrNull(globalOverride?.defense ?? raw.def), magic_defense: numberOrNull(globalOverride?.magicDefense ?? raw.mdef), attack_min: numberOrNull(raw.atk), attack_max: numberOrNull(raw.atk),
    matk_min: numberOrNull(raw.matk), matk_max: numberOrNull(raw.matk), flee_95: numberOrNull(raw.flee_95), hit_100: numberOrNull(raw.hit_100),
    str: numberOrNull(raw.str), agi: numberOrNull(raw.agi), vit: numberOrNull(raw.vit), int_stat: numberOrNull(raw.int), dex: numberOrNull(raw.dex), luk: numberOrNull(raw.luk),
    zeny_per_kill: numberOrNull(raw.zeny_pro_kill),
    exp_source: observation?.evidence || (expVerifiedByRagnaDex ? "RagnaDex · Zero-Global-bestätigt" : "RagnaDex · nicht Zero-Global-bestätigte Referenz"),
    exp_source_kind: observation ? "global_measurement" : expVerifiedByRagnaDex ? "ragnadex_zero_verified" : "ragnadex_reference",
    global_override_evidence: globalOverride?.evidence || null,
    special_attributes: (Array.isArray(raw.merkmale) ? raw.merkmale : raw.merkmale ? [raw.merkmale] : []).map((status) => ({ status_en: normalizeAttribute(status) })),
    ...behaviorFor(raw),
    drops: (raw.drops || []).map((drop) => {
      const item = itemsById?.get(Number(drop.item_id));
      const section = item ? itemSection(item) : null;
      return { item_id: Number(drop.item_id), name_en: drop.name || item?.name || item?.name_de || `Item #${drop.item_id}`, category: item?.typ === "Card" ? "Card" : section === "weapon" ? "Weapon" : section === "armor" ? "Armor" : section === "costume" ? "Costume" : item?.typ || "Unknown", rate_percent: numberOrNull(drop.rate), rate_known: numberOrNull(drop.rate) != null, npc_sell_price: npcPrice(item), image_url: null };
    }),
    spawns: normalizeSpawns(raw),
  };
}

async function allMonsters() {
  const [payload, itemPayload] = await Promise.all([ragnadexMonsters(), ragnadexItems()]);
  const rawItems = Array.isArray(itemPayload) ? itemPayload : itemPayload.items || [];
  const itemsById = new Map(rawItems.map((item) => [Number(item.id), item]));
  return (Array.isArray(payload) ? payload : payload.items || []).map((monster) => normalizeMonster(monster, itemsById));
}

function rankMonsters(items, sort) {
  return items.sort((a, b) => sort === "level" ? a.level - b.level
    : sort === "total" ? b.total_exp_per_hp - a.total_exp_per_hp
    : sort === "loot" ? Number(b.zeny_per_kill || 0) - Number(a.zeny_per_kill || 0)
    : sort === "sizeAsc" ? (MONSTER_SIZE_ORDER[a.size] ?? 3) - (MONSTER_SIZE_ORDER[b.size] ?? 3) || a.level - b.level
    : sort === "sizeDesc" ? (MONSTER_SIZE_ORDER[b.size] ?? -1) - (MONSTER_SIZE_ORDER[a.size] ?? -1) || a.level - b.level
    : b.exp_per_hp - a.exp_per_hp);
}

async function monstersApi(url) {
  const min = Math.max(1, Number(url.searchParams.get("min") || 1));
  const max = Math.max(min, Number(url.searchParams.get("max") || 50));
  const element = url.searchParams.get("element") || "Fire";
  const sort = url.searchParams.get("sort") || "exp";
  return cached(`monsters:ragnadex:${min}:${max}:${element}:${sort}`, 15 * 60 * 1000, async () => {
    const all = await allMonsters();
    const matches = all.filter((mob) => mob.level >= min && mob.level <= max && (element === "All" || mob.element === element) && mob.hp > 0 && mob.base_exp > 0 && mob.spawns.length > 0);
    return { total: matches.length, items: rankMonsters(matches, sort), source: "RagnaDex open API + Zero Global overrides" };
  });
}

async function searchApi(url) {
  const query = String(url.searchParams.get("q") || "").trim().toLowerCase();
  if (query.length < 2 && !/^\d+$/.test(query)) return { items: [], source: "RagnaDex open API" };
  return cached(`search:ragnadex:${query}`, 15 * 60 * 1000, async () => {
    const all = await allMonsters();
    const items = all.filter((mob) => `${mob.monster_id} ${mob.name_en} ${mob.aegis_name}`.toLowerCase().includes(query))
      .sort((a, b) => Number(String(a.monster_id) !== query) - Number(String(b.monster_id) !== query) || Number(!a.name_en.toLowerCase().startsWith(query)) - Number(!b.name_en.toLowerCase().startsWith(query)) || a.name_en.localeCompare(b.name_en)).slice(0, 40);
    return { items, total: items.length, source: "RagnaDex open API + Zero Global overrides" };
  });
}

function itemSection(raw) {
  if (raw.typ === "Card") return "card";
  if (raw.typ === "Costume" || raw.typ === "Costume Gear") return "costume";
  if (WEAPON_TYPES.has(raw.typ)) return "weapon";
  if (ARMOR_TYPES.has(raw.typ)) return "armor";
  if (raw.typ === "PetEgg") return "pet_egg";
  if (raw.typ === "PetArmor") return "pet_equipment";
  if (raw.typ === "Ammo") return "ammo";
  if (raw.typ === "Special Equipment") return "equipment";
  if (["Usable", "DelayConsume", "Cash"].includes(raw.typ)) return "consumable";
  return raw.typ === "Etc" ? "material" : "etc";
}

function itemSubtype(raw, section) {
  const subtypeAliases = {
    "1hSword": "One-handed Sword", "2hSword": "Two-handed Sword", "1hAxe": "One-handed Axe", "2hAxe": "Two-handed Axe",
    "1hSpear": "One-handed Spear", "2hSpear": "Two-handed Spear", Staff: "One-handed Staff", "2hStaff": "Two-handed Staff",
    Musical: "Instrument", Arrow: "Arrow", Shuriken: "Shuriken", Kunai: "Kunai", Huuma: "Huuma Shuriken",
  };
  if (raw.untertyp) return subtypeAliases[raw.untertyp] || raw.untertyp;
  if (section === "weapon" && raw.typ !== "Weapon") return raw.typ;
  if ((section === "armor" || section === "card") && raw.plaetze?.length) return raw.plaetze[0].replace("Right_Hand", "Weapon").replace("Left_Hand", "Shield");
  return null;
}

function normalizeItem(raw) {
  const source = itemSection(raw);
  return {
    key: `${source}:${raw.id}`, source, source_slug: raw.aegis || String(raw.id), item_id: Number(raw.id), name_en: raw.name || raw.name_de || `Item #${raw.id}`,
    category: raw.typ === "Card" ? "Card" : source === "weapon" ? "Weapon" : source === "armor" ? "Armor" : source === "costume" ? "Costume" : raw.typ || "Unknown",
    subtype: itemSubtype(raw, source), icon_url: null, resolved: true, attack: numberOrNull(raw.atk), defense: numberOrNull(raw.def), required_level: numberOrNull(raw.stufe_min), slots: numberOrNull(raw.slots), buy_price: null, sell_price: null,
  };
}

function itemMatches(raw, query) {
  const needle = query.toLowerCase();
  return [raw.id, raw.name, raw.name_de, raw.aegis].some((value) => String(value ?? "").toLowerCase().includes(needle));
}

async function itemSearchApi(url) {
  const section = String(url.searchParams.get("section") || "all");
  const query = String(url.searchParams.get("q") || "").trim();
  const subtype = String(url.searchParams.get("subtype") || "").trim().toLowerCase();
  const page = Math.max(0, Number(url.searchParams.get("page") || 0));
  const limit = 40;
  return cached(`item-search:ragnadex:${section}:${subtype}:${query}:${page}`, 15 * 60 * 1000, async () => {
    const payload = await ragnadexItems();
    let matches = (Array.isArray(payload) ? payload : payload.items || []).filter((raw) => {
      const detected = itemSection(raw);
      return (section === "all" || detected === section) && (!query || itemMatches(raw, query)) && (!subtype || String(itemSubtype(raw, detected) || "").toLowerCase() === subtype);
    });
    matches.sort((a, b) => Number(!String(a.name || "").toLowerCase().startsWith(query.toLowerCase())) - Number(!String(b.name || "").toLowerCase().startsWith(query.toLowerCase())) || String(a.name || "").localeCompare(String(b.name || "")));
    return { items: matches.slice(page * limit, (page + 1) * limit).map(normalizeItem), total: matches.length, page, limit, source: "RagnaDex open API" };
  });
}

function itemDescription(raw) {
  if (!Array.isArray(raw.wirkung)) return typeof raw.wirkung === "string" ? raw.wirkung : null;
  return raw.wirkung.map((entry) => entry.en || entry.de || "").filter(Boolean).join("\n");
}

function normalizeItemDetail(raw, monsters) {
  const source = itemSection(raw);
  const mobById = new Map(monsters.map((mob) => [mob.monster_id, mob]));
  const droppedBy = [...(raw.faellt_von || []), ...(raw.faellt_von_andere || [])].map((drop) => {
    const mob = mobById.get(Number(drop.monster_id));
    return { monster_id: numberOrNull(drop.monster_id), name_en: drop.name || mob?.name_en || "Unknown monster", aegis_name: mob?.aegis_name || null, level: mob?.level ?? null, image_url: null, rate_percent: numberOrNull(drop.rate), rate_kind: numberOrNull(drop.rate) == null ? "unknown" : "percentage", raw_rate: drop.rate ?? null };
  }).sort((a, b) => Number(b.rate_percent ?? -1) - Number(a.rate_percent ?? -1));
  return {
    source, source_slug: raw.aegis || String(raw.id), item_id: Number(raw.id), name_en: raw.name || raw.name_de || `Item #${raw.id}`, name_zh: null, aegis_name: raw.aegis || null,
    category: raw.typ === "Card" ? "Card" : source === "weapon" ? "Weapon" : source === "armor" ? "Armor" : source === "costume" ? "Costume" : raw.typ || "Unknown",
    subtype: itemSubtype(raw, source), slot: raw.plaetze?.join(", ") || null, description: itemDescription(raw), icon_url: null, slots: numberOrNull(raw.slots),
    attack: numberOrNull(raw.atk), magic_attack: numberOrNull(raw.matk), defense: numberOrNull(raw.def), magic_defense: null, weapon_level: numberOrNull(raw.waffenstufe), required_level: numberOrNull(raw.stufe_min), weight: numberOrNull(raw.gewicht),
    buy_price: null, sell_price: null, equip_jobs: Array.isArray(raw.jobs) ? raw.jobs.join(", ") : raw.jobs || null, can_trade: null, refinable: raw.aufwertbar == null ? null : Boolean(raw.aufwertbar), element: raw.element || null, card_prefix_name: null, dropped_by: droppedBy,
  };
}

async function itemDetailApi(url) {
  const id = String(url.searchParams.get("id") || "").trim();
  const slug = String(url.searchParams.get("slug") || "").trim().toLowerCase();
  if (!/^\d+$/.test(id) && !slug) throw new Error("Item-ID oder Itemname fehlt");
  return cached(`item-detail:ragnadex:${id}:${slug}`, 60 * 60 * 1000, async () => {
    const [itemsPayload, monsters] = await Promise.all([ragnadexItems(), allMonsters()]);
    const raw = (Array.isArray(itemsPayload) ? itemsPayload : itemsPayload.items || []).find((item) => String(item.id) === id || String(item.aegis || "").toLowerCase() === slug || String(item.id) === slug);
    if (!raw) throw new Error("Item nicht in RagnaDex gefunden");
    return { item: normalizeItemDetail(raw, monsters), source: "RagnaDex open API" };
  });
}

const NORMAL_DUNGEON_PATTERNS = [/^anthell\d{2}$/i, /^prt_sewb\d$/i, /^pay_dun\d{2}$/i, /^gef_dun\d{2}$/i, /^iz_dun\d{2}$/i, /^treasure_n\d$/i, /^moc_pryd\d{2}$/i, /^in_sphinx\d$/i, /^orcsdun\d{2}$/i, /^mjo_dun\d{2}$/i, /^prt_maze\d{2}$/i, /^beach_dun\d?$/i, /^alde_dun\d{2}$/i, /^ama_dun\d{2}$/i, /^ayo_dun\d{2}$/i, /^ein_dun\d{2}$/i, /^gon_dun\d{2}$/i, /^lou_dun\d{2}$/i, /^lhz_dun\d{2}$/i];
function isNormalDungeon(code) { return NORMAL_DUNGEON_PATTERNS.some((pattern) => pattern.test(String(code || ""))); }

async function fieldsApi() {
  return cached("fields:ragnadex:v1", 60 * 60 * 1000, async () => {
    const monsters = await allMonsters();
    const maps = new Map();
    for (const mob of monsters) for (const spawn of mob.spawns || []) {
      if (!/_fild\d{2}[a-z]?$/i.test(spawn.code) && !isNormalDungeon(spawn.code)) continue;
      if (!maps.has(spawn.code)) maps.set(spawn.code, { code: spawn.code, name: spawn.name, members: [] });
      maps.get(spawn.code).members.push({ monster_id: mob.monster_id, name_en: mob.name_en, aegis_name: mob.aegis_name, level: mob.level, hp: mob.hp, base_exp: mob.base_exp, job_exp: mob.job_exp, exp_per_hp: mob.exp_per_hp, element: mob.element, element_level: mob.element_level, element_modifiers: mob.element_modifiers, count: spawn.count, count_kind: spawn.count_kind, is_variant: /^C[1-5]_/i.test(mob.aegis_name) });
    }
    const fields = [...maps.values()].map((field) => {
      const members = field.members;
      const weightOf = (member) => member.count || 1;
      const totalWeight = members.reduce((sum, member) => sum + weightOf(member), 0);
      const expMembers = members.filter((member) => member.exp_per_hp > 0);
      const expWeight = expMembers.reduce((sum, member) => sum + weightOf(member), 0);
      const baseMembers = members.filter((member) => member.base_exp > 0);
      const baseWeight = baseMembers.reduce((sum, member) => sum + weightOf(member), 0);
      return { map_code: field.code, name_en: field.name || field.code, map_kind: isNormalDungeon(field.code) ? "dungeon" : "field", monster_count: members.length, known_spawn_total: members.reduce((sum, member) => sum + (member.count || 0), 0), average_level: members.reduce((sum, member) => sum + member.level * weightOf(member), 0) / Math.max(totalWeight, 1), min_level: Math.min(...members.map((member) => member.level)), max_level: Math.max(...members.map((member) => member.level)), average_exp_per_hp: expMembers.reduce((sum, member) => sum + member.exp_per_hp * weightOf(member), 0) / Math.max(expWeight, 1), average_base_exp_per_kill: baseMembers.reduce((sum, member) => sum + member.base_exp * weightOf(member), 0) / Math.max(baseWeight, 1), monsters: members.sort((a, b) => b.level - a.level) };
    });
    return { fields, unrated_maps: unratedMaps(fields.map((field) => field.map_code)), source: "RagnaDex open API; client-confirmed maps without public monster data remain unrated" };
  });
}

async function dungeonsApi() {
  return cached("dungeons:ragnadex:v2", 30 * 60 * 1000, async () => {
    const { fields, unrated_maps: unrated = [] } = await fieldsApi();
    const maps = fields.filter((field) => field.map_kind === "dungeon").map((field) => ({
      slug: field.map_code,
      name: field.name_en || field.map_code,
      floor: null,
      location: null,
      spawns: field.known_spawn_total || field.monster_count,
      warps: 0,
    }));
    for (const map of unrated.filter((entry) => entry.map_kind === "dungeon")) maps.push({ slug: map.map_code, name: map.name_en, floor: null, location: map.region, spawns: 0, warps: 0, data_status: map.data_status });
    maps.sort((a, b) => a.name.localeCompare(b.name));
    return { maps, source: "RagnaDex open API · spawn references" };
  });
}

async function dungeonDetailApi(slug) {
  return cached(`dungeon:ragnadex:v2:${slug}`, 30 * 60 * 1000, async () => {
    const [{ fields, unrated_maps: unrated = [] }, monsters] = await Promise.all([fieldsApi(), allMonsters()]);
    const map = fields.find((field) => field.map_kind === "dungeon" && field.map_code === slug);
    if (!map) {
      const pending = unrated.find((field) => field.map_kind === "dungeon" && field.map_code === slug);
      if (!pending) throw new Error("Dungeon nicht in RagnaDex gefunden");
      return { slug: pending.map_code, name: pending.name_en, image: null, location: pending.region, floor: null, level_min: null, level_max: null, spawns: [], connections: [], warps: 0, quests: [], data_status: pending.data_status };
    }
    const monsterById = new Map(monsters.map((monster) => [monster.monster_id, monster]));
    return {
      slug: map.map_code,
      name: map.name_en || map.map_code,
      image: null,
      location: null,
      floor: null,
      level_min: map.min_level,
      level_max: map.max_level,
      spawns: map.monsters.map((spawn) => {
        const monster = monsterById.get(spawn.monster_id);
        const traits = monster?.special_attributes?.map((entry) => entry.status_en) || [];
        return { name: spawn.name_en, slug: String(spawn.monster_id), level: spawn.level, count: spawn.count, mvp: traits.includes("MVP") || traits.includes("Boss"), respawn: spawn.count_kind || "reference" };
      }),
      connections: [],
      warps: 0,
      quests: [],
    };
  });
}

async function bossesApi() {
  return cached("bosses:ragnadex:v2", 30 * 60 * 1000, async () => {
    const [payload, monsters] = await Promise.all([ragnadexMvps(), allMonsters()]);
    const mobById = new Map(monsters.map((mob) => [mob.monster_id, mob]));
    const bosses = (payload.bosse || []).map((entry) => {
      const reference = mobById.get(Number(entry.id));
      return {
        slug: String(entry.id),
        name: reference?.name_en || entry.name || `Monster #${entry.id}`,
        level: reference?.level ?? numberOrNull(entry.stufe),
        hp: reference?.hp ?? numberOrNull(entry.hp),
        element: reference?.element ?? null,
        element_level: reference?.element_level ?? null,
        race: reference?.race ?? null,
        image: null,
        base_exp: reference?.base_exp ?? null,
        job_exp: reference?.job_exp ?? null,
        exp_source: reference?.exp_source ?? "RagnaDex MVP reference",
        maps: (entry.orte || []).map((location) => ({ name: location.name || location.name_de || location.karten?.join(", ") || "Unbekannte Karte", count: null })),
      };
    }).sort((a, b) => Number(a.level ?? Infinity) - Number(b.level ?? Infinity));
    return { bosses, source: "RagnaDex open API · MVP and spawn references" };
  });
}

async function skillsApi() {
  const data = await cached("ragnadex:skills:v1", 3600000, () => fetchJson(RAGNADEX + "/skills.json"), { persistent: true, staleWhileRevalidate: true });
  if (!Array.isArray(data.berufe) || !data.skills || typeof data.skills !== "object" || Array.isArray(data.skills)) throw new Error("Skill data format changed");
  return { families: data.berufe, skills: data.skills, source: "RagnaDex / rAthena / community" };
}

async function createMobileSnapshot() {
  const [monsters, itemPayload, skills, fieldResult, dungeonResult, bossResult] = await Promise.all([
    allMonsters(), ragnadexItems(), skillsApi(), fieldsApi(), dungeonsApi(), bossesApi(),
  ]);
  const rawItems = Array.isArray(itemPayload) ? itemPayload : itemPayload.items || [];
  const dungeonDetails = {};
  for (const dungeon of dungeonResult.maps) dungeonDetails[dungeon.slug] = await dungeonDetailApi(dungeon.slug);
  return {
    schema: 1,
    generated_at: new Date().toISOString(),
    source: "RagnaDex open API + Zero Global overrides + rAthena NPC references",
    monsters,
    items: rawItems.map((item) => normalizeItemDetail(item, monsters)),
    skills,
    fields: fieldResult,
    dungeons: dungeonResult,
    dungeon_details: dungeonDetails,
    bosses: bossResult,
  };
}

const handleApi = createApiHandler({
  "/api/money": async () => ({ items: await allMonsters(), source: "RagnaDex + rAthena NPC reference prices" }),
  "/api/skills": skillsApi,
  "/api/monsters": monstersApi, "/api/search": searchApi, "/api/item-search": itemSearchApi, "/api/item-detail": itemDetailApi,
  "/api/fields": fieldsApi, "/api/dungeons": dungeonsApi, "/api/bosses": bossesApi,
}, [{ prefix: "/api/dungeons/", load: dungeonDetailApi }]);

module.exports = { handleApi, createMobileSnapshot };
