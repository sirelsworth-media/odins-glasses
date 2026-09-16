const assert = require('node:assert/strict');
const { test } = require('node:test');
const { behaviorFor } = require('../server/behavior.cjs');
const data = require('../assets/rathena-behavior/behavior.json');
test('Poring loots, Peco assists, Elder Willow senses casts', () => {
  const flags = (id, aegis) => behaviorFor({ id, aegis }).behavior_attributes.map(x => x.status_en);
  assert(flags(1002, 'PORING').includes('Loots Items'));
  assert(!flags(1002, 'PORING').includes('Aggressive'));
  assert(flags(1019, 'PECOPECO').includes('Assists Allies'));
  assert(flags(1033, 'ELDER_WILOW').includes('Cast Sensor (Idle)'));
});
test('unknown and mismatched identities never inherit behavior', () => {
  for (const raw of [{ id: 999999, aegis: 'PORING' }, { id: 1002, aegis: 'C1_PORING' }, { id: 1002 }]) {
    assert.equal(behaviorFor(raw).behavior_reference, null);
    assert.deepEqual(behaviorFor(raw).behavior_attributes, []);
  }
});
test('supplement cannot overwrite combat stats or original attributes', () => {
  const raw = { id: 1019, aegis: 'PECOPECO', hp: 525, base_exp: 315, job_exp: 63, special_attributes: [] };
  const output = { ...raw, ...behaviorFor(raw) };
  for (const key of Object.keys(raw)) assert.deepEqual(output[key], raw[key]);
  assert.equal(output.behavior_reference.verified_global, false);
  for (const row of Object.values(data.monsters)) assert.deepEqual(Object.keys(row).sort(), ['aegis', 'ai', 'flags']);
});
test('API keeps RagnaDex stats, observations and flags separate', async () => {
  const originalFetch = global.fetch;
  global.fetch = async url => ({ ok: true, json: async () => String(url).endsWith('/items.json') ? [] : [{ id: 1019, aegis: 'PECOPECO', name: 'Peco Peco', hp: 525, level: 27, basis_exp: 999, job_exp: 999, merkmale: ['Detector'], drops: [], fundorte: [] }] });
  try {
    const { handleApi } = require('../api.cjs');
    let body;
    await handleApi({ url: '/api/search?q=1019', method: 'GET' }, { writeHead(code) { assert.equal(code, 200); }, end(text) { body = JSON.parse(text); } });
    const mob = body.items[0];
    assert.equal(mob.hp, 525);
    assert.equal(mob.base_exp, 315);
    assert.equal(mob.job_exp, 63);
    assert.deepEqual(mob.special_attributes, [{ status_en: 'Detects Hidden' }]);
    assert(mob.behavior_attributes.some(x => x.status_en === 'Assists Allies'));
  } finally { global.fetch = originalFetch; }
});
