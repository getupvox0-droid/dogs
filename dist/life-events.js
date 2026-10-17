import{canAct}from './species.js';
import{EXPERIENCE_EVENTS}from './experience-events.js';
import{initWorld,environmentAllows,weightedEvent}from './world.js';
// Authored narrative rules and timing: game design assumptions, not clinical advice.
const option=(id,text,result,effects={},memory=null,after=null)=>({id,text,result,effects,memory,after});
const family=s=>s.home==='family'&&!s.story.lost;
const outside=s=>s.home!=='shelter'&&!s.story.lost;
const young=s=>s.day>=70&&s.day<730;
const older=s=>s.day>=2920;
export const LIFE_EVENTS=[
{id:'chewing',cat:'growth',min:80,max:220,ok:family,text:'입 안이 근질거린다. 의자 다리 옆에 말랑한 씹기 장난감도 놓여 있다.',options:[option('toy','장난감을 붙잡고 씹는다','앞발로 장난감을 고정해 한참 씹는다. 입 안의 답답함이 조금 가신다.',{comfort:5},'chew-toy',{days:12,text:'입이 근질거릴 때면 그 장난감을 찾게 됐다. 사람이 닳은 장난감을 새것으로 바꿔 준다.'}),option('chair','의자 다리를 물어 본다','딱딱한 나무를 물자 사람이 부드럽게 다른 장난감을 내민다. 이번에는 그쪽을 씹어 본다.',{stress:2},'redirect-chewing')]},
{id:'toilet',cat:'learning',min:65,max:250,ok:family,text:'잠에서 깨자 배 아래가 묵직하다. 전에 배변했던 자리가 방 한쪽에 있다.',options:[option('spot','그 자리로 서둘러 간다','자리를 찾아 볼일을 본다. 사람이 조용히 칭찬하고 작은 보상을 준다.',{familyBond:4},'toilet-routine',{days:8,text:'다음에도 잠에서 깨자 같은 자리로 갔다. 익숙한 순서가 조금씩 몸에 밴다.'}),option('here','가까운 곳에서 몸을 낮춘다','바닥이 젖었다. 사람은 나를 다른 자리로 옮기고 조용히 바닥을 닦는다.',{},'learning-toilet')]},
{id:'recall',cat:'learning',min:100,ok:family,text:'긴 산책줄이 이어진 풀밭이다. 사람이 뒤에서 나를 부르며 보상을 든 손을 보여 준다.',options:[option('return','몸을 돌려 사람에게 달려간다','줄이 느슨해진 채 사람 앞에 도착한다. 작은 간식과 쓰다듬는 손이 기다린다.',{familyBond:5},'recall',{days:30,text:'산책 중 나를 부르는 소리에 귀가 움직였다. 뒤돌아보니 그 손이 기다리고 있다.'}),option('finish','풀밭을 조금 더 살핀다','잠시 뒤 사람이 거리를 좁혀 다시 부른다. 가까운 곳에서 돌아가는 연습을 해 본다.',{comfort:2},'slow-recall')]},
{id:'tug',cat:'play',min:100,max:2920,ok:family,text:'사람이 천 장난감 끝을 내민다. 반대편을 잡아도 놓지 않고 기다린다.',options:[option('pull','앞다리에 힘을 주고 당긴다','번갈아 당기고 놓으며 논다. 잠시 멈추자 사람이 다시 놀이를 청한다.',{comfort:6,familyBond:3},'tug'),option('carry','물고 내 자리로 가져간다','장난감을 물고 내 자리로 간다. 사람은 쫓아오지 않고 다른 장난감을 굴려 준다.',{comfort:4},'collect-toys')]},
{id:'fetch',cat:'play',min:120,max:2920,ok:family,text:'울타리 안 풀밭에서 공이 굴러간다. 사람은 무릎을 굽히고 나를 보고 있다.',options:[option('bring','공을 물고 돌아간다','공을 가져가자 다시 짧게 굴려 준다. 달리고 돌아오는 놀이에 신이 난다.',{comfort:6},'fetch'),option('keep','공을 앞발 사이에 두고 논다','내 앞에서 공을 굴리고 붙잡는다. 사람도 옆에 앉아 함께 시간을 보낸다.',{comfort:4},'solo-play')]},
{id:'puzzle',cat:'learning',min:150,ok:family,text:'작은 구멍이 있는 먹이 장난감 안에서 간식이 달그락거린다.',options:[option('roll','코와 앞발로 굴려 본다','한 번 굴리자 작은 조각이 나왔다. 방향을 바꾸어 다시 밀어 본다.',{comfort:5},'puzzle',{days:20,text:'이번에는 먹이 장난감을 보자 먼저 굴렸다. 지난번보다 덜 헤맨다.'}),option('ask','사람을 보고 장난감을 번갈아 본다','사람이 쉽게 꺼낼 수 있게 구멍을 조절한다. 다시 시도하니 조각이 떨어진다.',{familyBond:3},'ask-help')]},
{id:'bowl',cat:'food',min:75,ok:s=>!s.story.lost,text:'밥그릇에 평소와 조금 다른 먹이가 섞여 있다. 익숙한 부분과 낯선 부분이 보인다.',options:[option('small','조금씩 먹어 본다','작은 조각부터 천천히 먹는다. 배가 차자 그릇에서 물러난다.',{comfort:3},'slow-food'),option('leave','익숙한 부분만 먹고 물러난다','오늘은 익숙한 것만 먹었다. 남은 먹이에서 조금 떨어져 편히 쉰다.',{},'food-preference')]},
{id:'water',cat:'body',min:100,ok:s=>outside(s)&&s.world==='heat',text:'그늘까지 걸어오니 혀가 길게 나온다. 가까운 곳에 물그릇과 쉴 자리가 있다.',options:[option('drink','물을 마시고 그늘에서 쉰다','물을 조금씩 마시고 바닥에 눕는다. 숨이 차분해질 때까지 움직임을 줄인다.',{comfort:5},'shade-rest'),option('pause','그늘에 먼저 몸을 눕힌다','몸을 쉬게 한 뒤 가까운 물그릇으로 간다. 더운 길로 바로 나가지 않는다.',{comfort:4},'heat-pause')]},
{id:'grooming',cat:'body',min:120,ok:family,text:'사람이 빗을 보여 주고 내 어깨 털을 짧게 빗는다. 불편하면 멈출 수 있게 손을 뗀다.',options:[option('allow','편히 선 채 조금 더 맡긴다','짧게 빗고 쉬는 일을 반복한다. 끝나자 내 자리로 돌아간다.',{trust:3},'grooming-comfort'),option('away','몸을 옆으로 돌려 거리를 둔다','사람이 손을 멈춘다. 잠시 쉰 뒤 빗을 보기만 해도 보상을 받는다.',{stress:-2},'grooming-boundary')]},
{id:'paw-care',cat:'body',min:150,ok:family,text:'산책을 마치고 사람이 수건을 든다. 발끝에 마른 흙이 붙어 있다.',options:[option('paw','앞발을 내민 채 기다린다','한쪽씩 짧게 닦고 쉬었다. 깨끗한 발로 잠자리에 올라간다.',{comfort:3,familyBond:2},'paw-routine'),option('turn','발을 당기며 몸을 돌린다','사람이 당기지 않고 멈춘다. 수건을 가까이 두고 짧은 연습부터 다시 한다.',{stress:-1},'handling-boundary')]},
{id:'thunder',cat:'fear',min:100,ok:s=>family(s)&&s.world==='rain',text:'창밖이 번쩍하고 큰 소리가 난다. 몸이 굳는다. 집 안에 열린 숨을 자리와 익숙한 사람이 있다.',options:[option('den','조용한 안쪽 자리로 들어간다','안쪽에서 몸을 웅크린다. 사람이 억지로 꺼내지 않고 소리를 줄여 준다.',{stress:-4},'safe-den',{days:7,text:'놀랐을 때 들어갔던 자리를 다시 찾았다. 아무 일 없는 날에도 거기서 편히 잠든다.'}),option('person','사람 곁에 몸을 붙인다','가까이 머문다. 사람이 조용히 곁을 지키고, 소리가 잦아들 때까지 함께 쉰다.',{familyBond:4,stress:-3},'comfort-person')]},
{id:'traffic',cat:'learning',min:100,ok:family,text:'산책길 건너편에서 큰 차가 지나간다. 줄이 연결된 사람이 내 옆에서 멈춘다.',options:[option('back','차도에서 한 걸음 물러난다','사람도 함께 뒤로 이동한다. 조용해진 뒤 넓은 쪽 길로 돌아간다.',{stress:-2},'quiet-route'),option('look','멈춰 서서 차가 지나가기를 본다','멀리서 차를 바라본다. 사람이 거리를 유지한 채 기다려 준다.',{comfort:1},'traffic-distance')]},
{id:'child-home',cat:'family',min:365,ok:family,text:'집에 작은 사람의 물건이 들어왔다. 낮은 울음소리가 들린다. 사람은 안전문 너머에서 나를 챙긴다.',options:[option('bed','내 자리에서 소리를 살핀다','내 잠자리와 식사 시간은 그대로다. 익숙한 물건 곁에서 새 소리를 알아간다.',{comfort:2},'baby-home',{days:21,text:'작은 사람의 소리가 전보다 덜 낯설다. 문 너머에서 쉬면 사람이 내 몫의 시간을 따로 내 준다.'}),option('adult','곁에 있는 어른에게 장난감을 가져간다','사람이 작은 사람과 거리를 둔 자리에서 짧게 놀아 준다. 나도 내 방식으로 관심을 구한다.',{familyBond:4},'baby-home')]},
{id:'new-pet',cat:'family',min:400,ok:family,text:'안전문 너머로 새로운 동물이 보인다. 사람은 잠자리와 밥그릇을 따로 놓았다.',options:[option('side','몸을 옆으로 두고 멀리서 살핀다','서로의 구역을 넘지 않고 잠시 머문다. 사람은 짧게 마치고 각자의 자리로 데려간다.',{stress:-2},'housemate',{days:28,text:'안전문 너머의 움직임이 조금 익숙해졌다. 먹고 쉬는 자리는 여전히 따로다.'}),option('retreat','내 쉬는 자리로 돌아간다','사람이 나를 따라오게 강요하지 않는다. 내 자리에서 편히 쉬었다.',{comfort:3},'housemate-boundary')]},
{id:'visitor-play',cat:'family',min:180,ok:family,text:'집에 온 사람이 갑자기 내 머리 위로 손을 뻗는다. 돌아설 공간이 있다.',options:[option('turn','고개를 돌리고 거리를 둔다','곁에 있던 사람이 손님에게 잠시 기다려 달라고 한다. 내가 먼저 움직일 여유가 생겼다.',{stress:-3},'consent-space'),option('toy','장난감을 가져와 앞에 놓는다','손이 머리에서 물러나 장난감 쪽으로 향한다. 짧게 함께 놀고 쉰다.',{comfort:3},'visitor-game')]},
{id:'boarding',cat:'separation',min:500,ok:family,text:'사람과 함께 낯선 돌봄 공간에 왔다. 내 담요와 먹이가 놓였고, 사람은 잠시 나갔다.',options:[option('blanket','담요를 찾아 몸을 눕힌다','익숙한 물건 옆에서 주변 소리를 살핀다. 돌보는 사람이 내 속도에 맞춰 다가온다.',{stress:-2},'boarding',{days:5,text:'익숙한 사람이 데리러 왔다. 집에 돌아와 물을 마시고 한참 잤다.'}),option('activity','돌보는 사람의 짧은 놀이에 참여한다','넓지 않은 공간에서 천천히 움직인다. 피곤해지기 전에 내 자리로 돌아간다.',{comfort:2},'boarding',{days:5,text:'기다리던 사람이 돌아왔다. 익숙한 차와 집 냄새를 따라 다시 돌아간다.'})]},
{id:'car-ride',cat:'travel',min:150,ok:family,text:'차 안의 고정된 이동 공간에 담요가 깔려 있다. 문이 닫히고 바닥이 조금씩 흔들린다.',options:[option('lie','담요 위에 몸을 낮춘다','처음에는 긴장했지만 짧은 이동 뒤 차가 멈췄다. 조용한 곳에서 잠깐 쉬었다.',{stress:-1},'short-car'),option('signal','불편해서 작은 소리를 낸다','사람이 안전한 곳에 차를 세우고 상태를 살핀다. 오늘 이동은 짧게 마친다.',{trust:2},'car-signal')]},
{id:'beach',cat:'exploration',min:200,max:2920,ok:family,text:'사람과 처음 모래밭에 왔다. 발 아래가 푹 꺼지고 멀리서 물소리가 반복된다.',options:[option('sand','물에서 떨어진 모래를 파 본다','앞발로 모래를 밀자 작은 구덩이가 생겼다. 사람 곁에서 쉬며 바닷바람을 맞는다.',{comfort:6},'dig-sand'),option('dry','마른 모래 위를 천천히 걷는다','물결이 닿지 않는 곳을 보폭에 맞춰 걸었다. 새로운 바닥에 조금 익숙해졌다.',{comfort:4},'new-surface')]},
{id:'scent-game',cat:'learning',min:160,ok:family,text:'사람이 천 사이에 작은 먹이 조각을 숨겼다. 찾아도 된다는 몸짓을 보인다.',options:[option('nose','천 사이를 코로 차근차근 찾는다','작은 조각을 하나씩 찾아낸다. 급하게 뛰지 않아도 재미있는 놀이가 생겼다.',{comfort:5},'nose-work'),option('paw','천을 앞발로 펼쳐 본다','천을 펴니 조각이 하나 나왔다. 사람은 더 쉽게 접어 다시 놓아 준다.',{comfort:3},'puzzle-paws')]},
{id:'impulse',cat:'learning',min:130,max:730,ok:family,text:'문 안에서 산책줄을 매는 중이다. 신이 나서 몸이 먼저 뛰어오른다.',options:[option('feet','발을 바닥에 두고 잠깐 멈춘다','사람이 줄을 연결하고 문을 연다. 진정한 뒤 출발하는 순서가 생긴다.',{familyBond:3},'calm-start'),option('bounce','제자리에서 몸을 들썩인다','사람이 잠시 멈춰 기다린다. 숨을 고른 뒤 줄을 매고 함께 나간다.',{},'excited-start')]},
{id:'sore-day',cat:'body',min:400,ok:family,text:'어제 오래 논 뒤 오늘은 움직임이 무겁다. 평소보다 늦게 일어나는 나를 사람이 살핀다.',options:[option('rest','부드러운 자리에서 더 쉰다','사람이 오늘 활동을 줄이고 상태를 관찰한다. 불편함이 이어지면 진료를 받기로 한다.',{comfort:2},'rest-signal'),option('show','몇 걸음 걷다 멈춰 사람을 본다','사람이 걸음을 재촉하지 않는다. 평소와 다른 모습을 기록하고 필요한 돌봄을 살핀다.',{familyBond:2},'body-signal')]},
{id:'clinic',cat:'care',min:100,ok:family,text:'사람과 진료실에 왔다. 낯선 바닥 위에 내 담요를 펴 주고, 만지기 전에 잠시 기다린다.',options:[option('mat','담요 위에서 사람 쪽을 본다','짧게 살피고 쉬는 시간을 가진다. 익숙한 사람은 끝까지 곁에 있다.',{trust:2},'clinic-mat'),option('pause','몸을 돌려 잠깐 쉬고 싶다는 신호를 보낸다','손길이 멈췄다. 자세를 바꾸고 짧게 나누어 상태를 살핀다.',{stress:-2},'clinic-break')]},
{id:'meal-search',cat:'food',min:100,ok:s=>s.home==='street'&&!s.story.lost,text:'늘 먹이를 찾던 가게가 오늘은 닫혀 있다. 골목의 다른 급식 자리와 차가 많은 길이 떠오른다.',options:[option('known','알고 있는 다른 급식 자리로 간다','돌아가는 길이지만 차가 적다. 먹이를 조금 찾고 쉬던 곳으로 돌아간다.',{comfort:3},'feeding-route'),option('conserve','그늘에서 쉬며 가게가 열리기를 기다린다','움직임을 줄이며 익숙한 장소를 지킨다. 오늘은 먹이를 찾는 시간이 길어졌다.',{comfort:-2},'conserve-energy')]},
{id:'territory',cat:'survival',min:200,ok:s=>s.home==='street'&&!s.story.lost,text:'쉬던 자리에 다른 개들이 모여 있다. 지금은 들어갈 틈이 없어 보인다.',options:[option('detour','충돌하지 않고 다른 잠자리를 찾는다','벽 뒤의 바람 적은 자리를 찾아 몸을 말았다. 익숙한 곳 하나를 덜 쓰게 됐다.',{stress:2},'alternate-bed'),option('edge','멀찍이 떨어진 가장자리에 머문다','서로의 거리를 유지한다. 오늘은 무리 가까이 들어가지 않는다.',{stress:1},'distance-skill')]},
{id:'shelter-enrichment',cat:'play',min:100,ok:s=>s.home==='shelter',text:'돌보는 사람이 찢어도 되는 종이 상자 안에 먹이 장난감을 넣어 주었다.',options:[option('open','상자 모서리를 앞발로 열어 본다','입과 발을 번갈아 쓰며 안쪽을 살핀다. 먹이를 찾고 나니 조금 편안해졌다.',{comfort:5,stress:-3},'box-game'),option('roll','바깥으로 나온 장난감을 굴린다','잠자리와 떨어진 곳에서 천천히 논다. 소란한 복도를 잠시 잊는다.',{comfort:4},'shelter-game')]},
{id:'shelter-routine',cat:'learning',min:100,ok:s=>s.home==='shelter',text:'먹이를 나누는 수레가 왔다. 주변의 짖는 소리가 커진다. 내 문 앞에도 사람이 멈춘다.',options:[option('floor','네 발을 바닥에 두고 사람을 본다','사람이 그릇을 놓는다. 늘 같은 순서가 오늘도 이어졌다.',{stress:-2},'shelter-routine'),option('vocal','짧게 소리를 내며 문 앞을 오간다','사람은 문을 안전하게 열고 그릇을 놓는다. 밥을 먹은 뒤 한쪽에서 쉰다.',{},'meal-anticipation')]},
{id:'old-bed',cat:'aging',min:2920,ok:family,text:'높던 잠자리에 오르려다 멈춘다. 바닥 가까이에 두툼한 새 자리가 놓여 있다.',options:[option('low','낮은 자리에 몸을 눕힌다','오르내리지 않고 편하게 누웠다. 사람이 자주 쉬는 곳 옆으로 자리를 옮겨 준다.',{comfort:6},'low-bed'),option('signal','예전 자리 앞에서 사람을 본다','사람이 잠자리를 낮추고 오르내리는 길을 바꾼다. 오늘은 무리하지 않는다.',{familyBond:3},'accessible-home')]},
{id:'old-walk',cat:'aging',min:2920,ok:family,text:'예전 산책길 중간에서 다리가 느려진다. 사람은 줄을 느슨하게 하고 나를 기다린다.',options:[option('short','짧은 길로 돌아선다','익숙한 나무 한 곳만 들른 뒤 돌아왔다. 짧아도 함께한 시간은 남는다.',{comfort:4},'short-walk'),option('sit','풀그늘에서 잠깐 쉰다','사람도 옆에 앉는다. 숨을 고르고 천천히 집 쪽으로 간다.',{comfort:4},'slow-companion')]},
{id:'night-wake',cat:'aging',min:3285,ok:family,text:'밤중에 잠에서 깼다. 방이 어둡고 잠자리가 바로 떠오르지 않아 잠시 서 있다.',options:[option('call','작게 소리를 내 사람을 부른다','사람이 불을 낮게 켜고 곁에 온다. 익숙한 자리로 천천히 안내한다.',{stress:-3},'night-support'),option('blanket','발밑 담요를 찾아 몸을 낮춘다','담요에 코를 대고 다시 누웠다. 다음 밤에는 이동하는 길에 작은 불이 켜진다.',{comfort:3},'night-path')]},
{id:'rainy-play',cat:'play',min:120,max:2920,ok:s=>family(s)&&s.world==='rain',text:'오늘은 밖에 오래 나가지 못했다. 사람이 집 안에 짧은 놀이 자리를 만든다.',options:[option('find','가려 둔 장난감을 찾아본다','의자 뒤와 천 옆을 돌아 장난감을 찾아냈다. 마음껏 움직인 뒤 물을 마신다.',{comfort:5},'hide-game'),option('learn','손짓에 맞춰 몸을 돌려본다','작은 움직임을 맞출 때마다 보상이 온다. 오래 하지 않고 쉬는 시간도 갖는다.',{familyBond:3},'indoor-learning')]}
];
export function initLifeEvents(s){if(s.lifeEvents){if(!s.lifeEvents.dailyCounts){s.lifeEvents.dailyCounts={};for(const e of s.log)s.lifeEvents.dailyCounts[e.id]=(s.lifeEvents.dailyCounts[e.id]||0)+1;}return;}s.lifeEvents={version:1,used:{},recentCategories:[],nextAt:s.day+25+(s.seed%20),followups:[],habits:[],dailyCounts:{}};}
export function eligibleLifeEvents(s){initLifeEvents(s);initWorld(s);return LIFE_EVENTS.filter(e=>canAct(s,'walk')&&(!s.clinical?.active||!['play','exploration'].includes(e.cat))&&environmentAllows(s,e.id)&&!s.lifeEvents.used[e.id]&&s.day>=e.min&&(e.max==null||s.day<=e.max)&&e.ok(s));}
export function resolveLifeEvent(s,p,id,{log,remember,clamp}){if(!p.id.startsWith('life:'))return false;initLifeEvents(s);const e=LIFE_EVENTS.find(e=>'life:'+e.id===p.id),o=e?.options.find(x=>x.id===id);if(!e||!o)return false;for(const[k,v]of Object.entries(o.effects))s[k]=clamp(s[k]+v);if(o.memory){remember(s,o.memory);if(!s.lifeEvents.habits.includes(o.memory))s.lifeEvents.habits.push(o.memory)}if(e.cat==='food')s.worldModel.resource=Math.min(100,s.worldModel.resource+(id==='known'?8:3));if(e.cat==='learning'&&s.worldModel.care>50)s.trust=clamp(s.trust+1);log(s,'life-result:'+e.id,o.result);s.log.at(-1).storyId='experience:'+e.id;if(o.after)s.lifeEvents.followups.push({day:s.day+o.after.days,area:s.areaId,home:s.home,text:o.after.text,id:e.id});return true;}
export function lifeEventStep(s,{decision,log,random}){initLifeEvents(s);const state=s.lifeEvents;state.followups=state.followups.filter(f=>{if(s.day<f.day)return true;if(s.areaId===f.area&&s.home===f.home&&!s.story.lost){log(s,'life-followup:'+f.id,f.text);s.log.at(-1).storyId='experience:'+f.id;}return false});if(s.pending||s.story.lost||s.day<state.nextAt)return false;let pool=eligibleLifeEvents(s);const fresh=pool.filter(e=>!state.recentCategories.slice(-2).includes(e.cat));if(fresh.length)pool=fresh;if(!pool.length){state.nextAt=s.day+21;return false}const e=weightedEvent(s,pool,random);state.used[e.id]=s.day;state.recentCategories.push(e.cat);state.recentCategories=state.recentCategories.slice(-4);state.nextAt=s.day+Math.max(18,(s.day<730?38:65)-Math.floor(s.worldModel.traits.curiosity/5))+Math.floor(random(s)*25);decision(s,'life:'+e.id,e.text,e.options.map(o=>[o.id,o.text]));return true;}
export function validLifeDecision(id){return LIFE_EVENTS.some(e=>'life:'+e.id===id)}
// Later experiences are unlocked by earlier choices, not just by age.
LIFE_EVENTS.push(
{id:'fetch-second',cat:'play',min:240,max:2920,ok:s=>family(s)&&s.memories.includes('fetch'),text:'전에 공을 가져오던 풀밭이다. 이번에는 공 두 개가 놓였다. 사람은 내가 가져온 공을 잡아당기지 않는다.',options:[option('trade','공을 내려놓고 다른 공을 본다','내려놓자 다른 공이 굴러간다. 빼앗기는 대신 번갈아 노는 순서를 배웠다.',{comfort:5},'trade-game'),option('hold','물고 있는 공으로 조금 더 논다','사람이 기다려 준다. 충분히 놀고 내려놓은 뒤 다음 놀이가 시작된다.',{comfort:3},'play-boundary')]},
{id:'puzzle-second',cat:'learning',min:240,ok:s=>family(s)&&s.memories.includes('puzzle'),text:'전에 굴리던 먹이 장난감이 이번에는 얕은 천 위에 있다. 바로 밀면 천도 함께 움직인다.',options:[option('steady','앞발로 천을 누르고 코로 민다','천이 덜 움직이니 먹이가 나왔다. 지난 놀이에서 익힌 동작을 바꾸어 써 본다.',{comfort:5},'problem-solver'),option('help','장난감을 보다 사람 쪽으로 고개를 돌린다','사람이 천 한쪽을 펴 준다. 쉬운 동작부터 이어서 성공했다.',{trust:3},'cooperate')]},
{id:'recall-second',cat:'learning',min:240,ok:s=>family(s)&&s.memories.includes('recall'),text:'긴 줄 안에서 놀던 중 새가 날아오른다. 사람이 뒤에서 연습하던 소리로 나를 부른다.',options:[option('return','새에게서 고개를 돌려 돌아간다','돌아오자 보상을 받고 다시 풀밭을 살필 시간이 주어진다. 돌아가도 놀이가 끝나는 것은 아니다.',{familyBond:5},'reliable-recall'),option('watch','멈춰 선 채 날아가는 새를 본다','사람이 가까이 와 쉬운 거리에서 다시 부른다. 줄은 끝까지 연결돼 있다.',{},'recall-distraction')]},
{id:'nose-second',cat:'learning',min:260,ok:s=>family(s)&&s.memories.includes('nose-work'),text:'먹이를 찾던 천 대신 뚜껑 열린 작은 상자 몇 개가 놓였다. 한 곳에서만 먹이 냄새가 난다.',options:[option('search','상자를 하나씩 차례로 살핀다','두 번째 상자에서 먹이를 찾았다. 빈 상자를 지나치는 법도 배워 간다.',{comfort:5},'search-sequence'),option('rest','잠시 쉬었다가 다시 참여한다','사람이 상자 수를 줄인다. 짧게 찾고 끝내니 편안하게 놀이를 마쳤다.',{comfort:3},'self-paced')]},
{id:'safe-den-second',cat:'fear',min:300,ok:s=>family(s)&&s.memories.includes('safe-den')&&s.world==='rain',text:'다시 멀리서 천둥이 들린다. 전에 쉬었던 안쪽 자리는 오늘도 열려 있다.',options:[option('den','스스로 그 자리로 들어간다','억지로 버티지 않고 쉬는 곳을 찾았다. 작은 소리가 잦아들 때까지 머문다.',{stress:-5},'coping-place'),option('near','익숙한 사람 곁에서 쉰다','사람이 조용한 방으로 함께 이동한다. 안전한 자리가 하나만 있는 것은 아니다.',{familyBond:3},'flexible-comfort')]},
{id:'visitor-second',cat:'family',min:280,ok:s=>family(s)&&s.memories.includes('consent-space'),text:'지난번 집에 왔던 사람이 다시 왔다. 이번에는 먼저 손을 뻗지 않고 옆으로 앉는다.',options:[option('visit','내가 먼저 조금 가까이 간다','사람은 갑자기 만지지 않는다. 잠시 옆에 머물다가 내가 원하는 때 물러난다.',{trust:4},'trusted-visitor'),option('stay','내 자리에서 편하게 지낸다','손님은 그 거리를 지킨다. 낯선 사람이 와도 내 자리를 빼앗기지 않는다.',{comfort:4},'visitor-rest')]},
{id:'senior-puzzle',cat:'aging',min:2920,ok:s=>family(s)&&(s.memories.includes('puzzle')||s.memories.includes('nose-work')),text:'예전에 즐기던 먹이 놀이를 사람이 바닥 가까이 놓는다. 구멍은 더 쉽게 열리고, 움직일 거리는 짧아졌다.',options:[option('easy','익숙한 동작으로 천천히 풀어 본다','예전보다 오래 걸려도 조각을 찾았다. 사람은 서두르지 않고 기다린다.',{comfort:6},'adapted-play'),option('together','사람이 펼쳐 주는 곳을 함께 살핀다','도움을 받으며 짧게 놀았다. 끝나자 편한 자리에서 함께 쉰다.',{familyBond:4},'assisted-play')]}
);
const habitScene=(id,memory,text,min=100,max=Infinity)=>({id,ok:s=>family(s)&&s.day>=min&&s.day<=max&&s.memories.includes(memory),text,once:true});
export const LIFE_AMBIENT=[
habitScene('habit-chew','chew-toy','사람이 바쁠 때 나는 씹기 장난감을 가져왔다. 같은 방에서 각자의 일을 하다가 함께 쉬었다.'),
habitScene('habit-toilet','toilet-routine','잠에서 깨어 기지개를 켠 뒤 익숙한 배변 자리로 간다. 돌아오니 아침 식사가 준비돼 있다.'),
habitScene('habit-recall','recall','풀밭을 살피다가 부르는 소리에 고개를 돌린다. 돌아간 뒤에는 또 함께 걷는다.'),
habitScene('habit-fetch','fetch','공이 놓인 바구니 앞에 앉았다. 사람이 그 모습을 보고 웃으며 산책 가방을 꺼낸다.',150,2920),
habitScene('habit-tug','tug','천 장난감 끝을 사람 앞에 가져다 놓았다. 잠깐 놀고 나서 내 쪽에서 놓으니 놀이도 잠시 멈췄다.',150,2920),
habitScene('habit-den','safe-den','집 안이 조금 소란하다. 열린 쉬는 자리로 들어가자 아무도 따라 들어오지 않는다.'),
habitScene('habit-nose','nose-work','천이 펴지는 소리에 귀가 움직인다. 오늘은 먹이를 찾는 짧은 놀이가 기다린다.'),
habitScene('habit-car','short-car','차가 멈추면 곧바로 뛰어나가지 않고 사람이 이동 공간을 열 때까지 담요 위에 있다.'),
habitScene('habit-paws','paw-routine','비 오는 산책을 마치고 현관의 수건 쪽으로 간다. 한 발씩 닦은 뒤 물그릇으로 향한다.'),
habitScene('habit-groom','grooming-comfort','빗을 꺼내는 소리가 난다. 잠깐 털을 빗은 뒤 몸을 털고 내 자리로 돌아간다.'),
habitScene('habit-family','baby-home','작은 사람의 낮잠 시간이 되자 집이 조용하다. 내 자리에서 나도 함께 낮잠을 잔다.'),
habitScene('habit-low','low-bed','일어나기 편한 잠자리에서 몸을 편다. 이제 높은 곳에 오르려고 망설이지 않아도 된다.',2920),
habitScene('habit-slow','slow-companion','산책 가방을 보자 문 앞으로 간다. 멀리 가지 않아도 나무 그늘에서 같이 쉬는 시간이 좋다.',2920),
habitScene('habit-night','night-path','밤에 물을 마시러 일어났다. 낮게 켜진 불빛을 따라 걸어갔다가 같은 길로 돌아왔다.',3285),
habitScene('habit-help','ask-help','장난감이 낮은 가구 밑에 들어갔다. 가구와 사람을 번갈아 보자 손이 장난감을 꺼내 준다.'),
habitScene('habit-sand','dig-sand','산책길의 부드러운 모래를 밟자 전에 파던 감촉이 떠오른다. 허락된 작은 자리에서 앞발을 움직인다.',200,2920),
habitScene('habit-trade','trade-game','물고 온 장난감을 바닥에 내려놓았다. 사람은 다른 장난감을 굴려 주며 놀이를 이어 간다.'),
habitScene('habit-boundary','handling-boundary','발을 만지려던 손에서 몸을 돌렸다. 손이 멈추자 나도 긴장을 풀었다. 쉬고 싶다는 신호가 통했다.'),
habitScene('habit-return','boarding','집에서 늘 쓰던 담요에 몸을 비빈다. 잠깐 떨어져 있던 날을 지나 일상이 다시 익숙해졌다.'),
habitScene('habit-quiet','quiet-route','큰길 앞에서 사람이 익숙한 조용한 길로 방향을 바꾼다. 줄이 느슨해지고 내 걸음도 편해진다.')
];
export const DAILY_VARIANTS={
smell:['풀잎 사이에서 바람을 맞는다. 지나간 발자국은 보이지 않아도 냄새는 조금 남아 있다.','문득 공기의 방향이 바뀌었다. 고개를 들었다가 몸을 털고 하던 일을 이어 간다.'],
sleep:['잠자리에서 몇 번 돌고 몸을 내려놓는다. 길게 숨을 내쉬자 눈꺼풀이 무거워진다.','잠에서 깨어 앞다리를 길게 뻗는다. 물을 조금 마시고 다시 편한 자리를 찾는다.'],
play:['앞발로 건드린 것이 옆으로 굴러간다. 쫓아가 입으로 붙잡았다가 다시 내려놓는다.','몸을 낮추었다가 짧게 뛰어오른다. 신이 나서 몇 걸음 달린 뒤 숨을 고른다.'],
family:['사람이 바닥에 앉자 가까운 곳에 눕는다. 특별히 놀지 않아도 같은 방에 있는 시간이 편하다.','아침의 작은 소리들이 차례로 난다. 물 끓는 소리 뒤에 내 밥그릇이 움직인다.'],
street:['햇볕이 옮겨가자 쉴 자리도 조금 옮긴다. 가게 앞이 바빠지기 전에 통로를 비워 준다.','사람들의 발걸음이 줄어든 시간에 물을 마신다. 오늘은 익숙한 골목 안에서 움직인다.'],
shelter:['담요 끝을 앞발로 모아 턱을 괸다. 복도가 잠시 조용해져 눈을 감는다.','물을 갈아 준 사람이 문을 닫는다. 그릇을 확인한 뒤 편한 쪽으로 몸을 돌린다.'],
training:['손짓을 보고 잠시 멈추자 칭찬이 왔다. 짧은 연습 뒤에는 자유롭게 쉬는 시간이 이어진다.'],
bath:['수건 속에서 몸을 비빈다. 바닥에 내려오자 한 번 크게 털고 물을 마신다.'],
dream:['옆으로 누운 채 작은 소리를 낸다. 잠이 깨자 발을 쭉 뻗고 자세를 바꾼다.'],
grass:['풀밭 가장자리에서 발을 느리게 옮긴다. 한참 머문 뒤 몸을 털고 길 쪽으로 돌아온다.'],
shade:['그늘의 차가운 바닥을 골라 몸을 눕힌다. 해가 기울 때까지 움직임을 줄인다.'],
'old-stairs':['낮은 턱 앞에서 보폭을 줄인다. 사람이 재촉하지 않고 같은 속도로 따라온다.'],
'friend-rest':['오늘 만난 친구와 등을 조금 떨어뜨리고 쉰다. 둘 다 먼저 일어나려 하지 않는다.'],
'friend-toy':['친구와 잠깐 장난친 뒤 각자 물을 마신다. 쉬고 싶을 때는 서로를 쫓지 않는다.']
};

LIFE_EVENTS.push(...EXPERIENCE_EVENTS);

for(const e of LIFE_EVENTS){e.species=['dog'];e.kind='behavior';e.repeat={max:1};e.provenance={type:'authored',source:null,uncertainty:'발생률과 결과는 게임용 가정'};e.outcomeMode='fixed';}
