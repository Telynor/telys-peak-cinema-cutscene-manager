import {ID,escape as E,poseLibrary} from './model.mjs';
import {Audience} from './stage.mjs';
import {CinemaStore} from './store.mjs';
import {Director,AssetsEditor,notifyError} from './director.mjs';
let director,store;
const audience=new Audience();
function openDirector(){if(!game.user.isGM)return;if(!director)director=new Director(store);director.render({force:true});director.bringToFront();return director;}
Hooks.once('init',()=>{
  game.settings.register(ID,'library',{scope:'world',config:false,type:Array,default:[],restricted:true});
  game.settings.register(ID,'draft',{scope:'client',config:false,type:Object,default:null});
  game.settings.register(ID,'live',{scope:'world',config:false,type:Object,default:{active:false,revision:0},restricted:true,onChange:state=>audience.show(state).catch(notifyError)});
  class DirectorMenu extends foundry.applications.api.ApplicationV2 {render(){return openDirector();}}
  game.settings.registerMenu(ID,'director',{name:'Peak Cinema Director',label:'Open Scene Animation Controls',hint:'Build, preview, and direct cinematic cutscenes.',icon:'fa-solid fa-clapperboard',type:DirectorMenu,restricted:true});
});
Hooks.once('ready',()=>{
  store=new CinemaStore(game.settings,game.user);
  game.modules.get(ID).api=Object.freeze({open:openDirector,assets:actor=>{if(game.user.isGM&&actor)return new AssetsEditor(actor).render({force:true});},stop:()=>store.stop()});
  audience.show(store.get('live')).catch(notifyError);
});
Hooks.on('getSceneControlButtons',controls=>{
  if(!game.user.isGM)return;
  controls.peakCinema={name:'peakCinema',title:'Scene Animation Controls',icon:'fa-solid fa-clapperboard',order:Object.keys(controls).length,visible:true,onChange:(_event,active)=>{if(active)openDirector();},tools:{director:{name:'director',title:'Scene Animation Controls',icon:'fa-solid fa-clapperboard',order:0,button:true,onChange:()=>openDirector()},stop:{name:'stop',title:'End Cutscene',icon:'fa-solid fa-stop',order:1,button:true,onChange:()=>store?.stop().catch(notifyError)}}};
});
Hooks.on('canvasReady',()=>{if(store)audience.show(store.get('live')).catch(notifyError);});
Hooks.on('canvasTearDown',()=>audience.close());
Hooks.on('updateScene',(_scene,changes)=>{if(Object.hasOwn(changes,'active')&&store){const live=store.get('live');if(live.active&&live.hostSceneId!==game.scenes.active?.id&&game.user.isGM)store.stop().catch(notifyError);}});
function injectAssets(app,html){
  if(!game.user?.isGM)return;const actor=app.actor??app.document;if(!(actor instanceof Actor))return;
  const root=html?.[0]??html??app.element?.[0]??app.element;if(!root?.querySelector)return;
  const host=app.element?.[0]??app.element??root;
  if(host.querySelector('[data-pc-sheet-tab]'))return;
  const nav=host.querySelector('nav.tabs[data-group="primary"], nav.sheet-tabs, nav.tabs, .tabs-right nav');
  const body=host.querySelector('.tab-body, .sheet-body, [data-application-part="body"]');
  if(!nav||!body){const header=host.querySelector('.window-header');if(header&&!header.querySelector('[data-pc-assets-fallback]')){const b=document.createElement('button');b.type='button';b.dataset.pcAssetsFallback='';b.textContent='Cinema Assets';b.onclick=e=>{e.preventDefault();new AssetsEditor(actor).render({force:true});};header.append(b);}return;}
  const group=nav.dataset.group??nav.querySelector('[data-group]')?.dataset.group??'primary';
  const tab=document.createElement('a');tab.className='item control';tab.dataset.pcSheetTab='';tab.dataset.tab='peak-cinema';tab.dataset.group=group;tab.setAttribute('role','tab');tab.innerHTML='<i class="fa-solid fa-masks-theater"></i> Cinema Assets';nav.append(tab);
  const panel=document.createElement('section');panel.className='tab pc-sheet-assets';panel.dataset.tab='peak-cinema';panel.dataset.group=group;
  const poses=poseLibrary(actor.getFlag(ID,'poses'));
  panel.innerHTML=`<h2>Cinema Assets</h2><p>Expressions and talk poses for ${E(actor.name)}. Select faces and speaking states from the Peak Cinema director.</p><div class="pc-expression-summary">${Object.entries(poses).map(([k,v])=>`<span>${E(k.replaceAll('-',' '))}<strong>${v.length}</strong></span>`).join('')}</div><button type="button" data-pc-edit-assets><i class="fa-solid fa-images"></i> Configure expressions & pose variants</button>`;
  panel.querySelector('[data-pc-edit-assets]').onclick=e=>{e.preventDefault();e.stopPropagation();new AssetsEditor(actor).render({force:true});};body.append(panel);
  const activate=()=>{host.classList.add('pc-sheet-open');nav.querySelectorAll('[data-tab]').forEach(t=>t.classList.toggle('active',t===tab));body.querySelectorAll(`.tab[data-group="${CSS.escape(group)}"]`).forEach(t=>t.classList.toggle('active',t===panel));tab.setAttribute('aria-selected','true');app._peakCinemaTab=true;};
  nav.addEventListener('click',e=>{const target=e.target.closest('[data-tab]');if(!target)return;if(target===tab){e.preventDefault();e.stopImmediatePropagation();activate();}else{host.classList.remove('pc-sheet-open');panel.classList.remove('active');tab.classList.remove('active');tab.setAttribute('aria-selected','false');app._peakCinemaTab=false;}},{capture:true});
  if(app._peakCinemaTab)activate();
}
Hooks.on('renderActorSheet',injectAssets);
Hooks.on('renderApplicationV2',injectAssets);
