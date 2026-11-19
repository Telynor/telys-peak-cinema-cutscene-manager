import {ID,clone,normalizeScene} from './model.mjs';
export const LIVE_FIELDS = ['src','expression','variant','speaking','flip'];
export class CinemaStore {
  constructor(settings,user){this.settings=settings;this.user=user;this.queue=Promise.resolve();}
  get(key){return clone(this.settings.get(ID,key));}
  write(job){const next=this.queue.then(()=>{if(!this.user.isGM)throw new Error('Only a GM can direct cutscenes.');return job();});this.queue=next.catch(()=>{});return next;}
  publish(scene,hostSceneId){return this.write(async()=>{if(!hostSceneId)throw new Error('Open an active Foundry scene first.');const previous=this.get('live');return this.settings.set(ID,'live',{active:true,hostSceneId,scene:normalizeScene(scene),revision:(previous.revision||0)+1,by:this.user.id});});}
  stop(){return this.write(async()=>{const live=this.get('live');return this.settings.set(ID,'live',{...live,active:false,revision:(live.revision||0)+1,by:this.user.id});});}
  patchActor(sceneId,placementId,changes){return this.write(async()=>{const live=this.get('live');if(!live.active||live.scene?.id!==sceneId)return false;const p=live.scene.actors.find(p=>p.id===placementId);if(!p)return false;for(const key of LIVE_FIELDS)if(Object.hasOwn(changes,key))p[key]=changes[key];live.scene=normalizeScene(live.scene);live.revision=(live.revision||0)+1;live.by=this.user.id;await this.settings.set(ID,'live',live);return true;});}
  patchSpeaking(sceneId,enabled){return this.write(async()=>{const live=this.get('live');if(!live.active||live.scene?.id!==sceneId)return false;live.scene.dimInactive=!!enabled;live.revision=(live.revision||0)+1;live.by=this.user.id;await this.settings.set(ID,'live',live);return true;});}
  savePreset(scene){return this.write(async()=>{const rows=this.get('library');const clean=normalizeScene(scene),i=rows.findIndex(s=>s.id===clean.id);if(i<0)rows.push(clean);else rows[i]=clean;await this.settings.set(ID,'library',rows);return clean;});}
  deletePreset(id){return this.write(()=>this.settings.set(ID,'library',this.get('library').filter(s=>s.id!==id)));}
  importPresets(rows){return this.write(()=>this.settings.set(ID,'library',[...this.get('library'),...rows]));}
}
