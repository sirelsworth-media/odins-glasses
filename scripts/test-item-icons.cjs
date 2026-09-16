const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),Module=require('node:module');
const file=path.resolve(__dirname,'../renderer/src/domain/item-icon-key.ts');
const m=new Module(file);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,file);
const key=m.exports.itemIconKey;
const cases=[['Card','Weapon','card-weapon'],['Card','Armor','card-armor'],['Card','Upper Headgear','card-upper-headgear'],['Weapon','Two-Handed Sword','sub-two-handed-sword'],['Weapon','1hSword','sub-one-handed-sword'],['Weapon','Musical','sub-instrument'],['Weapon','Huuma Shuriken','sub-huuma'],['Ammo','Arrow','sub-arrow'],['Ammo','Shuriken','sub-shuriken'],['Ammo','Kunai','sub-kunai'],['Armor','Shoes','sub-shoes'],['Costume','Middle Headgear','sub-middle-headgear'],['PetEgg',null,'pet-egg'],['ETC',null,'material'],['Unknown',null,'unknown'],['Weapon',null,'weapon']];
for(const [cat,sub,expected] of cases)assert.equal(key(cat,sub),expected);
const specs=require('./item-icon-specs.json');
for(const spec of specs){const file=path.resolve(__dirname,'../renderer/src/assets/item-icons',spec.key+'.png');assert.ok(fs.existsSync(file),spec.key);const b=fs.readFileSync(file);assert.equal(b.readUInt32BE(16),128);assert.equal(b.readUInt32BE(20),128);}
const exact=require('./item-exact-icon-specs.json').items;
for(const spec of exact){const file=path.resolve(__dirname,'../renderer/src/assets/item-exact-icons',spec.itemId+'.png');assert.ok(fs.existsSync(file),spec.name);const b=fs.readFileSync(file);assert.equal(b.readUInt32BE(16),128);assert.equal(b.readUInt32BE(20),128);}
const aliases=require('../renderer/src/data/item-icon-aliases.json');
const exactIds=new Set(exact.map(spec=>String(spec.itemId)));
for(const [variantId,baseId] of Object.entries(aliases))assert.ok(exactIds.has(String(baseId)),`${variantId} points to missing exact icon ${baseId}`);
for(const boxedId of ['9539','23503','23504','23505','23506','23582','107320','107721','107722','107723','107724','107725','107832'])assert.ok(!(boxedId in aliases),`${boxedId} is a box and must not reuse a single-item icon`);
console.log(`PASS: ${cases.length} classification checks, ${specs.length} category icons, ${exact.length} exact item icons and ${Object.keys(aliases).length} safe aliases.`);
const recipes=require('../renderer/src/data/crafting-recipes.json').recipes;
const craftingIds=new Set();
for(const recipe of recipes)for(const entry of [recipe.output,...recipe.materials]){
 assert.ok(entry.itemId,`Crafting item without identity: ${entry.name}`);
 const id=String(aliases[entry.itemId]??entry.itemId);craftingIds.add(entry.itemId);
 assert.ok(exactIds.has(id),`Crafting item has no exact illustration: ${entry.name} #${entry.itemId}`);
 assert.ok(fs.existsSync(path.resolve(__dirname,'../renderer/src/assets/item-exact-icons',id+'.png')),entry.name);
}
console.log(`PASS: all ${craftingIds.size} distinct crafting items have individual icons.`);
