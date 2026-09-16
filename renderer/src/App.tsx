"use client";

import { useEffect, useMemo, useState } from "react";
import MoneyHelper from "./MoneyHelper";
import ClassGuide from "./ClassGuide";
import Crafting from "./Crafting";
import ThemeSwitch from "./components/ThemeSwitch";
import NavigationIcon from "./components/NavigationIcon";
import MonsterInfo from "./components/MonsterInfo";
import ItemInfo from "./components/ItemInfo";
import { ItemTypeIcon, MonsterPortrait } from "./components/VisualIcons";
import { api } from "./services/api-client";
import type { Boss, Dungeon, DungeonDetail, FieldMonster, HuntField, ItemDetail, ItemListEntry, Lang, Localized, Monster, Region, UnratedMap } from "./domain/types";
import { categoryNames, fmt, itemSubtypeNames } from "./domain/display";

type AppTab = "money" | "classes" | "hunt" | "search" | "items" | "crafting" | "specials" | "fields" | "dungeons";
type MonsterSort = "exp" | "total" | "level" | "loot" | "sizeAsc" | "sizeDesc";

const profiles = {
  novice: { label: { de: "Novize", en: "Novice" }, icon: "◇", element: "All", counter: { de: "Physisch", en: "Physical" }, group: "general" },
  swordsman: { label: { de: "Schwertkämpfer", en: "Swordsman" }, icon: "⚔", element: "All", counter: { de: "Physisch", en: "Physical" }, group: "first" },
  thief: { label: { de: "Dieb", en: "Thief" }, icon: "◆", element: "All", counter: { de: "Physisch", en: "Physical" }, group: "first" },
  archer: { label: { de: "Bogenschütze", en: "Archer" }, icon: "➶", element: "All", counter: { de: "Fernkampf", en: "Ranged" }, group: "first" },
  acolyte: { label: { de: "Akolyt", en: "Acolyte" }, icon: "✦", element: "Undead", counter: { de: "Heilig", en: "Holy" }, group: "first" },
  merchant: { label: { de: "Händler", en: "Merchant" }, icon: "¤", element: "All", counter: { de: "Physisch", en: "Physical" }, group: "first" },
  knight: { label: { de: "Ritter", en: "Knight" }, icon: "♞", element: "All", counter: { de: "Physisch", en: "Physical" }, group: "second" },
  crusader: { label: { de: "Kreuzritter", en: "Crusader" }, icon: "♜", element: "All", counter: { de: "Physisch", en: "Physical" }, group: "second" },
  wizard: { label: { de: "Wizard", en: "Wizard" }, icon: "✧", element: "All", counter: { de: "Elementwahl", en: "Element choice" }, group: "second" },
  sage: { label: { de: "Sage", en: "Sage" }, icon: "◈", element: "All", counter: { de: "Elementwahl", en: "Element choice" }, group: "second" },
  hunter: { label: { de: "Jäger", en: "Hunter" }, icon: "➹", element: "All", counter: { de: "Fernkampf", en: "Ranged" }, group: "second" },
  bard: { label: { de: "Barde", en: "Bard" }, icon: "♫", element: "All", counter: { de: "Fernkampf", en: "Ranged" }, group: "second" },
  dancer: { label: { de: "Tänzerin", en: "Dancer" }, icon: "♪", element: "All", counter: { de: "Fernkampf", en: "Ranged" }, group: "second" },
  priest: { label: { de: "Priester", en: "Priest" }, icon: "✚", element: "Undead", counter: { de: "Heilig", en: "Holy" }, group: "second" },
  monk: { label: { de: "Mönch", en: "Monk" }, icon: "●", element: "All", counter: { de: "Physisch", en: "Physical" }, group: "second" },
  blacksmith: { label: { de: "Schmied", en: "Blacksmith" }, icon: "⚒", element: "All", counter: { de: "Physisch", en: "Physical" }, group: "second" },
  alchemist: { label: { de: "Alchemist", en: "Alchemist" }, icon: "⚗", element: "All", counter: { de: "Physisch", en: "Physical" }, group: "second" },
  assassin: { label: { de: "Assassine", en: "Assassin" }, icon: "✣", element: "All", counter: { de: "Physisch", en: "Physical" }, group: "second" },
  rogue: { label: { de: "Schurke", en: "Rogue" }, icon: "♠", element: "All", counter: { de: "Physisch", en: "Physical" }, group: "second" },
  ice: { label: { de: "Magier – Eis", en: "Mage – Ice" }, icon: "❄", element: "Fire", counter: { de: "Wasser", en: "Water" }, group: "mage" },
  wind: { label: { de: "Magier – Elektro", en: "Mage – Lightning" }, icon: "ϟ", element: "Water", counter: { de: "Wind", en: "Wind" }, group: "mage" },
  fire: { label: { de: "Magier – Feuer", en: "Mage – Fire" }, icon: "♨", element: "Earth", counter: { de: "Feuer", en: "Fire" }, group: "mage" },
  earth: { label: { de: "Magier – Erde", en: "Mage – Earth" }, icon: "⬟", element: "Wind", counter: { de: "Erde", en: "Earth" }, group: "mage" },
};
const profileGroups = ["mage", "first", "second", "general"] as const;

const elementOptions = ["All", "Fire", "Water", "Wind", "Earth", "Undead", "Shadow", "Neutral"];
const raceOptions = ["Angel", "Brute", "Demon", "Demihuman", "Dragon", "Fish", "Formless", "Insect", "Plant", "Undead"];
const sizeOptions = ["Small", "Medium", "Large"];
const fieldElementOptions = ["Neutral", "Fire", "Water", "Wind", "Earth", "Poison", "Holy", "Shadow", "Ghost", "Undead"];
const attackElementOptions = ["All", "Fire", "Water", "Wind", "Earth", "Holy", "Ghost"];
const itemSections = ["all", "armor", "weapon", "ammo", "card", "costume", "consumable", "material", "etc", "enchant", "package", "collectible", "pet_egg", "pet_equipment", "taming"] as const;
const itemSectionNames: Record<string, Localized> = {
  all: { de: "Alle Items (kein Typfilter)", en: "All items (no type filter)" },
  armor: { de: "Rüstung", en: "Armor" }, weapon: { de: "Waffen", en: "Weapons" }, ammo: { de: "Munition", en: "Ammunition" }, card: { de: "Karten", en: "Cards" }, costume: { de: "Kostüme", en: "Costumes" },
  consumable: { de: "Verbrauchsitems", en: "Consumables" }, material: { de: "Material", en: "Materials" }, etc: { de: "Sonstiges", en: "ETC" }, enchant: { de: "Verzauberungssteine", en: "Enchant Stones" },
  package: { de: "Pakete & Boxen", en: "Packages & Boxes" }, collectible: { de: "Sammelitems", en: "Collectibles" }, pet_egg: { de: "Pet-Eier", en: "Pet Eggs" },
  pet_equipment: { de: "Pet-Ausrüstung", en: "Pet Equipment" }, taming: { de: "Zähmitems", en: "Taming Items" },
};
const armorSubtypes = ["Armor", "Shield", "Shoes", "Garment", "Accessory", "Upper Headgear", "Middle Headgear", "Lower Headgear"];
const weaponSubtypes = ["Book", "Bow", "Dagger", "Instrument", "Katar", "Knuckle", "Mace", "One-handed Axe", "One-handed Spear", "One-handed Staff", "One-handed Sword", "Two-handed Axe", "Two-handed Spear", "Two-handed Staff", "Two-handed Sword", "Whip"];
const ammoSubtypes = ["Arrow", "Dagger", "Shuriken", "Kunai"];
const cardSubtypes = ["Weapon", "Armor", "Shield", "Shoes", "Garment", "Accessory", "Upper Headgear"];
const elementNames: Record<string, Localized> = {
  All: { de: "Alle", en: "All" }, Fire: { de: "Feuer", en: "Fire" }, Water: { de: "Wasser", en: "Water" },
  Wind: { de: "Wind", en: "Wind" }, Earth: { de: "Erde", en: "Earth" }, Undead: { de: "Untot", en: "Undead" },
  Shadow: { de: "Schatten", en: "Shadow" }, Neutral: { de: "Neutral", en: "Neutral" },
  Poison: { de: "Gift", en: "Poison" }, Holy: { de: "Heilig", en: "Holy" }, Ghost: { de: "Geist", en: "Ghost" },
};
const sizeNames: Record<string, Localized> = {
  Small: { de: "Klein", en: "Small" }, Medium: { de: "Mittel", en: "Medium" }, Large: { de: "Groß", en: "Large" },
};
const sizeOrder: Record<string, number> = { Small: 0, Medium: 1, Large: 2 };
const groupNames: Record<string, Localized> = {
  mage: { de: "Magier-Builds", en: "Mage builds" }, first: { de: "Grundklassen", en: "First jobs" },
  second: { de: "2. Klassen", en: "Second jobs" }, general: { de: "Allgemein", en: "General" },
};
const variantTitles: Record<string, Localized> = {
  C1_ELDER_WILLOW: { de: "Flinker Elder Willow", en: "Swift Elder Willow" },
  C2_ELDER_WILLOW: { de: "Robuster Elder Willow", en: "Solid Elder Willow" },
  C2_ELDER_WILOW: { de: "Robuster Elder Willow", en: "Solid Elder Willow" },
  C3_SOLDIER_SKELETON: { de: "Anführer der Soldatenskelette", en: "Soldier Skeleton Ringleader" },
  C4_SOLDIER_SKELETON: { de: "Wütendes Soldatenskelett", en: "Furious Soldier Skeleton" },
  C5_PECOPECO: { de: "Ausweichendes Peco Peco", en: "Elusive Peco Peco" },
};
const variantPrefixes: Record<string, Localized> = {
  C1: { de: "Flink", en: "Swift" }, C2: { de: "Robust", en: "Solid" }, C3: { de: "Anführer", en: "Ringleader" },
  C4: { de: "Wütend", en: "Furious" }, C5: { de: "Ausweichend", en: "Elusive" },
};

