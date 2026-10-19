import {createLife,choose,random,serialize} from '../dist/engine.js';
import {automaticAction,decisionUid} from '../dist/decisions.js';
import {nextStoryBeat,beatDelay,timelineEntries} from '../dist/story-runner.js';
import {readingMs} from '../dist/time-config.js';
const samples=Number(process.argv[2]||12),rows=[];
for(const mode of ['story','observe'])for(let seed=1;seed<=samples;seed++){
 const s=createLife(seed);s.chronicle.preferences.progressMode=mode;s.mode='intervene';let beats=0,questions=0,ms1=0,ms16=0,empty=0;
 while(s.alive&&s.day<12000){if(s.pending){choose(s,automaticAction(s,random),decisionUid(s));questions++;const wait=readingMs(s.presentation?.text||'');ms1+=wait;ms16+=wait;s.presentation=null;continue}const b=nextStoryBeat(s);beats++;empty+=Number(!b.events.length);ms1+=beatDelay(b,1);ms16+=beatDelay(b,16)}
 rows.push({mode,seed,days:s.day,alive:s.alive,beats,questions,empty,seconds1:Math.round(ms1/1000),seconds16:Math.round(ms16/1000),records:s.log.length,visible:timelineEntries(s).length,bytes:serialize(s).length});
}
console.log(JSON.stringify({samplesPerMode:samples,method:'Deterministic seeds, weighted player actions; scheduled beat/result reading waits only, excludes user choice time, rendering and computation. Observation output density with intervention choices held identical for comparison.',rows},null,2));
