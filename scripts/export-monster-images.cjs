const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

async function main() {
  const source = path.resolve(__dirname, '../renderer/src/assets/monster-portraits');
  const destination = path.resolve(__dirname, '../../outputs/Odins-Glasses-Monsterbilder-2026-09-04');
  const response = await fetch('https://ragnadex.com/api/monsters.json');
  if (!response.ok) throw new Error(`Monster names: HTTP ${response.status}`);
  const monsters = await response.json();
  const names = new Map(monsters.map(monster => [String(monster.id), monster.name]));
  const files = fs.readdirSync(source).filter(file => /^\d+\.png$/i.test(file));
  const entries = files.map(file => {
    const id = path.basename(file, '.png');
    const name = names.get(id);
    if (!name) throw new Error(`Missing monster name: ${id}`);
    let safe = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/, '').trim();
    if (!safe || /^(CON|PRN|AUX|NUL|COM\d|LPT\d)$/i.test(safe)) safe = `Monster ${id}`;
    return { id, name, safe, file };
  });
  const counts = new Map();
  for (const entry of entries) counts.set(entry.safe.toLowerCase(), (counts.get(entry.safe.toLowerCase()) || 0) + 1);
  const used = new Set();
  for (const entry of entries) {
    entry.output = `${entry.safe}${counts.get(entry.safe.toLowerCase()) > 1 ? ` (${entry.id})` : ''}.png`;
    if (used.has(entry.output.toLowerCase())) throw new Error(`Filename collision: ${entry.output}`);
    used.add(entry.output.toLowerCase());
  }
  fs.mkdirSync(destination, { recursive: false });
  for (const entry of entries) {
    const input = fs.readFileSync(path.join(source, entry.file));
    const target = path.join(destination, entry.output);
    fs.writeFileSync(target, input, { flag: 'wx' });
    const hash = data => crypto.createHash('sha256').update(data).digest('hex');
    if (hash(input) !== hash(fs.readFileSync(target))) throw new Error(`Copy mismatch: ${entry.output}`);
  }
  console.log(JSON.stringify({ destination, images: entries.length, duplicateNames: entries.filter(e => counts.get(e.safe.toLowerCase()) > 1).length, examples: entries.slice(0, 8).map(e => e.output) }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
