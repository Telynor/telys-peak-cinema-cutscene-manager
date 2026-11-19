import test from 'node:test';
import assert from 'node:assert/strict';
import {ID,newScene,normalizeScene,duplicateScene,addActor,choosePose,asset,escape,importLibrary,poseLibrary} from '../scripts/model.mjs';
import {CinemaStore} from '../scripts/store.mjs';
function setup(){const values={live:{active:false,revision:0},library:[]};const settings={get:(_id,key)=>structuredClone(values[key]),set:async(_id,key,v)=>{await new Promise(r=>setTimeout(r,1));values[key]=structuredClone(v);return v;}};return {store:new CinemaStore(settings,{isGM:true,id:'gm'}),values,settings};}
const actor={id:'renard',name:'Renard',img:'actors/renard.webp'};
test('default expressions include all requested emotions and talk variants',()=>{assert.deepEqual(Object.keys(poseLibrary()),['neutral','talking','happy','sad','laughing','disappointment','talk-pose-1','talk-pose-2','talk-pose-3']);});
test('normalization clamps geometry and rejects unsafe image schemes',()=>{const scene=normalizeScene({background:'javascript:alert(1)',actors:[{x:Infinity,y:-100,height:999,z:-1,src:'data:text/html,evil'}]});assert.equal(scene.background,'');assert.equal(scene.actors[0].src,'');assert.equal(scene.actors[0].x,50);assert.equal(scene.actors[0].y,-30);assert.equal(scene.actors[0].height,250);assert.equal(scene.actors[0].z,0);assert.equal(asset('https://example.com/a.webp'),'https://example.com/a.webp');assert.equal(escape('<a "x">'), '&lt;a &quot;x&quot;&gt;');});
test('multiple expression poses support explicit and random selection',()=>{const poses={happy:[{src:''},{src:'a.png',label:'A'},{src:'b.png',label:'B'}]};assert.equal(choosePose(poses,'happy',{index:2}).src,'b.png');assert.equal(choosePose(poses,'happy',{random:true,rng:()=>0}).src,'a.png');assert.equal(choosePose(poses,'happy',{random:true,rng:()=>.99}).src,'b.png');assert.equal(choosePose(poses,'sad'),null);});
test('quick-start copies have new scene identity and independent actor data',()=>{const s=newScene('forest.webp');const p=addActor(s,actor);const copy=duplicateScene(s);assert.notEqual(copy.id,s.id);copy.actors[0].x=5;assert.equal(s.actors[0].x,50);assert.equal(copy.actors[0].id,p.id);});
test('pose library ignores prototype keys',()=>{const p=poseLibrary(JSON.parse('{"__proto__":[],"constructor":[],"custom":[{"src":"a.png"}]}'));assert.equal(Object.hasOwn(p,'__proto__'),false);assert.equal(Object.hasOwn(p,'constructor'),false);assert.equal(p.custom[0].src,'a.png');});
test('live patches cannot leak staged additions, removals, background, scale or positions',async()=>{const {store,values}=setup();const d=newScene('old.webp');const a=addActor(d,actor),b=addActor(d,{...actor,id:'lark',name:'Lark'});await store.publish(d,'host');const staged=structuredClone(d);staged.background='new.webp';staged.actors=staged.actors.filter(p=>p.id!==b.id);staged.actors[0].x=12;staged.actors[0].height=150;addActor(staged,{...actor,id:'new'});await store.patchActor(d.id,a.id,{src:'happy.webp',expression:'happy',variant:2,speaking:true,flip:true,x:12,height:150});const live=values.live.scene;assert.equal(live.background,'old.webp');assert.equal(live.actors.length,2);assert.equal(live.actors[1].id,b.id);assert.equal(live.actors[0].x,50);assert.equal(live.actors[0].height,85);assert.equal(live.actors[0].src,'happy.webp');assert.equal(live.actors[0].speaking,true);assert.equal(live.actors[0].flip,true);assert.equal(await store.patchActor(d.id,staged.actors[1].id,{speaking:true}),false);await store.publish(staged,'host');assert.equal(values.live.scene.background,'new.webp');assert.equal(values.live.scene.actors[0].x,12);});
test('library edits and other scene IDs never mutate live cutscene',async()=>{const {store,values}=setup();const d=newScene();const a=addActor(d,actor);await store.publish(d,'host');assert.equal(await store.patchActor('other-scene',a.id,{flip:true}),false);assert.equal(values.live.scene.actors[0].flip,false);assert.equal(await store.patchSpeaking('other-scene',true),false);});
test('rapid speaking and flip operations preserve both updates',async()=>{const {store,values}=setup();const d=newScene();const a=addActor(d,actor),b=addActor(d,{...actor,id:'lark'});await store.publish(d,'host');await Promise.all([store.patchActor(d.id,a.id,{speaking:true}),store.patchActor(d.id,b.id,{speaking:true}),store.patchActor(d.id,a.id,{flip:true}),store.patchSpeaking(d.id,true)]);assert.equal(values.live.scene.actors[0].speaking,true);assert.equal(values.live.scene.actors[1].speaking,true);assert.equal(values.live.scene.actors[0].flip,true);assert.equal(values.live.scene.dimInactive,true);await store.patchSpeaking(d.id,false);assert.equal(values.live.scene.actors[0].speaking,true);});
test('preset save updates and quick copies remain distinct',async()=>{const {store,values}=setup();const s=newScene();await store.savePreset(s);s.name='Edited';await store.savePreset(s);assert.equal(values.library.length,1);assert.equal(values.library[0].name,'Edited');const copy=duplicateScene(s);await store.savePreset(copy);assert.equal(values.library.length,2);await store.deletePreset(s.id);assert.equal(values.library[0].id,copy.id);});
test('end cutscene survives refresh state and blocks further live patches',async()=>{const {store,values}=setup();const d=newScene();const a=addActor(d,actor);await store.publish(d,'host');await store.stop();assert.equal(values.live.active,false);assert.equal(await store.patchActor(d.id,a.id,{flip:true}),false);});
test('players cannot publish, stop or mutate presets',async()=>{const {settings}=setup();const store=new CinemaStore(settings,{isGM:false});await assert.rejects(store.publish(newScene(),'host'),/Only a GM/);await assert.rejects(store.stop(),/Only a GM/);await assert.rejects(store.savePreset(newScene()),/Only a GM/);});
test('imports validate format and assign fresh IDs',()=>{const s=newScene();const imported=importLibrary({format:ID,version:1,scenes:[s]});assert.notEqual(imported[0].id,s.id);assert.throws(()=>importLibrary({scenes:[s]}),/Peak Cinema/);assert.throws(()=>importLibrary({format:ID,version:1,scenes:Array(501).fill(s)}),/500/);});

