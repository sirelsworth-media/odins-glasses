import imported from "./data/crafting-recipes.json";

export type CraftLang = "de" | "en";
export type CraftText = { de: string; en: string };
export type CraftProfession = "npc" | "alchemist" | "blacksmith" | "priest" | "assassin" | "sage";
export type CraftConfidence = "client" | "classic";

export type CraftMaterial = {
  itemId?: number | null;
  name: CraftText;
  amount: number;
  role?: "ingredient" | "container" | "tool";
};

export type CraftRecipe = {
  id: string;
  profession: CraftProfession;
  output: CraftText;
  outputItemId?: number | null;
  amount?: number;
  skill: CraftText;
  skillLevel?: number | null;
  materials: CraftMaterial[];
  confidence: CraftConfidence;
  fee?: number | null;
  location?: { name: string; navi: string } | null;
  requiredLevel?: number | null;
  source?: string;
  note?: CraftText;
};

const t = (de: string, en: string): CraftText => ({ de, en });

const skillDe: Record<string, string> = {
  "NPC Crafting": "NPC-Herstellung",
  "Holy Water": "Weihwasser herstellen",
  "Iron Tempering": "Eisen herstellen",
  "Steel Tempering": "Stahl herstellen",
  "Enchanted Stone Craft": "Elementsteine herstellen",
  "Dagger Forging": "Dolche schmieden",
  "Sword Forging": "Schwerter schmieden",
  "Two-Handed Sword Forging": "Zweihänder schmieden",
  "Axe Forging": "Äxte schmieden",
  "Mace Forging": "Streitkolben schmieden",
  "Knuckle Forging": "Knöchelwaffen schmieden",
  "Spear Forging": "Speere schmieden",
  "Prepare Potion": "Trank zubereiten",
  "Create Deadly Poison": "Tödliches Gift herstellen",
  "Create Elemental Converter": "Elementkonverter herstellen",
};

function roleFor(name: string, amount: number): CraftMaterial["role"] {
  if (amount === 0 || /guide|manual|book$/i.test(name)) return "tool";
  if (/bottle|test ?tube|glass tube|scroll$/i.test(name)) return "container";
  return "ingredient";
}

export const craftingRecipes: CraftRecipe[] = imported.recipes.map((recipe) => ({
  id: recipe.id,
  profession: recipe.profession as CraftProfession,
  output: t(recipe.output.name, recipe.output.name),
  outputItemId: recipe.output.itemId,
  amount: recipe.output.amount,
  skill: t(skillDe[recipe.skill] || recipe.skill, recipe.skill),
  skillLevel: "skillLevel" in recipe ? recipe.skillLevel : null,
  materials: recipe.materials.map((material) => ({
    itemId: material.itemId,
    name: t(material.name, material.name),
    amount: material.amount,
    role: roleFor(material.name, material.amount),
  })),
  confidence: recipe.confidence as CraftConfidence,
  fee: recipe.fee,
  location: recipe.location,
  requiredLevel: recipe.requiredLevel,
  source: recipe.source,
  note: recipe.confidence === "classic"
    ? t("Klassische rAthena-Referenz: Zutaten und Verfügbarkeit vor größeren Einkäufen in Zero Global prüfen.", "Classic rAthena reference: verify ingredients and availability in Zero Global before large purchases.")
    : undefined,
}));

export const professionNames: Record<CraftProfession, CraftText> = {
  npc: t("NPC-Handwerk", "NPC crafting"),
  alchemist: t("Alchemist", "Alchemist"),
  blacksmith: t("Schmied", "Blacksmith"),
  priest: t("Priester", "Priest"),
  assassin: t("Assassine", "Assassin"),
  sage: t("Weiser", "Sage"),
};

export const professionIcons: Record<CraftProfession, string> = {
  npc: "✦", alchemist: "⚗", blacksmith: "⚒", priest: "✚", assassin: "◆", sage: "◇",
};

export const confidenceNames: Record<CraftConfidence, CraftText> = {
  client: t("Zero-Global-Client geprüft", "Checked against Zero Global client"),
  classic: t("Klassische rAthena-Referenz", "Classic rAthena reference"),
};
