// Deterministic Electron performance check with a full-size synthetic catalog.
// It measures the application itself without network latency or third-party data changes.
const { app } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { cached, configurePersistentCache, clearMemoryCache } = require('../server/http.cjs');

const startedAt = performance.now();
const catalogSize = 489;
const sizes = ['Small', 'Medium', 'Large'];
const races = ['Plant', 'Brute', 'Demon'];
const catalog = Array.from({ length: catalogSize }, (_, index) => ({
  monster_id: 50000 + index,
  name_en: `Performance Monster ${index}`,
  aegis_name: `PERF_MONSTER_${index}`,
  level: 30,
  hp: 1000 + index,
  base_exp: 500,
  job_exp: 250,
  exp_per_hp: 0.5,
  total_exp_per_hp: 0.75,
  element: 'Fire',
  element_level: 1,
  race: races[index % races.length],
  size: sizes[index % sizes.length],
  defense: 0,
  magic_defense: 0,
  attack_min: 20,
  attack_max: 30,
  exp_source: 'Performance fixture',
  exp_source_kind: 'ragnadex_reference',
  spawns: [{ code: `perf_field_${index % 40}`, name: `Performance Field ${index % 40}`, count: 10, count_kind: 'fixture' }],
  drops: [],
}));

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('in-process-gpu');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'odins-glasses-performance-')));

require('../api.cjs').handleApi = async (request, response) => {
  if (!request.url.startsWith('/api/')) return false;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify({ items: catalog, total: catalog.length }));
  return true;
};

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const percentile = (values, fraction) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * fraction) - 1];
const round = (value) => Math.round(value * 10) / 10;

app.on('browser-window-created', (_event, window) => {
  window.webContents.setBackgroundThrottling(false);
  window.webContents.once('did-finish-load', async () => {
    const run = (code) => window.webContents.executeJavaScript(code);
    const visibleLimit = 30;
    const waitForCards = async (expected) => {
      for (let attempt = 0; attempt < 200; attempt += 1) {
        if (await run(`document.querySelectorAll('.mobCard').length === ${Math.min(visibleLimit, expected)} && Number(document.querySelector('.mobList')?.dataset.resultCount) === ${expected}`)) return;
        await sleep(25);
      }
      throw new Error(`Timed out waiting for ${expected} hunt cards`);
    };

    try {
      await waitForCards(catalogSize);
      const coldStartMs = performance.now() - startedAt;
      const warmReloadMs = [];
      for (let index = 0; index < 5; index += 1) {
        const reloadStarted = performance.now();
        await new Promise((resolve) => {
          window.webContents.once('did-finish-load', resolve);
          window.reload();
        });
        await waitForCards(catalogSize);
        warmReloadMs.push(performance.now() - reloadStarted);
      }

      const filterMs = [];
      for (let index = 0; index < 30; index += 1) {
        const value = index % 2 === 0 ? 'Large' : 'All';
        const expected = value === 'All' ? catalogSize : Math.floor(catalogSize / 3);
        const duration = await run(`new Promise((resolve, reject) => {
          const started = performance.now();
          const select = document.getElementById('hunt-size');
          select.value = '${value}';
          select.dispatchEvent(new Event('change', { bubbles: true }));
          const check = () => {
            if (Number(document.querySelector('.mobList')?.dataset.resultCount) === ${expected}) resolve(performance.now() - started);
            else if (performance.now() - started > 1000) reject(new Error('Filter update timeout'));
            else setTimeout(check, 0);
          };
          setTimeout(check, 0);
        })`);
        filterMs.push(duration);
      }

      const cacheDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'odins-glasses-cache-benchmark-'));
      configurePersistentCache(cacheDirectory);
      const cachedCatalog = {
        monsters: catalog,
        items: Array.from({ length: 4584 }, (_, index) => ({ id: index + 1, aegis: `ITEM_${index}`, name: `Performance Item ${index}`, sell: index % 1000 })),
      };
      await cached('performance:catalog', 60_000, async () => cachedCatalog, { persistent: true });
      const cacheReadMs = [];
      for (let index = 0; index < 30; index += 1) {
        clearMemoryCache();
        const readStarted = performance.now();
        const value = await cached('performance:catalog', 60_000, async () => { throw new Error('Unexpected cache miss'); }, { persistent: true });
        assert.equal(value.monsters.length, catalogSize);
        cacheReadMs.push(performance.now() - readStarted);
      }
      configurePersistentCache(null);
      fs.rmSync(cacheDirectory, { recursive: true, force: true });

      const mainMemory = await process.getProcessMemoryInfo();
      const rendererPid = window.webContents.getOSProcessId();
      const rendererMetric = app.getAppMetrics().find((metric) => metric.pid === rendererPid);
      if (!rendererMetric) throw new Error('Renderer memory metric unavailable');
      const rendererWorkingSetSize = rendererMetric.memory.workingSetSize;
      const result = {
        measuredAt: new Date().toISOString(),
        platform: `${process.platform} ${process.arch}`,
        electron: process.versions.electron,
        catalogSize,
        runs: { coldStart: 1, warmReload: warmReloadMs.length, sizeFilter: filterMs.length, persistentCacheRead: cacheReadMs.length },
        milliseconds: {
          coldStart: round(coldStartMs),
          warmReloadMedian: round(percentile(warmReloadMs, 0.5)),
          warmReloadP95: round(percentile(warmReloadMs, 0.95)),
          sizeFilterMedian: round(percentile(filterMs, 0.5)),
          sizeFilterP95: round(percentile(filterMs, 0.95)),
          sizeFilterMax: round(Math.max(...filterMs)),
          persistentCacheReadMedian: round(percentile(cacheReadMs, 0.5)),
          persistentCacheReadP95: round(percentile(cacheReadMs, 0.95)),
        },
        memoryMiB: {
          mainWorkingSet: round((mainMemory.residentSet || mainMemory.private || 0) / 1024),
          rendererWorkingSet: round(rendererWorkingSetSize / 1024),
          combinedWorkingSet: round(((mainMemory.residentSet || mainMemory.private || 0) + rendererWorkingSetSize) / 1024),
        },
        targets: { coldStartMs: 20000, warmReloadP95Ms: 1500, localFilterP95Ms: 300, persistentCacheReadP95Ms: 100 },
      };
      result.passed = result.milliseconds.coldStart <= result.targets.coldStartMs
        && result.milliseconds.warmReloadP95 <= result.targets.warmReloadP95Ms
        && result.milliseconds.sizeFilterP95 <= result.targets.localFilterP95Ms
        && result.milliseconds.persistentCacheReadP95 <= result.targets.persistentCacheReadP95Ms;
      assert.equal(result.passed, true, JSON.stringify(result));
      const output = path.resolve(__dirname, '../performance-2026-09-16.json');
      fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
      console.log(`PASS: ${JSON.stringify(result)}`);
      app.exit(0);
    } catch (error) {
      console.error(error);
      app.exit(1);
    }
  });
});

process.env.ODINS_GLASSES_SMOKE_TEST = '1';
require('../main.cjs');
setTimeout(() => {
  console.error('Performance test timeout');
  app.exit(1);
}, 60000);
