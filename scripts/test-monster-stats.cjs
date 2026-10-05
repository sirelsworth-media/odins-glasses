const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
const compiled=ts.transpileModule(fs.readFileSync('renderer/src/domain/monster-stats.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const mod=new Module('stats-test');mod._compile(compiled,'stats-test.js');
const {compareMonsterStat,matchesMonsterStat,monsterStatValue}=mod.exports;
const mobs=[{monster_id:1,flee_95:200},{monster_id:2,flee_95:0},{monster_id:3,flee_95:null},{monster_id:4,flee_95:100},{monster_id:5,flee_95:NaN}];
test('stat ordering retains zero and always puts unknown values last',()=>{
assert.deepEqual([...mobs].sort((a,b)=>compareMonsterStat(a,b,'flee_95','asc')).map(m=>m.monster_id),[2,4,1,3,5]);
assert.deepEqual([...mobs].sort((a,b)=>compareMonsterStat(a,b,'flee_95','desc')).map(m=>m.monster_id),[1,4,2,3,5]);
assert.equal(monsterStatValue({},'attack_max'),null);
});
test('inclusive stat bounds exclude unknowns only when set',()=>{
assert.equal(matchesMonsterStat(mobs[2],'flee_95','',''),true);
assert.deepEqual(mobs.filter(m=>matchesMonsterStat(m,'flee_95','0','100')).map(m=>m.monster_id),[2,4]);
assert.deepEqual(mobs.filter(m=>matchesMonsterStat(m,'flee_95','100','')).map(m=>m.monster_id),[1,4]);
assert.deepEqual(mobs.filter(m=>matchesMonsterStat(m,'flee_95','200','100')),[]);
});
