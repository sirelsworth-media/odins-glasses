import type { SkillData } from "../ClassGuide";
import type { Boss, Dungeon, DungeonDetail, HuntField, ItemDetail, ItemListEntry, Monster, UnratedMap } from "../domain/types";

type MobileSnapshot = {
  schema: number;
  generated_at: string;
  source: string;
  monsters: Monster[];
  items: ItemDetail[];
  skills: SkillData;
  fields: { fields: HuntField[]; unrated_maps?: UnratedMap[] };
  dungeons: { maps: Dungeon[] };
  dungeon_details: Record<string, DungeonDetail>;
  bosses: { bosses: Boss[] };
};

const sizeOrder: Record<string, number> = { Small: 0, Medium: 1, Large: 2 };
let snapshotPromise: Promise<MobileSnapshot> | null = null;

function aborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Request aborted", "AbortError");
}

async function snapshot(signal?: AbortSignal) {
  aborted(signal);
  snapshotPromise ??= fetch("/mobile-data.json").then(async (response) => {
    if (!response.ok) throw new Error(`Mobile data unavailable (${response.status})`);
    const data = await response.json() as MobileSnapshot;
    if (data.schema !== 1 || !Array.isArray(data.monsters) || !Array.isArray(data.items)) throw new Error("Mobile data format changed");
    return data;
  }).catch((error) => {
    snapshotPromise = null;
    throw error;
  });
  const data = await snapshotPromise;
  aborted(signal);
  return data;
}

function rankMonsters(items: Monster[], sort: string) {
  return items.sort((a, b) => sort === "level" ? a.level - b.level
    : sort === "total" ? b.total_exp_per_hp - a.total_exp_per_hp
    : sort === "loot" ? Number(b.zeny_per_kill || 0) - Number(a.zeny_per_kill || 0)
    : sort === "sizeAsc" ? (sizeOrder[a.size] ?? 3) - (sizeOrder[b.size] ?? 3) || a.level - b.level
    : sort === "sizeDesc" ? (sizeOrder[b.size] ?? -1) - (sizeOrder[a.size] ?? -1) || a.level - b.level
    : b.exp_per_hp - a.exp_per_hp);
}

function itemListEntry(item: ItemDetail): ItemListEntry {
  return {
    key: `${item.source}:${item.item_id}`,
    source: item.source,
    source_slug: item.source_slug,
    item_id: item.item_id,
    name_en: item.name_en,
    category: item.category,
    subtype: item.subtype,
    icon_url: item.icon_url,
    resolved: true,
    attack: item.attack,
    defense: item.defense,
    required_level: item.required_level,
    slots: item.slots,
    buy_price: item.buy_price,
    sell_price: item.sell_price,
  };
}

export const mobileApi = {
  async money(signal?: AbortSignal) { return { items: (await snapshot(signal)).monsters }; },
  async skills(signal?: AbortSignal) { return (await snapshot(signal)).skills; },
  async monsters(params: URLSearchParams, signal?: AbortSignal) {
    const data = await snapshot(signal);
    const min = Math.max(1, Number(params.get("min") || 1));
    const max = Math.max(min, Number(params.get("max") || 50));
    const element = params.get("element") || "Fire";
    const sort = params.get("sort") || "exp";
    const items = data.monsters.filter((mob) => mob.level >= min && mob.level <= max && (element === "All" || mob.element === element) && mob.hp > 0 && mob.base_exp > 0 && (mob.spawns?.length || 0) > 0);
    return { items: rankMonsters(items, sort) };
  },
  async monsterSearch(query: string, signal?: AbortSignal) {
    const data = await snapshot(signal);
    const needle = query.trim().toLowerCase();
    if (needle.length < 2 && !/^\d+$/.test(needle)) return { items: [] };
    const items = data.monsters.filter((mob) => `${mob.monster_id} ${mob.name_en} ${mob.aegis_name}`.toLowerCase().includes(needle))
      .sort((a, b) => Number(String(a.monster_id) !== needle) - Number(String(b.monster_id) !== needle) || Number(!a.name_en.toLowerCase().startsWith(needle)) - Number(!b.name_en.toLowerCase().startsWith(needle)) || a.name_en.localeCompare(b.name_en)).slice(0, 40);
    return { items };
  },
  async itemSearch(params: URLSearchParams, signal?: AbortSignal) {
    const data = await snapshot(signal);
    const section = params.get("section") || "all";
    const query = (params.get("q") || "").trim().toLowerCase();
    const subtype = (params.get("subtype") || "").trim().toLowerCase();
    const page = Math.max(0, Number(params.get("page") || 0));
    const limit = 40;
    const matches = data.items.filter((item) => (section === "all" || item.source === section)
      && (!query || [item.item_id, item.name_en, item.aegis_name, item.source_slug].some((value) => String(value ?? "").toLowerCase().includes(query)))
      && (!subtype || String(item.subtype || "").toLowerCase() === subtype))
      .sort((a, b) => Number(!a.name_en.toLowerCase().startsWith(query)) - Number(!b.name_en.toLowerCase().startsWith(query)) || a.name_en.localeCompare(b.name_en));
    return { items: matches.slice(page * limit, (page + 1) * limit).map(itemListEntry), total: matches.length };
  },
  async itemDetail(params: URLSearchParams) {
    const data = await snapshot();
    const id = params.get("id") || "";
    const slug = (params.get("slug") || "").toLowerCase();
    const item = data.items.find((entry) => String(entry.item_id) === id || entry.source_slug.toLowerCase() === slug || String(entry.item_id) === slug);
    if (!item) throw new Error("Item not found in offline data");
    return { item };
  },
  async fields() { return (await snapshot()).fields; },
  async dungeons() { return (await snapshot()).dungeons; },
  async dungeon(slug: string) {
    const detail = (await snapshot()).dungeon_details[slug];
    if (!detail) throw new Error("Dungeon not found in offline data");
    return detail;
  },
  async bosses() { return (await snapshot()).bosses; },
};
