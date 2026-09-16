// Hidden Electron smoke test with synthetic data; never contacts game databases.
const { app } = require('electron');
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('in-process-gpu');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(),'odins-glasses-theme-test-')));
const output = path.resolve(__dirname,'../previews');
fs.mkdirSync(output, { recursive: true });
const mob = { monster_id:1019,name_en:'Peco Peco',aegis_name:'PECOPECO',level:27,hp:525,base_exp:315,job_exp:63,exp_per_hp:.6,total_exp_per_hp:.72,element:'Fire',element_level:1,race:'Brute',size:'Large',defense:0,magic_defense:0,attack_min:20,attack_max:30,exp_source:'UI test fixture',exp_source_kind:'global_measurement',spawns:[{code:'moc_fild03',name:'Sograt Desert',count:30,count_kind:'reference'}],drops:[{item_id:909,name_en:'Jellopy',category:'Etc',rate_percent:50,rate_known:true,npc_sell_price:100,image_url:null}] };
require('../api.cjs').handleApi = async (req,res) => {
 if(!req.url.startsWith('/api/'))return false;
 res.setHeader('Content-Type','application/json');
 const body=req.url.startsWith('/api/skills')?{families:[{erst:'Swordsman',zweit:['Knight']}],skills:{Swordsman:[{k:'bash',n:'Bash',b:'Strikes a target with great force and deals heavy physical damage.',max:10,a:'Active',q:0,v:[],st:[{Level:'1',SP:'8',Effect:'ATK 130%'}]}],Knight:[]}}:req.url.startsWith('/api/fields')?{fields:[]}:req.url.startsWith('/api/dungeons')?{maps:[]}:req.url.startsWith('/api/bosses')?{bosses:[]}:req.url.startsWith('/api/item-search')?{items:[{key:'test',item_id:4100,name_en:'Test Card',source_slug:'test-card',category:'Card',subtype:'Shoes',sell_price:10}],total:1}:{items:[mob, {...mob, monster_id:1002, name_en:"Race filter fixture", aegis_name:"PORING", race:"Plant", size:"Small", spawns:[{code:"fixture_plant",name:"Plant fixture map",count:5}]}]};
 res.end(JSON.stringify(body)); return true;
};
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
app.on('browser-window-created',(_,win)=>{
 win.webContents.setBackgroundThrottling(false);
 win.webContents.once('did-finish-load',async()=>{
  try{
   const run = code => win.webContents.executeJavaScript(code).catch(error=>{console.error('Failed UI check:',code);throw error;});
   await sleep(900);
   assert.equal(await run('document.documentElement.dataset.theme'),'aurora');
   assert.equal(await run('document.querySelectorAll(".tabs svg").length'),9);
   assert.equal(await run('document.querySelectorAll(".mobCard").length'),2);
   const selectRace = async value => { await run(`{const select=document.getElementById('hunt-race');select.value='${value}';select.dispatchEvent(new Event('change',{bubbles:true}));}`);await sleep(150); };
   const selectSize = async value => { await run(`{const select=document.getElementById('hunt-size');select.value='${value}';select.dispatchEvent(new Event('change',{bubbles:true}));}`);await sleep(150); };
   await selectSize('Large');
   assert.equal(await run('document.querySelectorAll(".mobCard").length'),1);
   assert.ok(await run('document.querySelector(".mobIdentity").textContent.includes("Peco Peco")'));
   await selectSize('All');
   assert.equal(await run('document.querySelectorAll(".mobCard").length'),2);
   await selectRace('Brute');
   assert.equal(await run('document.querySelectorAll(".mobCard").length'),1);
   assert.ok(await run('document.querySelector(".mobIdentity").textContent.includes("Peco Peco")'));
   await run('document.querySelectorAll(".viewSwitch button")[1].click()');await sleep(150);
   assert.equal(await run('document.querySelectorAll(".regionCard").length'),1);
   assert.ok(await run('document.querySelector(".regionCard").textContent.includes("Sograt Desert")'));
   await run('document.querySelectorAll(".viewSwitch button")[0].click()');await sleep(150);
   await selectRace('Angel');
   assert.equal(await run('document.querySelectorAll(".mobCard").length'),0);
   assert.ok(await run('document.querySelector(".mobList").textContent.includes("Keine Monster")'));
   await selectRace('All');
   assert.equal(await run('document.querySelectorAll(".mobCard").length'),2);
   await selectRace('Brute');
   await run('document.querySelector(".mobCard").click()');
   await sleep(500);
   assert.equal(await run('document.querySelector(".monsterArtwork img").naturalWidth'),480);
   await run('document.querySelector(".monsterArtwork").scrollIntoView({block:"start",behavior:"instant"})');
   win.setSize(1358,980);
   await sleep(1600);
   fs.writeFileSync(path.join(output,'monster-detail-480.png'),(await win.webContents.capturePage()).toPNG());
   await run('document.querySelector(".mobCard").click(); window.scrollTo({top:0,behavior:"instant"})');
   for (const width of [1360,900]) {
    win.setSize(width,980);await sleep(250);
    assert.equal(await run('document.documentElement.scrollWidth <= innerWidth'),true,`Overflow at ${width}`);
    fs.writeFileSync(path.join(output,`aurora-${width}.png`),(await win.webContents.capturePage()).toPNG());
   }
   await run('document.querySelectorAll(".themeSwitch button")[0].click()');await sleep(250);
   assert.equal(JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'appearance.json'))).theme,'classic');
   await new Promise(resolve=>{win.webContents.once('did-finish-load',resolve);win.reload();});
   for(let attempt=0;attempt<30;attempt++){if(await run('document.documentElement.dataset.theme')==='classic')break;await sleep(100);}
   assert.equal(await run('document.documentElement.dataset.theme'),'classic');
   fs.writeFileSync(path.join(output,'classic-900.png'),(await win.webContents.capturePage()).toPNG());
   await run('document.querySelectorAll(".themeSwitch button")[2].click()');await sleep(250);
   assert.equal(await run('document.documentElement.dataset.theme'),'nocturne');
   assert.equal(JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'appearance.json'))).theme,'nocturne');
   for (const width of [1360,900]) {
    win.setSize(width,980);await sleep(250);
    assert.equal(await run('document.documentElement.scrollWidth <= innerWidth'),true,`Nocturne overflow at ${width}`);
    fs.writeFileSync(path.join(output,`nocturne-${width}.png`),(await win.webContents.capturePage()).toPNG());
   }
   await new Promise(resolve=>{win.webContents.once('did-finish-load',resolve);win.reload();});
   for(let attempt=0;attempt<30;attempt++){if(await run('document.documentElement.dataset.theme')==='nocturne')break;await sleep(100);}
   assert.equal(await run('document.documentElement.dataset.theme'),'nocturne');
   await run('document.querySelectorAll(".themeSwitch button")[1].click()');
   for(let i=0;i<9;i++){
    await run(`document.querySelectorAll('.tabs button')[${i}].click()`);await sleep(400);
    assert.equal(await run('!!document.querySelector(".tabs button.active")'),true);
    if(i===2){
     await run(`{const select=document.querySelector('.itemFilters select');select.value='card';select.dispatchEvent(new Event('change',{bubbles:true}));}`);
     await sleep(1600);
     await run('document.querySelector(".itemIdentity").scrollIntoView({block:"center",behavior:"instant"})');
     win.setSize(903,980);await sleep(800);
     assert.equal(await run('document.querySelector(".itemIdentity .renderedItemIcon img").naturalWidth'),128);
     assert.ok(await run('document.querySelector(".itemIdentity .renderedItemIcon img").src.includes("card-shoes")'));
     await run('document.querySelector(".itemCategoryPreview").scrollIntoView({block:"center",behavior:"instant"})');
     win.setSize(902,980);await sleep(800);
     fs.writeFileSync(path.join(output,'item-icons-in-app.png'),(await win.webContents.capturePage()).toPNG());
    }
    if(i===3){
     assert.equal(await run('document.querySelectorAll(".recipeOutputImage .exactItemIcon").length'), await run('document.querySelectorAll(".recipeOutputImage").length'));
     assert.equal(await run('document.querySelectorAll(".recipeMaterialIcon .exactItemIcon").length'), await run('document.querySelectorAll(".recipeMaterialIcon").length'));
     await sleep(500);
     assert.ok(await run('document.querySelectorAll(".recipeOutputImage .generatedItemIcon").length > 0'));
     assert.ok(await run('document.querySelectorAll(".recipeMaterialIcon .exactItemIcon img").length > 0'));
     assert.equal(await run('document.querySelector(".recipeMaterialIcon .exactItemIcon img").naturalWidth'),128);
     await run('document.querySelector(".recipeMaterials").scrollIntoView({block:"center",behavior:"instant"})');
     win.setSize(1100,980);await sleep(600);
     fs.writeFileSync(path.join(output,'crafting-icons-in-app.png'),(await win.webContents.capturePage()).toPNG());
     await run('document.querySelectorAll(".craftProfessions button")[3].click()');await sleep(500);
     assert.ok(await run('document.querySelectorAll(".recipeOutputImage .exactItemIcon img").length > 0'));
     assert.equal(await run('document.querySelector(".recipeOutputImage .exactItemIcon img").naturalWidth'),128);
     await run('document.querySelector(".recipeGrid").scrollIntoView({block:"start",behavior:"instant"})');
     win.setSize(1100,980);await sleep(600);
     fs.writeFileSync(path.join(output,'crafting-blacksmith-icons.png'),(await win.webContents.capturePage()).toPNG());
     await run('document.querySelectorAll(".craftViewSwitch button")[1].click()');await sleep(350);
     assert.ok(await run('document.querySelectorAll(".materialItemImage .exactItemIcon img").length > 0'));
    }
    if(i===7){
     await sleep(500);
     assert.equal(await run('document.querySelectorAll(".moneyCard").length'),2);
     assert.ok(await run('document.querySelector(".moneyCard").textContent.includes("1.500")'));
     await run('document.querySelector(".moneyCard summary").click()');await sleep(100);
     assert.ok(await run('document.querySelector(".moneyCard table").textContent.includes("Jellopy")'));
     await run('document.querySelector(".moneyPage").scrollIntoView({block:"start",behavior:"instant"})');await run('window.scrollBy(0,-110)');win.setSize(1098,980);await sleep(800);
     fs.writeFileSync(path.join(output,'money-helper.png'),(await win.webContents.capturePage()).toPNG());
    }
    if(i===8){
     for(let attempt=0;attempt<50;attempt++){if(await run('document.querySelectorAll(".skillCard").length')===1)break;await sleep(100);}
     if(await run('document.querySelectorAll(".skillCard").length')!==1)console.log(await run('document.body.innerText.slice(-4000)'));
     assert.equal(await run('document.querySelectorAll(".skillCard").length'),1);
     assert.ok(await run('document.querySelector(".skillDescription").textContent.includes("heavy physical damage")'));
     await run('document.querySelector(".skillCard summary").click()');await sleep(100);
     assert.ok(await run('document.querySelector(".skillCard table").textContent.includes("130%")'));
     await run('document.querySelector(".classPage").scrollIntoView({block:"start",behavior:"instant"})');await run('window.scrollBy(0,-110)');win.setSize(1096,980);await sleep(800);
     fs.writeFileSync(path.join(output,'class-guide.png'),(await win.webContents.capturePage()).toPNG());
    }
    assert.equal(await run('document.documentElement.scrollWidth <= innerWidth'),true,`Tab overflow ${i}`);
   }
   console.log('PASS: 9 tabs, race and size filters, money and skills, 9 SVG icons, three themes, saved preferences + reload, 900/1360px, screenshots.');
   app.exit(0);
  }catch(error){console.error(error);app.exit(1);}
 });
});
process.env.ODINS_GLASSES_SMOKE_TEST='1';
require('../main.cjs');
setTimeout(()=>{console.error('Smoke test timeout');app.exit(1);},60000);
