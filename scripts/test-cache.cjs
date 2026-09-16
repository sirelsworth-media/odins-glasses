const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { cached, configurePersistentCache, clearMemoryCache } = require('../server/http.cjs');

test('persistent data cache serves starts immediately and refreshes stale data', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'odins-glasses-cache-test-'));
  configurePersistentCache(directory);
  let loads = 0;
  const load = async () => ({ revision: ++loads });
  try {
    assert.deepEqual(await cached('fixture', 60_000, load, { persistent: true, staleWhileRevalidate: true }), { revision: 1 });
    clearMemoryCache();
    assert.deepEqual(await cached('fixture', 60_000, load, { persistent: true, staleWhileRevalidate: true }), { revision: 1 });
    assert.equal(loads, 1, 'fresh disk cache must avoid a remote load');

    const file = path.join(directory, fs.readdirSync(directory)[0]);
    const entry = JSON.parse(fs.readFileSync(file, 'utf8'));
    fs.writeFileSync(file, JSON.stringify({ ...entry, expires: 0 }));
    clearMemoryCache();
    assert.deepEqual(await cached('fixture', 60_000, load, { persistent: true, staleWhileRevalidate: true }), { revision: 1 });
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const persisted = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (persisted.value?.revision === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    assert.equal(loads, 2, 'stale data must refresh in the background');
    clearMemoryCache();
    assert.deepEqual(await cached('fixture', 60_000, load, { persistent: true, staleWhileRevalidate: true }), { revision: 2 });
  } finally {
    configurePersistentCache(null);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
