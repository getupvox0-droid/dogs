import{existsSync,writeFileSync}from 'node:fs';
import{resolve}from 'node:path';
import{pathToFileURL}from 'node:url';
import{semanticKey,semanticMetrics,decisionSemantics}from '../dist/event-semantics.js';
const count=Number(process.env.DOGS_SAMPLE||1000),dir=resolve(process.env.DOGS_ENGINE_DIR||new URL('../dist',import.meta.url).pathname);
if(!Number.isInteger(count)||count<1||count>100000)throw Error('Invalid sample size');
const{createLife,advance,choose}=await import(pathToFileURL(resolve(dir,'engine.js')));
const{automaticAction}=await import(pathToFileURL(resolve(dir,'decisions.js')));
const validator=existsSync(resolve(dir,'situations.js'))?await import(pathToFileURL(resolve(dir,'situations.js'))):null;
const types=new Set(),structures=new Set(),causes=new Set();let questions=0,repeated=0,structureRepeats=0,explicit=0,actorTotal=0,changed=0,choices=0,followups=0,routines=0,invalid=0,wordRepeats=0;const start=performance.now();
function fingerprint(s){return JSON.stringify([s.health,s.comfort,s.trust,s.stress,s.familyBond,s.dogBond,s.needs,s.worldModel.traits,s.reproduction,s.clinical.mobility]);}
for(let seed=0;seed<count;seed++){
 const s=createLife(seed);let guard=0;
 while(s.alive&&guard++<20000){
  if(s.pending){const p=s.pending;if(p.id.startsWith('composed:')&&!p.options.every(o=>validator?.canResolveSituation(s,p,o.id)))invalid++;
   const row=s.log.findLast(e=>e.id==='decision'&&e.day===s.day);if(row&&!row.semantic)row.semantic=decisionSemantics(s,p.id,p.options);
   const option=seed%3===0?p.options[0].id:seed%3===1?p.options.at(-1).id:automaticAction(s,()=>.45),before=fingerprint(s);
   if(!choose(s,option))throw Error('Unresolved choice '+seed+':'+p.id);choices++;if(before!==fingerprint(s))changed++;
  }else advance(s,30);
 }
 if(s.alive)throw Error('Lifetime guard exceeded');
 const metrics=semanticMetrics(s.log);questions+=metrics.taggedDecisions;explicit+=metrics.explicitDecisions;repeated+=metrics.semanticWindowRepeats;structureRepeats+=Math.round(metrics.structureWindowRepeatRatio*metrics.taggedDecisions);actorTotal+=metrics.actors;
 const wording=new Set();for(const e of s.log){if(e.id==='decision'&&e.semantic){const key=semanticKey(e.semantic);types.add(key);structures.add(JSON.stringify(e.semantic.actionTypes||e.semantic.actions));causes.add(e.semantic.cause);if(wording.has(e.text))wordRepeats++;wording.add(e.text);}if(e.id==='composed-followup')followups++;if(e.id==='composed-routine')routines++;}
 if((seed+1)%100===0)console.log('Completed',seed+1,'/',count);
}
const report={sample:count,policies:['first','last','weighted deterministic'],questions,explicitDecisions:explicit,semanticTypes:types.size,causes:causes.size,rawActionSequences:structures.size,semanticWindowRepeats:repeated,semanticWindowRepeatRatio:repeated/questions,choiceStructureWindowRepeatRatio:structureRepeats/questions,meanActorsPerLife:actorTotal/count,exactTextRepeatRatio:wordRepeats/questions,choicesWithImmediateStateChange:changed,choices,immediateStateChangeRatio:changed/choices,completedComposedFollowups:followups,automaticComposedRoutines:routines,invalidComposedChoices:invalid,seconds:(performance.now()-start)/1000,definition:'Authored cause/goal/conflict/role/canonical action set repeated among previous 5 questions within 180 days. Legacy classifications are ID-based except medical/social context, not a complete semantic review. Actor IDs excluded from semantic type counts. Game assumptions; not clinical validation.'};
if(process.env.DOGS_SEMANTIC_REPORT)writeFileSync(process.env.DOGS_SEMANTIC_REPORT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
if(invalid)process.exitCode=1;
