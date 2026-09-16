// Exact type matching: never classify a Card as a weapon because of its name.
const normalize = (value?: string | null) => (value || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
const categories: Record<string,string> = { all:'all',armor:'armor',weapon:'weapon',ammo:'sub-arrow',card:'card',costume:'costume','costume-gear':'costume',consumable:'consumable',usable:'consumable',delayconsume:'consumable',cash:'consumable',etc:'material',material:'material',other:'other',equipment:'equipment','special-equipment':'equipment','enchant-stone':'enchant-stone','package/box':'package-box',collectible:'collectible','pet-egg':'pet-egg',petegg:'pet-egg','pet-equipment':'pet-equipment',petarmor:'pet-equipment','taming-item':'taming-item',unknown:'unknown' };
const subtypes: Record<string,string> = { armor:'body-armor',body:'body-armor',shield:'shield',shoes:'shoes',garment:'garment',accessory:'accessory','accessory-(right)':'accessory','accessory-(left)':'accessory','upper-headgear':'upper-headgear',head_top:'upper-headgear','head-top':'upper-headgear','middle-headgear':'middle-headgear','head-mid':'middle-headgear','lower-headgear':'lower-headgear','head-low':'lower-headgear',helm:'upper-headgear',helmet:'upper-headgear',headgear:'upper-headgear',book:'book',bow:'bow',dagger:'dagger',instrument:'instrument',musical:'instrument',katar:'katar',knuckle:'knuckle',mace:'mace','one-handed-axe':'one-handed-axe','1haxe':'one-handed-axe','one-handed-spear':'one-handed-spear','1hspear':'one-handed-spear','one-handed-staff':'one-handed-staff',staff:'one-handed-staff','one-handed-sword':'one-handed-sword','1hsword':'one-handed-sword','two-handed-axe':'two-handed-axe','2haxe':'two-handed-axe','two-handed-spear':'two-handed-spear','2hspear':'two-handed-spear','two-handed-staff':'two-handed-staff','2hstaff':'two-handed-staff','two-handed-sword':'two-handed-sword','2hsword':'two-handed-sword',whip:'whip',arrow:'arrow',shuriken:'shuriken',kunai:'kunai','huuma-shuriken':'huuma',huuma:'huuma' };
export function itemIconKey(category?: string | null, subtype?: string | null) {
 const cat = normalize(category), sub = normalize(subtype);
 if(cat === 'card') {
  const slot = sub === 'right-hand' ? 'weapon' : sub === 'left-hand' ? 'shield' : subtypes[sub] || sub;
  const cardSlot = slot === 'body-armor' ? 'armor' : slot;
  return ['weapon','armor','shield','shoes','garment','accessory','upper-headgear'].includes(cardSlot) ? `card-${cardSlot}` : 'card';
 }
 if(['weapon','armor','equipment','costume','costume-gear','ammo'].includes(cat) && subtypes[sub]) return `sub-${subtypes[sub]}`;
 return categories[cat] || (subtypes[cat] ? `sub-${subtypes[cat]}` : 'unknown');
}
