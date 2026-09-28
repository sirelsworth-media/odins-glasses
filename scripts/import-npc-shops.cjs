const fs = require('fs');

const revision = 'e985006171d2eb320ee512a653f4c83aea3d81b6';
const sourceFiles = ['shops-common.txt', 'shops-renewal.txt'];
const shops = {};

for (const file of sourceFiles) {
  for (const rawLine of fs.readFileSync(`assets/economy-sources/${file}`, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//')) continue;
    const columns = line.split(/\t+/);
    if (columns.length < 4 || columns[1] !== 'shop') continue;
    const [map, x, y] = columns[0].split(',');
    if (!map || !/^\d+$/.test(x) || !/^\d+$/.test(y)) continue;
    const name = columns[2].split('#')[0].trim() || 'NPC Shop';
    const entries = columns[3].split(',').slice(1);
    for (const entry of entries) {
      const match = entry.trim().match(/^(\d+):(-?\d+)$/);
      if (!match) continue;
      const itemId = Number(match[1]);
      const configuredPrice = Number(match[2]);
      const vendor = { name, map, x: Number(x), y: Number(y), price: configuredPrice >= 0 ? configuredPrice : null };
      const key = `${vendor.name}|${vendor.map}|${vendor.x}|${vendor.y}|${vendor.price}`;
      shops[itemId] ??= [];
      if (!shops[itemId].some((existing) => existing.key === key)) shops[itemId].push({ key, ...vendor });
    }
  }
}

for (const vendors of Object.values(shops)) {
  vendors.sort((a, b) => a.map.localeCompare(b.map) || a.name.localeCompare(b.name) || a.x - b.x || a.y - b.y);
  for (const vendor of vendors) delete vendor.key;
}

fs.writeFileSync('assets/economy-sources/shops.json', JSON.stringify({ revision, shops }));
console.log(`${Object.keys(shops).length} purchasable item references across ${Object.values(shops).reduce((sum, entries) => sum + entries.length, 0)} NPC shop links`);
