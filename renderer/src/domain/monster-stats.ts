import type { Monster } from './types';

export const monsterStats = [
  { key: 'flee_95', de: 'Benötigte FLEE (95 %)', en: 'Required FLEE (95%)' },
  { key: 'hit_100', de: 'Benötigter HIT (100 %)', en: 'Required HIT (100%)' },
  { key: 'attack_max', de: 'Physischer Angriff (ATK)', en: 'Physical attack (ATK)' },
  { key: 'matk_max', de: 'Magischer Angriff (MATK)', en: 'Magic attack (MATK)' },
  { key: 'defense', de: 'Verteidigung (DEF)', en: 'Defense (DEF)' },
  { key: 'magic_defense', de: 'Magieverteidigung (MDEF)', en: 'Magic defense (MDEF)' },
  { key: 'hp', de: 'HP', en: 'HP' },
  ...(['str', 'agi', 'vit', 'int_stat', 'dex', 'luk'] as const).map(key => ({ key, de: key === 'int_stat' ? 'INT' : key.toUpperCase(), en: key === 'int_stat' ? 'INT' : key.toUpperCase() })),
] as const;
export type MonsterStat = typeof monsterStats[number]['key'];
export function monsterStatValue(mob: Partial<Pick<Monster, MonsterStat>>, key: MonsterStat): number | null {
  const value = mob[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
export function compareMonsterStat(a: Monster, b: Monster, key: MonsterStat, direction: 'asc' | 'desc') {
  const av = monsterStatValue(a, key), bv = monsterStatValue(b, key);
  if (av == null || bv == null) return av == null ? (bv == null ? a.monster_id - b.monster_id : 1) : -1;
  return (direction === 'asc' ? av - bv : bv - av) || a.monster_id - b.monster_id;
}
export function matchesMonsterStat(mob: Partial<Pick<Monster, MonsterStat>>, key: MonsterStat, min: string, max: string) {
  if (!min.trim() && !max.trim()) return true;
  const value = monsterStatValue(mob, key);
  if (value == null) return false;
  return (!min.trim() || value >= Number(min)) && (!max.trim() || value <= Number(max));
}

export function fieldStatSummary(monsters: (Partial<Pick<Monster, MonsterStat>> & { count?: number | null })[], key: MonsterStat, aggregation: 'max' | 'min' | 'average') {
  const known = monsters.flatMap(mob => { const value = monsterStatValue(mob, key); return value == null ? [] : [{ value, weight: mob.count && mob.count > 0 ? mob.count : 1 }]; });
  const value = !known.length ? null : aggregation === 'max' ? Math.max(...known.map(m => m.value)) : aggregation === 'min' ? Math.min(...known.map(m => m.value)) : known.reduce((sum, m) => sum + m.value * m.weight, 0) / known.reduce((sum, m) => sum + m.weight, 0);
  return { value, known: known.length, total: monsters.length };
}
export function matchesFieldStats(monsters: Partial<Pick<Monster, MonsterStat>>[], key: MonsterStat, min: string, max: string, mode: 'all' | 'any') {
  if (!min.trim() && !max.trim()) return true;
  return monsters.length > 0 && (mode === 'all' ? monsters.every(m => matchesMonsterStat(m, key, min, max)) : monsters.some(m => matchesMonsterStat(m, key, min, max)));
}
