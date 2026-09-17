const fs = require("node:fs");
const path = require("node:path");
const { createMobileSnapshot } = require("../api.cjs");

async function main() {
  const outputDirectory = path.join(__dirname, "..", ".mobile-public");
  const outputPath = path.join(outputDirectory, "mobile-data.json");
  fs.mkdirSync(outputDirectory, { recursive: true });
  const snapshot = await createMobileSnapshot();
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(snapshot));
  fs.renameSync(temporaryPath, outputPath);
  const size = fs.statSync(outputPath).size;
  console.log(`Mobile data: ${snapshot.monsters.length} monsters, ${snapshot.items.length} items, ${(size / 1024 / 1024).toFixed(1)} MB`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