function isVariant(mob: Monster) { return /^C[1-5]_/i.test(mob.aegis_name) || /^(Fast|Sturdy|Wandering|Boss|Enraged)\b/i.test(mob.name_en); }
function canonicalBaseName(mob: Monster) {
  return mob.aegis_name.replace(/^C[1-5]_/, "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function monsterTitle(mob: Monster, lang: Lang) {
  if (!isVariant(mob)) return mob.name_en.replace(/^C([1-5])_/, "C$1 ").replaceAll("_", " ");
  if (variantTitles[mob.aegis_name]) return variantTitles[mob.aegis_name][lang];
  const code = mob.aegis_name.match(/^(C[1-5])_/i)?.[1].toUpperCase();
  return code ? `${variantPrefixes[code]?.[lang] || code} ${canonicalBaseName(mob)}` : mob.name_en;
}
function advantage(element: string, level: number) {
  if (element === "Fire") return [0, 150, 175, 200, 200][level] || 150;
  if (element === "Water") return [0, 175, 175, 200, 200][level] || 175;
  if (element === "Wind" || element === "Earth") return [0, 150, 175, 200, 200][level] || 150;
  return 100;
}
function profileAdvantage(profile: keyof typeof profiles, mob: Monster) {
  const attackElement = profile === "ice" ? "Water" : profile === "wind" ? "Wind" : profile === "fire" ? "Fire" : profile === "earth" ? "Earth" : profile === "acolyte" || profile === "priest" ? "Holy" : null;
  if (attackElement && mob.element_modifiers?.[attackElement] != null) return mob.element_modifiers[attackElement];
  if (profile === "acolyte" || profile === "priest") return mob.element === "Undead" ? 150 : mob.element === "Shadow" ? 125 : 100;
  if (profiles[profile].element === "All") return 100;
  return advantage(mob.element, mob.element_level);
}
function attackElementModifier(attack: string, target: string, level: number, modifiers?: Record<string, number> | null) {
  if (attack === "All") return 100;
  if (modifiers?.[attack] != null) return modifiers[attack];
  const tier = Math.max(1, Math.min(4, level || 1));
  const strong = [0, 150, 175, 200, 200][tier];
  const windStrong = [0, 175, 175, 200, 200][tier];
  const weak = [0, 50, 25, 0, -25][tier];
  const same = [0, 25, 0, -25, -50][tier];
  if (attack === target) return same;
  if (attack === "Water" && target === "Fire") return strong;
  if (attack === "Fire" && target === "Earth") return strong;
  if (attack === "Wind" && target === "Water") return windStrong;
  if (attack === "Earth" && target === "Wind") return strong;
  if ((attack === "Fire" && target === "Water") || (attack === "Water" && target === "Wind") || (attack === "Wind" && target === "Earth") || (attack === "Earth" && target === "Fire")) return weak;
  if (attack === "Holy" && (target === "Undead" || target === "Shadow")) return [0, 125, 150, 175, 200][tier];
  if (attack === "Ghost" && target === "Ghost") return [0, 125, 150, 175, 200][tier];
  if (attack === "Ghost" && target === "Neutral") return [0, 25, 25, 0, 0][tier];
  return 100;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("de");
  const [tab, setTab] = useState<AppTab>("hunt");
  const [tabHistory, setTabHistory] = useState<AppTab[]>([]);
  const [profile, setProfile] = useState<keyof typeof profiles>("ice");
  const [min, setMin] = useState(20); const [max, setMax] = useState(45);
  const [element, setElement] = useState("Fire");
  const [race, setRace] = useState("All");
  const [monsterSize, setMonsterSize] = useState("All");
  const [visibleMonsterCount, setVisibleMonsterCount] = useState(30);
  const [sort, setSort] = useState<MonsterSort>("exp");
  const [huntView, setHuntView] = useState<"monsters" | "regions">("monsters");
  const [regionSort, setRegionSort] = useState<"score" | "level" | "efficiency">("score");
  const [expandedMonster, setExpandedMonster] = useState<number | null>(null);
  const [monsters, setMonsters] = useState<Monster[]>([]); const [monsterLoading, setMonsterLoading] = useState(true);
  const [error, setError] = useState("");
  const [dungeons, setDungeons] = useState<Dungeon[]>([]); const [dungeonQuery, setDungeonQuery] = useState("");
  const [dungeonMode, setDungeonMode] = useState<"maps" | "bosses">("maps");
  const [selectedDungeon, setSelectedDungeon] = useState<DungeonDetail | null>(null); const [detailLoading, setDetailLoading] = useState(false);
  const [bosses, setBosses] = useState<Boss[]>([]); const [raidLoading, setRaidLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fields, setFields] = useState<HuntField[]>([]); const [fieldsLoading, setFieldsLoading] = useState(false); const [fieldsLoaded, setFieldsLoaded] = useState(false);
  const [unratedMaps, setUnratedMaps] = useState<UnratedMap[]>([]);
  const [fieldQuery, setFieldQuery] = useState(""); const [fieldMin, setFieldMin] = useState(1); const [fieldMax, setFieldMax] = useState(45);
  const [fieldSafeOnly, setFieldSafeOnly] = useState(true); const [fieldSort, setFieldSort] = useState<"score" | "element" | "level" | "exp" | "killExp">("score");
  const [fieldAttackElement, setFieldAttackElement] = useState("All"); const [includeNormalDungeons, setIncludeNormalDungeons] = useState(true);
  const [fieldIgnoreVariants, setFieldIgnoreVariants] = useState(true);
  const [excludedFieldElements, setExcludedFieldElements] = useState<string[]>([]);
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [focusedFieldCode, setFocusedFieldCode] = useState<string | null>(null);
  const [monsterQuery, setMonsterQuery] = useState(""); const [searchResults, setSearchResults] = useState<Monster[]>([]);
  const [searchLoading, setSearchLoading] = useState(false); const [searchError, setSearchError] = useState("");
  const [expandedSearch, setExpandedSearch] = useState<number | null>(null);
  const [itemSection, setItemSection] = useState<(typeof itemSections)[number]>("all"); const [itemSubtype, setItemSubtype] = useState("");
  const [itemQuery, setItemQuery] = useState(""); const [itemPage, setItemPage] = useState(0); const [itemTotal, setItemTotal] = useState(0);
  const [itemResults, setItemResults] = useState<ItemListEntry[]>([]); const [itemLoading, setItemLoading] = useState(false); const [itemError, setItemError] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null); const [itemDetailLoading, setItemDetailLoading] = useState<string | null>(null);
  const [itemDetails, setItemDetails] = useState<Record<string, ItemDetail>>({});
  const [requestedItem, setRequestedItem] = useState<string | null>(null);
  const words = {
    de: { live: "Live-Daten · beim Öffnen aktualisiert", hunt: "Jagdplaner", raids: "Bosse & Dungeons", classBuild: "KLASSE & BUILD", allTargets: "zeigt alle passenden Gegner", against: "gegen", levelRange: "Levelbereich", targetElement: "Ziel-Element", sorting: "Sortierung", expHp: "EXP / HP (Richtwert)", totalExpHp: "Gesamt-EXP / HP (Richtwert)", lowestLevel: "Niedrigstes Level", showVariants: "Spezialvarianten anzeigen", update: "Jetzt aktualisieren →", bestTargets: "BESTE ZIELE", enemiesFor: "Gegner für", normalEnemies: "normale Gegner", specialVariants: "Spezialvarianten", hits: "Treffer", loadingMonsters: "Monsterdaten werden geladen …", variant: "Spezialvariante", noMap: "Keine Karte hinterlegt", measured: "✓ Global gemessen", unconfirmed: "EXP unbestätigt", groupContent: "GRUPPENINHALTE", dungeonIntro: "RagnaDex-Spawns, Monsterlevel und Bosse aus einer einheitlichen offenen Quelle.", dungeons: "Dungeons", bossMonsters: "Bossmonster", loadingRaids: "Dungeon- und Bossdaten werden geladen …", searchDungeon: "Dungeon suchen, z. B. Payon Cave …", maps: "Karten", paths: "Wege", analysing: "Dungeon wird analysiert …", monsterLevel: "Monsterlevel", monstersOnMap: "Monster auf der Karte", connections: "Verbindungen", chooseDungeon: "Dungeon auswählen", chooseDungeonHint: "Dann erscheinen Levelbereich und alle bekannten Monster.", unknown: "Unbekannt", unknownSpawn: "Spawn unbekannt" },
    en: { live: "Live data · refreshed when opened", hunt: "Hunt planner", raids: "Bosses & Dungeons", classBuild: "CLASS & BUILD", allTargets: "shows all suitable targets", against: "against", levelRange: "Level range", targetElement: "Target element", sorting: "Sorting", expHp: "EXP / HP (estimate)", totalExpHp: "Total EXP / HP (estimate)", lowestLevel: "Lowest level", showVariants: "Show special variants", update: "Refresh now →", bestTargets: "BEST TARGETS", enemiesFor: "monsters for", normalEnemies: "normal monsters", specialVariants: "special variants", hits: "results", loadingMonsters: "Loading monster data …", variant: "Special variant", noMap: "No map listed", measured: "✓ Measured on Global", unconfirmed: "EXP unconfirmed", groupContent: "GROUP CONTENT", dungeonIntro: "RagnaDex spawns, monster levels, and bosses from one openly reusable source.", dungeons: "Dungeons", bossMonsters: "Boss monsters", loadingRaids: "Loading dungeon and boss data …", searchDungeon: "Search dungeon, e.g. Payon Cave …", maps: "maps", paths: "paths", analysing: "Analysing dungeon …", monsterLevel: "Monster level", monstersOnMap: "Monsters on this map", connections: "Connections", chooseDungeon: "Select a dungeon", chooseDungeonHint: "Its level range and all known monsters will appear here.", unknown: "Unknown", unknownSpawn: "Spawn unknown" },
  }[lang];

  function chooseProfile(key: keyof typeof profiles) {
    setProfile(key);
    setElement(profiles[key].element);
  }
  function toggleExcludedFieldElement(elementName: string) {
    setExcludedFieldElements((current) => current.includes(elementName) ? current.filter((item) => item !== elementName) : [...current, elementName]);
  }
  function navigateToTab(nextTab: AppTab) {
    if (nextTab === tab) return;
    setTabHistory((current) => [...current, tab].slice(-30));
    setTab(nextTab);
  }
  function goBack() {
    const previousTab = tabHistory.at(-1);
    if (!previousTab) return;
    setTabHistory((current) => current.slice(0, -1));
    setTab(previousTab);
  }
  function openMonsterFromField(monster: FieldMonster) {
    setMonsterQuery(String(monster.monster_id));
    setExpandedSearch(monster.monster_id);
    navigateToTab("search");
    window.setTimeout(() => document.getElementById("monster-search")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }
  function openMonsterFromItem(monsterId: number) {
    setMonsterQuery(String(monsterId));
    setExpandedSearch(monsterId);
    navigateToTab("search");
    window.setTimeout(() => document.getElementById("monster-search")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }
  function openFieldFromMonster(spawn: NonNullable<Monster["spawns"]>[number]) {
    setFieldQuery(spawn.code);
    setFocusedFieldCode(spawn.code);
    setExpandedField(spawn.code);
    navigateToTab("fields");
    window.setTimeout(() => document.getElementById("field-hunting")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }
  function openItemFromMonster(drop: NonNullable<Monster["drops"]>[number]) {
    navigateToItem(String(drop.item_id));
  }
  function navigateToItem(query: string) {
    setItemSection("all");
    setItemSubtype("");
    setItemQuery(query);
    setRequestedItem(query);
    setItemPage(0);
    setExpandedItem(null);
    navigateToTab("items");
    window.setTimeout(() => document.getElementById("item-search")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }
  function openItemFromCrafting(name: string) {
    navigateToItem(name);
  }
  async function expandItem(entry: ItemListEntry) {
    setExpandedItem(entry.key);
    if (itemDetails[entry.key]) {
      window.setTimeout(() => document.getElementById(`item-${entry.item_id ?? entry.source_slug}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
      return;
    }
    setItemDetailLoading(entry.key); setItemError("");
    try {
      const params = new URLSearchParams({ source: entry.source, slug: entry.source_slug });
      if (entry.item_id != null) params.set("id", String(entry.item_id));
      const data = await api.itemDetail(params);
      setItemDetails((current) => ({ ...current, [entry.key]: data.item }));
    } catch (cause) {
      setItemError(cause instanceof Error ? cause.message : "Item detail error");
    } finally {
      setItemDetailLoading(null);
      window.setTimeout(() => document.getElementById(`item-${entry.item_id ?? entry.source_slug}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    }
  }
  async function toggleItemDetail(entry: ItemListEntry) {
    if (expandedItem === entry.key) { setExpandedItem(null); return; }
    await expandItem(entry);
  }

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    setVisibleMonsterCount(30);
  }, [race, monsterSize, sort, min, max, element, tab]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setMonsterLoading(true); setError("");
      try {
        const data = await api.monsters(new URLSearchParams({ min: String(min), max: String(max), element, sort }), controller.signal);
        if (!controller.signal.aborted) setMonsters(data.items || []);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : lang === "de" ? "Unbekannter Fehler" : "Unknown error");
      } finally {
        if (!controller.signal.aborted) setMonsterLoading(false);
      }
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [min, max, element, sort, refreshKey, lang]);
  useEffect(() => {
    if (tab !== "dungeons" || dungeons.length) return;
    setRaidLoading(true);
    Promise.all([api.dungeons(), api.bosses()])
      .then(([mapData, bossData]) => { setDungeons(mapData.maps || []); setBosses(bossData.bosses || []); })
      .catch(() => setError(lang === "de" ? "Dungeon-Daten konnten nicht geladen werden" : "Dungeon data could not be loaded"))
      .finally(() => setRaidLoading(false));
  }, [tab, dungeons.length, lang]);
  useEffect(() => {
    if (tab !== "fields" || fieldsLoaded || fieldsLoading) return;
    setFieldsLoading(true); setError("");
    api.fields().then((data) => { setFields(data.fields || []); setUnratedMaps(data.unrated_maps || []); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Field data error"))
      .finally(() => { setFieldsLoading(false); setFieldsLoaded(true); });
  }, [tab, fieldsLoaded, fieldsLoading, lang]);
  useEffect(() => {
    if (tab !== "search") return;
    const query = monsterQuery.trim();
    if (query.length < 2 && !/^\d+$/.test(query)) {
      setSearchResults([]); setSearchLoading(false); setSearchError("");
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchLoading(true); setSearchError("");
      try {
        const data = await api.monsterSearch(query, controller.signal);
        if (!controller.signal.aborted) setSearchResults(data.items || []);
      } catch (cause) {
        if (!controller.signal.aborted) setSearchError(cause instanceof Error ? cause.message : "Search error");
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [tab, monsterQuery, lang]);
  useEffect(() => {
    if (tab !== "items") return;
    if (itemSection === "all" && !itemQuery.trim()) {
      setItemResults([]); setItemTotal(0); setItemError(""); setItemLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setItemLoading(true); setItemError("");
      try {
        const params = new URLSearchParams({ section: itemSection, subtype: itemSubtype, q: itemQuery.trim(), page: String(itemPage) });
        const data = await api.itemSearch(params, controller.signal);
        if (!controller.signal.aborted) { setItemResults(data.items || []); setItemTotal(Number(data.total || 0)); }
      } catch (cause) {
        if (!controller.signal.aborted) setItemError(cause instanceof Error ? cause.message : "Item search error");
      } finally { if (!controller.signal.aborted) setItemLoading(false); }
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [tab, itemSection, itemSubtype, itemQuery, itemPage, lang]);
  useEffect(() => {
    if (tab !== "items" || !requestedItem || itemLoading || !itemResults.length) return;
    const requested = requestedItem.toLowerCase();
    const entry = itemResults.find((item) => String(item.item_id) === requested || item.name_en.toLowerCase() === requested) || itemResults[0];
    setRequestedItem(null);
    void expandItem(entry);
  }, [tab, requestedItem, itemLoading, itemResults]);

  async function openDungeon(slug: string) {
    setDetailLoading(true); setSelectedDungeon(null);
    try { setSelectedDungeon(await api.dungeon(slug)); }
    finally { setDetailLoading(false); }
  }

  const specialMode = tab === "specials";
  const activeItemSubtypes = itemSection === "armor" ? armorSubtypes : itemSection === "weapon" ? weaponSubtypes : itemSection === "ammo" ? ammoSubtypes : itemSection === "card" ? cardSubtypes : [];
  const itemPageCount = Math.max(1, Math.ceil(itemTotal / 40));
  const eligibleMonsters = useMemo(() => monsters.filter((mob) =>
    (race === "All" || mob.race === race)
    && (monsterSize === "All" || mob.size === monsterSize)
    && (specialMode ? isVariant(mob) : !isVariant(mob))), [monsters, specialMode, race, monsterSize]);
  const ranked = useMemo(() => [...eligibleMonsters]
    .sort((a, b) => sort === "level" ? a.level - b.level
      : sort === "total" ? b.total_exp_per_hp - a.total_exp_per_hp
      : sort === "loot" ? Number(b.zeny_per_kill || 0) - Number(a.zeny_per_kill || 0)
      : sort === "sizeAsc" ? (sizeOrder[a.size] ?? 3) - (sizeOrder[b.size] ?? 3) || a.level - b.level
      : sort === "sizeDesc" ? (sizeOrder[b.size] ?? -1) - (sizeOrder[a.size] ?? -1) || a.level - b.level
      : b.exp_per_hp - a.exp_per_hp), [eligibleMonsters, sort]);
  const visibleRanked = useMemo(() => ranked.slice(0, visibleMonsterCount), [ranked, visibleMonsterCount]);
  const regions = useMemo(() => {
    const maps = new Map<string, Region>();
    for (const mob of eligibleMonsters) {
      for (const spawn of mob.spawns || []) {
        const key = spawn.code || spawn.name;
        const region = maps.get(key) || { code: key, name: spawn.name, score: 0, weightedExpPerHp: 0, averageLevel: 0, knownSpawns: 0, targets: [] };
        region.targets.push({ mob, count: spawn.count });
        region.knownSpawns += spawn.count || 0;
        maps.set(key, region);
      }
    }
    return Array.from(maps.values()).map((region) => {
      const totalWeight = region.targets.reduce((sum, target) => sum + (target.count || 1), 0);
      region.weightedExpPerHp = region.targets.reduce((sum, target) => sum + target.mob.exp_per_hp * (target.count || 1), 0) / Math.max(totalWeight, 1);
      region.averageLevel = region.targets.reduce((sum, target) => sum + target.mob.level * (target.count || 1), 0) / Math.max(totalWeight, 1);
      const varietyBonus = 1 + Math.min(region.targets.length - 1, 4) * 0.08;
      const rangeMiddle = (min + max) / 2;
      const levelTolerance = Math.max((max - min) / 2, 5);
      const levelFit = 1 / (1 + Math.abs(region.averageLevel - rangeMiddle) / levelTolerance);
      region.score = region.weightedExpPerHp * varietyBonus * (0.75 + levelFit * 0.25);
      region.targets.sort((a, b) => b.mob.exp_per_hp - a.mob.exp_per_hp);
      return region;
    }).sort((a, b) => regionSort === "level" ? a.averageLevel - b.averageLevel : regionSort === "efficiency" ? b.weightedExpPerHp - a.weightedExpPerHp : b.score - a.score).slice(0, 20);
  }, [eligibleMonsters, min, max, regionSort]);
  const variantCount = useMemo(() => monsters.filter(isVariant).length, [monsters]);
  const shownDungeons = useMemo(() => dungeons.filter((dungeon) => `${dungeon.name} ${dungeon.location || ""}`.toLowerCase().includes(dungeonQuery.toLowerCase())).slice(0, 60), [dungeons, dungeonQuery]);
  const shownFields = useMemo(() => {
    const normalizedQuery = fieldQuery.trim().toLocaleLowerCase();
    const normalizedFocus = focusedFieldCode?.trim().toLocaleLowerCase() || null;
    const middle = (fieldMin + fieldMax) / 2;
    const tolerance = Math.max((fieldMax - fieldMin) / 2, 5);
    const ratedFields = fields.flatMap((field) => {
      const ratingMonsters = fieldIgnoreVariants ? field.monsters.filter((monster) => !monster.is_variant) : field.monsters;
      if (!ratingMonsters.length) return [];
      const weightOf = (monster: FieldMonster) => monster.count || 1;
      const totalWeight = ratingMonsters.reduce((sum, monster) => sum + weightOf(monster), 0);
      const expMonsters = ratingMonsters.filter((monster) => monster.exp_per_hp > 0);
      const expWeight = expMonsters.reduce((sum, monster) => sum + weightOf(monster), 0);
      const baseExpMonsters = ratingMonsters.filter((monster) => monster.base_exp > 0);
      const baseExpWeight = baseExpMonsters.reduce((sum, monster) => sum + weightOf(monster), 0);
      return [{
        ...field,
        ratingMonsters,
        ratingMonsterCount: ratingMonsters.length,
        ignoredVariantCount: field.monsters.length - ratingMonsters.length,
        average_level: ratingMonsters.reduce((sum, monster) => sum + monster.level * weightOf(monster), 0) / Math.max(totalWeight, 1),
        min_level: Math.min(...ratingMonsters.map((monster) => monster.level)),
        max_level: Math.max(...ratingMonsters.map((monster) => monster.level)),
        average_exp_per_hp: expMonsters.reduce((sum, monster) => sum + monster.exp_per_hp * weightOf(monster), 0) / Math.max(expWeight, 1),
        average_base_exp_per_kill: baseExpMonsters.reduce((sum, monster) => sum + monster.base_exp * weightOf(monster), 0) / Math.max(baseExpWeight, 1),
      }];
    });
    return ratedFields.filter((field) => {
      const normalizedFieldText = `${field.map_code} ${field.name_en}`.toLocaleLowerCase();
      const focusedMatch = normalizedFocus === field.map_code.toLocaleLowerCase();
      const textMatch = focusedMatch || normalizedFieldText.includes(normalizedQuery);
      const averageMatch = field.average_level >= fieldMin && field.average_level <= fieldMax;
      const safeMatch = !fieldSafeOnly || field.max_level <= fieldMax;
      const kindMatch = includeNormalDungeons || field.map_kind !== "dungeon";
      return focusedMatch || (textMatch && averageMatch && safeMatch && kindMatch);
    }).map((field) => {
      const totalWeight = field.ratingMonsters.reduce((sum, monster) => sum + (monster.count || 1), 0);
      const averageElementModifier = field.ratingMonsters.reduce((sum, monster) => sum + attackElementModifier(fieldAttackElement, monster.element, monster.element_level, monster.element_modifiers) * (monster.count || 1), 0) / Math.max(totalWeight, 1);
      const weakWeight = field.ratingMonsters.filter((monster) => attackElementModifier(fieldAttackElement, monster.element, monster.element_level, monster.element_modifiers) > 100).reduce((sum, monster) => sum + (monster.count || 1), 0);
      const elementFactor = fieldAttackElement === "All" ? 1 : .5 + Math.max(0, averageElementModifier) / 200;
      return {
        ...field,
        averageElementModifier,
        weakTargetShare: fieldAttackElement === "All" ? 0 : weakWeight / Math.max(totalWeight, 1),
        excludedMonsters: field.ratingMonsters.filter((monster) => excludedFieldElements.includes(monster.element)),
        score: field.average_exp_per_hp * elementFactor * (1 + Math.min(field.ratingMonsterCount, 10) * 0.02) * (1 / (1 + Math.abs(field.average_level - middle) / tolerance)),
      };
    }).sort((a, b) => {
      const suitability = Number(a.excludedMonsters.length > 0) - Number(b.excludedMonsters.length > 0);
      if (suitability !== 0) return suitability;
      return fieldSort === "element" ? b.averageElementModifier - a.averageElementModifier : fieldSort === "level" ? a.average_level - b.average_level : fieldSort === "exp" ? b.average_exp_per_hp - a.average_exp_per_hp : fieldSort === "killExp" ? b.average_base_exp_per_kill - a.average_base_exp_per_kill : b.score - a.score;
    });
  }, [fields, fieldQuery, fieldMin, fieldMax, fieldSafeOnly, fieldSort, excludedFieldElements, fieldAttackElement, includeNormalDungeons, fieldIgnoreVariants, focusedFieldCode]);
  const suitableFieldCount = shownFields.filter((field) => field.excludedMonsters.length === 0).length;
  const shownUnratedMaps = useMemo(() => {
    const query = fieldQuery.trim().toLocaleLowerCase();
    return unratedMaps.filter((map) => {
      const queryMatch = !query || `${map.map_code} ${map.name_en} ${map.name_de} ${map.region}`.toLocaleLowerCase().includes(query);
      return queryMatch && (includeNormalDungeons || map.map_kind !== "dungeon");
    });
  }, [unratedMaps, fieldQuery, includeNormalDungeons]);
  useEffect(() => {
    if (tab !== "fields" || !focusedFieldCode || fieldsLoading) return;
    window.setTimeout(() => document.getElementById(`field-${focusedFieldCode}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }, [tab, focusedFieldCode, fieldsLoading, shownFields]);

  return (
    <main>
      <header className="topbar">
        <ThemeSwitch lang={lang} />
        <a className="brand" href="#top"><span className="brandMark">OG</span><span><strong>Odin’s Glasses</strong><small>RO Zero Global Companion</small></span></a>
        <div className="topActions"><button type="button" className="appBackButton" disabled={!tabHistory.length} onClick={goBack}>← {lang === "de" ? "Zurück" : "Back"}</button><div className="status"><i /> {words.live}</div><div className="desktopBadge">WINDOWS APP</div><div className="langSwitch" aria-label={lang === "de" ? "Sprache" : "Language"}><button className={lang === "de" ? "active" : ""} onClick={() => setLang("de")}>DE</button><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button></div></div>
      </header>

      <section className="hero" id="top">
        <div><p className="eyebrow">{lang === "de" ? "LEVELN, PLANEN, LOSZIEHEN" : "LEVEL, PLAN, SET OUT"}</p><h1>{lang === "de" ? <>Finde den nächsten<br /><em>guten Kampf.</em></> : <>Find your next<br /><em>good fight.</em></>}</h1><p className="heroCopy">{lang === "de" ? "Monsterwerte, elementare Vorteile, Spawnkarten und Dungeon-Infos – für alle Klassen und Builds." : "Monster stats, elemental advantages, spawn maps and dungeon information – for every class and build."}</p></div>
        <div className="heroStats"><div><strong>489</strong><span>Monster</span></div><div><strong>4.584</strong><span>Items</span></div><div><strong>3</strong><span>{lang === "de" ? "Quelltypen" : "Source types"}</span></div></div>
      </section>

      <nav className="tabs" aria-label={lang === "de" ? "Bereiche" : "Sections"}>
        <button className={tab === "hunt" ? "active" : ""} onClick={() => navigateToTab("hunt")}><NavigationIcon name="hunt" />{words.hunt}</button>
        <button className={tab === "search" ? "active" : ""} onClick={() => navigateToTab("search")}><NavigationIcon name="search" />{lang === "de" ? "Monster-Suche" : "Monster Search"}</button>
        <button className={tab === "items" ? "active" : ""} onClick={() => navigateToTab("items")}><NavigationIcon name="items" />Items</button>
        <button className={tab === "crafting" ? "active" : ""} onClick={() => navigateToTab("crafting")}><NavigationIcon name="crafting" />Crafting</button>
        <button className={tab === "fields" ? "active" : ""} onClick={() => navigateToTab("fields")}><NavigationIcon name="fields" />{lang === "de" ? "Feld-Hunting" : "Field Hunting"}</button>
        <button className={tab === "specials" ? "active" : ""} onClick={() => navigateToTab("specials")}><NavigationIcon name="specials" />{lang === "de" ? "Spezialvarianten" : "Special variants"}</button>
        <button className={tab === "dungeons" ? "active" : ""} onClick={() => navigateToTab("dungeons")}><NavigationIcon name="dungeons" />{words.raids}</button>
        <button className={tab === "money" ? "active" : ""} onClick={() => navigateToTab("money")}><NavigationIcon name="money" />Money Helper</button>
        <button className={tab === "classes" ? "active" : ""} onClick={() => navigateToTab("classes")}><NavigationIcon name="classes" />{lang === "de" ? "Klassen & Skills" : "Classes & Skills"}</button>
      </nav>

      {tab === "money" ? <MoneyHelper lang={lang} /> : tab === "classes" ? <ClassGuide lang={lang} /> : tab === "crafting" ? <Crafting lang={lang} onOpenItem={openItemFromCrafting} /> : tab === "search" ? <section className="monsterSearchWorkspace" id="monster-search">
        <div className="searchHero"><div><p className="panelKicker">MONSTER-LEXIKON</p><h2>{lang === "de" ? "Ein Monster nachschlagen" : "Look up a monster"}</h2><p>{lang === "de" ? "Suche nach englischem Namen, internem Datenbanknamen oder Monster-ID." : "Search by English name, internal database name, or monster ID."}</p></div><span>{searchResults.length} {lang === "de" ? "Treffer" : "results"}</span></div>
        <label className="monsterSearchBox"><span>⌕</span><input autoFocus type="search" value={monsterQuery} placeholder={lang === "de" ? "Peco Peco, PECOPECO oder 1019" : "Peco Peco, PECOPECO, or 1019"} onChange={(event) => setMonsterQuery(event.target.value)} /></label>
        {searchError && <div className="errorBox">{searchError}</div>}
        {searchLoading ? <div className="loadingBox">{lang === "de" ? "Monster wird gesucht …" : "Searching monsters …"}</div> : monsterQuery.trim().length < 2 && !/^\d+$/.test(monsterQuery.trim()) ? <div className="searchHint"><b>⌕</b><h3>{lang === "de" ? "Mindestens zwei Buchstaben eingeben" : "Enter at least two letters"}</h3><p>{lang === "de" ? "Eine Monster-ID funktioniert auch direkt. Spezialvarianten erscheinen unter ihrem eigenen Namen." : "A monster ID also works directly. Special variants appear under their own names."}</p></div> : <div className="searchResults">
          {searchResults.map((mob) => <article className={`searchMonsterCard${expandedSearch === mob.monster_id ? " expanded" : ""}`} key={mob.monster_id}>
            <button className="searchMonsterSummary" onClick={() => setExpandedSearch((current) => current === mob.monster_id ? null : mob.monster_id)} aria-expanded={expandedSearch === mob.monster_id}>
              <div className="searchMonsterIdentity"><MonsterPortrait monsterId={mob.monster_id} name={mob.name_en} race={mob.race} element={mob.element} monsterSize={mob.size} variant={isVariant(mob)} /><span><small>#{mob.monster_id} · {mob.aegis_name}</small><strong>{monsterTitle(mob, lang)}</strong><em>{elementNames[mob.element]?.[lang] || mob.element} {mob.element_level} · {mob.race} · {mob.size}</em></span></div>
              <span className="searchStat"><small>LEVEL</small><strong>{mob.level}</strong></span><span className="searchStat"><small>HP</small><strong>{fmt(mob.hp, lang)}</strong></span><span className="searchStat"><small>BASE / JOB EXP</small><strong>{fmt(mob.base_exp, lang)} / {fmt(mob.job_exp, lang)}</strong></span><span className="searchExpand">{expandedSearch === mob.monster_id ? "▴" : "▾"}</span>
            </button>
            {expandedSearch === mob.monster_id && <div className="searchMonsterDetails">
              <MonsterInfo mob={mob} lang={lang} noMap={words.noMap} onMap={openFieldFromMonster} onItem={openItemFromMonster} />
            </div>}
          </article>)}
          {searchResults.length === 0 && <div className="loadingBox">{lang === "de" ? "Kein Monster mit diesem Namen oder dieser ID gefunden." : "No monster found with that name or ID."}</div>}
        </div>}
      </section> : tab === "items" ? <section className="itemWorkspace" id="item-search">
        <div className="searchHero"><div><p className="panelKicker">ITEM-LEXIKON</p><h2>{lang === "de" ? "Items suchen und vergleichen" : "Search and compare items"}</h2><p>{lang === "de" ? "Nach Haupttyp und Untertyp filtern. Öffne ein Item, um Werte, Effekte und alle bekannten droppenden Monster zu sehen." : "Filter by main type and subtype. Open an item to see stats, effects, and all known monsters that drop it."}</p></div><span>{fmt(itemTotal, lang)} {lang === "de" ? "Treffer" : "results"}</span></div>
        <div className="itemFilters">
          <label className="itemSearchBox"><span>⌕</span><input type="search" value={itemQuery} placeholder={lang === "de" ? "Itemname oder ID, z. B. Coat …" : "Item name or ID, e.g. Coat …"} onChange={(event) => { setItemQuery(event.target.value); setItemPage(0); setExpandedItem(null); }} /></label>
          <label><span>{lang === "de" ? "HAUPTTYP" : "MAIN TYPE"}</span><select value={itemSection} onChange={(event) => { setItemSection(event.target.value as (typeof itemSections)[number]); setItemSubtype(""); setItemPage(0); setExpandedItem(null); }}>{itemSections.map((section) => <option key={section} value={section}>{itemSectionNames[section][lang]}</option>)}</select></label>
          <label><span>{lang === "de" ? "UNTERTYP" : "SUBTYPE"}</span><select value={itemSubtype} disabled={!activeItemSubtypes.length} onChange={(event) => { setItemSubtype(event.target.value); setItemPage(0); setExpandedItem(null); }}><option value="">{lang === "de" ? "Alle Untertypen" : "All subtypes"}</option>{activeItemSubtypes.map((subtype) => <option key={subtype} value={subtype}>{itemSubtypeNames[subtype]?.[lang] || subtype}</option>)}</select></label>
        </div>
        <div className="itemCategoryPreview"><ItemTypeIcon category={({ etc: 'Other', enchant: 'Enchant Stone', package: 'Package/Box', pet_egg: 'Pet Egg', pet_equipment: 'Pet Equipment', taming: 'Taming Item' } as Record<string,string>)[itemSection] || itemSection} subtype={itemSubtype} /><span><strong>{itemSubtype ? itemSubtypeNames[itemSubtype]?.[lang] || itemSubtype : itemSectionNames[itemSection][lang]}</strong><small>{lang === 'de' ? 'Kategorie-Illustration · kein exaktes Itembild' : 'Category illustration · not an exact item image'}</small></span></div>
        {itemError && <div className="errorBox">{itemError}</div>}
        {itemLoading ? <div className="loadingBox">{lang === "de" ? "Items werden geladen …" : "Loading items …"}</div> : <div className="itemResults">{itemResults.map((item) => <article id={`item-${item.item_id ?? item.source_slug}`} className={`itemCard${expandedItem === item.key ? " expanded" : ""}`} key={item.key}>
          <button className="itemSummary" onClick={() => void toggleItemDetail(item)} aria-expanded={expandedItem === item.key}>
            <span className="itemIdentity"><ItemTypeIcon itemId={item.item_id} category={item.category} subtype={item.subtype} name={item.name_en} /><span><small>#{item.item_id ?? "?"} · {item.source_slug}</small><strong>{item.name_en}</strong><em>{categoryNames[item.category]?.[lang] || item.category}{item.subtype ? ` · ${itemSubtypeNames[item.subtype]?.[lang] || item.subtype}` : ""}</em></span></span>
            <span className="itemListStat"><small>{lang === "de" ? "BENÖTIGTES LEVEL" : "REQUIRED LEVEL"}</small><strong>{fmt(item.required_level, lang)}</strong></span>
            <span className="itemListStat"><small>{item.category === "Weapon" ? "ATK" : item.category === "Armor" ? "DEF" : item.category === "Card" ? (lang === "de" ? "EINSETZBAR IN" : "EQUIPPED ON") : (lang === "de" ? "NPC-KAUFPREIS" : "NPC BUY")}</small><strong>{item.category === "Weapon" ? fmt(item.attack, lang) : item.category === "Armor" ? fmt(item.defense, lang) : item.category === "Card" ? (item.subtype ? itemSubtypeNames[item.subtype]?.[lang] || item.subtype : "—") : item.buy_price != null ? `${fmt(item.buy_price, lang)} z` : "—"}</strong></span>
            <span className="itemListStat valuable"><small>{lang === "de" ? "NPC-VERKAUF" : "NPC SELL"}</small><strong>{item.sell_price != null ? `${fmt(item.sell_price, lang)} z` : "—"}</strong></span>
            <span className="searchExpand">{expandedItem === item.key ? "▴" : "▾"}</span>
          </button>
          {expandedItem === item.key && (itemDetailLoading === item.key ? <div className="loadingBox itemDetailLoading">{lang === "de" ? "Itemdetails werden geladen …" : "Loading item details …"}</div> : itemDetails[item.key] ? <ItemInfo item={itemDetails[item.key]} lang={lang} onMonster={openMonsterFromItem} /> : null)}
        </article>)}{!itemResults.length && !itemLoading && <div className="searchHint"><b>▣</b><h3>{itemSection === "all" && !itemQuery.trim() ? (lang === "de" ? "Itemname oder ID eingeben" : "Enter an item name or ID") : (lang === "de" ? "Keine passenden Items gefunden" : "No matching items found")}</h3><p>{itemSection === "all" && !itemQuery.trim() ? (lang === "de" ? "Die Gesamtsuche durchsucht normale Items, Waffen, Rüstung, Kostüme und Karten gleichzeitig." : "The global search checks regular items, weapons, armor, costumes, and cards at the same time.") : (lang === "de" ? "Versuche einen anderen Namen, Haupttyp oder Untertyp." : "Try another name, main type, or subtype.")}</p></div>}</div>}
        {itemTotal > 40 && <div className="itemPagination"><button disabled={itemPage === 0} onClick={() => { setItemPage((value) => Math.max(0, value - 1)); setExpandedItem(null); }}>← {lang === "de" ? "Zurück" : "Previous"}</button><span>{lang === "de" ? "Seite" : "Page"} {itemPage + 1} / {itemPageCount}</span><button disabled={itemPage + 1 >= itemPageCount} onClick={() => { setItemPage((value) => Math.min(itemPageCount - 1, value + 1)); setExpandedItem(null); }}>{lang === "de" ? "Weiter" : "Next"} →</button></div>}
        <p className="itemSourceNote">{lang === "de" ? "Itemnamen, Typen, Werte und bekannte Dropquellen stammen aus der offenen RagnaDex-API. Fehlende NPC- und Marktpreise bleiben leer; es werden keine Werte geraten." : "Item names, types, stats, and known drop sources come from the open RagnaDex API. Missing NPC and market prices stay blank; no values are guessed."}</p>
      </section> : tab === "fields" ? <section className="fieldWorkspace" id="field-hunting">
        <div className="fieldHead"><div><p className="panelKicker">AUTO-HUNT</p><h2>{lang === "de" ? "Das beste vollständige Feld" : "The best complete field"}</h2><p>{fieldIgnoreVariants ? (lang === "de" ? "Normale Monster bestimmen die Wertung; Spezialvarianten bleiben als Information sichtbar." : "Normal monsters determine the rating; special variants remain visible for reference.") : (lang === "de" ? "Bewertet alle Monster eines Feldes – einschließlich seltener Spezialvarianten." : "Rates every monster on a field, including rare special variants.")}</p></div><span>{suitableFieldCount} {lang === "de" ? "passend" : "suitable"}{shownFields.length > suitableFieldCount ? ` · ${shownFields.length - suitableFieldCount} ${lang === "de" ? "eingeschränkt" : "limited"}` : ""}</span></div>
        <div className="fieldFilters">
          <label><span>{lang === "de" ? "Map-Code oder Name" : "Map code or name"}</span><input type="search" value={fieldQuery} placeholder="prt_fild01" onChange={(event) => { setFieldQuery(event.target.value); setFocusedFieldCode(null); }} /></label>
          <label><span>{lang === "de" ? "Gewünschtes Ø-Level" : "Desired average level"}</span><div className="fieldRange"><input type="number" value={fieldMin} onChange={(event) => setFieldMin(Number(event.target.value))} /><b>–</b><input type="number" value={fieldMax} onChange={(event) => setFieldMax(Number(event.target.value))} /></div></label>
          <label><span>{lang === "de" ? "Sortierung" : "Sorting"}</span><select value={fieldSort} onChange={(event) => setFieldSort(event.target.value as typeof fieldSort)}><option value="score">{lang === "de" ? "Auto-Hunt-Gesamtwert inkl. Element" : "Auto-hunt score incl. element"}</option><option value="element">{lang === "de" ? "Beste Elementwirkung" : "Best elemental effectiveness"}</option><option value="level">{lang === "de" ? "Niedrigstes Ø-Level" : "Lowest average level"}</option><option value="exp">{lang === "de" ? "Höchste Ø-EXP/HP" : "Highest average EXP/HP"}</option><option value="killExp">{lang === "de" ? "Höchste Ø-Base-EXP pro Kill" : "Highest average Base EXP per kill"}</option></select></label>
          <label className="safeCheck"><input type="checkbox" checked={fieldSafeOnly} onChange={(event) => setFieldSafeOnly(event.target.checked)} /><span>{lang === "de" ? `Keine Monster über Level ${fieldMax}` : `No monsters above level ${fieldMax}`}</span></label>
          <div className="fieldPreferenceRow"><label><span>{lang === "de" ? "Dein Angriffs-Element" : "Your attack element"}</span><select value={fieldAttackElement} onChange={(event) => setFieldAttackElement(event.target.value)}>{attackElementOptions.map((elementName) => <option value={elementName} key={elementName}>{elementNames[elementName][lang]}</option>)}</select></label><label className="dungeonCheck"><input type="checkbox" checked={includeNormalDungeons} onChange={(event) => setIncludeNormalDungeons(event.target.checked)} /><span><strong>{lang === "de" ? "Normale Dungeons einbeziehen" : "Include normal dungeons"}</strong><small>{lang === "de" ? "Nur öffentliche Standardkarten; keine Instanzen, Raids oder Event-Dungeons." : "Public standard maps only; no instances, raids, or event dungeons."}</small></span></label><label className="dungeonCheck variantScoreCheck"><input type="checkbox" checked={fieldIgnoreVariants} onChange={(event) => setFieldIgnoreVariants(event.target.checked)} /><span><strong>{lang === "de" ? "Spezialvarianten bei der Wertung ignorieren" : "Ignore special variants in rating"}</strong><small>{lang === "de" ? "Bleiben in den Felddetails sichtbar." : "They remain visible in field details."}</small></span></label></div>
          <div className="fieldElementFilter"><div><strong>{lang === "de" ? "Problematische Monster-Elemente" : "Problematic monster elements"}</strong><small>{lang === "de" ? "Betroffene Felder bleiben sichtbar, werden aber getrennt nach unten sortiert und deutlich gekennzeichnet." : "Affected fields remain visible, but move into a separate section below and are clearly marked."}</small></div><div className="elementChips">{fieldElementOptions.map((elementName) => { const selected = excludedFieldElements.includes(elementName); return <button type="button" className={selected ? "excluded" : ""} aria-pressed={selected} key={elementName} onClick={() => toggleExcludedFieldElement(elementName)}><span>{selected ? "×" : "+"}</span>{elementNames[elementName][lang]}</button>; })}{excludedFieldElements.length > 0 && <button type="button" className="clearElements" onClick={() => setExcludedFieldElements([])}>{lang === "de" ? "Auswahl löschen" : "Clear selection"}</button>}</div></div>
        </div>
        {error && <div className="errorBox">{error}</div>}
        {fieldsLoading ? <div className="loadingBox">{lang === "de" ? "Alle Feldspawns werden ausgewertet …" : "Evaluating every field spawn …"}</div> : <div className="fieldList">{shownFields.map((field, index) => <div className="fieldListEntry" key={field.map_code}>{index === suitableFieldCount && suitableFieldCount < shownFields.length && <div className="limitedFieldsHead"><div><strong>⚠ {lang === "de" ? "Eingeschränkt nutzbare Felder" : "Limited-use fields"}</strong><small>{lang === "de" ? "Diese Felder enthalten gute Ziele, aber auch mindestens ein Monster mit einem als problematisch markierten Element." : "These fields contain good targets, but also at least one monster with an element marked as problematic."}</small></div><span>{shownFields.length - suitableFieldCount}</span></div>}<article id={`field-${field.map_code}`} className={`fieldCard${field.excludedMonsters.length ? " elementLimited" : ""}${expandedField === field.map_code ? " expanded" : ""}`}>
          <button className="fieldSummary" onClick={() => setExpandedField((current) => current === field.map_code ? null : field.map_code)} aria-expanded={expandedField === field.map_code}>
            <span className="rank">{String(index + 1).padStart(2, "0")}</span><div className="fieldIdentity"><small>{field.map_code} · {field.map_kind === "dungeon" ? (lang === "de" ? "NORMALER DUNGEON" : "NORMAL DUNGEON") : (lang === "de" ? "AUSSENFELD" : "FIELD")}</small><h3>{field.name_en}</h3><p>{field.monster_count} {lang === "de" ? "Monstertypen" : "monster types"} · {field.known_spawn_total || "?"} Spawns{fieldIgnoreVariants && field.ignoredVariantCount > 0 && <strong className="ignoredVariantBadge">{field.ignoredVariantCount} {lang === "de" ? "Specials nur Info" : "specials info only"}</strong>}{fieldAttackElement !== "All" && <strong className={field.averageElementModifier > 100 ? "fieldElementBoost" : field.averageElementModifier < 100 ? "fieldElementResist" : "fieldElementNeutral"}>{elementNames[fieldAttackElement][lang]} Ø {Math.round(field.averageElementModifier)}% · {Math.round(field.weakTargetShare * 100)}% {lang === "de" ? "anfällig" : "weak"}</strong>}{field.excludedMonsters.length > 0 && <strong className="fieldElementWarning">⚠ {field.excludedMonsters.length} {lang === "de" ? "problematisch" : "problematic"}</strong>}</p></div>
            <div className="fieldMetric"><small>Ø LEVEL</small><strong>{field.average_level.toLocaleString(lang === "de" ? "de-DE" : "en-US", { maximumFractionDigits: 1 })}</strong><span>Lv {field.min_level}–{field.max_level}</span></div>
            <div className="fieldMetric"><small>Ø EXP / HP</small><strong>{field.average_exp_per_hp.toLocaleString(lang === "de" ? "de-DE" : "en-US", { maximumFractionDigits: 3 })}</strong><span>{lang === "de" ? "nach Spawns gewichtet" : "spawn-weighted"}</span></div>
            <div className="fieldMetric"><small>Ø BASE-EXP / KILL</small><strong>{fmt(Math.round(field.average_base_exp_per_kill), lang)}</strong><span>{lang === "de" ? "nach Spawns gewichtet" : "spawn-weighted"}</span></div>
            <div className="fieldMetric score"><small>{lang === "de" ? "AUTO-HUNT-WERT" : "AUTO-HUNT SCORE"}</small><strong>{field.score.toLocaleString(lang === "de" ? "de-DE" : "en-US", { maximumFractionDigits: 3 })}</strong><span>{expandedField === field.map_code ? "▴" : "▾"} Details</span></div>
          </button>
            {expandedField === field.map_code && <div className="fieldMonsters"><div className="fieldMonsterHead"><span>{lang === "de" ? "Alle Monster dieses Feldes · anklicken für Details" : "Every monster on this field · click for details"}</span><span>Lv</span><span>HP</span><span>Spawns</span><span>EXP/HP</span></div>{field.monsters.map((monster) => { const modifier = attackElementModifier(fieldAttackElement, monster.element, monster.element_level, monster.element_modifiers); const ignoredVariant = fieldIgnoreVariants && monster.is_variant; return <div className={["fieldMonsterLink", monster.level > fieldMax ? "dangerMonster" : "", excludedFieldElements.includes(monster.element) ? "excludedElementMonster" : "", ignoredVariant ? "ignoredVariantMonster" : ""].filter(Boolean).join(" ")} key={monster.monster_id} role="button" tabIndex={0} title={lang === "de" ? `${monster.name_en} in der Monster-Suche öffnen` : `Open ${monster.name_en} in Monster Search`} onClick={() => openMonsterFromField(monster)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openMonsterFromField(monster); } }}><span>{monster.name_en}<em className="mobLookupHint">{lang === "de" ? "Infos →" : "Details →"}</em>{monster.is_variant && <small>{lang === "de" ? "Spezialvariante" : "Special variant"}</small>}{ignoredVariant && <small className="notRatedTag">{lang === "de" ? "nicht gewertet" : "not rated"}</small>}{fieldAttackElement !== "All" && <small className={modifier > 100 ? "elementWeak" : modifier < 100 ? "elementResist" : "elementNormal"}>{elementNames[fieldAttackElement][lang]} {modifier}%</small>}{excludedFieldElements.includes(monster.element) && <small className="elementWarning">⚠ {elementNames[monster.element]?.[lang] || monster.element}</small>}</span><b>{monster.level}</b><b>{fmt(monster.hp, lang)}</b><b>{monster.count ?? "?"}</b><b>{monster.exp_per_hp.toLocaleString(lang === "de" ? "de-DE" : "en-US", { maximumFractionDigits: 3 })}</b></div>; })}</div>}
        </article></div>)}{shownFields.length === 0 && shownUnratedMaps.length === 0 && !fieldsLoading && <div className="loadingBox">{lang === "de" ? "Kein Feld erfüllt diese Level- und Sicherheitsgrenzen." : "No field matches these level and safety limits."}</div>}{shownUnratedMaps.length > 0 && <div className="unratedMaps"><div className="unratedMapsHead"><div><strong>◌ {lang === "de" ? "Neue Karten – noch nicht bewertbar" : "New maps — not yet rateable"}</strong><small>{lang === "de" ? "Im aktuellen Zero-Global-Client bestätigt. RagnaDex enthält dafür noch keine vollständigen Monster-, HP-, EXP- und Spawnwerte." : "Confirmed in the current Zero Global client. RagnaDex does not yet contain complete monster, HP, EXP, and spawn values for them."}</small></div><span>{shownUnratedMaps.length}</span></div>{shownUnratedMaps.map((map) => <article className="unratedMapCard" key={map.map_code}><div><small>{map.map_code} · {map.map_kind === "dungeon" ? (lang === "de" ? "NORMALER DUNGEON" : "NORMAL DUNGEON") : (lang === "de" ? "AUSSENFELD" : "FIELD")}</small><h3>{lang === "de" ? map.name_de : map.name_en}</h3><p>{map.region}</p></div><strong>{lang === "de" ? "Kartencode bestätigt" : "Map code confirmed"}</strong><span>{lang === "de" ? "Wertung wartet auf offene Spawndaten" : "Rating waits for open spawn data"}</span></article>)}</div>}</div>}
        <p className="fieldNote">{fieldIgnoreVariants ? (lang === "de" ? "Der Elementwert und alle Kartenkennzahlen sind nach bekannten Spawnmengen der normalen Monster gewichtet. Spezialvarianten bleiben sichtbar, beeinflussen die Wertung und Sicherheitsprüfung aber nicht. Normale Dungeons sind öffentliche Standardkarten; Instanzen, Raids, Events und angekündigte zukünftige Karten werden nicht aufgenommen." : "Element effectiveness and every map metric are weighted by known normal-monster spawn counts. Special variants remain visible but do not affect the rating or safety check. Normal dungeons are public standard maps; instances, raids, events, and announced future maps are excluded.") : (lang === "de" ? "Der Elementwert und alle Kartenkennzahlen sind nach bekannten Spawnmengen gewichtet. Spezialvarianten fließen vollständig in Wertung und Sicherheitsprüfung ein. Normale Dungeons sind öffentliche Standardkarten; Instanzen, Raids, Events und angekündigte zukünftige Karten werden nicht aufgenommen." : "Element effectiveness and every map metric are weighted by known spawn counts. Special variants fully affect the rating and safety check. Normal dungeons are public standard maps; instances, raids, events, and announced future maps are excluded.")}</p>
      </section> : tab !== "dungeons" ? <section className="workspace">
        <aside className="filterPanel">
          <p className="panelKicker">{words.classBuild}</p>
          <select className="classSelect" value={profile} onChange={(event) => chooseProfile(event.target.value as keyof typeof profiles)}>{profileGroups.map((group) => <optgroup key={group} label={groupNames[group][lang]}>{Object.entries(profiles).filter(([, value]) => value.group === group).map(([key, value]) => <option key={key} value={key}>{value.label[lang]}</option>)}</optgroup>)}</select>
          <div className="profileSummary"><b>{profiles[profile].icon}</b><span><strong>{profiles[profile].label[lang]}</strong><small>{profiles[profile].element === "All" ? words.allTargets : `${profiles[profile].counter[lang]} ${words.against} ${elementNames[profiles[profile].element][lang]}`}</small></span></div>
          <label>{words.levelRange} <span>{min}–{max}</span></label><div className="rangeFields"><input aria-label={`${words.levelRange} minimum`} type="number" value={min} onChange={(event) => setMin(Number(event.target.value))} /><b>—</b><input aria-label={`${words.levelRange} maximum`} type="number" value={max} onChange={(event) => setMax(Number(event.target.value))} /></div>
          <label htmlFor="hunt-race">{lang === "de" ? "Monsterrasse" : "Monster race"}</label><select id="hunt-race" value={race} onChange={(event) => setRace(event.target.value)}><option value="All">{lang === "de" ? "Alle Rassen" : "All races"}</option>{raceOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>
          <label htmlFor="hunt-size">{lang === "de" ? "Monstergröße" : "Monster size"}</label><select id="hunt-size" value={monsterSize} onChange={(event) => setMonsterSize(event.target.value)}><option value="All">{lang === "de" ? "Alle Größen" : "All sizes"}</option>{sizeOptions.map((option) => <option key={option} value={option}>{sizeNames[option][lang]}</option>)}</select>
          <label>{words.targetElement}</label><select value={element} onChange={(event) => setElement(event.target.value)}>{elementOptions.map((option) => <option key={option} value={option}>{elementNames[option][lang]}</option>)}</select>
          <label>{huntView === "regions" ? (lang === "de" ? "Regionen sortieren" : "Sort regions") : words.sorting}</label>{huntView === "regions" ? <select value={regionSort} onChange={(event) => setRegionSort(event.target.value as typeof regionSort)}><option value="score">{lang === "de" ? "Beste Gesamtwertung" : "Best combined score"}</option><option value="level">{lang === "de" ? "Niedrigstes Durchschnittslevel" : "Lowest average level"}</option><option value="efficiency">{lang === "de" ? "Höchste EXP / HP" : "Highest EXP / HP"}</option></select> : <select value={sort} onChange={(event) => setSort(event.target.value as MonsterSort)}><option value="exp">{words.expHp}</option><option value="total">{words.totalExpHp}</option><option value="loot">{lang === "de" ? "Wertvollste Drops (Ø NPC-Zeny/Kill)" : "Most valuable drops (avg NPC zeny/kill)"}</option><option value="level">{words.lowestLevel}</option><option value="sizeAsc">{lang === "de" ? "Monstergröße: Klein → Groß" : "Monster size: Small → Large"}</option><option value="sizeDesc">{lang === "de" ? "Monstergröße: Groß → Klein" : "Monster size: Large → Small"}</option></select>}
          <button className="applyButton" onClick={() => setRefreshKey((value) => value + 1)}>{words.update}</button>
          <p className="sourceNote">{lang === "de" ? "Grunddaten stammen aus der offen zur Tool-Nutzung freigegebenen RagnaDex-API (Client-, rAthena- und Communitydaten). HP, EXP und Spawnzahlen sind Referenzwerte und nicht automatisch für Zero Global bestätigt. Grün markierte EXP wurden direkt in Zero Global gemessen und überschreiben die Referenz." : "Baseline data comes from the RagnaDex API, which is openly available for tools (client, rAthena, and community data). HP, EXP, and spawn counts are reference values and are not automatically confirmed for Zero Global. Green EXP values were measured directly on Zero Global and override the reference."}{sort === "loot" && <><br /><br />{lang === "de" ? "Dropwertung: erwarteter NPC-Verkaufswert pro Kill. Nur bekannte Dropchancen und NPC-Werte zählen; Spieler-Marktpreise werden nicht geschätzt." : "Drop rating: expected NPC sell value per kill. Only known drop rates and NPC values count; player-market prices are not estimated."}</>}</p>
        </aside>
        <div className="results">
          <div className="resultsHead"><div><p className="panelKicker">{specialMode ? (lang === "de" ? "SELTENE GEGNER" : "RARE TARGETS") : words.bestTargets}</p><h2>{huntView === "regions" ? (specialMode ? (lang === "de" ? "Regionen mit Spezialvarianten" : "Special-variant regions") : (lang === "de" ? "Beste Regionen" : "Best regions")) : specialMode ? (lang === "de" ? "Spezialvarianten" : "Special variants") : `${elementNames[element][lang]}-${words.enemiesFor} ${profiles[profile].label[lang]}`}</h2><p className="resultExplain">{lang === "de" ? "Filter aktualisieren sich sofort" : "Filters update immediately"} · {eligibleMonsters.length} {specialMode ? words.specialVariants : words.normalEnemies}</p></div><div className="resultTools"><div className="segmented viewSwitch"><button className={huntView === "monsters" ? "active" : ""} onClick={() => setHuntView("monsters")}>{lang === "de" ? "Einzelgegner" : "Monsters"}</button><button className={huntView === "regions" ? "active" : ""} onClick={() => setHuntView("regions")}>{lang === "de" ? "Regionen" : "Regions"}</button></div><span>{huntView === "regions" ? regions.length : ranked.length} {huntView === "regions" ? (lang === "de" ? "Regionen" : "regions") : words.hits}</span></div></div>
          {error && <div className="errorBox">{error}</div>}
          {monsterLoading ? <div className="loadingBox">{words.loadingMonsters}</div> : huntView === "regions" ? <div className="regionList">{regions.map((region, index) => <article className="regionCard" key={region.code}>
            <span className="rank">{String(index + 1).padStart(2, "0")}</span>
            <div className="regionIdentity"><small>{region.code}</small><h3>{region.name}</h3><p>Ø Lv {region.averageLevel.toLocaleString(lang === "de" ? "de-DE" : "en-US", { maximumFractionDigits: 1 })} · {region.targets.length} {lang === "de" ? "passende Gegner" : "matching monsters"}{region.knownSpawns ? ` · ${region.knownSpawns} ${lang === "de" ? "bekannte Spawns" : "known spawns"}` : ""}</p></div>
            <div className="regionScore"><small>{lang === "de" ? "REGIONSWERT" : "REGION SCORE"}</small><strong>{region.score.toLocaleString(lang === "de" ? "de-DE" : "en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</strong><span>Ø Lv {region.averageLevel.toLocaleString(lang === "de" ? "de-DE" : "en-US", { maximumFractionDigits: 1 })} · {region.weightedExpPerHp.toLocaleString(lang === "de" ? "de-DE" : "en-US", { maximumFractionDigits: 3 })} EXP/HP</span></div>
            <div className="regionTargets">{region.targets.slice(0, 4).map((target) => <div key={target.mob.monster_id}><span>{monsterTitle(target.mob, lang)}<small>Lv {target.mob.level} · {target.count ? `×${target.count}` : "?"}</small></span><b>{target.mob.exp_per_hp.toLocaleString(lang === "de" ? "de-DE" : "en-US", { maximumFractionDigits: 3 })}</b></div>)}</div>
          </article>)}{regions.length === 0 && <div className="loadingBox">{lang === "de" ? "Für diese Auswahl sind keine Spawnkarten hinterlegt." : "No spawn maps are listed for this selection."}</div>}</div> : <div className="mobList" data-result-count={ranked.length}>{ranked.length === 0 && <div className="loadingBox">{lang === "de" ? "Keine Monster für diese Auswahl. Prüfe Rasse, Größe, Levelbereich und Ziel-Element." : "No monsters match. Check race, size, level range, and target element."}</div>}{visibleRanked.map((mob, index) => <article className={`${isVariant(mob) ? "mobCard variantCard" : "mobCard"}${expandedMonster === mob.monster_id ? " expanded" : ""}`} key={mob.monster_id} role="button" tabIndex={0} aria-expanded={expandedMonster === mob.monster_id} onClick={() => setExpandedMonster((current) => current === mob.monster_id ? null : mob.monster_id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setExpandedMonster((current) => current === mob.monster_id ? null : mob.monster_id); } }}>
            <span className="rank">{String(index + 1).padStart(2, "0")}</span>
            <div className="mobIdentity"><MonsterPortrait monsterId={mob.monster_id} name={mob.name_en} race={mob.race} element={mob.element} monsterSize={mob.size} variant={isVariant(mob)} /><div><h3>{monsterTitle(mob, lang)}{isVariant(mob) && <small className="variantBadge">{words.variant}</small>}</h3><p>{isVariant(mob) ? `${mob.aegis_name} · ` : ""}#{mob.monster_id} · Lv {mob.level} · {mob.race} · {sizeNames[mob.size]?.[lang] || mob.size} · {elementNames[mob.element]?.[lang] || mob.element} {mob.element_level}</p></div></div>
            <div className="metric"><small>HP</small><strong>{fmt(mob.hp, lang)}</strong></div><div className={mob.exp_source_kind !== "ragnadex_reference" ? "metric verifiedExp" : "metric"}><small>{mob.exp_source_kind === "global_measurement" ? (lang === "de" ? "GLOBAL GEMESSEN" : "GLOBAL MEASURED") : mob.exp_source_kind === "ragnadex_zero_verified" ? (lang === "de" ? "RAGNADEX ZERO-GEPRÜFT" : "RAGNADEX ZERO-VERIFIED") : (lang === "de" ? "OFFENE REFERENZ-EXP" : "OPEN REFERENCE EXP")}</small><strong>{fmt(mob.base_exp, lang)} / {fmt(mob.job_exp, lang)}</strong></div><div className="metric accent"><small>{sort === "loot" ? (lang === "de" ? "Ø NPC-ZENY / KILL" : "AVG NPC ZENY / KILL") : "EXP / HP"}</small><strong>{sort === "loot" ? (mob.zeny_per_kill != null ? `${fmt(Math.round(mob.zeny_per_kill), lang)} z` : "—") : mob.exp_per_hp.toLocaleString(lang === "de" ? "de-DE" : "en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</strong></div>
            <div className="weakness"><small>{profiles[profile].counter[lang].toUpperCase()}</small><strong>{profileAdvantage(profile, mob)}%</strong></div>
            <div className="mapline">⌖ {mob.spawns?.length ? mob.spawns.map((spawn) => `${spawn.name}${spawn.count ? ` ≈${spawn.count}` : ""}`).join(" · ") : words.noMap} <em className={mob.exp_source_kind !== "ragnadex_reference" ? "verifiedTag" : "referenceTag"}>{mob.exp_source_kind === "global_measurement" ? (lang === "de" ? "✓ Global gemessen" : "✓ Global measured") : mob.exp_source_kind === "ragnadex_zero_verified" ? (lang === "de" ? "✓ RagnaDex Zero-geprüft" : "✓ RagnaDex Zero-verified") : (lang === "de" ? "RagnaDex-Referenz" : "RagnaDex reference")}</em><span>{expandedMonster === mob.monster_id ? "▴" : "▾"} {lang === "de" ? "Details" : "Details"}</span></div>
            {expandedMonster === mob.monster_id && <div className="monsterDetails" onClick={(event) => event.stopPropagation()}>
              <MonsterInfo mob={mob} lang={lang} noMap={words.noMap} onMap={openFieldFromMonster} onItem={openItemFromMonster} />
            </div>}
          </article>)}{ranked.length > visibleRanked.length && <button type="button" className="loadMoreButton" onClick={() => setVisibleMonsterCount((count) => count + 30)}>{lang === "de" ? `${visibleRanked.length} von ${ranked.length} Treffern · 30 weitere anzeigen` : `${visibleRanked.length} of ${ranked.length} results · Show 30 more`}</button>}</div>}
        </div>
      </section> : <section className="raidWorkspace">
        <div className="raidHead"><div><p className="panelKicker">{words.groupContent}</p><h2>{words.raids}</h2><p>{words.dungeonIntro}</p></div><div className="segmented"><button className={dungeonMode === "maps" ? "active" : ""} onClick={() => setDungeonMode("maps")}>{words.dungeons}</button><button className={dungeonMode === "bosses" ? "active" : ""} onClick={() => setDungeonMode("bosses")}>{words.bossMonsters}</button></div></div>
        {raidLoading ? <div className="loadingBox">{words.loadingRaids}</div> : dungeonMode === "maps" ? <>
          <div className="dungeonSearch"><input type="search" placeholder={words.searchDungeon} value={dungeonQuery} onChange={(event) => setDungeonQuery(event.target.value)} /><span>{shownDungeons.length} {words.maps}</span></div>
          <div className="dungeonLayout"><div className="dungeonGrid">{shownDungeons.map((dungeon) => <button className={selectedDungeon?.slug === dungeon.slug ? "dungeonCard active" : "dungeonCard"} key={dungeon.slug} onClick={() => void openDungeon(dungeon.slug)}><small>{dungeon.location || "Dungeon"}{dungeon.floor ? ` · ${dungeon.floor}` : ""}</small><h3>{dungeon.name}</h3><div><span>♟ {dungeon.spawns} Spawns</span><span>⇄ {dungeon.warps} {words.paths}</span></div></button>)}</div>
          <aside className="detailPanel">{detailLoading ? <div className="loadingBox">{words.analysing}</div> : selectedDungeon ? <><div className="detailHero">{selectedDungeon.image && <img src={selectedDungeon.image} alt="" />}<div><small>{selectedDungeon.location || "Dungeon"}</small><h3>{selectedDungeon.name}</h3><p>{words.monsterLevel} {fmt(selectedDungeon.level_min, lang)}–{fmt(selectedDungeon.level_max, lang)} · {selectedDungeon.warps} Warps</p></div></div><h4>{words.monstersOnMap}</h4><div className="spawnList">{selectedDungeon.spawns.sort((a,b) => (b.count || 0) - (a.count || 0)).map((spawn) => <div key={`${spawn.slug}-${spawn.count}`}><span>{spawn.mvp ? "◆" : "·"} {spawn.name}<small>Lv {fmt(spawn.level, lang)}</small></span><b>{spawn.count ? `×${spawn.count}` : "?"}</b></div>)}</div>{selectedDungeon.connections.length > 0 && <><h4>{words.connections}</h4><p className="connections">{selectedDungeon.connections.map((connection) => connection.name).join(" · ")}</p></>}</> : <div className="emptyDetail"><b>⌖</b><h3>{words.chooseDungeon}</h3><p>{words.chooseDungeonHint}</p></div>}</aside></div>
        </> : <div className="bossGrid">{bosses.map((boss) => <article className="bossCard" key={boss.slug}><MonsterPortrait monsterId={Number(boss.slug)} name={boss.name} race={boss.race} element={boss.element} /><div><small>MVP · {boss.race || words.unknown}</small><h3>{boss.name}</h3><p>Lv {fmt(boss.level, lang)} · {elementNames[boss.element || ""]?.[lang] || boss.element || "?"} {boss.element_level || ""}</p><div className="bossStats"><span><small>HP</small>{fmt(boss.hp, lang)}</span>{boss.base_exp != null && <span><small>{lang === "de" ? "REFERENZ-EXP" : "REFERENCE EXP"}</small>{fmt(boss.base_exp, lang)}</span>}</div><p className="bossMaps">⌖ {boss.maps?.map((map) => map.name).join(" · ") || words.unknownSpawn}</p></div></article>)}</div>}
        <p className="raidNote">{lang === "de" ? "Dungeon-, Spawn- und MVP-Angaben stammen vollständig aus der offen nutzbaren RagnaDex-API. Spawnzahlen und Wiedererscheinungszeiten bleiben Referenzwerte; Kartenbilder, Warps, Quests und Community-Raidtermine werden nicht aus ungeklärten Drittquellen übernommen." : "Dungeon, spawn, and MVP data now comes entirely from the openly reusable RagnaDex API. Spawn counts and respawn times remain reference values; map images, warps, quests, and community raid schedules are not copied from third-party sources without clear reuse terms."}</p>
      </section>}
      <footer className="legalFooter">{lang === "de" ? <><strong>Inoffizielles, nicht-kommerzielles Fan-Tool.</strong> Nicht mit Gravity oder Gravity Game Unite verbunden. Ragnarok Online und zugehörige Spielinhalte: © Gravity Co., Ltd. &amp; Lee Myoungjin (studio DTDS). Datenbasis: RagnaDex Open API (Namensnennung gemäß API-Bedingung), rAthena GPL‑3.0-or-later und eigene Zero-Global-Messungen. Jeder Wert behält seinen Quellenstatus.</> : <><strong>Unofficial, non-commercial fan tool.</strong> Not affiliated with Gravity or Gravity Game Unite. Ragnarok Online and related game content: © Gravity Co., Ltd. &amp; Lee Myoungjin (studio DTDS). Data basis: RagnaDex Open API (attributed as required), rAthena GPL-3.0-or-later, and our own Zero Global measurements. Every value retains its source status.</>}</footer>
    </main>
  );
}
