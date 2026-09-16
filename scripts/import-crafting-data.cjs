const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "renderer", "src", "data", "crafting-recipes.json");
const SOURCE_DIR = path.join(ROOT, "assets", "crafting-sources");
const RAGNADEX_ITEMS = "https://ragnadex.com/api/items.json";
const RAGNADEX_CRAFTING = "https://ragnadex.com/en/crafting/";
const RATHENA_PRODUCE = "https://raw.githubusercontent.com/rathena/rathena/e985006171d2eb320ee512a653f4c83aea3d81b6/db/re/produce_db.txt";
const RATHENA_LICENSE = "https://raw.githubusercontent.com/rathena/rathena/e985006171d2eb320ee512a653f4c83aea3d81b6/LICENSE";

const skillMap = {
  31: ["priest", "Holy Water"],
  93: ["blacksmith", "Iron Tempering"],
  94: ["blacksmith", "Steel Tempering"],
  95: ["blacksmith", "Steel Tempering"],
  96: ["blacksmith", "Enchanted Stone Craft"],
  98: ["blacksmith", "Dagger Forging"],
  99: ["blacksmith", "Sword Forging"],
  100: ["blacksmith", "Two-Handed Sword Forging"],
  101: ["blacksmith", "Axe Forging"],
  102: ["blacksmith", "Mace Forging"],
  103: ["blacksmith", "Knuckle Forging"],
  104: ["blacksmith", "Spear Forging"],
  228: ["alchemist", "Prepare Potion"],
  407: ["assassin", "Create Deadly Poison"],
  1007: ["sage", "Create Elemental Converter"],
};

function decode(value) {
  return String(value || "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function plain(value) {
  return decode(String(value || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

async function getText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

function parseHeadgear(html) {
  return [...html.matchAll(/<article class="craft-karte">([\s\S]*?)<\/article>/g)].map((match) => {
    const card = match[1];
    const output = card.match(/class="craft-name" href="\/en\/items\/(\d+)\/">([^<]+)<\/a>/);
    const quest = card.match(/class="craft-quest">([^<]*)<\/span>/);
    const number = card.match(/class="craft-nr">#(\d+)<\/span>/);
    const navi = card.match(/<code class="craft-navi">\/navi\s+([^<]+)<\/code>/);
    const footer = card.match(/<div class="craft-ort">([\s\S]*?)<\/div>/);
    const fee = plain(card).match(/([\d,]+)\s*Zeny\s*\(Fee\)/i);
    const level = card.match(/from base level\s*(\d+)/i);
    const materials = [...card.matchAll(/<li>[\s\S]*?<span class="craft-menge">(\d+)[\s\S]*?<a href="\/en\/items\/(\d+)\/">([^<]+)<\/a>[\s\S]*?<\/li>/g)].map((material) => ({
      itemId: Number(material[2]), name: plain(material[3]), amount: Number(material[1]), role: "ingredient",
    }));
    if (!output) throw new Error(`Could not parse crafting card: ${plain(card).slice(0, 120)}`);
    const locationText = plain(footer?.[1] || "").replace(/^◆\s*/, "").replace(/\/navi\s+.*$/, "").trim();
    return {
      id: `npc-${output[1]}`, profession: "npc", output: { itemId: Number(output[1]), name: plain(output[2]), amount: 1 },
      skill: plain(quest?.[1]) || "NPC Crafting", materials, confidence: "client", fee: fee ? Number(fee[1].replace(/,/g, "")) : null,
      location: navi ? { name: locationText, navi: `/navi ${plain(navi[1])}` } : null,
      requiredLevel: level ? Number(level[1]) : null, referenceId: number ? Number(number[1]) : null,
      source: RAGNADEX_CRAFTING,
    };
  });
}

function parseProduce(text, itemsById) {
  const recipes = [];
  let comment = "";
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("//--")) comment = line.replace(/^\/\/--\s*/, "").trim();
    if (!/^\d+(?:,\d+)+$/.test(line)) continue;
    const values = line.split(",").map(Number);
    const [index, outputId, itemLevel, skillId, skillLevel, ...materialsRaw] = values;
    if (index > 145 || !skillMap[skillId]) continue;
    const [profession, skill] = skillMap[skillId];
    const commentOutput = comment.split("<--")[0]?.trim();
    const outputItem = itemsById.get(outputId);
    const materials = [];
    for (let offset = 0; offset < materialsRaw.length; offset += 2) {
      const itemId = materialsRaw[offset];
      const amount = materialsRaw[offset + 1];
      const item = itemsById.get(itemId);
      materials.push({ itemId, name: item?.name || item?.name_de || item?.aegis || `Item #${itemId}`, amount, role: amount === 0 ? "tool" : "ingredient" });
    }
    recipes.push({
      id: `rathena-${index}`, profession, output: { itemId: outputId, name: outputItem?.name || outputItem?.name_de || commentOutput || `Item #${outputId}`, amount: 1 },
      skill, skillLevel, itemLevel, materials, confidence: "classic", fee: null, location: null, requiredLevel: null,
      source: RATHENA_PRODUCE,
    });
  }
  return recipes;
}

async function main() {
  const [itemsText, craftingHtml, produceText, licenseText] = await Promise.all([
    getText(RAGNADEX_ITEMS), getText(RAGNADEX_CRAFTING), getText(RATHENA_PRODUCE), getText(RATHENA_LICENSE),
  ]);
  const payload = JSON.parse(itemsText);
  const items = Array.isArray(payload) ? payload : payload.items || [];
  const itemsById = new Map(items.map((item) => [Number(item.id), item]));
  const recipes = [...parseHeadgear(craftingHtml), ...parseProduce(produceText, itemsById)];
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), recipes }, null, 2)}\n`);
  fs.writeFileSync(path.join(SOURCE_DIR, "produce_db.txt"), produceText);
  fs.writeFileSync(path.join(SOURCE_DIR, "LICENSE-rAthena"), licenseText);
  fs.writeFileSync(path.join(SOURCE_DIR, "NOTICE.txt"), `Crafting reference sources\n\nRagnaDex Headgear Crafting (${RAGNADEX_CRAFTING})\n- 31 NPC headgear recipes. RagnaDex states that 30/31 locations were checked against the Zero Global client navigation data.\n- RagnaDex open API/data reuse condition: name RagnaDex and preserve source context.\n\nrAthena produce_db.txt\n- Upstream revision e985006171d2eb320ee512a653f4c83aea3d81b6.\n- GPL-3.0-or-later; full source file and license are included here.\n- Only recipe indices 0-145 are imported: classic forging, metals, alchemy, Holy Water, Deadly Poison and elemental converters.\n- These are reference recipes and are NOT automatically confirmed for Ragnarok Zero Global.\n\nGenerated file: renderer/src/data/crafting-recipes.json\nRebuild: node scripts/import-crafting-data.cjs\n`);
  console.log(`Wrote ${recipes.length} recipes (${recipes.filter((r) => r.confidence === "client").length} client-checked NPC, ${recipes.filter((r) => r.confidence === "classic").length} classic references).`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
