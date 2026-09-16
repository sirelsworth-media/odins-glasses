const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const spellingEntries = new Set(['Microsoft', 'Microsoft/Spelling', 'Microsoft/Spelling/neutral']);

function listRelative(directory, root, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    result.push(path.relative(root, full).replaceAll('\\', '/'));
    if (entry.isDirectory()) listRelative(full, root, result);
  }
  return result;
}

for (const name of fs.readdirSync(projectRoot)) {
  if (!/[^\x20-\x7e]/.test(name)) continue;
  const candidate = path.join(projectRoot, name);
  try {
    if (!fs.statSync(candidate).isDirectory()) continue;
    if (listRelative(candidate, candidate).every(entry => spellingEntries.has(entry))) {
      fs.rmSync(candidate, { recursive: true, force: true });
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

for (const name of fs.readdirSync(os.tmpdir())) {
  if (name.startsWith('odins-glasses-theme-test-')) {
    try {
      fs.rmSync(path.join(os.tmpdir(), name), { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}
