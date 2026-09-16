import type { Lang, Localized } from "./types";

export function fmt(value: number | null | undefined, lang: Lang) {
  return value == null ? "—" : value.toLocaleString(lang === "de" ? "de-DE" : "en-US");
}

export const itemSubtypeNames: Record<string, Localized> = {
  Armor: { de: "Körperrüstung", en: "Body Armor" }, Shield: { de: "Schild", en: "Shield" }, Shoes: { de: "Schuhe", en: "Shoes" }, Garment: { de: "Umhang", en: "Garment" },
  Accessory: { de: "Accessoire", en: "Accessory" }, "Upper Headgear": { de: "Oberes Kopfteil", en: "Upper Headgear" }, "Middle Headgear": { de: "Mittleres Kopfteil", en: "Middle Headgear" },
  "Lower Headgear": { de: "Unteres Kopfteil", en: "Lower Headgear" }, Weapon: { de: "Waffe", en: "Weapon" }, Book: { de: "Buch", en: "Book" }, Bow: { de: "Bogen", en: "Bow" },
  Dagger: { de: "Dolch", en: "Dagger" }, Instrument: { de: "Instrument", en: "Instrument" }, Katar: { de: "Katar", en: "Katar" }, Knuckle: { de: "Faustwaffe", en: "Knuckle" },
  Mace: { de: "Streitkolben", en: "Mace" }, "One-handed Axe": { de: "Einhandaxt", en: "One-handed Axe" }, "One-handed Spear": { de: "Einhandlanze", en: "One-handed Spear" },
  "One-handed Staff": { de: "Einhandstab", en: "One-handed Staff" }, "One-handed Sword": { de: "Einhandschwert", en: "One-handed Sword" }, "Two-handed Axe": { de: "Zweihandaxt", en: "Two-handed Axe" },
  "Two-handed Spear": { de: "Zweihandlanze", en: "Two-handed Spear" }, "Two-handed Staff": { de: "Zweihandstab", en: "Two-handed Staff" }, "Two-handed Sword": { de: "Zweihandschwert", en: "Two-handed Sword" },
  Whip: { de: "Peitsche", en: "Whip" }, Arrow: { de: "Pfeil", en: "Arrow" }, Shuriken: { de: "Shuriken", en: "Shuriken" },
  Kunai: { de: "Kunai", en: "Kunai" }, "Huuma Shuriken": { de: "Huuma-Shuriken", en: "Huuma Shuriken" },
};

export const categoryNames: Record<string, Localized> = {
  Consumable: { de: "Verbrauch", en: "Consumable" }, ETC: { de: "Material", en: "Material" }, Other: { de: "Sonstiges", en: "Other" },
  Card: { de: "Karte", en: "Card" }, Weapon: { de: "Waffe", en: "Weapon" }, Armor: { de: "Rüstung", en: "Armor" }, Equipment: { de: "Ausrüstung", en: "Equipment" },
  Costume: { de: "Kostüm", en: "Costume" }, Material: { de: "Material", en: "Material" }, "Enchant Stone": { de: "Verzauberungsstein", en: "Enchant Stone" },
  "Package/Box": { de: "Paket/Box", en: "Package/Box" }, Collectible: { de: "Sammelitem", en: "Collectible" }, "Pet Egg": { de: "Pet-Ei", en: "Pet Egg" },
  "Pet Equipment": { de: "Pet-Ausrüstung", en: "Pet Equipment" }, "Taming Item": { de: "Zähmitem", en: "Taming Item" }, Ammo: { de: "Munition", en: "Ammunition" }, Unknown: { de: "Unbekannt", en: "Unknown" },
};

const sourceJobNames: Record<string, Localized> = {
  "初學者以外的全職業": { de: "Alle Klassen außer Novize", en: "All jobs except Novice" }, "全職業": { de: "Alle Klassen", en: "All jobs" }, "所有職業": { de: "Alle Klassen", en: "All jobs" }, "全部職業": { de: "Alle Klassen", en: "All jobs" },
  "初學者": { de: "Novize", en: "Novice" }, "劍士系列": { de: "Schwertkämpfer-Klassen", en: "Swordman class" }, "魔法師系列": { de: "Magier-Klassen", en: "Mage class" },
  "弓箭手系列": { de: "Bogenschützen-Klassen", en: "Archer class" }, "服事系列": { de: "Akolyten-Klassen", en: "Acolyte class" }, "商人系列": { de: "Händler-Klassen", en: "Merchant class" },
  "盜賊系列": { de: "Diebes-Klassen", en: "Thief class" }, "跆拳系列": { de: "Taekwon-Klassen", en: "Taekwon class" }, "忍者系列": { de: "Ninja-Klassen", en: "Ninja class" }, "神槍手系列": { de: "Revolverhelden-Klassen", en: "Gunslinger class" },
};
const nonLatinSourceText = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;

