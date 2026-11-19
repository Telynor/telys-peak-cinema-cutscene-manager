import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {ID,newScene,addActor,normalizeScene} from '../scripts/model.mjs';
import {CinemaStore} from '../scripts/store.mjs';
const dom=new JSDOM('<!doctype html><body></body>',{url:'https://foundry.test/game'});
Object.assign(globalThis,{document:dom.window.document,HTMLElement:dom.window.HTMLElement,CSS:{escape:s=>s},Image:class {set src(s){queueMicrotask(()=>s.includes('missing')?this.onerror?.():this.onload?.());}}});
dom.window.HTMLElement.prototype.animate=function(){return {cancel(){}};};
class App {constructor(){this.element=document.createElement('section');this.element.className='pc-app';this.content=document.createElement('div');this.content.className='window-content';this.element.append(this.content);document.body.append(this.element);}async render(){this._replaceHTML(await this._renderHTML(),this.content);return this;}async close(){this.element.remove();}bringToFront(){}}
globalThis.foundry={applications:{api:{ApplicationV2:App,DialogV2:{confirm:async()=>true}},apps:{FilePicker:{implementation:class {}}}},utils:{saveDataToFile(){}}};
const notices=[];globalThis.ui={notifications:{warn:s=>notices.push(s),error:s=>notices.push(s),info:s=>notices.push(s)}};
const {Director,AssetsEditor}=await import('../scripts/director.mjs');
const {Stage,Audience}=await import('../scripts/stage.mjs');
function setup(){document.body.replaceChildren();notices.length=0;const values={live:{active:false,revision:0},library:[],draft:null};const actors=[{id:'a',name:'Actor A',img:'a.webp',getFlag(){return {neutral:[{src:'a.webp',label:'Neutral'}],happy:[{src:'happy.webp',label:'Happy 1'},{src:'happy2.webp',label:'Happy 2'}]};},async setFlag(_id,_key,v){this.saved=v;}}];const scenes=[{id:'host',name:'Active map',background:{src:'background.webp'}},{id:'other',name:'Another background',background:{src:'other.webp'}}];const settings={get:(_id,k)=>structuredClone(values[k]),set:async(_id,k,v)=>{values[k]=structuredClone(v);return v;}};globalThis.game={user:{id:'gm',isGM:true},settings,actors:{contents:actors,get:id=>actors.find(a=>a.id===id)},scenes:{contents:scenes,get:id=>scenes.find(s=>s.id===id),active:scenes[0]}};globalThis.canvas={scene:scenes[0]};return {values,actors,store:new CinemaStore(settings,game.user)};}
test('director renders two tabs and library builder with scaler and preview',async()=>{const {store}=setup();const app=new Director(store);await app.render();assert.ok(app.root.querySelector('[data-pc="current"]'));assert.ok(app.root.querySelector('[data-pc="library"]'));await app.action('library',{});await app.action('new',{});assert.ok(app.root.querySelector('.pc-preview'));assert.ok(app.root.querySelector('[data-field="bgScale"]'));assert.ok(app.root.querySelector('[data-pc="save"]'));await app.action('save',{});assert.equal(store.get('library').length,1);await app.action('use-scene',{});assert.equal(app.tab,'current');assert.notEqual(app.current.id,store.get('library')[0].id);clearTimeout(app.draftTimer);});
test('director speaking/flip/face go live; adding and moving stay staged',async()=>{const {store,actors,values}=setup();const scene=newScene();const p=addActor(scene,actors[0],actors[0].getFlag());await store.publish(scene,'host');const app=new Director(store);app.selected=p.id;await app.render();await app.action('speak',{dataset:{id:p.id}});assert.equal(values.live.scene.actors[0].speaking,true);assert.ok(app.root.querySelector('.pc-speaking'));await app.action('flip',{});assert.equal(values.live.scene.actors[0].flip,true);const x=app.root.querySelector('[data-field="actor.x"]');x.value='20';await app.change(x);assert.equal(values.live.scene.actors[0].x,50);await app.choosePose(0);const emotion=app.root.querySelector('[data-field="actor.expression"]');emotion.value='happy';await app.change(emotion);assert.equal(values.live.scene.actors[0].src,'happy.webp');assert.equal(values.live.scene.actors[0].x,50);app.root.querySelector('[data-choice="actor"]').value='a';await app.action('add-actor',{});assert.equal(app.current.actors.length,2);assert.equal(values.live.scene.actors.length,1);await app.action('master-speaking',{});assert.equal(values.live.scene.dimInactive,true);assert.equal(values.live.scene.actors.length,1);await app.action('push',document.createElement('button'));assert.equal(values.live.scene.actors.length,2);assert.equal(values.live.scene.actors[0].x,20);clearTimeout(app.draftTimer);});
test('library controls never change the audience',async()=>{const {store,actors,values}=setup();const scene=newScene();const p=addActor(scene,actors[0]);await store.publish(scene,'host');await store.savePreset(scene);const app=new Director(store);await app.action('library',{});await app.action('edit-preset',{dataset:{id:scene.id}});app.selected=p.id;await app.action('flip',{});await app.action('speak',{dataset:{id:p.id}});await app.action('master-speaking',{});assert.equal(values.live.scene.actors[0].flip,false);assert.equal(values.live.scene.actors[0].speaking,false);assert.equal(values.live.scene.dimInactive,false);});
test('stage dims non-speakers, supports multiple speakers, master disable restores all',()=>{setup();const root=document.createElement('div');const stage=new Stage(root,{preview:true});const scene=newScene();const a=addActor(scene,{id:'a',name:'A',img:'a.png'}),b=addActor(scene,{id:'b',name:'B',img:'b.png'});scene.dimInactive=true;a.speaking=true;stage.render(scene);assert.equal(stage.nodes.get(a.id).style.filter,'none');assert.equal(stage.nodes.get(b.id).style.filter,'brightness(.48)');b.speaking=true;stage.render(scene);assert.equal(stage.nodes.get(b.id).style.filter,'none');a.speaking=false;scene.dimInactive=false;stage.render(scene);assert.equal(stage.nodes.get(a.id).style.filter,'none');a.flip=true;stage.render(scene);assert.match(stage.nodes.get(a.id).style.transform,/scaleX\(-1\)/);});
test('pose replacement preserves an in-flow current image across rapid changes',()=>{setup();const stage=new Stage(document.createElement('div'));const scene=newScene();const p=addActor(scene,{id:'a',name:'A',img:'a.png'});stage.render(scene);p.src='b.png';stage.render(scene);p.src='c.png';stage.render(scene);const node=stage.nodes.get(p.id);assert.equal(node.querySelectorAll('.pc-current').length,1);assert.equal(node.querySelectorAll('.pc-outgoing').length,1);assert.equal(node.lastElementChild.dataset.path,'c.png');});
test('audience reconstructs live state on refresh and closes on other scenes',async()=>{setup();const audience=new Audience();const scene=newScene('background.webp');addActor(scene,{id:'a',name:'A',img:'a.png'});await audience.show({active:true,hostSceneId:'host',scene,revision:1});assert.ok(document.querySelector('.pc-audience'));assert.equal(audience.stage.nodes.size,1);await audience.show({active:true,hostSceneId:'other',scene,revision:2});assert.equal(document.querySelector('.pc-audience'),null);await audience.show({active:true,hostSceneId:'host',scene,revision:3});await audience.show({active:false});assert.equal(document.querySelector('.pc-audience'),null);});
test('assets editor saves variants independently of the actor sheet form',async()=>{const {actors}=setup();const app=new AssetsEditor(actors[0]);await app.render();await app.action({dataset:{pc:'add'}},app.content);assert.equal(app.poses.neutral.length,2);app.poses.neutral[1].src='extra.webp';await app.action({dataset:{pc:'save'}},app.content);assert.equal(actors[0].saved.neutral[1].src,'extra.webp');assert.equal(app.dirty,false);});
test('Foundry hooks register GM rail controls and inject an actor asset tab once',async()=>{const {values}=setup();const registrations={};const hooks={};globalThis.Hooks={once:(k,fn)=>(hooks[k]??=[]).push(fn),on:(k,fn)=>(hooks[k]??=[]).push(fn)};globalThis.Actor=class {constructor(){this.id='npc';this.name='NPC';}getFlag(){return {};}};game.settings.register=(_id,key,opts)=>{registrations[key]=opts;};game.settings.registerMenu=()=>{};game.modules={get:()=>({})};await import('../scripts/main.mjs');hooks.init[0]();hooks.ready[0]();assert.equal(registrations.live.restricted,true);assert.equal(registrations.library.restricted,true);const controls={tokens:{}};hooks.getSceneControlButtons[0](controls);assert.equal(controls.peakCinema.title,'Scene Animation Controls');game.user.isGM=false;const playerControls={};hooks.getSceneControlButtons[0](playerControls);assert.equal(playerControls.peakCinema,undefined);game.user.isGM=true;const host=document.createElement('div');host.innerHTML='<nav class="tabs" data-group="primary"><a data-tab="details">Details</a></nav><div class="sheet-body"><section class="tab active" data-group="primary" data-tab="details">Details</section></div>';const app={actor:new Actor(),element:host};hooks.renderActorSheet[0](app,host);hooks.renderApplicationV2[0](app,host);assert.equal(host.querySelectorAll('[data-pc-sheet-tab]').length,1);host.querySelector('[data-pc-sheet-tab]').click();assert.equal(host.classList.contains('pc-sheet-open'),true);assert.equal(host.querySelector('.pc-sheet-assets').classList.contains('active'),true);host.querySelector('[data-tab="details"]').click();assert.equal(host.classList.contains('pc-sheet-open'),false);});

