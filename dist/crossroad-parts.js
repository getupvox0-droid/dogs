// Parts for generated crossroads: a setting, a lure that pulls the dog, a hazard only the player
// knows about. Any lure a setting allows can meet any hazard it allows, so the moments keep
// changing across lives. Every sentence the dog "says" stays in its senses (docs/ROADMAP.md).
// Odds here are game assumptions, not statistics.

// Which settings a life can meet, by where it lives now (worldModel.context.id).
export const SETTING_FAMILIES = {
  'street-city': ['alley', 'market', 'parking', 'roadside', 'site'],
  'street-rural': ['field', 'farmroad', 'barn', 'stream', 'roadside'],
  'street-water': ['pier', 'embankment', 'alley', 'roadside'],
  'family-city': ['kitchen', 'balcony', 'frontdoor', 'park', 'stairs', 'roadside'],
  'family-house': ['kitchen', 'frontdoor', 'park', 'farmroad', 'stairs', 'yard'],
  'family-coast': ['kitchen', 'frontdoor', 'embankment', 'pier', 'yard'],
  shelter: ['kennel', 'shelteryard', 'frontdoor'],
};
const CONTEXT_FAMILY = {
  'market-edge': 'street-city',
  'warehouse-edge': 'street-city',
  'old-courtyard': 'street-city',
  'field-den': 'street-rural',
  'village-edge': 'street-rural',
  'orchard-edge': 'street-rural',
  'river-town': 'street-water',
  'harbor-edge': 'street-water',
  'city-flat': 'family-city',
  'shared-home': 'family-city',
  'shop-home': 'family-city',
  'garden-house': 'family-house',
  'suburb-home': 'family-house',
  'farm-room': 'family-house',
  'hill-home': 'family-house',
  'coast-home': 'family-coast',
};
export function settingFamily(s) {
  if (s.home === 'shelter') return 'shelter';
  const f = CONTEXT_FAMILY[s.worldModel?.context?.id];
  if (f && f.startsWith(s.home === 'family' ? 'family' : 'street')) return f;
  return s.home === 'family' ? 'family-city' : 'street-city';
}

