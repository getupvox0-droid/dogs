// Correlated world scores and change schedules are authored game assumptions.
// They are not country statistics, clinical rates or demographic predictions.
export const REGION_LABELS = {urban:'도심',suburb:'교외',rural:'농촌',mountain:'산간',coast:'해안'};
const REGIONS = {
  urban:{density:88,traffic:82,nature:18,animals:68,medical:86,water:72},
  suburb:{density:49,traffic:48,nature:61,animals:49,medical:68,water:78},
  rural:{density:21,traffic:24,nature:86,animals:42,medical:38,water:57},
  mountain:{density:10,traffic:13,nature:94,animals:25,medical:19,water:48},
  coast:{density:42,traffic:42,nature:74,animals:47,medical:53,water:63}
};
const clamp = n => Math.max(0,Math.min(100,Math.round(n)));
const scoreKeys = ['density','traffic','nature','animals','medical','water'];
const societyKeys = ['economy','careTime','support','crowding','rescue'];
function regionFor(s,hash){
  const c=s.worldModel.context,id=c.id;
  if(/coast|harbor/.test(id))return 'coast';
  if(/hill/.test(id))return 'mountain';
  if(/farm|field|orchard|rural/.test(id))return 'rural';
  if(/city-flat|shop-home|shared-home|market-edge|warehouse-edge|urban/.test(id))return 'urban';
  if(c.space==='garden')return 'suburb';
  if(c.space==='rural')return 'rural';
  return ['urban','suburb','rural'][hash(`${s.lifeId}:${s.areaId}`,4401)%3];
}
function locality(s,hash){
  const key=`${s.lifeId}:${s.seed}:${s.areaId}`,region=regionFor(s,hash),base=REGIONS[region];
  // One shared settlement-size factor correlates traffic, services and density.
  const size=hash(key,4402)%21-10;
  const geography={country:s.country.id,region,climate:s.country.climate};
  for(const k of scoreKeys)geography[k]=clamp(base[k]+(k==='nature'?-size:size)+(hash(key,4403+scoreKeys.indexOf(k))%11-5));
  const care=s.worldModel.care,resource=s.worldModel.resource;
  const society={economy:clamp(resource*.7+geography.medical*.3),careTime:clamp(care*.75+(100-geography.density)*.25),support:care,crowding:clamp(geography.animals*.6+(s.home==='shelter'?30:0)),rescue:clamp(care*.5+geography.medical*.5)};
  return {geography,society};
}
export function initWorldProfile(s,hash,newborn=false){
  const w=s.worldModel;
  if(w.profile)return w.profile;
  const {geography,society}=locality(s,hash);
  const p=w.profile={version:1,provenance:'authored-v4-world',initializedDay:s.day,area:s.areaId,geography,society,birth:null,sequence:0,changes:[],lastStep:s.day,nextChange:Math.max(s.day+30,w.calendar.household)};
  if(newborn){
    w.resource=clamp(w.resource*.8+society.economy*.2);
    w.care=clamp(w.care*.8+society.careTime*.2);
    w.origin.food=w.context.food=w.resource;
    w.origin.support=w.context.support=w.care;
    p.birth={day:0,area:s.areaId,geography:{...geography},society:{...society},setting:w.origin.id};
  }
  return p;
}
export function syncWorldProfile(s,hash){
  const p=initWorldProfile(s,hash);
  if(p.area===s.areaId)return p;
  const previous=p.area;
  Object.assign(p,locality(s,hash),{area:s.areaId,nextChange:s.day+120+hash(`${s.seed}:${s.areaId}`,4410)%181});
  p.changes.push({day:s.day,kind:'relocation',from:previous,area:s.areaId,cause:s.lastAreaChange?.reason||'area-change'});
  p.changes=p.changes.slice(-64);
  return p;
}
export function worldAccess(s,access){
  const p=s.worldModel?.profile;
  if(!p)return access;
  // Geography affects existing care/access calculations; it never grants a vet
  // or a guardian to a street dog and never overrides the home/clinic gates.
  return {...access,water:clamp(access.water*(.8+p.geography.water/500)),medical:clamp(access.medical*(.65+p.geography.medical/250))};
}
export function connectWorldHuman(s,h){
  const p=s.worldModel?.profile;
  if(!p||h.id!==s.caregiverId||h.worldProfileArea===s.areaId)return;
  // Preserve all pre-v4 human scores during migration and at later adoption.
  if(p.birth&&s.day===0&&h.worldProfileArea==null){
    h.time=clamp(h.time*.65+p.society.careTime*.35);
    h.money=clamp(h.money*.65+p.society.economy*.35);
  }
  h.worldProfileArea=s.areaId;
}
export function applyWorldChange(s,kind,{hash,log}){
  const p=syncWorldProfile(s,hash),w=s.worldModel;
  const h=s.humans?.find(h=>h.id===s.caregiverId&&h.area===s.areaId);
  const sign=hash(`${s.seed}:${s.areaId}:${p.sequence}`,4421)%2?1:-1;
  const amount=8+hash(`${s.seed}:${s.areaId}:${p.sequence}`,4422)%13;
  let text,delta={},actor=null;
  if(kind==='work-schedule'&&s.home==='family'&&h){
    actor=h.id;const before=h.time;h.time=clamp(h.time+sign*amount);delta={humanTime:h.time-before};
    p.society.careTime=h.time;w.care=clamp(w.care+sign*amount*.35);
    h.schedule=sign<0?'돌봄 시간이 줄어든 일정':'돌봄을 나눌 시간이 생긴 일정';
    text=sign<0?'현관문이 닫힌 뒤 조용한 시간이 길어졌다. 함께 사는 사람의 일하는 시간이 바뀌어 낮의 놀이가 짧아졌다.':'익숙한 발소리가 전보다 일찍 돌아온다. 함께 사는 사람의 일정이 바뀌어 낮에도 짧게 놀고 쉴 시간이 생겼다.';
  }else if(kind==='household-economy'&&s.home==='family'&&h){
    actor=h.id;const before=h.money;h.money=clamp(h.money+sign*amount);delta={humanMoney:h.money-before};
    p.society.economy=h.money;w.resource=clamp(w.resource+sign*amount*.25);
    text=sign<0?'사람이 돌봄 물건을 정리하고 남은 먹이를 나눠 챙긴다. 오늘도 먹이와 물은 놓였지만 새 물건이 들어오는 일은 줄었다.':'먹이와 돌봄 물건이 제자리에 채워졌다. 사람은 필요한 물건을 챙겨 둔 뒤 내 잠자리 가까이 앉는다.';
  }else if(kind==='shelter-crowding'&&s.home==='shelter'){
    const before=p.society.crowding;p.society.crowding=clamp(before+sign*amount);delta={crowding:p.society.crowding-before};
    w.care=clamp(w.care-sign*amount*.3);p.society.support=w.care;
    text=sign>0?'복도 건너 빈 칸에 다른 개가 들어왔다. 직원이 돌볼 자리를 나누면서 내 앞에서 머무는 시간이 조금 짧아졌다.':'복도 건너 몇 칸이 비었다. 직원이 청소와 급여를 마친 뒤 내 앞에 조금 더 오래 머문다.';
  }else if(kind==='water-access'&&s.home==='street'){
    const before=p.geography.water;p.geography.water=clamp(before+sign*amount);delta={waterAccess:p.geography.water-before};
    text=sign>0?'그늘진 벽 아래에 물그릇이 놓였다. 머물던 자리에서 큰길을 건너지 않고 물에 닿을 수 있게 됐다.':'머물던 벽 아래 물그릇이 치워졌다. 예전에 마시던 자리에는 마른 바닥만 남아 있다.';
  }else if(kind==='route-change'&&s.home==='street'){
    const before=w.resource;w.resource=clamp(w.resource+sign*amount);delta={foodResource:w.resource-before};
    p.geography.traffic=clamp(p.geography.traffic-sign*5);
    text=sign<0?'가림막이 익숙한 통로를 막았다. 먹이를 찾던 자리까지 곧장 갈 수 없어 같은 쪽의 다른 골목을 살핀다.':'막혀 있던 골목의 가림막이 걷혔다. 큰길을 건너지 않고 전에 다니던 쉼터 쪽으로 걸을 수 있다.';
  }else return false;
  const record={day:s.day,area:s.areaId,kind,actor,delta};
  p.sequence++;p.changes.push(record);p.changes=p.changes.slice(-64);
  if(h&&actor)h.decisions.push({day:s.day,kind,delta});
  log(s,'world-change',text);
  Object.assign(s.log.at(-1),{worldChange:kind,actorId:actor,cause:'world-state-change',worldDelta:{...delta},placeLabel:w.context.label});
  return true;
}
export function worldProfileStep(s,{hash,log}){
  const p=syncWorldProfile(s,hash);
  if(!s.alive||p.lastStep>=s.day)return;
  p.lastStep=s.day;
  if(s.day<p.nextChange||s.story.lost)return;
  p.nextChange=s.day+150+hash(`${s.seed}:${s.areaId}:${p.sequence}`,4420)%241;
  const kinds=s.home==='family'?['work-schedule','household-economy']:s.home==='shelter'?['shelter-crowding']:['water-access','route-change'];
  applyWorldChange(s,kinds[hash(`${s.seed}:${s.areaId}:${p.sequence}`,4423)%kinds.length],{hash,log});
}
export function validateWorldProfile(s){
  const p=s.worldModel?.profile;if(p==null)return;
  const scores=(object,keys)=>object&&keys.every(k=>Number.isFinite(object[k])&&object[k]>=0&&object[k]<=100);
  const geo=g=>scores(g,scoreKeys)&&Object.hasOwn(REGIONS,g.region)&&g.country===s.country.id&&['hot','cold','temperate'].includes(g.climate);
  const day=n=>Number.isInteger(n)&&n>=0;
  if(p.version!==1||p.provenance!=='authored-v4-world'||typeof p.area!=='string'||!geo(p.geography)||!scores(p.society,societyKeys)||!day(p.initializedDay)||p.initializedDay>s.day||!day(p.lastStep)||p.lastStep>s.day||!day(p.nextChange)||!day(p.sequence)||!Array.isArray(p.changes)||p.changes.length>64||!p.changes.every(e=>day(e.day)&&e.day<=s.day&&typeof e.kind==='string'&&typeof e.area==='string')||p.birth!==null&&(!p.birth||p.birth.day!==0||typeof p.birth.area!=='string'||!geo(p.birth.geography)||!scores(p.birth.society,societyKeys)))throw Error('손상된 세계 프로필');
}
