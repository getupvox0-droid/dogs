import{choose,advance,random}from './engine.js';
import{automaticAction,decisionUid}from './decisions.js';
import{initLifeState}from './life-state.js';
export function resolveChoice(s,id,uid=null){const accepted=choose(s,id,uid);return {accepted,running:accepted&&s.alive&&!s.pending};}
export function playbackTick(s,running,days){initLifeState(s);if(!running||!s.alive)return false;if(s.mode==='observe'){for(let n=0;n<days&&s.alive;n++){if(s.pending){const id=automaticAction(s,random);choose(s,id,decisionUid(s));}advance(s,1);}return s.alive}if(s.pending)return false;advance(s,days);return s.alive&&!s.pending;}
