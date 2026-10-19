import {memoryBias} from './behavior.js';
import {neighborMemory,rememberNeighborContact} from './neighbor-behavior.js';
import {effectiveHumanTime} from './human-behavior.js';
const option=(id,text,result,next,delta={},days=21)=>({id,text,result,next,delta,days});
const end=text=>({text,terminal:true});
const localDog=(s,id=s.friend.id)=>s.neighborhood?.animals.find(a=>a.id===id&&a.area===s.areaId&&a.alive!==false);
function friendEvidence(s){const a=localDog(s);if(!a||a.interactions.length<2)return null;const recent=a.interactions.at(-1);if(s.day-recent.day>180)return null;const index=s.log.findLastIndex(e=>e.id==='dog-friend'&&e.actorId===a.id&&e.day===recent.day);return index<0?null:{kind:'repeated-dog-contact',record:index,day:recent.day,actor:a.id,result:recent.result};}
function homeEvidence(s){const record=s.log.findLastIndex(e=>['adopt','guardian-changed','foster-start'].includes(e.id)&&e.area===s.areaId&&s.day-e.day<=180);return record<0?null:{kind:'new-caregiver',record,day:s.log[record].day,actor:s.caregiverId};}
function bodyEvidence(s){const c=s.clinical.history.findLast(c=>['patella','joint','fracture'].includes(c.kind)&&c.end<=s.day&&s.day-c.end<=365);if(!c)return null;const record=s.log.findLastIndex(e=>e.id==='clinical-managed'&&e.storyId===c.id&&e.area===s.areaId&&e.day===c.end);return record<0?null:{kind:'managed-mobility',record,day:s.log[record].day,actor:s.caregiverId,clinicalId:c.id,condition:c.kind,treatment:c.treatment,residual:!!c.residual};}
export const CAUSAL_JOURNEYS=[
{id:'friend-history',label:'다시 만난 사이의 거리',min:120,homes:['family','street','shelter'],place:'같은 생활권의 넓은 쉼터',memoryDomain:'canine-social',trigger:friendEvidence,
condition:s=>s.home!=='family'||s.story.care==='normal'&&(!s.story.settleAt||s.day>=s.story.settleAt),actor:s=>localDog(s)?.id,
continues:(s,j)=>!!localDog(s,j.actor)&&(s.home!=='family'||s.story.care==='normal'),retryEnd:'brief',
chance:(s,j,o,base)=>{const a=localDog(s,j.actor);return base+(a.traits.sociability-50)/250+neighborMemory(a,s.lifeId,s.day)/150-a.autonomy.needs.stress/400;},
effect:(s,j,o,steady)=>{const a=localDog(s,j.actor),delta=steady?(o.id==='parallel'||o.id==='quiet'?5:2):-2;a.bond=Math.max(0,Math.min(100,a.bond+delta));rememberNeighborContact(s,a,o.id,steady);if(s.friend.id===a.id){s.friend.met=true;s.friend.meetings++;s.friend.lastMet=s.day;s.friend.bond=a.bond;s.dogBond=a.bond;}a.lastSeen=s.day;a.interactions.push({day:s.day,purpose:'reunion',action:o.id,result:steady?'settled':'distance'});a.interactions=a.interactions.slice(-20);},
nodes:{
start:{text:'몇 번 만난 개와 같은 생활권에서 다시 마주쳤다. 서로의 앞에는 넓은 공간이 있다.',prompt:(s,j)=>j.evidence.result==='distance'?'전에 가까워지다 거리를 벌렸던 개를 같은 생활권에서 다시 만났다. 서로 사이에는 넓은 빈자리가 있다. 상대가 멈추자 나도 발걸음을 늦춘다.':'몇 번 만났던 개가 쉼터 옆을 지나온다. 내가 발걸음을 늦추자 상대도 잠깐 멈춘다. 몸을 옆으로 두고 서로의 움직임을 살핀다.',actions:[{...option('parallel','닿지 않는 거리에서 같은 방향으로 걷는다','몇 걸음 나란히 걷다가 함께 멈췄다. 서로 먼저 움직일 틈을 남긴다.','shared-rest',{stress:-2},30),challenge:true,fallback:'space',alternate:'발걸음이 가까워지자 상대가 옆으로 비켰다. 더 좁히지 않고 각자 넓은 자리를 쓴다.'},option('space','한 번 살핀 뒤 내 쉬는 자리로 간다','상대의 길을 막지 않고 떨어졌다. 같은 생활권에 있어도 오늘은 각자 쉰다.','space',{comfort:1},35)]},
space:{text:'지난번 거리를 벌린 뒤 여러 날이 지났다. 같은 쉼터에 그 개가 먼저 와 있다. 나는 통로의 넓은 쪽에 멈추고, 상대가 움직일 공간을 남긴다.',actions:[{...option('still','시선을 옆으로 두고 움직임을 기다린다','잠시 뒤 상대의 몸이 덜 굳었다. 가까이 붙지 않고 같은 곳에 머물렀다.','shared-rest',{stress:-2},30),challenge:true,fallback:'space',alternate:'상대는 아직 자리를 더 넓게 쓰려 한다. 따라가지 않고 오늘의 만남을 짧게 마친다.'},option('pass','통로를 비워 주고 천천히 지나간다','서로를 오래 붙잡지 않고 각자의 자리로 돌아갔다. 짧은 만남으로 남았다.','brief',{stress:-1},21)]},
'shared-rest':{text:'함께 머문 뒤 다시 여러 날이 흘렀다. 같은 쉼터에서 만난 그 개가 빈자리 옆에 선다. 뛰어들기보다 서로의 보폭과 멈추는 순간을 살핀다.',actions:[option('quiet','닿지 않는 옆자리에서 몸을 낮춘다','각자 누울 공간을 남겨 두고 쉬었다. 상대도 오래 다가오라고 재촉하지 않는다.','familiar',{comfort:2},60),option('pass','잠깐 확인하고 오늘은 먼저 돌아간다','함께 오래 머물지는 않았다. 뒤쫓지 않는 짧은 만남이 이어졌다.','brief',{stress:-1},45)]},
familiar:end('여러 번 함께 머물며 서로 편한 거리를 익혔다. 가까이 붙는 날과 각자 쉬는 날이 모두 그 사이의 기록으로 남았다.'),brief:end('만남은 짧게 이어졌고 서로의 공간을 넓게 남겼다. 오래 놀기보다 서로 지나갈 틈을 남기는 만남이 이어졌다.')
}},
{id:'guardian-anchor',label:'새로운 발소리에 기대는 날들',min:120,homes:['family'],place:'새 보호자와 지내는 집 안',memoryDomain:'caregiver-contact',trigger:homeEvidence,actor:s=>s.caregiverId,continues:(s,j)=>s.caregiverId===j.actor&&s.humans.some(h=>h.id===j.actor&&h.area===s.areaId),
chance:(s,j,o,base)=>{const h=s.humans.find(h=>h.id===j.actor);return base+(effectiveHumanTime(h,s.day)-50)/300+memoryBias(s,j.actor)/150;},
effect:(s,j,o,steady)=>{const h=s.humans.find(h=>h.id===j.actor);h.bond=Math.max(0,Math.min(100,h.bond+(steady?2:0)));},retryEnd:'refuge',nodes:{
start:{text:'새 집에서 지낸 날들이 쌓였다. 방 안의 문이 닫히는 소리에 고개를 들자, 함께 사는 사람이 하던 일을 멈추고 몸을 낮춘다. 잠자리 쪽도 비어 있다.',actions:[{...option('person','사람 가까이 가서 손의 움직임을 살핀다','사람은 몸을 잡지 않고 손을 낮춰 두었다. 잠깐 곁에 선 뒤 스스로 물러났다.','practice',{familyBond:2,stress:-1},30),challenge:true,fallback:'refuge',alternate:'사람 쪽으로 몇 걸음 옮기다 멈췄다. 손이 따라오지 않아 잠자리로 돌아가 쉬었다.'},option('den','담요가 있는 안쪽에서 소리가 잦아들기를 기다린다','안쪽에 몸을 낮췄다. 사람은 잠자리 앞을 막지 않고 방 안에 머문다.','refuge',{comfort:2},30)]},
practice:{text:'그 사람과 지낸 뒤 한 달가량 더 흘렀다. 바깥에서 갑자기 큰 소리가 나자 귀가 움직인다. 사람은 통로에서 비켜 서고, 내 쪽에서 움직이기를 기다린다.',actions:[{...option('near','익숙해진 발치 가까이에 멈춰 선다','잠깐 곁에 머문 뒤 물그릇 쪽으로 움직였다. 소리가 난 뒤에도 내 속도로 자리를 옮겼다.','anchor',{trust:2},60),challenge:true,fallback:'refuge',alternate:'오늘은 발치까지 가지 않았다. 사람이 통로를 비워 두자 안쪽에서 쉬는 쪽을 택했다.'},option('den','먼저 익숙한 잠자리로 몸을 옮긴다','잠자리 안쪽에서 몸을 낮췄다. 사람의 발소리는 멀어지지 않고 방 안에 남았다.','refuge',{comfort:2},45)]},
anchor:end('낯선 소리가 난 뒤 사람 곁에 잠깐 서거나 스스로 쉬는 자리로 돌아가는 날들이 있었다. 새로 만난 사람과 편한 거리를 익힌 과정이 기록에 남았다.'),refuge:end('새집에서 먼저 익숙해진 것은 안쪽 잠자리였다. 그곳을 비워 주는 손길을 겪으며 쉬고 다시 나오는 내 속도를 찾았다.')
}},
{id:'mobility-memory',label:'몸에 맞춰 다시 움직이는 계절',min:365,homes:['family','shelter'],place:'치료 뒤 지내는 낮고 넓은 바닥',memoryDomain:'movement',trigger:bodyEvidence,
condition:s=>s.clinical.mobility>=60,actor:s=>s.caregiverId,continues:(s,j)=>s.caregiverId===j.actor&&s.clinical.mobility>=60,
chance:(s,j,o,base)=>base+(s.clinical.mobility-80)/150,retryEnd:'gentle',nodes:{
start:{text:'다리를 치료한 뒤 짧게 움직이고 쉬는 생활이 이어졌다. 오늘은 낮고 미끄럽지 않은 바닥에 짧은 통로가 비어 있다. 몸을 크게 움직이지 않아도 물그릇에 닿을 수 있다.',actions:[{...option('short','가까운 그릇까지 천천히 갔다 돌아온다','짧게 움직인 뒤 쉬던 곳으로 돌아와 몸을 눕혔다. 더 먼 곳까지 뛰지는 않았다.','season',{comfort:2},90),challenge:true,fallback:'gentle',alternate:'몇 걸음 뒤에 몸을 낮추고 쉬었다. 돌보는 사람은 통로를 더 넓히지 않고 가까운 자리를 유지한다.'},option('rest','오늘은 편한 자세로 쉬는 시간을 더 갖는다','몸을 돌려 눕고 그릇이 있는 쪽을 살핀다. 돌보는 사람은 움직임을 재촉하지 않았다.','gentle',{fatigue:-2},45)]},
season:{text:'짧게 움직이고 쉬던 때에서 몇 달이 지났다. 같은 돌봄 공간에서 낮은 장난감이 앞발 가까이에 놓였다. 다리를 크게 굽히거나 뛰지 않고도 건드릴 수 있다.',actions:[option('nose','코와 앞발로 가까운 장난감을 건드린다','장난감을 조금 밀고 붙잡은 뒤 쉬었다. 크게 뛰는 놀이 대신 짧은 움직임으로 시간을 보냈다.','adapted',{comfort:2},120),option('rest','장난감 옆에서 먼저 몸을 눕힌다','오늘은 움직임보다 쉬는 쪽을 택했다. 익숙한 물과 잠자리 가까이에서 지냈다.','gentle',{fatigue:-2},60)]},
adapted:end('치료 뒤 몇 달에 걸쳐 짧게 움직이고 쉬는 경험이 쌓였다. 가까운 놀이를 마친 뒤에는 낮은 잠자리에서 몸을 눕혔다.'),gentle:end('치료 뒤에는 가까운 곳에서 먹고 마시며 자주 쉬는 날들이 남았다. 몸을 편히 둘 수 있는 자세와 짧은 동선이 생활에 남았다.')
}}
];
