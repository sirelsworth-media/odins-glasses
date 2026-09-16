import { variantPortraitBaseIds } from "../domain/variant-portrait-map";
import { paperPortraitIds } from "../domain/paper-portrait-ids";
import { itemIconKey } from '../domain/item-icon-key';
import itemIconAliases from '../data/item-icon-aliases.json';
const itemIconModules = import.meta.glob<string>('../assets/item-icons/*.png', { eager: true, query: '?url', import: 'default' });
const itemIcons = Object.fromEntries(Object.entries(itemIconModules).map(([file,url]) => [file.split('/').pop()!.replace('.png',''),url]));
const exactItemIconModules = import.meta.glob<string>('../assets/item-exact-icons/*.png', { eager: true, query: '?url', import: 'default' });
const exactItemIcons = Object.fromEntries(Object.entries(exactItemIconModules).map(([file,url]) => [file.split('/').pop()!.replace('.png',''),url]));

type MonsterPortraitProps = {
  monsterId?: number | null;
  name: string;
  race?: string | null;
  element?: string | null;
  monsterSize?: string | null;
  variant?: boolean;
};

const portraitModules = import.meta.glob<string>("../assets/monster-portraits/*.png", { eager: true, query: "?url", import: "default" });
const authoredMonsterPortraits = Object.fromEntries(Object.entries(portraitModules).flatMap(([path, source]) => {
  const id = path.match(/\/(\d+)\.png$/)?.[1];
  return id ? [[Number(id), source]] : [];
})) as Record<number, string>;

type ItemIconProps = {
  itemId?: number | null;
  category?: string | null;
  subtype?: string | null;
  name?: string | null;
};

const elementColors: Record<string, { background: string; aura: string; ink: string }> = {
  Fire: { background: "#f6c06d", aura: "#c94e31", ink: "#5c241d" },
  Water: { background: "#a9d9e5", aura: "#347f9c", ink: "#153f58" },
  Wind: { background: "#d9e9ad", aura: "#79a541", ink: "#365224" },
  Earth: { background: "#d8bd82", aura: "#8b6731", ink: "#49351d" },
  Poison: { background: "#d2bdde", aura: "#7b4b8f", ink: "#402448" },
  Holy: { background: "#f4e8a4", aura: "#d49b31", ink: "#65461c" },
  Shadow: { background: "#aaa0ba", aura: "#55486f", ink: "#272036" },
  Ghost: { background: "#c8d6e9", aura: "#7286ad", ink: "#35405b" },
  Undead: { background: "#c7c6aa", aura: "#6e7457", ink: "#353a2c" },
  Neutral: { background: "#e1cfae", aura: "#9b7954", ink: "#493628" },
};

function hashText(text: string) {
  let value = 2166136261;
  for (const character of text) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return value >>> 0;
}