export const SETTINGS = {
  alley: {
    text: ['좁은 골목 바닥에 기름 자국이 번들거린다.', '건물 사이 골목에 바람이 갇혀 맴돈다.'],
    lures: ['food', 'prey', 'dogcall', 'person', 'warmth', 'scent'],
    hazards: ['traffic', 'hostile-dog', 'hostile-human', 'sharp', 'poison'],
  },
  market: {
    text: ['상자와 비닐이 쌓인 시장 뒤편이다. 사람 발소리가 끊이지 않는다.'],
    lures: ['food', 'person', 'prey'],
    hazards: ['traffic', 'hostile-human', 'sharp'],
  },
  parking: {
    text: ['기름 냄새가 밴 넓은 바닥에 큰 것들이 줄지어 멈춰 있다.'],
    lures: ['food', 'warmth', 'prey', 'water'],
    hazards: ['traffic', 'heat', 'poison'],
  },
  roadside: {
    text: ['발밑이 단단하고 매끈하다.', '길가 풀숲이 끝나는 곳에서 바닥이 단단해진다.'],
    lures: ['food', 'dogcall', 'person', 'scent'],
    hazards: ['traffic', 'lost'],
  },
  site: {
    text: ['흙더미와 쇠 냄새가 섞인 곳이다. 바닥이 울퉁불퉁하다.'],
    lures: ['food', 'warmth', 'open', 'water'],
    hazards: ['height', 'sharp', 'machine'],
  },
  field: {
    text: ['흙이 부드럽고 풀 냄새가 짙다.', '이랑 사이로 바람이 낮게 지나간다.'],
    lures: ['prey', 'food', 'scent', 'water'],
    hazards: ['machine', 'poison', 'lost'],
  },
  farmroad: {
    text: ['흙길 양옆으로 도랑이 길게 이어진다.'],
    lures: ['dogcall', 'scent', 'food', 'prey'],
    hazards: ['traffic', 'water', 'lost'],
  },
  barn: {
    text: ['짚 냄새와 큰 짐승 냄새가 섞여 있다.'],
    lures: ['food', 'warmth', 'prey', 'open'],
    hazards: ['hostile-dog', 'machine', 'sharp'],
  },
  stream: {
    text: ['물소리가 가깝다. 발밑의 돌이 미끄럽다.'],
    lures: ['prey', 'water', 'scent'],
    hazards: ['water', 'sharp'],
  },
  pier: {
    text: ['비린내가 진하고, 바닥 널판 사이로 출렁이는 물이 보인다.'],
    lures: ['food', 'prey', 'person'],
    hazards: ['water', 'height', 'hostile-human', 'machine'],
  },
  embankment: {
    text: ['높은 둑 위로 바람이 세게 분다. 아래에서 물소리가 난다.'],
    lures: ['prey', 'dogcall', 'scent', 'water'],
    hazards: ['water', 'height'],
  },
  kitchen: {
    text: ['높은 곳에서 음식 냄새가 내려온다. 바닥이 매끄럽다.'],
    lures: ['food', 'toy'],
    hazards: ['poison', 'sharp', 'heat'],
  },
  balcony: {
    text: ['바깥 공기가 드나드는 높은 곳이다. 난간 사이로 바람이 분다.'],
    lures: ['prey', 'toy', 'dogcall'],
    hazards: ['height'],
  },
  frontdoor: {
    text: ['현관문이 조금 열려 있다. 바깥 냄새가 한꺼번에 밀려든다.'],
    lures: ['dogcall', 'prey', 'scent'],
    hazards: ['traffic', 'lost'],
  },
  park: {
    text: ['풀밭이 넓고 다른 개들의 흔적이 많다. 목줄이 느슨하게 늘어져 있다.'],
    lures: ['toy', 'dogcall', 'prey', 'food', 'person'],
    hazards: ['hostile-dog', 'poison', 'lost'],
  },
  stairs: {
    text: ['계단이 아래로 길게 이어진다. 끝이 잘 보이지 않는다.'],
    lures: ['toy', 'dogcall', 'food'],
    hazards: ['height'],
  },
  yard: {
    text: ['마당 울타리 아래로 흙이 파여 있다. 바깥 냄새가 그 틈으로 들어온다.'],
    lures: ['prey', 'open', 'scent', 'dogcall'],
    hazards: ['traffic', 'hostile-dog', 'lost'],
  },
  kennel: {
    text: ['철문이 늘어선 복도다. 여러 개의 냄새와 소리가 한꺼번에 섞인다.'],
    lures: ['food', 'dogcall', 'toy', 'person'],
    hazards: ['hostile-dog', 'sharp'],
  },
  shelteryard: {
    text: ['울타리 안 운동장이다. 흙바닥이 넓고 햇볕이 고르게 든다.'],
    lures: ['open', 'toy', 'dogcall', 'scent'],
    hazards: ['lost', 'hostile-dog', 'heat'],
  },
};

