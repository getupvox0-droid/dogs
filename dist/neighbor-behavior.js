import {mix} from './world.js';
// Bounded game scores, not measured animal physiology or clinical rates.
const clamp=n=>Math.max(0,Math.min(100,n));
export const NEIGHBOR_GOALS={food:'먹이 찾기',water:'물 찾기',rest:'쉬기',social:'사회적 접촉',explore:'주변 탐색',avoid:'거리 확보'};
export function initNeighborBehavior(s,a){
  if(a.autonomy)return a.autonomy;
  const code=mix(a.id,1801),family=a.id===s.friend?.id&&s.home==='family';
  const home=family?'family':s.home==='shelter'?'shelter':'street';
  a.autonomy={version:1,lastDay:s.day,home,territory:a.area,
    access:{food:home==='family'?75:home==='shelter'?65:35+code%35,water:home==='family'?85:home==='shelter'?75:30+mix(code,2)%40},
    needs:{hunger:15+code%20,thirst:12+mix(code,3)%20,fatigue:15+mix(code,4)%25,stress:a.traits.caution*.3},
    goal:'rest',activity:.4,history:[],relations:[],memories:[]};
  return a.autonomy;
}
export function neighborMemory(a,target,day){return clamp(50+(a.autonomy?.memories||[]).filter(m=>m.target===target).reduce((v,m)=>v+m.valence*m.intensity*Math.exp(-Math.max(0,day-m.day)/240),0))-50;}
export function neighborMotives(a,day){const b=a.autonomy,n=b.needs,t=a.traits;return {
  food:n.hunger,water:n.thirst,rest:clamp(n.fatigue+(a.condition!=='well'?35:0)+(day-a.birthDay>2920?10:0)),
  avoid:clamp(n.stress*.65+t.caution*.35),
  social:clamp(t.sociability*.7-n.stress*.3-n.fatigue*.15),
  explore:clamp(t.curiosity*.45+t.energy*.3+t.independence*.2-n.fatigue*.35)
};}
export function neighborBehaviorStep(s,a){
  const b=initNeighborBehavior(s,a);if(a.alive===false||s.day<=b.lastDay)return b;
  // Near actors update daily. Distant actors retain their own resources and catch up
  // in bounded daily chunks; no events or protagonist resources are invented remotely.
  if(a.area!==s.areaId&&s.day-b.lastDay<7)return b;
  const end=Math.min(s.day,b.lastDay+366);
  for(let day=b.lastDay+1;day<=end;day++){
    const n=b.needs,t=a.traits,local=a.area===s.areaId;
    const heat=local&&s.world==='heat',young=day-a.birthDay<55;
    n.hunger=clamp(n.hunger+(young?12:16)+b.activity*3);
    n.thirst=clamp(n.thirst+(heat?24:15)+b.activity*2);
    // Meals and water are actual probabilistic intake; inaccessible food is not supplied.
    const food=b.access.food,water=b.access.water;
    const fed=mix(a.id,day*7+1)%100<food;
    const drank=mix(a.id,day*7+2)%100<water;
    if(fed)n.hunger=clamp(n.hunger*.38);
    if(drank)n.thirst=clamp(n.thirst*.3);
    n.fatigue=clamp(n.fatigue+b.activity*9-(b.goal==='rest'?22:5));
    n.stress=clamp(n.stress+(n.hunger>80||n.thirst>80?3:-1)-(b.goal==='rest'?1:0));
    b.intake={day,food:fed,water:drank,feeding:young?'젖·보조 돌봄':'생활권 먹이'};
    const motives=neighborMotives(a,day);
    b.goal=young?'rest':Object.entries(motives).sort((x,y)=>y[1]-x[1])[0][0];
    b.activity=young?.1:b.goal==='rest'||a.condition!=='well'?.2:Math.min(1.2,.25+t.energy/100);
    if(day%30===0){b.history.push({day,goal:b.goal,area:a.area});b.history=b.history.slice(-12)}
    b.lastDay=day;
  }
  return b;
}
export function rememberNeighborContact(s,a,action,positive){
  const b=initNeighborBehavior(s,a),target=s.lifeId;
  let r=b.relations.find(r=>r.target===target);
  if(!r){r={target,trust:25,caution:a.traits.caution,conflict:0,contacts:0,lastDay:null};b.relations.push(r)}
  r.contacts++;r.lastDay=s.day;r.trust=clamp(r.trust+(positive?4:-3));r.caution=clamp(r.caution+(positive?-3:4));
  if(!positive&&['greet','parallel'].includes(action))r.conflict=clamp(r.conflict+1);
  b.memories.push({day:s.day,target,action,valence:positive?1:-1,intensity:6});b.memories=b.memories.slice(-20);
  b.needs.stress=clamp(b.needs.stress+(positive?-4:5));
}
export function neighborPurposeWeight(s,a,p,base){
  const b=initNeighborBehavior(s,a),n=b.needs;
  const history=neighborMemory(a,s.lifeId,s.day);
  const factors={food:.5+n.hunger/45,rest:.5+n.fatigue/45+(a.condition!=='well'?2:0),
    cautious:.5+n.stress/45+Math.max(0,-history)/20,
    territory:.5+n.stress/70+Math.max(0,-history)/35,
    play:Math.max(.1,1.5-n.fatigue/80-n.thirst/140-n.hunger/160+history/90),
    reunion:Math.max(.2,1+history/45),curious:.6+a.traits.curiosity/100};
  return Math.max(.05,base*(factors[p]??1));
}
export function validateNeighborBehavior(a,day){
  const b=a.autonomy;if(!b)return;
  const score=n=>Number.isFinite(n)&&n>=0&&n<=100;
  if(b.version!==1||!Number.isInteger(b.lastDay)||b.lastDay<0||b.lastDay>day||!['family','shelter','street'].includes(b.home)||typeof b.territory!=='string'||!b.access||!['food','water'].every(k=>score(b.access[k]))||!b.needs||!['hunger','thirst','fatigue','stress'].every(k=>score(b.needs[k]))||!Object.hasOwn(NEIGHBOR_GOALS,b.goal)||!Number.isFinite(b.activity)||b.activity<0||b.activity>2||!Array.isArray(b.history)||b.history.length>12||!b.history.every(h=>Number.isInteger(h.day)&&h.day<=day&&typeof h.area==='string'&&Object.hasOwn(NEIGHBOR_GOALS,h.goal))||!Array.isArray(b.relations)||b.relations.length>8||!b.relations.every(r=>typeof r.target==='string'&&['trust','caution','conflict'].every(k=>score(r[k]))&&Number.isInteger(r.contacts)&&r.contacts>=0)||!Array.isArray(b.memories)||b.memories.length>20||!b.memories.every(m=>Number.isInteger(m.day)&&m.day>=0&&m.day<=day&&typeof m.target==='string'&&typeof m.action==='string'&&[-1,1].includes(m.valence)&&score(m.intensity)))throw Error('손상된 주변 동물 행동 기록');
}
