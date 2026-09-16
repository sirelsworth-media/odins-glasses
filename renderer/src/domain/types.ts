export type Lang = "de" | "en";
export type Localized = Record<Lang, string>;

export type Monster = {
  monster_id: number; name_en: string; aegis_name: string; level: number; hp: number;
  base_exp: number; job_exp: number; exp_per_hp: number; total_exp_per_hp: number;
  element: string; element_level: number; element_modifiers?: Record<string, number> | null; race: string; size: string; image_url: string;
  defense: number | null; magic_defense: number | null; attack_min: number | null; attack_max: number | null;
  matk_min?: number | null; matk_max?: number | null; flee_95?: number | null; hit_100?: number | null;
  str?: number | null; agi?: number | null; vit?: number | null; int_stat?: number | null; dex?: number | null; luk?: number | null;
  zeny_per_kill?: number | null; exp_source: string; exp_source_kind: "global_measurement" | "ragnadex_zero_verified" | "ragnadex_reference";
  global_override_evidence?: string | null;
  special_attributes?: { status_en: string }[];
  behavior_attributes?: { status_en: string }[];
  behavior_reference?: { source: string; revision: string; ai: number; verified_global: boolean } | null;
  drops?: { item_id: number; name_en: string; category: string; rate_percent: number | null; rate_known: boolean; npc_sell_price: number | null; image_url: string | null }[];
  spawns?: { code: string; name: string; count: number | null; count_kind: string }[];
};

export type Region = { code: string; name: string; score: number; weightedExpPerHp: number; averageLevel: number; knownSpawns: number; targets: { mob: Monster; count: number | null }[] };
export type FieldMonster = { monster_id: number; name_en: string; aegis_name: string; level: number; hp: number; base_exp: number; job_exp: number; exp_per_hp: number; element: string; element_level: number; element_modifiers?: Record<string, number> | null; count: number | null; count_kind: string | null; is_variant: boolean };
export type HuntField = { map_code: string; name_en: string; map_kind: "field" | "dungeon"; monster_count: number; known_spawn_total: number; average_level: number; min_level: number; max_level: number; average_exp_per_hp: number; average_base_exp_per_kill: number; monsters: FieldMonster[] };
export type UnratedMap = { map_code: string; name_en: string; name_de: string; map_kind: "field" | "dungeon"; region: string; data_status: "map_only"; source: string };
export type Dungeon = { slug: string; name: string; floor: string | null; location: string | null; spawns: number; warps: number };
export type DungeonDetail = { slug: string; name: string; image: string | null; location: string | null; floor: string | null; level_min: number | null; level_max: number | null; warps: number; connections: { slug: string; name: string }[]; quests: string[]; spawns: { name: string; slug: string; level: number | null; count: number | null; mvp: boolean; respawn: string }[] };
export type Boss = { slug: string; name: string; level: number | null; hp: number | null; element: string | null; element_level?: number; race: string | null; image: string | null; base_exp?: number | null; job_exp?: number | null; exp_source?: string | null; maps?: { name: string; count: number | null }[] };
export type ItemListEntry = { key: string; source: string; source_slug: string; item_id: number | null; name_en: string; category: string; subtype: string | null; icon_url: string | null; resolved: boolean; attack: number | null; defense: number | null; required_level: number | null; slots: number | null; buy_price: number | null; sell_price: number | null };
export type ItemDropper = { monster_id: number | null; name_en: string; aegis_name: string | null; level: number | null; image_url: string | null; rate_percent: number | null; rate_kind: string; raw_rate: string | number | null };
export type ItemDetail = { source: string; source_slug: string; item_id: number | null; name_en: string; name_zh: string | null; aegis_name: string | null; category: string; subtype: string | null; slot: string | null; description: string | null; icon_url: string | null; slots: number | null; attack: number | null; magic_attack: number | null; defense: number | null; magic_defense: number | null; weapon_level: number | null; required_level: number | null; weight: number | null; buy_price: number | null; sell_price: number | null; equip_jobs: string | null; can_trade: boolean | null; refinable: boolean | null; element: string | null; card_prefix_name: string | null; dropped_by: ItemDropper[] };
