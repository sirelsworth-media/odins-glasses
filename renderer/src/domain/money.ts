import type { Monster } from './types';
export function moneyValue(mob: Monster, overcharge = 0, minChance = 0, includeCards = true) {
 const drops = (mob.drops || []).filter(d => (includeCards || d.category !== 'Card') && (d.rate_percent == null || d.rate_percent >= minChance));
 const rows = drops.map(d => {
  const chance = d.rate_percent;
  const valid = chance != null && Number.isFinite(chance) && chance >= 0 && chance <= 100 && d.npc_sell_price != null && Number.isFinite(d.npc_sell_price) && d.npc_sell_price >= 0;
  const price = valid ? Math.floor(d.npc_sell_price! * (1 + overcharge / 100)) : null;
  return {...d, price, expected: price == null ? null : price * chance! / 100};
 });
 const known = rows.filter(d=>d.expected != null).length;
 return {rows, known, total:rows.length, complete: rows.length > 0 && known === rows.length, value: known ? rows.reduce((sum,d)=>sum+(d.expected??0),0) : null};
}
export function spawnValue(value: number | null, count: number | null) {
 return value == null || count == null || !Number.isFinite(count) || count < 0 ? null : value * count;
}