function RaceSilhouette({ race, ink, seed }: { race: string; ink: string; seed: number }) {
  const eyeShift = seed % 5 - 2;
  const shapes: Record<string, React.ReactNode> = {
    Brute: <><path d="M24 48c-7-5-9-14-6-22 3-8 10-13 18-13s15 5 18 13c3 8 1 17-6 22-7 6-17 6-24 0Z"/><path d="M20 25 12 13c10-1 15 3 18 8m22 4 8-12c-10-1-15 3-18 8" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round"/></>,
    Plant: <><path d="M35 56c-9-12-8-25 1-37 9 12 10 25 1 37Z"/><path d="M35 38C22 38 15 30 15 19c13 0 20 7 20 19Zm2-5c13 0 20-8 20-19-13 0-20 7-20 19Z"/></>,
    Insect: <><ellipse cx="36" cy="38" rx="11" ry="20"/><path d="M26 28C14 20 10 31 19 40m27-12c12-8 16 3 7 12M24 41l-11 8m35-8 11 8M29 18l-6-8m20 8 6-8" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round"/></>,
    Fish: <><path d="M14 38c10-15 28-20 44-7l8-8v28l-8-8C42 56 24 51 14 38Z"/><path d="m34 25 8-11 6 14M34 51l8 10 6-14"/></>,
    Dragon: <><path d="M18 51c2-23 14-37 34-39l-8 12c11 4 16 13 13 26-8-8-15-9-23-4l-1 12Z"/><path d="m25 29-14-8 5 19m30-16 12-9-2 18"/></>,
    Demon: <><path d="M20 20 8 7c14 0 21 6 22 15m22-2L64 7c-14 0-21 6-22 15" fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round"/><path d="M16 38c0-15 9-24 20-24s20 9 20 24-8 21-20 21-20-6-20-21Z"/><path d="m27 48 9 8 9-8" fill="none" stroke="#f8ead0" strokeWidth="3"/></>,
    Undead: <><path d="M17 34c0-14 8-23 19-23s19 9 19 23c0 8-3 13-8 17v10H25V51c-5-4-8-9-8-17Z"/><circle cx="28" cy="35" r="5" fill="#f4ead5"/><circle cx="44" cy="35" r="5" fill="#f4ead5"/><path d="m34 43 2-4 2 4m-8 10v8m8-8v8m8-8v8" stroke="#f4ead5" strokeWidth="2"/></>,
    Angel: <><path d="M32 54C18 57 7 48 7 34c11-1 19 3 25 12m8 8c14 3 25-6 25-20-11-1-19 3-25 12"/><path d="M27 23c0-7 4-12 9-12s9 5 9 12v28H27Z"/><ellipse cx="36" cy="8" rx="12" ry="4" fill="none" stroke={ink} strokeWidth="3"/></>,
    "Demi-Human": <><circle cx="36" cy="25" r="13"/><path d="M15 59c2-17 9-25 21-25s19 8 21 25Z"/><path d="M22 21c4-12 24-15 31-2-10-3-20-2-31 2Z" fill="#f1dfbd"/></>,
    Formless: <><path d="M11 45c3-8 7-10 8-20 8 4 11-8 18-12 5 8 12 7 17 3 1 11 8 15 8 25 0 12-12 19-26 19S8 56 11 45Z"/></>,
  };
  return <g fill={ink} transform={`translate(${eyeShift * .35} 0)`}>{shapes[race] || shapes.Formless}<circle cx={29 + eyeShift} cy="34" r="2.4" fill="#fff2cf"/><circle cx={43 + eyeShift} cy="34" r="2.4" fill="#fff2cf"/></g>;
}

export function MonsterPortrait({ monsterId, name, race = "Formless", element = "Neutral", monsterSize = "Medium", variant = false }: MonsterPortraitProps) {
  const variantBaseId = monsterId != null ? variantPortraitBaseIds[monsterId] : undefined;
  const portraitId = variantBaseId ?? monsterId;
  const authoredPortrait = portraitId != null ? authoredMonsterPortraits[portraitId] : undefined;
  if (authoredPortrait) return <span className={`generatedPortrait authoredPortrait${variantBaseId ? " heroPortrait" : ""}${paperPortraitIds.has(variantBaseId || monsterId || 0) ? " paperPortrait" : ""}`} title={`${name} · ${race} · ${element}`} aria-label={`${name} illustration`}><img src={authoredPortrait} alt="" loading="lazy" decoding="async" /></span>;
  const seed = hashText(name);
  const palette = elementColors[element || "Neutral"] || elementColors.Neutral;
  const scale = monsterSize === "Small" ? .78 : monsterSize === "Large" ? 1.08 : .92;
  const spots = Array.from({ length: 2 + seed % 4 }, (_, index) => ({
    x: 15 + ((seed >> (index * 3)) % 43), y: 16 + ((seed >> (index * 4 + 1)) % 39), r: 1 + ((seed >> (index + 2)) % 3),
  }));
  return <span className="generatedPortrait" title={`${name} · ${race} · ${element}`} aria-label={`${name} illustration`}>
    <svg viewBox="0 0 72 72" role="img">
      <circle cx="36" cy="36" r="34" fill={palette.background}/>
      <path d="M7 43c8-7 14-5 20-12s13-14 38-6" fill="none" stroke={palette.aura} strokeWidth="5" opacity=".42"/>
      <g transform={`translate(${36 - 36 * scale} ${39 - 39 * scale}) scale(${scale})`}><RaceSilhouette race={race || "Formless"} ink={palette.ink} seed={seed}/></g>
      {spots.map((spot, index) => <circle key={index} cx={spot.x} cy={spot.y} r={spot.r} fill={palette.aura} opacity=".42"/>)}
      {variant && <path d="m36 4 5 8 9-1-4 8 5 7-10 1-5 9-5-9-10-1 5-7-4-8 9 1Z" fill="#f1c44f" stroke="#7a531b" strokeWidth="1.5"/>}
      <circle cx="36" cy="36" r="33" fill="none" stroke="#7e5c2f" strokeWidth="2"/>
      <circle cx="36" cy="36" r="29.5" fill="none" stroke="#fff3d6" strokeWidth="1" opacity=".8"/>
    </svg>
  </span>;
}