test('real director button clicks execute once after repeated rerenders',async()=>{
  const {store}=setup();
  const app=new Director(store);
  await app.render();
  const pending=[];
  const original=app.action.bind(app);
  let calls=0;
  app.action=(action,button)=>{calls++;const result=original(action,button);pending.push(result);return result;};
  const click=async(selector)=>{calls=0;app.root.querySelector(selector).click();await Promise.all(pending.splice(0));assert.equal(calls,1,`${selector} should dispatch one action`);};
  await click('[data-pc="library"]');assert.equal(app.tab,'library');
  await click('[data-pc="current"]');assert.equal(app.tab,'current');
  await click('[data-pc="library"]');
  await click('[data-pc="new"]');assert.ok(app.libraryDraft);
  await click('[data-pc="save"]');assert.equal(store.get('library').length,1);
  await click('[data-pc="use-scene"]');assert.equal(app.tab,'current');
  app.root.querySelector('[data-choice="actor"]').value='a';
  await click('[data-pc="add-actor"]');assert.equal(app.current.actors.length,1);
  await click('[data-pc="flip"]');assert.equal(app.current.actors[0].flip,true);
  await click('[data-pc="flip"]');assert.equal(app.current.actors[0].flip,false);
  await click('.pc-right [data-pc="speak"]');assert.equal(app.current.actors[0].speaking,true);
  await click('.pc-right [data-pc="speak"]');assert.equal(app.current.actors[0].speaking,false);
  clearTimeout(app.draftTimer);
});

test('director opens and buttons work in the logged non-secure browser environment',async t=>{
  const {store}=setup();
  const originalCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  const originalRandom=foundry.utils.randomID;
  t.after(()=>{Object.defineProperty(globalThis,'crypto',originalCrypto);if(originalRandom)foundry.utils.randomID=originalRandom;else delete foundry.utils.randomID;});
  let next=0;
  foundry.utils.randomID=()=>`http-id-${++next}`;
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues:values=>values.fill(1)}});
  const app=new Director(store);await app.render();
  assert.ok(app.root.querySelector('[data-pc="library"]'));
  assert.match(app.current.id,/^http-id-/);
  await app.action('library',{});await app.action('new',{});
  assert.ok(app.root.querySelector('.pc-preview'));
  clearTimeout(app.draftTimer);
});