// rush / careful / avoid texts. `items` fill {item} so one lure reads differently each time.
export const LURES = {
  food: {
    items: ['고기 조각', '생선 머리', '튀김 부스러기', '닭 뼈', '빵 조각'],
    sense: (x) => `${x} 냄새가 진하게 풍겨 온다.`,
    rush: '냄새를 따라 곧장 달려간다',
    careful: '몸을 낮추고 냄새 쪽으로 천천히 다가간다',
    avoid: '냄새만 맡고 그 자리에 머문다',
    reward: (x, j) => `${j(x, '을', '를')} 찾아 배를 채웠다.`,
    lack: '냄새는 바람에 흩어졌다. 배는 여전히 비어 있다.',
    delta: { hunger: -20 },
    miss: { hunger: 6 },
  },
  prey: {
    min: 150,
    items: ['고양이 한 마리', '작은 새', '쥐 한 마리', '비둘기'],
    sense: (x, j) => `${j(x, '이', '가')} 재빠르게 움직인다. 다리에 저절로 힘이 들어간다.`,
    rush: '몸을 날려 쫓아간다',
    careful: '몸을 낮추고 살금살금 따라간다',
    avoid: '귀만 세우고 지켜본다',
    reward: (x, j) => `${j(x, '을', '를')} 끝까지 쫓았다. 놓쳤지만 숨이 차도록 신이 났다.`,
    lack: '움직이던 것은 금세 사라졌다.',
    delta: { happiness: 8, fatigue: 10 },
    miss: {},
  },
  dogcall: {
    sense: () => '멀리서 다른 개가 짖는다. 꼬리가 저절로 움직이는 소리다.',
    rush: '소리 나는 쪽으로 뛰어간다',
    careful: '냄새를 맡으며 천천히 소리 쪽으로 간다',
    avoid: '제자리에서 짧게 짖어 대답한다',
    reward: () => '짖던 개와 코를 맞댔다. 한참을 같이 뛰었다.',
    lack: '대답하는 소리가 몇 번 오가다 멎었다.',
    delta: { dogBond: 6, happiness: 5 },
    miss: {},
  },
  person: {
    min: 90,
    sense: () => '누군가 쪼그려 앉아 혀를 차며 부른다. 손에서 먹이 냄새가 난다.',
    rush: '꼬리를 흔들며 곧장 다가간다',
    careful: '거리를 두고 천천히 다가가 냄새를 맡는다',
    avoid: '몸을 돌려 멀찍이 물러난다',
    reward: () => '손바닥의 먹이를 받아먹었다. 손이 잠깐 머리에 닿았다.',
    lack: '부르던 소리가 멀어졌다.',
    delta: { trust: 5, hunger: -8 },
    miss: {},
  },
  warmth: {
    ok: (s) => s.world === 'cold',
    sense: () => '털 사이로 찬 기운이 파고든다. 어딘가에서 따뜻한 바람이 새어 나온다.',
    rush: '따뜻한 곳으로 곧장 파고든다',
    careful: '주변 냄새를 살핀 뒤 조심스레 들어간다',
    avoid: '지금 자리에서 몸을 더 말고 버틴다',
    reward: () => '따뜻한 곳에서 몸을 펴고 잠들었다.',
    lack: '밤새 몸을 떨었다.',
    delta: { comfort: 8, fatigue: -15 },
    miss: { comfort: -5, health: -2 },
  },
  water: {
    ok: (s) => s.world === 'heat',
    sense: () => '혀가 바싹 마른다. 어디선가 물 냄새가 난다.',
    rush: '물 냄새를 따라 곧장 간다',
    careful: '천천히 다가가 가장자리에서 혀를 댄다',
    avoid: '그늘에 엎드려 참는다',
    reward: () => '물을 실컷 마셨다. 혀가 다시 촉촉해졌다.',
    lack: '목마름이 오래 남았다.',
    delta: { thirst: -25 },
    miss: { thirst: 10 },
  },
  toy: {
    ok: (s) => s.home !== 'street',
    sense: () => '굴러간 공이 저쪽에서 멈췄다. 공에서 사람 손 냄새가 난다.',
    rush: '공을 향해 힘껏 달려간다',
    careful: '천천히 걸어가 공을 문다',
    avoid: '공을 두고 자리에 눕는다',
    reward: () => '공을 물고 돌아왔다. 꼬리가 멈추지 않았다.',
    lack: '공은 그 자리에 오래 남아 있었다.',
    delta: { happiness: 8, familyBond: 2 },
    miss: {},
  },
  scent: {
    ok: (s) => s.day >= (s.reproduction?.matureAt ?? 300),
    sense: () => '바람에 실려 온 다른 개의 냄새가 몸을 들뜨게 한다.',
    rush: '냄새를 좇아 멀리까지 달려간다',
    careful: '냄새가 이어진 길을 천천히 따라간다',
    avoid: '코만 높이 들고 머문다',
    reward: () => '냄새의 주인을 찾았다. 서로 오래 냄새를 맡았다.',
    lack: '냄새는 해가 지자 옅어졌다.',
    delta: { happiness: 6, dogBond: 3 },
    miss: { stress: 3 },
  },
  open: {
    sense: () => '늘 닫혀 있던 틈이 열려 있다. 처음 맡는 냄새가 밀려든다.',
    rush: '열린 틈으로 곧장 빠져나간다',
    careful: '틈 앞에서 냄새를 오래 맡고 한 발씩 나선다',
    avoid: '열린 틈 앞에 앉아 바라만 본다',
    reward: () => '처음 가 보는 곳을 실컷 돌아다녔다. 코가 바빴다.',
    lack: '틈은 다시 닫혔다.',
    delta: { happiness: 7 },
    miss: {},
  },
};

