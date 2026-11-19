export const ID = 'telys-peak-cinema-cutscene-manager';
export const EXPRESSIONS = ['neutral', 'talking', 'happy', 'sad', 'laughing', 'disappointment', 'talk-pose-1', 'talk-pose-2', 'talk-pose-3'];
export const clone = value => structuredClone(value);
export function uid() {
  // Foundry's helper works on HTTP/LAN hosts where randomUUID is unavailable.
  if (typeof globalThis.foundry?.utils?.randomID === 'function') return globalThis.foundry.utils.randomID(24);
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
export const clamp = (v, min, max, fallback = min) => Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : fallback;
export const text = (v, max = 2000) => String(v ?? '').slice(0, max);
export function asset(v) {
  const s = text(v, 4096).trim();
  if (/^(?:javascript|data|vbscript|file|blob):/i.test(s) || s.startsWith('//')) return '';
  if (/^[a-z][a-z\d+.-]*:/i.test(s) && !/^https?:/i.test(s)) return '';
  return s;
}
export const escape = v => text(v, 12000).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
export const label = key => key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
export function newScene(background = '') {
  return {id:uid(), name:'Untitled cutscene', background:asset(background), sourceSceneId:'', aspect:'16/9', bgScale:100, bgX:50, bgY:50, duration:650, transition:'fade', letterbox:true, dimInactive:false, actors:[], speaker:'', dialogue:'', introduction:{name:'', subtitle:''}};
}
export function normalizeScene(raw = {}) {
  const base = newScene();
  return {...base, id:text(raw.id || base.id,100), name:text(raw.name || base.name,160), background:asset(raw.background), sourceSceneId:text(raw.sourceSceneId,100), aspect:['16/9','21/9','4/3'].includes(raw.aspect)?raw.aspect:'16/9', bgScale:clamp(raw.bgScale ?? 100,100,300,100), bgX:clamp(raw.bgX ?? 50,0,100,50), bgY:clamp(raw.bgY ?? 50,0,100,50), duration:clamp(raw.duration ?? 650,0,5000,650), transition:['fade','cut'].includes(raw.transition)?raw.transition:'fade', letterbox:raw.letterbox !== false, dimInactive:raw.dimInactive === true,
    actors:(Array.isArray(raw.actors)?raw.actors:[]).slice(0,40).map(p=>({id:text(p.id || uid(),100), actorId:text(p.actorId,100), name:text(p.name,160), src:asset(p.src), expression:text(p.expression || 'neutral',100), variant:Math.floor(clamp(p.variant ?? 0,0,999)), x:clamp(p.x ?? 50,-30,130,50), y:clamp(p.y ?? 100,-30,150,100), height:clamp(p.height ?? 85,5,250,85), z:Math.floor(clamp(p.z ?? 1,0,100)), flip:!!p.flip, speaking:!!p.speaking, visible:p.visible!==false, entrance:['fade','left','right','rise','none'].includes(p.entrance)?p.entrance:'fade'})),
    speaker:text(raw.speaker,100), dialogue:text(raw.dialogue,6000), introduction:{name:text(raw.introduction?.name,160), subtitle:text(raw.introduction?.subtitle,300)}};
}
export function poseLibrary(raw = {}) {
  const result = Object.fromEntries(EXPRESSIONS.map(k=>[k,[]]));
  for (const [key, rows] of Object.entries(raw).slice(0,100)) {
    if (['__proto__','constructor','prototype'].includes(key) || !Array.isArray(rows)) continue;
    result[text(key,100)] = rows.slice(0,100).map(p=>({id:text(p.id || uid(),100),label:text(p.label || 'Pose',160),src:asset(p.src)}));
  }
  return result;
}
export function choosePose(poses, expression, {index = 0, random = false, rng = Math.random} = {}) {
  const rows = poseLibrary(poses)[expression] ?? [];
  const available = rows.map((p,i)=>({...p,index:i})).filter(p=>p.src);
  if (!available.length) return null;
  return random ? available[Math.min(available.length-1, Math.floor(rng()*available.length))] : (available.find(p=>p.index===index) ?? available[0]);
}
export function duplicateScene(scene) {
  const copy = normalizeScene(clone(scene)); copy.id = uid(); copy.name += ' (copy)'; return copy;
}
export function addActor(scene, actor, poses = {}) {
  const pose = choosePose(poses,'neutral');
  const placement = {id:uid(), actorId:actor.id, name:actor.name, src:pose?.src || actor.img || '', expression:'neutral', variant:pose?.index || 0, x:50, y:100, height:85, z:scene.actors.length+1, flip:false, speaking:false, visible:true, entrance:'fade'};
  scene.actors.push(placement); return placement;
}
export function importLibrary(data) {
  if (data?.format!==ID || data.version!==1 || !Array.isArray(data.scenes) || data.scenes.length>500) throw new Error('Choose a Peak Cinema library export (maximum 500 scenes).');
  return data.scenes.map(s=>({...normalizeScene(s),id:uid()}));
}
