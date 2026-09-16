import type { Lang, Monster } from "../domain/types";
import { attributeNames, categoryNames, fmt } from "../domain/display";
import { ItemTypeIcon } from "./VisualIcons";
import MonsterArtwork from './MonsterArtwork';
import behaviorLicense from "../../../assets/rathena-behavior/LICENSE?raw";
import behaviorNotice from "../../../assets/rathena-behavior/NOTICE.txt?raw";

type SpawnReference = NonNullable<Monster["spawns"]>[number];
type DropReference = NonNullable<Monster["drops"]>[number];

type MonsterInfoProps = {
  mob: Monster;
  lang: Lang;
  noMap: string;
  onMap: (spawn: SpawnReference) => void;
  onItem: (drop: DropReference) => void;
};

export default function MonsterInfo({ mob, lang, noMap, onMap, onItem }: MonsterInfoProps) {
  const locale = lang === "de" ? "de-DE" : "en-US";
  const elements = ["Neutral", "Water", "Wind", "Earth", "Fire", "Poison", "Holy", "Shadow", "Ghost", "Undead"];
  const elementLabel: Record<string, { de: string; en: string }> = {
    Neutral: { de: "Neutral", en: "Neutral" }, Water: { de: "Wasser", en: "Water" }, Wind: { de: "Wind", en: "Wind" }, Earth: { de: "Erde", en: "Earth" }, Fire: { de: "Feuer", en: "Fire" },
    Poison: { de: "Gift", en: "Poison" }, Holy: { de: "Heilig", en: "Holy" }, Shadow: { de: "Schatten", en: "Shadow" }, Ghost: { de: "Geist", en: "Ghost" }, Undead: { de: "Untot", en: "Undead" },
  };
  const stat = (label: string, value: React.ReactNode) => <span><small>{label}</small><strong>{value}</strong></span>;
  return <>
    <MonsterArtwork id={mob.monster_id} name={mob.name_en} lang={lang} />
    <div className="detailCombat"><div className="detailStats">
      {stat(lang === "de" ? "PHYS. ANGRIFF" : "PHYS. ATTACK", `${fmt(mob.attack_min, lang)}–${fmt(mob.attack_max, lang)}`)}
      {stat("MATK", `${fmt(mob.matk_min, lang)}–${fmt(mob.matk_max, lang)}`)}
      {stat("DEF", fmt(mob.defense, lang))}{stat("MDEF", fmt(mob.magic_defense, lang))}{stat("FLEE (95%)", fmt(mob.flee_95, lang))}{stat("HIT (100%)", fmt(mob.hit_100, lang))}
      {stat("STR", fmt(mob.str, lang))}{stat("AGI", fmt(mob.agi, lang))}{stat("VIT", fmt(mob.vit, lang))}{stat("INT", fmt(mob.int_stat, lang))}{stat("DEX", fmt(mob.dex, lang))}{stat("LUK", fmt(mob.luk, lang))}
      {stat(lang === "de" ? "RASSE" : "RACE", mob.race || "—")}{stat(lang === "de" ? "GRÖSSE" : "SIZE", mob.size || "—")}
      {stat("EXP / HP", mob.exp_per_hp.toLocaleString(locale, { maximumFractionDigits: 3 }))}{stat(lang === "de" ? "GESAMT-EXP / HP" : "TOTAL EXP / HP", mob.total_exp_per_hp.toLocaleString(locale, { maximumFractionDigits: 3 }))}
      {stat(lang === "de" ? "Ø NPC-ZENY / KILL" : "AVG NPC ZENY / KILL", mob.zeny_per_kill != null ? `${fmt(Math.round(mob.zeny_per_kill), lang)} z` : "—")}
      <span><small>ASPD</small><strong className="unavailableStat">— <em>{lang === "de" ? "nicht in Quelle" : "not in source"}</em></strong></span>{stat(lang === "de" ? "EXP-QUELLE" : "EXP SOURCE", mob.exp_source)}
    </div>
    {mob.global_override_evidence && <p className="globalEvidence">✓ {lang === "de" ? "Im Global-Client bestätigt" : "Confirmed in Global client"}: {mob.global_override_evidence}</p>}
    {!!mob.element_modifiers && <div className="elementModifierBlock"><h4>{lang === "de" ? "Elementschaden gegen dieses Monster" : "Element damage against this monster"}</h4><div>{elements.map((element) => <span className={(mob.element_modifiers?.[element] ?? 100) > 100 ? "elementBoost" : (mob.element_modifiers?.[element] ?? 100) < 100 ? "elementReduced" : ""} key={element}><small>{elementLabel[element][lang]}</small><strong>{mob.element_modifiers?.[element] ?? 100}%</strong></span>)}</div></div>}
    <div className="attributeBlock"><h4>{lang === "de" ? "Verhalten · rAthena-Referenz" : "Behaviour · rAthena reference"}</h4>
      <p>{mob.behavior_reference ? (lang === "de" ? "Global unbestätigt · Grundverhalten; Skills können es verändern." : "Unverified for Global · baseline behaviour; skills may change it.") : (lang === "de" ? "Unbekannt: kein eindeutig passender Verhaltenseintrag. Das bedeutet nicht passiv." : "Unknown: no exact behaviour match. This does not mean passive.")}</p>
      <div>{mob.behavior_attributes?.map(attribute => <span key={attribute.status_en}>{attributeNames[attribute.status_en]?.[lang] || attribute.status_en}</span>)}</div>
      {mob.behavior_reference && <small>{mob.behavior_reference.source} · AI {mob.behavior_reference.ai} · {mob.behavior_reference.revision.slice(0, 8)}</small>}
      <details><summary>{lang === "de" ? "Quelle, Lizenz und bearbeitbare Daten" : "Source, license and editable data"}</summary>
        <p>{lang === "de" ? "© rAthena Development Team · GPL-3.0-or-later · ohne Gewähr. Bearbeitet am 04.09.2026. Quelldaten und Importskript liegen im mitgelieferten Ordner rathena-behavior-sources; bei Weitergabe mitgeben." : "© rAthena Development Team · GPL-3.0-or-later · no warranty. Modified 2026-09-04. Source data and import script are included in rathena-behavior-sources; include them when redistributing."}</p>
        <pre style={{ whiteSpace: "pre-wrap", maxHeight: 240, overflow: "auto" }}>{behaviorNotice + "\n\n" + behaviorLicense}</pre>
      </details>
    </div>
    {!!mob.special_attributes?.length && <div className="attributeBlock"><h4>{lang === "de" ? "Weitere Merkmale · RagnaDex" : "Additional attributes · RagnaDex"}</h4><div>{mob.special_attributes.map((attribute) => <span key={attribute.status_en}>{attributeNames[attribute.status_en]?.[lang] || attribute.status_en}</span>)}</div></div>}</div>
    <div className="detailSpawns"><h4>{lang === "de" ? "Alle bekannten Spawnkarten · anklicken" : "All known spawn maps · click to open"}</h4>{mob.spawns?.length ? mob.spawns.map((spawn) => <button type="button" className="detailSpawnLink" key={spawn.code} onClick={() => onMap(spawn)} title={lang === "de" ? `${spawn.name} im Feld-Hunting öffnen` : `Open ${spawn.name} in Field Hunting`}><span>{spawn.name}<small>{spawn.code}</small></span><b>{spawn.count ? `≈${spawn.count}` : "?"}</b><em>{lang === "de" ? "Feld ansehen →" : "View field →"}</em></button>) : <p>{noMap}</p>}</div>
    <div className="dropSection"><div className="dropHead"><h4>{lang === "de" ? "Mögliche Drops · anklicken" : "Possible drops · click to open"}</h4><span>{mob.drops?.length || 0} {lang === "de" ? "Einträge" : "entries"}</span></div>{mob.drops?.length ? <div className="dropTable"><div className="dropRow dropLabels"><span>ITEM</span><span>{lang === "de" ? "ART" : "TYPE"}</span><span>RATE</span><span>{lang === "de" ? "NPC-VERKAUF" : "NPC SELL"}</span></div>{mob.drops.map((drop) => <button type="button" className="dropRow dropLink" key={`${mob.monster_id}-${drop.item_id}`} onClick={() => onItem(drop)} title={lang === "de" ? `${drop.name_en} im Item-Lexikon öffnen` : `Open ${drop.name_en} in Item Lexicon`}><span className="dropIdentity"><ItemTypeIcon itemId={drop.item_id} category={drop.category} name={drop.name_en} /><b>{drop.name_en}</b><small>#{drop.item_id}</small></span><span><em>{categoryNames[drop.category]?.[lang] || drop.category}</em></span><span><b>{drop.rate_known && drop.rate_percent != null ? `${drop.rate_percent.toLocaleString(locale, { maximumFractionDigits: 4 })}%` : "—"}</b></span><span><b>{drop.npc_sell_price != null ? `${fmt(drop.npc_sell_price, lang)} z` : "—"}</b></span></button>)}</div> : <p className="noDrops">{lang === "de" ? "Keine Dropdaten verfügbar." : "No drop data available."}</p>}</div>
  </>;
}
