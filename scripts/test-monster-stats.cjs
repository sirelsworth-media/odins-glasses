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

const {fieldStatSummary,matchesFieldStats}=mod.exports;
test('field stats use known values and spawn weights, with explicit coverage',()=>{
const mobs=[{flee_95:100,count:3},{flee_95:200,count:1},{flee_95:null,count:500}];
assert.deepEqual(fieldStatSummary(mobs,'flee_95','average'),{value:125,known:2,total:3});
assert.equal(fieldStatSummary(mobs,'flee_95','max').value,200);
assert.equal(fieldStatSummary(mobs,'flee_95','min').value,100);
assert.equal(fieldStatSummary([{flee_95:null}],'flee_95','max').value,null);
assert.equal(fieldStatSummary([{hp:0,count:0}],'hp','average').value,0);
});
test('field bounds test individual monsters rather than hiding risks behind an average',()=>{
const mobs=[{flee_95:100},{flee_95:200}];
assert.equal(matchesFieldStats(mobs,'flee_95','','150','all'),false);
assert.equal(matchesFieldStats(mobs,'flee_95','','150','any'),true);
assert.equal(matchesFieldStats([{flee_95:100},{flee_95:null}],'flee_95','','150','all'),false);
assert.equal(matchesFieldStats([{flee_95:null}],'flee_95','','150','any'),false);
assert.equal(matchesFieldStats([{flee_95:null}],'flee_95','','','all'),true);
});
