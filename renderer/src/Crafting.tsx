"use client";

import { useMemo, useState } from "react";
import { confidenceNames, craftingRecipes, professionIcons, professionNames, type CraftLang, type CraftProfession, type CraftRecipe } from "./crafting-data";
import { ItemTypeIcon } from "./components/VisualIcons";

type View = "recipes" | "materials";
type ProfessionFilter = "all" | CraftProfession;

function label(value: { de: string; en: string }, lang: CraftLang) { return value[lang]; }
function normalized(value: string) { return value.trim().toLocaleLowerCase(); }

export default function Crafting({ lang, onOpenItem }: { lang: CraftLang; onOpenItem: (name: string) => void }) {
  const [view, setView] = useState<View>("recipes");
  const [profession, setProfession] = useState<ProfessionFilter>("all");
  const [query, setQuery] = useState("");
  const [includeReference, setIncludeReference] = useState(true);
  const needle = normalized(query);

  const recipes = useMemo(() => craftingRecipes.filter((recipe) => {
    if (profession !== "all" && recipe.profession !== profession) return false;
    if (!includeReference && recipe.confidence === "classic") return false;
    if (!needle) return true;
    return [recipe.output.de, recipe.output.en, recipe.skill.de, recipe.skill.en, ...recipe.materials.flatMap((material) => [material.name.de, material.name.en])]
      .some((value) => normalized(value).includes(needle));
  }), [profession, includeReference, needle]);

  const materials = useMemo(() => {
    const index = new Map<string, {
      itemId?: number | null;
      name: { de: string; en: string };
      role: "ingredient" | "container" | "tool";
      recipes: CraftRecipe[];
      amount: number;
    }>();
    for (const recipe of craftingRecipes) {
      if (profession !== "all" && recipe.profession !== profession) continue;
      if (!includeReference && recipe.confidence === "classic") continue;
      for (const material of recipe.materials) {
        const key = normalized(material.name.en);
        const current = index.get(key) || { itemId: material.itemId, name: material.name, role: material.role || "ingredient", recipes: [], amount: 0 };
        if (current.itemId == null && material.itemId != null) current.itemId = material.itemId;
        current.recipes.push(recipe);
        current.amount += material.amount;
        index.set(key, current);
      }
    }
    return [...index.values()].filter((material) => !needle || [material.name.de, material.name.en, ...material.recipes.flatMap((recipe) => [recipe.output.de, recipe.output.en])]
      .some((value) => normalized(value).includes(needle)))
      .sort((a, b) => {
        const roleOrder = { ingredient: 0, container: 1, tool: 2 };
        return roleOrder[a.role] - roleOrder[b.role] || b.recipes.length - a.recipes.length || label(a.name, lang).localeCompare(label(b.name, lang));
      });
  }, [profession, includeReference, needle, lang]);

  const noRecipeMatch = needle && recipes.length === 0 && materials.length === 0;

  return <section className="craftWorkspace" id="crafting">
    <div className="craftHero">
      <div><p className="panelKicker">CRAFTING-LAGER</p><h2>{lang === "de" ? "Was behalten, was herstellen?" : "What should you keep and craft?"}</h2><p>{lang === "de" ? "Rezepte nach Beruf und eine Materialansicht für deine Drops. Unsichere Zero-Daten werden sichtbar getrennt." : "Recipes by profession and a material view for your drops. Uncertain Zero data is kept visibly separate."}</p></div>
      <div className="craftHeroCount"><strong>{view === "recipes" ? recipes.length : materials.length}</strong><span>{view === "recipes" ? (lang === "de" ? "Rezepte" : "recipes") : (lang === "de" ? "Materialien" : "materials")}</span></div>
    </div>

    <div className="craftControls">
      <div className="segmented craftViewSwitch"><button className={view === "recipes" ? "active" : ""} onClick={() => setView("recipes")}>{lang === "de" ? "Rezepte" : "Recipes"}</button><button className={view === "materials" ? "active" : ""} onClick={() => setView("materials")}>{lang === "de" ? "Drops behalten?" : "Keep drops?"}</button></div>
      <label className="craftSearch"><span>⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={lang === "de" ? "Drop, Zutat oder Ergebnis suchen …" : "Search drop, ingredient, or result …"} /></label>
      <div className="craftProfessions"><button className={profession === "all" ? "active" : ""} onClick={() => setProfession("all")}>{lang === "de" ? "Alle" : "All"}</button>{(["npc", "alchemist", "blacksmith", "priest", "assassin", "sage"] as CraftProfession[]).map((entry) => <button className={profession === entry ? "active" : ""} key={entry} onClick={() => setProfession(entry)}>{professionIcons[entry]} {label(professionNames[entry], lang)}</button>)}</div>
      <label className="craftReferenceToggle"><input type="checkbox" checked={includeReference} onChange={(event) => setIncludeReference(event.target.checked)} /><span><strong>{lang === "de" ? "Klassische Referenzrezepte einblenden" : "Show classic reference recipes"}</strong><small>{lang === "de" ? "rAthena-Rezepte sind nicht automatisch für Zero Global bestätigt und bleiben deutlich markiert." : "rAthena recipes are not automatically confirmed for Zero Global and remain clearly marked."}</small></span></label>
    </div>

    {noRecipeMatch && <div className="craftUnknown"><b>?</b><div><strong>{lang === "de" ? `„${query}“ ist in den erfassten Rezepten nicht enthalten.` : `“${query}” is not in the recorded recipes.`}</strong><p>{lang === "de" ? "Das bedeutet nicht automatisch „ruhig verkaufen“: Quest-, Event- und kommende Global-Rezepte sind noch nicht vollständig erfasst." : "That does not automatically mean safe to sell: quest, event, and future Global recipes are not yet fully covered."}</p></div><button onClick={() => onOpenItem(query)}>{lang === "de" ? "Im Item-Lexikon prüfen →" : "Check Item Lexicon →"}</button></div>}

    {view === "recipes" ? <div className="recipeGrid">{recipes.map((recipe) => <article className={`recipeCard confidence-${recipe.confidence}`} key={recipe.id}>
      <header><button className="recipeOutputImage" onClick={() => onOpenItem(recipe.output.en)} title={lang === "de" ? `${label(recipe.output, lang)} im Item-Lexikon öffnen` : `Open ${label(recipe.output, lang)} in Item Lexicon`}><ItemTypeIcon itemId={recipe.outputItemId} name={recipe.output.en} /></button><div><small><span className="recipeProfessionMini">{professionIcons[recipe.profession]}</span>{label(professionNames[recipe.profession], lang)} · {label(recipe.skill, lang)}{recipe.skillLevel ? ` Lv.${recipe.skillLevel}` : ""}</small><button className="recipeOutputLink" onClick={() => onOpenItem(recipe.output.en)}><h3>{label(recipe.output, lang)}{(recipe.amount || 1) > 1 ? ` ×${recipe.amount}` : ""}</h3></button></div><em>{label(confidenceNames[recipe.confidence], lang)}</em></header>
      <div className="recipeMaterials">{recipe.materials.map((material, index) => <button key={`${recipe.id}-${material.name.en}-${index}`} onClick={() => onOpenItem(material.name.en)}><span className="recipeMaterialIcon"><ItemTypeIcon itemId={material.itemId} name={material.name.en} /><i>{material.role === "tool" ? "⌁" : material.role === "container" ? "◇" : "+"}</i></span><strong>{label(material.name, lang)}</strong><b>{material.amount === 0 ? (lang === "de" ? "benötigt" : "required") : `×${material.amount}`}</b></button>)}</div>
      {(recipe.location || recipe.fee || recipe.requiredLevel) && <div className="recipeMeta">{recipe.location && <span><b>{recipe.location.name}</b><code>{recipe.location.navi}</code></span>}{recipe.fee ? <span>{recipe.fee.toLocaleString(lang === "de" ? "de-DE" : "en-US")} Zeny</span> : null}{recipe.requiredLevel ? <span>{lang === "de" ? `Ab Basislevel ${recipe.requiredLevel}` : `From base level ${recipe.requiredLevel}`}</span> : null}</div>}
      {recipe.note && <p>{label(recipe.note, lang)}</p>}
    </article>)}</div> : <div className="materialList">{materials.map((material) => {
      const referenceOnly = material.recipes.every((recipe) => recipe.confidence === "classic");
      const status = material.role === "tool" || material.role === "container" ? (lang === "de" ? "Verbrauchsmaterial" : "Consumable supply") : referenceOnly ? (lang === "de" ? "Nur klassische Referenz – erst prüfen" : "Classic reference only – verify first") : (lang === "de" ? "Behalten: Zero-Rezeptmaterial" : "Keep: Zero recipe material");
      return <article className={`materialCard${referenceOnly ? " referenceOnly" : ""}`} key={material.name.en}>
        <button className="materialIdentity" onClick={() => onOpenItem(material.name.en)}><span className="materialItemImage"><ItemTypeIcon itemId={material.itemId} name={material.name.en} /><i>{material.role === "tool" ? "⌁" : material.role === "container" ? "◇" : "◆"}</i></span><div><small>{material.role === "tool" ? (lang === "de" ? "WERKZEUG" : "TOOL") : material.role === "container" ? (lang === "de" ? "BEHÄLTER" : "CONTAINER") : (lang === "de" ? "ZUTAT" : "INGREDIENT")}</small><h3>{label(material.name, lang)}</h3><em>{material.name.de !== material.name.en ? material.name.en : ""}</em></div></button>
        <div className="materialStatus"><small>{lang === "de" ? "EMPFEHLUNG" : "RECOMMENDATION"}</small><strong>{status}</strong></div>
        <div className="materialUses"><small>{lang === "de" ? "BEKANNTE VERWENDUNG" : "KNOWN USE"}</small><strong>{material.recipes.length} {material.recipes.length === 1 ? (lang === "de" ? "Rezept" : "recipe") : (lang === "de" ? "Rezepte" : "recipes")}</strong><span>{material.recipes.map((recipe) => label(recipe.output, lang)).join(" · ")}</span></div>
        <button className="materialLookup" onClick={() => onOpenItem(material.name.en)}>{lang === "de" ? "Item & Drops →" : "Item & drops →"}</button>
      </article>;
    })}</div>}

    <div className="craftDataNote"><strong>{lang === "de" ? "Datenstatus" : "Data status"}</strong><p>{lang === "de" ? "31 NPC-Kopfbedeckungsrezepte stammen aus der offen nutzbaren RagnaDex-Sammlung und wurden dort fast vollständig gegen die Zero-Global-Client-Navigation geprüft. Schmieden, Alchemie und weitere Skill-Rezepte stammen als klar markierte klassische Referenz aus rAthena; sie können in Zero abweichen. „Nicht gefunden“ ist niemals automatisch eine Verkaufsgarantie." : "31 NPC headgear recipes come from the openly reusable RagnaDex dataset and were checked there almost completely against Zero Global client navigation. Forging, alchemy and other skill recipes are clearly marked classic references from rAthena and can differ in Zero. “Not found” is never automatically a guarantee that an item is safe to sell."}</p></div>
  </section>;
}
