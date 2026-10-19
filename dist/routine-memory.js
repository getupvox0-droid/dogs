import {normalizeRoutineSemantic} from './routine-taxonomy.js';
import {semanticKey,decisionSemantics} from './event-semantics.js';
import {mix} from './world.js';
import {behaviorWeight,motives,learnAction} from './behavior.js';
import {recordExperience} from './life-state.js';
export const routineDecision=id=>id==='dog-meet'||id.startsWith('situation:');
export function initRoutineMemory(s){return s.routineMemory??={version:1,entries:[],applied:[]};}
export function routineContext(s,meta){
 const a=s.neighborhood?.animals.find(a=>a.id===meta.actor);
 const humanBound=['familiar-cue','visitor-contact','wet-body-care','neighbor-separation'].includes(meta.cause);
 const placeBound=['wet-route','moving-barrier','cleaning-route','closed-food-source','visible-movement'].includes(meta.cause);
 // A learned basic skill survives a new room. Actual counterpart and route knowledge do not transfer blindly.
 const identity=meta.role==='dog'?['dog',s.areaId,meta.actor,a?.condition||'well']:humanBound?['person',s.home,s.areaId,meta.actor]:placeBound?['place',s.home,s.areaId]:['skill',s.home];
 const resource=meta.goal==='food'?s.needs.hunger>75:meta.goal==='water'?s.needs.thirst>75:false;
 return [...identity,resource?'urgent':'usual'].join('|');
}
export function routineMeta(s,p){const m=normalizeRoutineSemantic(p.semantic||decisionSemantics(s,p.id,p.options),p.id);return {...m,actor:p.context?.actor||m.actor,area:s.areaId};}
function matching(s,meta){return initRoutineMemory(s).entries.find(e=>e.key===semanticKey(meta)&&e.context===routineContext(s,meta));}
export function familiarRoutine(s,p){
 if(!routineDecision(p.id)||!s.alive||s.day<90||s.story.lost||s.medical.episode||s.clinical.active||s.clinical.mobility<55)return false;
 const meta=routineMeta(s,p),state=initRoutineMemory(s);if(matching(s,meta))return true;
 // Recognition of a learned skill transfers; the selected action/habit remains context-specific.
 if(p.id.startsWith('situation:'))return (s.opportunities?.counts?.[p.id.slice(10)]||0)>0||state.entries.some(e=>e.key===semanticKey(meta));
 const a=s.neighborhood?.animals.find(a=>a.id===meta.actor&&a.area===s.areaId&&a.alive!==false);
 if(!a)return false;if(a.asked?.[meta.socialPurpose]!=null)return true;
 if(a.interactions.length>=2&&['rest','curious','reunion'].includes(meta.socialPurpose))return true;
 return meta.goal==='contact'&&state.entries.some(e=>e.context===routineContext(s,meta)&&e.key.split('|')[1]==='contact');
}
export function learnRoutine(s,p,id,positive,contextOverride=null){if(!routineDecision(p.id))return;const m=routineMeta(s,p),state=initRoutineMemory(s),key=semanticKey(m),context=contextOverride??routineContext(s,m);let e=state.entries.find(e=>e.key===key&&e.context===context);if(!e){e={key,context,day:s.day,action:id,exposures:0,successes:0};state.entries.push(e)}e.successes=positive?(e.action===id?e.successes:0)+1:0;e.action=id;e.day=s.day;e.exposures++;if(state.entries.length>128)state.entries.splice(state.entries.reduce((best,e,i,a)=>e.day<a[best].day?i:best,0),1);}
export function chooseRoutineAction(s,p){
 if(!routineDecision(p.id))return null;
 const meta=routineMeta(s,p),e=matching(s,meta),options=p.options,urgent=Math.max(s.needs.hunger,s.needs.thirst,s.needs.fatigue)>85;
 if(e?.successes>=2&&!urgent&&s.stress<65&&options.some(o=>o.id===e.action))return e.action;
 const view={...s,pending:p},m=motives(s),weights=options.map(o=>Math.max(.1,behaviorWeight(view,o)+(o.goal?(m[o.goal]??s.worldModel.traits.energy)/80:0)));
 let roll=mix(`${s.seed}:${s.day}:${meta.actor}:${meta.cause}`,2101)/4294967296*weights.reduce((a,b)=>a+b,0);
 for(let i=0;i<options.length;i++){roll-=weights[i];if(roll<=0)return options[i].id}return options.at(-1).id;
}
export function autonomousRoutine(s,p,action,resolve){
 if(!routineDecision(p.id)||!s.alive||s.day<90||s.story.lost||s.medical.episode||s.clinical.active||s.clinical.mobility<55)return false;
 const state=initRoutineMemory(s),meta=routineMeta(s,p),uid=p.uid||`routine:${s.lifeId}:${s.day}:${p.id}:${meta.actor}:${meta.cause}`;
 if(s.pending||state.applied.includes(uid)||!p.options.some(o=>o.id===action))return false;
 const before={routineContext:routineContext(s,meta),logLength:s.log.length,...Object.fromEntries(['health','comfort','trust','stress','familyBond','dogBond'].map(k=>[k,s[k]])),...s.needs},hadPresentation=Object.hasOwn(s,'presentation'),presentation=s.presentation;
 if(!resolve(action))return false;learnAction(s,p,action);
 const resolved={...p,uid,semantic:meta};recordExperience(s,resolved,action,before);const episode=s.episodes.at(-1);episode.automatic=true;
 learnRoutine(s,resolved,action,episode.valence>=0,before.routineContext);for(const e of s.log.slice(before.logLength))Object.assign(e,{automatic:true,routineType:p.id,semantic:meta});
 if(hadPresentation)s.presentation=presentation;else delete s.presentation;state.applied.push(uid);state.applied=state.applied.slice(-64);return true;
}
export function validateRoutineMemory(s){const t=s.routineMemory;if(!t)return;const day=d=>Number.isInteger(d)&&d>=0&&d<=s.day;
 if(t.version!==1||!Array.isArray(t.entries)||t.entries.length>128||!t.entries.every(e=>typeof e.key==='string'&&typeof e.context==='string'&&typeof e.action==='string'&&day(e.day)&&Number.isInteger(e.exposures)&&e.exposures>0&&Number.isInteger(e.successes)&&e.successes>=0&&e.successes<=e.exposures)||!Array.isArray(t.applied)||t.applied.length>64||!t.applied.every(id=>typeof id==='string')||new Set(t.applied).size!==t.applied.length)throw Error('손상된 익숙한 행동 기록');
}