test('IDs use Foundry randomID when browser randomUUID is unavailable',t=>{
  const originalFoundry=Object.getOwnPropertyDescriptor(globalThis,'foundry');
  const originalCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  t.after(()=>{if(originalFoundry)Object.defineProperty(globalThis,'foundry',originalFoundry);else delete globalThis.foundry;Object.defineProperty(globalThis,'crypto',originalCrypto);});
  let next=0;
  Object.defineProperty(globalThis,'foundry',{configurable:true,value:{utils:{randomID:length=>`foundry-${length}-${++next}`}}});
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues:values=>values.fill(7)}});
  const scene=newScene();
  assert.match(scene.id,/^foundry-24-/);
  const placement=addActor(scene,actor);
  assert.match(placement.id,/^foundry-24-/);
  assert.notEqual(placement.id,scene.id);
  const copy=duplicateScene(scene);
  assert.notEqual(copy.id,scene.id);
  assert.ok(poseLibrary({happy:[{src:'happy.png'}]}).happy[0].id.startsWith('foundry-24-'));
});

test('standalone ID fallback supports crypto without randomUUID',t=>{
  const originalFoundry=Object.getOwnPropertyDescriptor(globalThis,'foundry');
  const originalCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  t.after(()=>{if(originalFoundry)Object.defineProperty(globalThis,'foundry',originalFoundry);else delete globalThis.foundry;Object.defineProperty(globalThis,'crypto',originalCrypto);});
  Object.defineProperty(globalThis,'foundry',{configurable:true,value:undefined});
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues:values=>values.fill(12)}});
  assert.equal(newScene().id,'0c'.repeat(16));
});
