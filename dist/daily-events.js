import{friendPresent}from './social.js';
// Narrative conditions are authored game content, not measured event rates.
export const EXTRA_EVENTS=[
{id:'first-name',ok:s=>s.home==='family'&&s.day>60&&s.day<365,text:'사람이 같은 소리를 몇 번이고 부른다. 고개를 돌리자 웃으며 손을 내민다. 그 소리가 나를 부르는 것임을 배운다.',once:true},
{id:'first-leash',ok:s=>s.home==='family'&&s.day>90&&s.day<365,text:'몸에 닿는 산책줄이 낯설다. 처음에는 멈춰 섰다가, 익숙한 손을 따라 한 발 내딛는다.',once:true},
{id:'mirror',ok:s=>s.home==='family'&&s.day>60&&s.day<365,text:'반짝이는 면 안에서 다른 강아지가 나를 본다. 고개를 기울이자 그쪽도 똑같이 움직인다.',once:true},
{id:'shoe',ok:s=>s.home==='family'&&s.day>70&&s.day<500,text:'신발 한 짝을 잠자리로 끌고 왔다. 익숙한 사람의 냄새가 짙어서 그 옆에서 잠든다.'},
{id:'training',ok:s=>s.home==='family'&&s.day>90,text:'손이 올라갈 때 엉덩이를 바닥에 대니 작은 간식이 왔다. 다시 손을 유심히 살핀다.'},
{id:'bath',ok:s=>s.home==='family'&&s.day>90,text:'몸에 물이 닿았다. 수건에서 빠져나와 온몸을 턴다. 닦아 주던 사람에게도 물방울이 튄다.'},
{id:'doorbell',ok:s=>s.home==='family'&&s.day>60,text:'문 쪽에서 낯선 소리가 난다. 귀를 세우고 보다가 익숙한 사람의 표정을 살핀다.'},
{id:'visitor',ok:s=>s.home==='family'&&s.day>90,text:'처음 맡는 옷 냄새가 집 안으로 들어왔다. 멀리서 지켜보다 내려놓은 손 가까이 코를 댄다.'},
{id:'dream',ok:s=>s.day>30,text:'잠결에 앞발이 조금 움직인다. 눈을 뜨니 달리던 곳 대신 익숙한 잠자리다.'},
{id:'grass',ok:s=>s.day>70&&s.home!=='shelter',text:'풀잎 끝이 배를 간질인다. 몸을 비비고 뒹군 뒤 일어나 길게 기지개를 켠다.'},
{id:'bird',ok:s=>s.day>70&&s.home!=='shelter',text:'작은 새가 가까이 내려앉았다. 한 발 다가가자 날아오른다. 빈자리를 한동안 바라본다.'},
{id:'puddle',ok:s=>s.day>70&&s.world==='rain'&&s.home!=='shelter',text:'웅덩이에 코끝을 가까이 댔다. 떨어진 빗방울이 물 위의 모습을 흐트러뜨린다.'},
{id:'shade',ok:s=>s.day>70&&s.world==='heat',text:'볕이 드는 자리를 피해 그늘로 옮긴다. 바닥에 배를 대니 조금 서늘하다.'},
{id:'cold-paws',ok:s=>s.day>70&&s.world==='cold'&&s.home!=='family',text:'찬 바닥에서 발을 번갈아 든다. 바람이 덜 들어오는 벽 쪽으로 몸을 붙인다.'},
{id:'market-smell',ok:s=>s.home==='street'&&s.day>70,text:'골목에 음식 냄새가 퍼졌다. 바쁜 발걸음을 피해 한쪽에서 조용히 기다린다.'},
{id:'street-bed',ok:s=>s.home==='street'&&s.day>70,text:'어제보다 바람이 덜 드는 자리를 찾았다. 몸이 들어갈 만큼의 공간을 몇 번 돌고 눕는다.'},
{id:'shelter-clean',ok:s=>s.home==='shelter'&&s.day>70,text:'바닥에서 새로운 물 냄새가 난다. 청소가 끝나자 익숙한 담요가 다시 놓였다.'},
{id:'shelter-visitor',ok:s=>s.home==='shelter'&&s.day>70,text:'복도에서 여러 발소리가 멈췄다. 문 앞에 앉아 조심스럽게 손 냄새를 맡는다.'},
{id:'friend-rest',ok:s=>friendPresent(s)&&s.dogBond>20&&s.day>90,text:'방금 만난 친구와 조금 떨어져 나란히 쉰다. 가까이 있어도 이제 몸에 힘이 들어가지 않는다.'},
{id:'friend-toy',ok:s=>friendPresent(s)&&s.dogBond>35&&s.day<2920,text:'친구가 물고 있던 작은 나뭇가지를 놓았다. 내가 다가가자 앞다리를 낮추고 꼬리를 흔든다.'},
{id:'old-stairs',ok:s=>s.home==='family'&&s.day>2920,text:'계단 앞에서 잠시 멈춘다. 사람이 걸음을 늦추고 내가 올라갈 때까지 기다린다.'},
{id:'old-scent',ok:s=>s.day>2920&&s.memories.includes('favorite-path'),text:'오랜만에 그 나무 냄새를 맡았다. 걸음은 느려졌어도 멈추는 자리는 예전과 같다.'},
{id:'reunion-memory',ok:s=>s.story.reunited&&s.home==='family',text:'사람이 문을 나서려 하자 가까이 붙는다. 돌아온 손 냄새를 맡고 나서야 편히 눕는다.'},
{id:'settled-memory',ok:s=>s.memories.includes('settled')&&s.home==='family',text:'창밖 소리가 들려도 놀라지 않는다. 처음엔 낯설던 이곳이 이제 내 잠자리다.'}
];
