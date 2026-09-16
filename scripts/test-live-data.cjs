const assert = require("node:assert/strict");

const endpoints = {
  monsters: "https://ragnadex.com/api/monsters.json",
  items: "https://ragnadex.com/api/items.json",
  fields: "https://ragnadex.com/api/fundorte.json",
  bosses: "https://ragnadex.com/api/mvp.json",
};

async function getJson(name, url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  assert.equal(response.ok, true, `${name}: HTTP ${response.status}`);
  return response.json();
}

async function main() {
  const [monsters, items, fields, bosses] = await Promise.all(
    Object.entries(endpoints).map(([name, url]) => getJson(name, url)),
  );

  assert.ok(Array.isArray(monsters) && monsters.length > 100, "monster list missing");
  assert.ok(Array.isArray(items) && items.length > 100, "item list missing");
  assert.deepEqual(fields.felder?.slice(0, 5), ["id", "name", "stufe", "anzahl", "exp_pro_hp"], "field row schema changed");
  assert.ok(Array.isArray(fields.regionen) && fields.regionen.length > 10, "region list missing");
  assert.ok(Array.isArray(bosses.bosse) && bosses.bosse.length > 1, "boss list missing");

  const sampleMonster = monsters.find((entry) => Number(entry?.id) > 0);
  assert.ok(sampleMonster?.name, "monster name missing");
  assert.ok("hp" in sampleMonster, "monster HP field missing");
  assert.ok("fundorte" in sampleMonster, "monster location field missing");

  const sampleField = fields.regionen.find((entry) => Array.isArray(entry?.karten) && entry.karten.length);
  assert.ok(sampleField, "field map code missing");
  assert.ok(Array.isArray(sampleField.m), "field monster rows missing");

  const sampleBoss = bosses.bosse.find((entry) => Number(entry?.id) > 0);
  assert.ok(sampleBoss?.name, "boss name missing");
  assert.ok(Array.isArray(sampleBoss.orte), "boss locations missing");

  console.log(
    `PASS: RagnaDex live contract (${monsters.length} monsters, ${items.length} items, ${fields.regionen.length} regions, ${bosses.bosse.length} bosses).`,
  );
}

main().catch((error) => {
  console.error(`FAIL: RagnaDex live contract: ${error.message}`);
  process.exitCode = 1;
});
