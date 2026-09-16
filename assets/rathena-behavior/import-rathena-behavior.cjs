// SPDX-License-Identifier: GPL-3.0-or-later
// Odin’s Glasses, 2026-09-04. Reproducible behavior-only adaptation of rAthena data.
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const revision = 'e985006171d2eb320ee512a653f4c83aea3d81b6';
const root = fs.existsSync(path.join(__dirname, 'mob_db.yml')) ? __dirname : path.resolve(__dirname, '../assets/rathena-behavior');
const files = { 'mob_db.yml': 'db/re/mob_db.yml', 'mob_db_mode_list.txt': 'doc/mob_db_mode_list.txt', 'LICENSE': 'LICENSE' };
async function main() {
  fs.mkdirSync(root, { recursive: true });
  for (const [name, source] of Object.entries(files)) {
    if (process.argv.includes('--offline')) continue;
    const response = await fetch(`https://raw.githubusercontent.com/rathena/rathena/${revision}/${source}`);
    if (!response.ok) throw new Error(`${source}: HTTP ${response.status}`);
    fs.writeFileSync(path.join(root, name), await response.text());
  }
  const documentation = fs.readFileSync(path.join(root, 'mob_db_mode_list.txt'), 'utf8');
  // Restrict to the AI section; later class IDs overlap with AI IDs.
  const aiSection = documentation.split('Aegis/rA (description)')[1].split('Special AI:')[0];
  const ai = Object.fromEntries([...aiSection.matchAll(/^(\d{2}):\s+(0x[0-9A-Fa-f]+)/gm)].map(m => [Number(m[1]), Number(m[2])]));
  const bits = { CanMove: 1, Looter: 2, Aggressive: 4, Assist: 8, CastSensorIdle: 16, NoRandomWalk: 32, NoCast: 64, CanAttack: 128, CastSensorChase: 512, ChangeChase: 1024, Angry: 2048, ChangeTargetMelee: 4096, ChangeTargetChase: 8192, TargetWeak: 16384, RandomTarget: 32768 };
  // Upstream repeats an unrelated RaceGroups key. JSON mode uses the last value.
  const rows = yaml.load(fs.readFileSync(path.join(root, 'mob_db.yml'), 'utf8'), { json: true }).Body;
  const monsters = {};
  for (const row of rows) {
    const type = Number(row.Ai ?? 6);
    if (!Object.hasOwn(ai, type)) continue; // Unknown AI is not equivalent to passive.
    let mask = ai[type];
    for (const [key, bit] of Object.entries(bits)) {
      if (row.Modes?.[key] === true) mask |= bit;
      if (row.Modes?.[key] === false) mask &= ~bit;
    }
    monsters[row.Id] = { aegis: row.AegisName, ai: type, flags: Object.fromEntries(Object.entries(bits).map(([key, bit]) => [key, Boolean(mask & bit)])) };
  }
  const output = { license: 'GPL-3.0-or-later', copyright: 'rAthena Development Team', modified: '2026-09-04', revision, source: `https://github.com/rathena/rathena/tree/${revision}`, description: 'Renewal reference behavior only; NOT verified for Zero Global. AI defaults plus explicit mode overrides. No HP, EXP, drops, or combat stats.', monsters };
  fs.writeFileSync(path.join(root, 'behavior.json'), JSON.stringify(output, null, 2) + '\n');
  if (__filename !== path.join(root, 'import-rathena-behavior.cjs')) fs.copyFileSync(__filename, path.join(root, 'import-rathena-behavior.cjs'));
  console.log(`Imported ${Object.keys(monsters).length} behavior records at ${revision}`);
}
main().catch(e => { console.error(e); process.exitCode = 1; });
