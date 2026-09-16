import { variantPortraitBaseIds } from '../domain/variant-portrait-map';
const modules = import.meta.glob<string>('../assets/monster-details/*.png', { eager: true, query: '?url', import: 'default' });
const portraits = Object.fromEntries(Object.entries(modules).map(([file, url]) => [Number(file.match(/\/(\d+)\.png$/)?.[1]), url]));

export default function MonsterArtwork({ id, name, lang }: { id: number; name: string; lang: 'de' | 'en' }) {
  const baseId = variantPortraitBaseIds[id];
  const source = portraits[baseId ?? id];
  if (!source) return null;
  return <figure className={`monsterArtwork${baseId ? ' championArtwork' : ''}`}>
    <img src={source} alt={name} width={480} height={480} decoding="async" />
    <figcaption><strong>{name}</strong><span>{lang === 'de' ? "Odin’s Glasses · Eigene Illustration" : "Odin’s Glasses · Original illustration"}{baseId ? (lang === 'de' ? ' · Spezialvariante' : ' · Special variant') : ''}</span></figcaption>
  </figure>;
}
