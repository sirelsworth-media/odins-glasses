const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const memoryCache = new Map();
const refreshes = new Map();
let persistentCacheDirectory = null;

function configurePersistentCache(directory) {
  persistentCacheDirectory = directory;
  try { fs.mkdirSync(directory, { recursive: true }); } catch { persistentCacheDirectory = null; }
}

function persistentPath(key) {
  if (!persistentCacheDirectory) return null;
  return path.join(persistentCacheDirectory, `${crypto.createHash('sha256').update(key).digest('hex')}.json`);
}

function readPersistent(key) {
  const file = persistentPath(key);
  if (!file) return null;
  try {
    const entry = JSON.parse(fs.readFileSync(file, 'utf8'));
    return entry.key === key && Number.isFinite(entry.expires) ? entry : null;
  } catch { return null; }
}

function writePersistent(key, value, expires) {
  const file = persistentPath(key);
  if (!file) return;
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify({ key, value, expires, savedAt: Date.now() }));
    fs.renameSync(temporary, file);
  } catch {
    try { fs.rmSync(temporary, { force: true }); } catch { /* best-effort cache cleanup */ }
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "OdinsGlassesDesktop/1.0" },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Remote request failed (${response.status})`);
  return response.json();
}

async function cached(key, ttl, load, options = {}) {
  const current = memoryCache.get(key);
  if (current && current.expires > Date.now()) return current.value;
  const saved = options.persistent ? readPersistent(key) : null;
  if (saved && saved.expires > Date.now()) {
    memoryCache.set(key, saved);
    return saved.value;
  }
  if (saved && options.staleWhileRevalidate) {
    memoryCache.set(key, { value: saved.value, expires: Date.now() + Math.min(ttl, 5 * 60 * 1000) });
    if (!refreshes.has(key)) {
      const refresh = Promise.resolve().then(load).then((value) => {
        const entry = { value, expires: Date.now() + ttl };
        memoryCache.set(key, entry);
        writePersistent(key, value, entry.expires);
      }).catch(() => {}).finally(() => refreshes.delete(key));
      refreshes.set(key, refresh);
    }
    return saved.value;
  }
  const value = await load();
  const entry = { value, expires: Date.now() + ttl };
  memoryCache.set(key, entry);
  if (options.persistent) writePersistent(key, value, entry.expires);
  return value;
}

function clearMemoryCache() { memoryCache.clear(); }

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

module.exports = { fetchJson, cached, sendJson, configurePersistentCache, clearMemoryCache };