// severity 3 can kill on a rush; 2 only a puppy, an old dog or a frail one; 1 never kills.
// `cue` is what the dog senses without knowing what it means; `know` is the player's line.
export const HAZARDS = {
  traffic: {
    severity: 3,
    cue: [
      '그 사이로 무언가 큰 것이 바람을 일으키며 지나간다.',
      '바닥이 낮게 울리고, 굉음이 가까워졌다 멀어진다.',
    ],
    know: () =>
      '이곳은 차와 오토바이가 쉬지 않고 지나다니는 길입니다. 개는 차의 속도를 가늠하지 못합니다.',
    fear: '굉음이 들리자 몸이 먼저 굳는다.',
    near: '바로 앞을 큰 것이 스쳐 지나갔다. 몸이 저절로 뒤로 물러났다.',
    hit: '굉음과 함께 무언가가 옆구리를 스쳤다. 몸이 길가로 나뒹굴었다.',
    hurt: '길에서 부딪힌 다리가 붓고 뜨겁다. 딛을 수가 없다.',
    death: {
      cause: '도로에서 차에 치임',
      text: '빛과 굉음이 한꺼번에 덮쳤다. 길 위에서 몸이 멈췄다.',
    },
  },
  water: {
    severity: 3,
    cue: ['물소리가 가깝고 발밑이 젖어 미끄럽다.'],
    know: () => '물이 보기보다 깊고 빠릅니다. 개는 한번 빠지면 기슭으로 다시 오르기 어렵습니다.',
    fear: '물소리를 듣자 다리가 뻣뻣해진다.',
    near: '앞발이 미끄러져 물에 닿았다. 허둥지둥 뒤로 물러났다.',
    hit: '발이 미끄러져 물에 빠졌다. 물살에 떠밀리다 돌에 부딪히며 겨우 기어 나왔다.',
    hurt: '물에 빠졌다 나온 뒤 옆구리가 결리고 숨이 가쁘다.',
    death: { cause: '물에 빠짐', text: '차가운 물이 귀와 코를 덮었다. 물살이 몸을 데려갔다.' },
  },
  height: {
    severity: 2,
    cue: ['발끝 너머로 바람이 아래에서 올라온다.'],
    know: () => '떨어지면 크게 다칠 수 있는 높이입니다. 어린 개와 나이 든 개는 더 위험합니다.',
    fear: '발끝 아래가 비어 있는 느낌에 몸이 움츠러든다.',
    near: '디딘 곳이 흔들렸다. 몸을 낮추고 겨우 버텼다.',
    hit: '발 디딘 곳이 무너지며 아래로 떨어졌다.',
    hurt: '떨어지며 부딪힌 다리와 허리가 아프다. 일어서려 하면 몸이 떨린다.',
    death: { cause: '높은 곳에서 떨어짐', text: '아래로 떨어지는 동안 소리가 멀어졌다.' },
  },
  poison: {
    severity: 3,
    illness: 'digestive',
    // Only something the dog would put in its mouth can poison it.
    lures: ['food', 'water'],
    cue: ['냄새 사이에 코를 찌르는 낯선 단내가 섞여 있다.'],
    know: (setting) =>
      ({
        kitchen: '사람 음식에는 개에게 해로운 초콜릿, 양파, 포도가 섞여 있기도 합니다.',
        field: '밭과 과수원에는 농약이 뿌려져 있기도 합니다.',
        parking: '주차장 바닥에 고인 단 냄새는 개에게 치명적인 부동액일 수 있습니다.',
      })[setting] || '길과 공원에는 쥐약이 섞인 먹이가 놓여 있기도 합니다.',
    fear: '낯선 단내를 맡자 혀를 내밀었다가 거둔다.',
    near: '혀끝에 닿은 맛이 이상했다. 퉤 뱉고 물러났다.',
    hit: '먹고 나서 배가 꼬이고 다리가 떨렸다. 침이 멈추지 않았다.',
    hurt: '해로운 것을 먹은 뒤 배가 꼬이고 다리가 떨린다. 침이 멈추지 않는다.',
    death: {
      cause: '해로운 것을 먹고 중독됨',
      text: '숨이 가빠지고 다리에 힘이 빠졌다. 누운 자리에서 숨이 천천히 멎었다.',
    },
  },
  'hostile-dog': {
    severity: 2,
    cue: ['낮게 울리는 소리와 함께 굵은 개 냄새가 난다.'],
    know: () => '자기 영역을 지키는 개들이 있는 곳입니다. 몸집이 작은 개는 크게 다치기 쉽습니다.',
    fear: '굵은 개 냄새에 꼬리가 다리 사이로 들어간다.',
    near: '큰 개가 이빨을 드러냈다. 귀를 눕히고 물러나자 따라오지 않았다.',
    hit: '굵은 개가 달려들어 목덜미를 물었다. 한참을 끌려다니다 겨우 빠져나왔다.',
    hurt: '물린 목덜미와 어깨가 붓고 열이 난다.',
    death: { cause: '다른 개에게 물린 상처', text: '큰 몸이 나를 덮쳤다. 다시 일어서지 못했다.' },
  },
  'hostile-human': {
    severity: 1,
    cue: ['쇠붙이가 부딪히는 소리와 함께 낯선 사람의 발소리가 다가온다.'],
    know: () => '길의 개를 쫓아내거나 붙잡으려는 사람이 자주 오는 곳입니다.',
    fear: '사람의 발소리에 몸이 먼저 움츠러든다.',
    near: '사람이 막대기를 휘둘렀다. 몸을 비틀어 피했다.',
    hit: '날아온 막대기에 등을 맞았다. 깨갱대며 달아났다.',
    hurt: '맞은 등과 뒷다리가 아파 몸을 웅크린다.',
  },
  machine: {
    severity: 3,
    cue: ['땅을 울리는 기계 소리가 가까워졌다 멀어진다.'],
    know: () => '큰 기계가 오가며 일하는 곳입니다. 기계는 작은 개를 보지 못하고 지나가기도 합니다.',
    fear: '땅이 울리자 몸이 바닥에 붙는다.',
    near: '울리던 것이 바로 옆을 지나갔다. 흙이 얼굴에 튀었다.',
    hit: '울리던 것이 갑자기 가까워졌다. 발이 바퀴 아래 깔렸다.',
    hurt: '기계에 깔린 발이 붓고 피가 난다.',
    death: { cause: '작업 기계에 깔림', text: '땅을 울리는 소리가 몸 위로 지나갔다.' },
  },
  sharp: {
    severity: 1,
    cue: ['바닥에서 반짝이는 조각들이 발에 걸린다.'],
    know: () => '깨진 유리와 쇠붙이가 흩어져 있습니다.',
    fear: '반짝이는 바닥을 보자 발을 든다.',
    near: '발끝에 날카로운 것이 닿았다. 얼른 발을 뺐다.',
    hit: '반짝이는 조각을 밟았다. 발바닥에서 피가 났다.',
    hurt: '베인 발바닥이 쓰라려 디딜 때마다 다리를 든다.',
  },
  lost: {
    severity: 1,
    noInjury: true,
    cue: ['처음 맡는 냄새들이 겹겹이 이어진다.'],
    know: () => '여기서 멀리 가면 돌아오는 길을 찾지 못할 수 있습니다.',
    fear: '낯선 냄새가 겹치자 걸음이 느려진다.',
    near: '한참 가다가 아는 냄새가 끊겼다. 왔던 길을 되짚어 돌아왔다.',
    hit: '냄새를 따라가다 보니 아는 냄새가 하나도 없었다. 하루를 꼬박 헤매고서야 돌아왔다.',
    cost: { hunger: 15, fatigue: 25, stress: 12 },
  },
  heat: {
    severity: 2,
    noInjury: true,
    ok: (s) => s.world === 'heat',
    cue: ['바닥이 뜨겁게 달아 있다. 숨이 가쁘다.'],
    know: () => '한낮의 바닥과 갇힌 공간은 개가 쓰러질 만큼 뜨거워집니다.',
    fear: '뜨거운 바닥을 디디자 발을 번갈아 든다.',
    near: '숨이 거칠어졌다. 그늘을 찾아 몸을 눕혔다.',
    hit: '숨이 거칠어지고 다리가 휘청거렸다. 그늘에 쓰러지듯 누웠다.',
    cost: { health: -15, thirst: 25 },
    death: { cause: '더위에 쓰러짐', text: '뜨거운 숨이 끝내 가라앉지 않았다.' },
  },
};
