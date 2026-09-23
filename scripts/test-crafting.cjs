const assert = require("node:assert/strict");
const { recipes } = require("../renderer/src/data/crafting-recipes.json");

const cooking = recipes.filter((recipe) => recipe.profession === "cooking");
const smelting = recipes.filter((recipe) => recipe.profession === "smelting");

assert.equal(cooking.length, 60, "all 60 classic cooking recipes must be imported");
assert.equal(smelting.length, 7, "all seven metal and elemental-stone recipes must be separated as smelting");
assert.equal(new Set(recipes.map((recipe) => recipe.id)).size, recipes.length, "recipe identities must remain unique");

for (let level = 1; level <= 10; level += 1) {
  const recipesAtLevel = cooking.filter((recipe) => recipe.skillLevel === level);
  assert.equal(recipesAtLevel.length, 6, `cooking level ${level} must contain six recipes`);
  for (const recipe of recipesAtLevel) {
    assert.ok(recipe.output.name && recipe.output.nameDe, `${recipe.id} must have English and German output names`);
    assert.ok(recipe.materials.some((material) => material.amount === 0 && /Cookbook/.test(material.name)), `${recipe.id} must name its required cookbook`);
    assert.ok(recipe.materials.every((material) => material.itemId && material.name && material.nameDe), `${recipe.id} ingredients must retain item identities and bilingual names`);
  }
}

assert.deepEqual(smelting.map((recipe) => recipe.id), Array.from({ length: 7 }, (_, index) => `rathena-${112 + index}`));
assert.ok(!recipes.some((recipe) => recipe.profession === "blacksmith" && /^rathena-11[2-8]$/.test(recipe.id)), "smelting recipes must not remain mixed into forging");

console.log("PASS: 60 cooking recipes across levels 1-10 and seven separated smelting recipes.");