export function localizedSourceJobs(value: string | null, lang: Lang) {
  if (!value) return null;
  if (sourceJobNames[value]) return sourceJobNames[value][lang];
  const translated = value.split(/[,，、]/).map((part) => part.trim()).filter(Boolean).flatMap((part) => sourceJobNames[part] ? [sourceJobNames[part][lang]] : nonLatinSourceText.test(part) ? [] : [part]);
  return translated.length ? translated.join(", ") : null;
}

export function readableSourceText(value: string | null) { return value && !nonLatinSourceText.test(value) ? value : null; }

export const attributeNames: Record<string, Localized> = {
  "Can Attack": { de: "Kann normal angreifen", en: "Can attack normally" },
  "No Random Walk": { de: "Wandert nicht umher", en: "No random walking" },
  "Cannot Cast": { de: "Kann keine Skills wirken", en: "Cannot cast skills" },
  "Targets Weak Players": { de: "Bevorzugt schwächere Spieler", en: "Targets weaker players" },
  Aggressive: { de: "Aggressiv", en: "Aggressive" }, "Assists Allies": { de: "Unterstützt Verbündete", en: "Assists Allies" }, "Physically Attackable": { de: "Physisch angreifbar", en: "Physically Attackable" },
  "Can Move": { de: "Beweglich", en: "Can Move" }, "Changes Target on Melee": { de: "Wechselt Ziel bei Nahkampf", en: "Changes Target on Melee" }, "Changes Target When Attacked": { de: "Wechselt Ziel bei Angriff", en: "Changes Target When Attacked" },
  "Changes Chase Target": { de: "Wechselt Verfolgungsziel", en: "Changes Chase Target" }, "Detects Hidden": { de: "Erkennt Versteckte", en: "Detects Hidden" },
  "Cast Sensor (Idle)": { de: "Reagiert auf Zauber (ruhend)", en: "Cast Sensor (Idle)" }, "Cast Sensor (Chase)": { de: "Reagiert auf Zauber (Verfolgung)", en: "Cast Sensor (Chase)" },
  "Enraged State": { de: "Wird wütend", en: "Enraged State" }, "Loots Items": { de: "Sammelt Gegenstände", en: "Loots Items" }, Boss: { de: "Boss", en: "Boss" }, MVP: { de: "MVP", en: "MVP" },
  "Mini Boss": { de: "Mini-Boss", en: "Mini Boss" }, "Other Damage Reduction": { de: "Reduziert sonstigen Schaden", en: "Other Damage Reduction" },
  "Ranged Damage Reduction": { de: "Reduziert Fernkampfschaden", en: "Ranged Damage Reduction" }, "Physical Damage Reduction": { de: "Reduziert physischen Schaden", en: "Physical Damage Reduction" },
  "Magic Damage Reduction": { de: "Reduziert magischen Schaden", en: "Magic Damage Reduction" }, "Random Target": { de: "Zufälliges Ziel", en: "Random Target" }, "Fixed Drop": { de: "Fester Drop", en: "Fixed Drop" },
  "Immune to Magic": { de: "Immun gegen Magie", en: "Immune to Magic" }, "Immune to Melee": { de: "Immun gegen Nahkampf", en: "Immune to Melee" },
  "Immune to Misc": { de: "Immun gegen sonstigen Schaden", en: "Immune to Misc" }, "Immune to Ranged": { de: "Immun gegen Fernkampf", en: "Immune to Ranged" },
  "Cannot Be Knocked Back": { de: "Kann nicht zurückgestoßen werden", en: "Cannot Be Knocked Back" }, "Fixed Item Drop": { de: "Fester Itemdrop", en: "Fixed Item Drop" },
};