function ItemSymbol({ kind }: { kind: string }) {
  if (kind === "weapon") return <><path d="m18 53 8-8 5 5-8 8-8 1 1-8Zm10-10 23-29 7-2-2 8-22 27Z"/><path d="m25 40 10 10" fill="none" stroke="#f7e8c6" strokeWidth="4"/></>;
  if (kind === "armor") return <path d="M18 16 29 10c4 5 10 5 14 0l11 6-4 39-14 8-14-8Z"/>;
  if (kind === "card") return <><rect x="18" y="11" width="36" height="50" rx="4"/><path d="m36 21 5 9 10 2-7 8 2 11-10-5-10 5 2-11-7-8 10-2Z" fill="#f0d08b"/></>;
  if (kind === "consumable") return <><path d="M29 10h14v9l7 8v27c0 5-4 8-9 8H31c-5 0-9-3-9-8V27l7-8Z"/><path d="M24 40h24" stroke="#f4d4c0" strokeWidth="4"/></>;
  if (kind === "costume") return <><path d="M10 27c9-10 17-11 26-2 9-9 17-8 26 2-1 19-11 29-26 29S11 46 10 27Z"/><circle cx="25" cy="34" r="5" fill="#f5e8cc"/><circle cx="47" cy="34" r="5" fill="#f5e8cc"/></>;
  if (kind === "pet") return <><path d="M17 39c0-17 8-28 19-28s19 11 19 28-7 25-19 25-19-8-19-25Z"/><path d="M21 43c8 5 22 5 30 0" fill="none" stroke="#f7e8c6" strokeWidth="3"/></>;
  if (kind === "package") return <><path d="M12 24 36 11l24 13v31L36 65 12 55Z"/><path d="M12 24l24 12 24-12M36 36v29" fill="none" stroke="#f7e8c6" strokeWidth="3"/></>;
  return <><path d="m36 8 9 18 19 10-19 10-9 18-9-18L8 36l19-10Z"/><circle cx="36" cy="36" r="8" fill="#f3dfb0"/></>;
}

export function ItemTypeIcon({ itemId, category = "Unknown", subtype = "", name = "" }: ItemIconProps) {
  const resolvedItemId = itemId == null
    ? null
    : (itemIconAliases[String(itemId) as keyof typeof itemIconAliases] ?? itemId);
  const exact = resolvedItemId != null ? exactItemIcons[String(resolvedItemId)] : undefined;
  if (exact) return <span className="generatedItemIcon renderedItemIcon exactItemIcon" title={`${name || `Item #${itemId}`} · Individual illustration`} aria-hidden="true"><img src={exact} alt="" width={128} height={128} loading="lazy" /></span>;
  const rendered = itemIcons[itemIconKey(category, subtype)];
  if (rendered) return <span className="generatedItemIcon renderedItemIcon" title={`${category}${subtype ? ` · ${subtype}` : ''} · Category illustration`} aria-hidden="true"><img src={rendered} alt="" width={128} height={128} loading="lazy" /></span>;
  const text = `${category} ${subtype} ${name}`.toLowerCase();
  const kind = /weapon|sword|dagger|bow|staff|mace|axe|spear|katar/.test(text) ? "weapon"
    : /armor|shield|shoes|garment|helm|accessory/.test(text) ? "armor"
    : /card/.test(text) ? "card" : /usable|consume|potion/.test(text) ? "consumable"
    : /costume/.test(text) ? "costume" : /pet|egg|taming/.test(text) ? "pet"
    : /package|box|cash/.test(text) ? "package" : "material";
  const seed = hashText(name || text);
  const hues = ["#9b4b36", "#3f7180", "#65743a", "#735a87", "#9b7431"];
  return <span className="generatedItemIcon" aria-hidden="true"><svg viewBox="0 0 72 72"><rect x="3" y="3" width="66" height="66" rx="13" fill="#eadfc9" stroke="#9d8054" strokeWidth="2"/><circle cx="36" cy="36" r="27" fill={hues[seed % hues.length]} opacity=".18"/><g fill={hues[seed % hues.length]}><ItemSymbol kind={kind}/></g></svg></span>;
}
