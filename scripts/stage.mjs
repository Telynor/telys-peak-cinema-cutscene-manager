import {asset, clamp, normalizeScene} from './model.mjs';
const make = (tag, cls, text) => {const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;};
export function image(src, cls = '') {
  const el=make('img',cls); el.alt=''; el.draggable=false; el.src=asset(src) || 'icons/svg/mystery-man.svg';
  el.addEventListener('error',()=>{el.classList.add('pc-missing');el.title=`Unable to load image: ${src}`;},{once:true}); return el;
}
export class Stage {
  constructor(root,{preview=false,onSelect,onMove}={}) {this.root=root;this.preview=preview;this.onSelect=onSelect;this.onMove=onMove;this.nodes=new Map();this.scene=null;this.generation=0;root.classList.add('pc-stage');}
  render(raw,selected='') {
    const scene=normalizeScene(raw); const previous=this.scene;this.scene=scene;
    this.root.style.aspectRatio=scene.aspect;this.root.style.setProperty('--pc-duration',`${this.preview?0:scene.transition==='cut'?0:scene.duration}ms`);
    this.root.classList.toggle('pc-letterbox',scene.letterbox);
    if(!previous || previous.background!==scene.background || previous.bgScale!==scene.bgScale || previous.bgX!==scene.bgX || previous.bgY!==scene.bgY) {
      const bg=make('div','pc-background');
      if(scene.background) {const img=image(scene.background);img.style.objectPosition=`${scene.bgX}% ${scene.bgY}%`;img.style.transform=`scale(${scene.bgScale/100})`;img.style.transformOrigin=`${scene.bgX}% ${scene.bgY}%`;bg.append(img);}
      const old=this.root.querySelectorAll('.pc-background'); this.root.prepend(bg);
      if(!this.preview && previous && scene.transition!=='cut')bg.animate([{opacity:0},{opacity:1}],{duration:scene.duration,fill:'both'});
      for(const node of old) {if(this.preview)node.remove();else setTimeout(()=>node.remove(),scene.duration);}
    }
    for(const [id, node] of this.nodes) if(!scene.actors.some(p=>p.id===id&&p.visible)) {this.nodes.delete(id);if(!this.preview && scene.transition!=='cut'){node.animate([{opacity:1},{opacity:0}],{duration:scene.duration,fill:'forwards'});setTimeout(()=>node.remove(),scene.duration);}else node.remove();}
    for(const p of scene.actors.filter(p=>p.visible)) {
      let node=this.nodes.get(p.id);const fresh=!node;
      if(fresh){node=make('div','pc-character');node.dataset.placement=p.id;node.tabIndex=this.preview?0:-1;this.nodes.set(p.id,node);this.root.append(node);if(this.preview)this.bindDrag(node,p.id);}
      node.title=p.name;node.setAttribute('aria-label',p.name);
      const current=node.querySelector('.pc-current');
      if(current?.dataset.path!==p.src){for(const old of node.querySelectorAll('.pc-outgoing'))old.remove();const img=image(p.src,'pc-current');img.dataset.path=p.src;if(current){current.className='pc-outgoing';if(!this.preview&&scene.transition!=='cut'){img.animate([{opacity:0},{opacity:1}],{duration:scene.duration});setTimeout(()=>current.remove(),scene.duration);}else current.remove();}node.append(img);}
      Object.assign(node.style,{left:`${p.x}%`,top:`${p.y}%`,height:`${p.height}%`,zIndex:String(10+p.z),transform:`translate(-50%, -100%) scaleX(${p.flip?-1:1})`,filter:scene.dimInactive&&!p.speaking?'brightness(.48)':'none'});
      node.classList.toggle('pc-selected',this.preview&&p.id===selected);
      if(fresh&&!this.preview&&p.entrance!=='none'&&scene.transition!=='cut'){
        node.animate([{opacity:0,translate:p.entrance==='left'?'-120px 0':p.entrance==='right'?'120px 0':p.entrance==='rise'?'0 80px':'0 0'},{opacity:1,translate:'0 0'}],{duration:scene.duration,easing:'ease-out'});
      }
    }
    this.root.querySelector('.pc-dialogue')?.remove();this.root.querySelector('.pc-introduction')?.remove();
    if(scene.dialogue){const box=make('div','pc-dialogue');const speaker=scene.actors.find(p=>p.id===scene.speaker);if(speaker)box.append(make('strong','',speaker.name));box.append(make('div','',scene.dialogue));this.root.append(box);}
    if(scene.introduction.name){const intro=make('div','pc-introduction');intro.append(make('h2','',scene.introduction.name),make('p','',scene.introduction.subtitle));this.root.append(intro);if(!this.preview&&JSON.stringify(previous?.introduction)!==JSON.stringify(scene.introduction))intro.animate([{opacity:0,translate:'-40px 0'},{opacity:1,translate:'0 0'}],{duration:scene.duration});}
  }
  bindDrag(node,id) {
    node.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;e.preventDefault();this.onSelect?.(id);node.setPointerCapture(e.pointerId);
      const rect=this.root.getBoundingClientRect();const p=this.scene.actors.find(p=>p.id===id);if(!p||!rect.width||!rect.height)return;
      const start={x:e.clientX,y:e.clientY,px:p.x,py:p.y};
      const move=ev=>{const x=clamp(start.px+(ev.clientX-start.x)/rect.width*100,-30,130),y=clamp(start.py+(ev.clientY-start.y)/rect.height*100,-30,150);node.style.left=`${x}%`;node.style.top=`${y}%`;this.onMove?.(id,{x,y},false);};
      const done=()=>{node.removeEventListener('pointermove',move);node.removeEventListener('pointerup',done);node.removeEventListener('pointercancel',done);this.onMove?.(id,{},true);};
      node.addEventListener('pointermove',move);node.addEventListener('pointerup',done);node.addEventListener('pointercancel',done);
    });
    node.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const p=this.scene.actors.find(p=>p.id===id),step=e.shiftKey?5:1;this.onMove?.(id,{x:clamp(p.x+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),-30,130),y:clamp(p.y+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0),-30,150)},true);});
  }
  destroy(){this.generation++;this.nodes.clear();this.root.replaceChildren();}
}
export class Audience {
  constructor(){this.root=null;this.stage=null;this.revision=0;this.pending=0;}
  async show(state) {
    const ticket=++this.pending;
    if(!state?.active || state.hostSceneId!==globalThis.canvas?.scene?.id){this.close();return;}
    // Only published data is read by players. Image loading happens before the swap.
    const scene=normalizeScene(state.scene);await preload(scene);if(ticket!==this.pending)return;
    if(!this.root){this.root=make('section','pc-audience');this.root.setAttribute('aria-label','Peak Cinema cutscene');document.body.append(this.root);const viewport=make('div','pc-viewport');this.root.append(viewport);this.stage=new Stage(viewport);}
    this.root.style.setProperty('--pc-aspect',scene.aspect);const [w,h]=scene.aspect.split('/').map(Number);this.root.style.setProperty('--pc-ratio',String(w/h));this.stage.render(scene);this.revision=state.revision;
  }
  close(){this.pending++;this.stage?.destroy();this.root?.remove();this.root=null;this.stage=null;}
}
const loaded=new Map();
export async function preload(scene){
  const paths=[scene.background,...scene.actors.filter(p=>p.visible).map(p=>p.src)].filter(Boolean);
  const results=await Promise.all([...new Set(paths)].map(src=>{if(loaded.has(src))return loaded.get(src);const promise=new Promise(resolve=>{const img=new Image();const done=value=>{clearTimeout(timer);if(value)loaded.delete(src);resolve(value);};const timer=setTimeout(()=>done(src),7000);img.onload=()=>done(null);img.onerror=()=>done(src);img.src=asset(src);});loaded.set(src,promise);return promise;}));return results.filter(Boolean);
}
