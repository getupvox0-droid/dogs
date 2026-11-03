// Crossroads: rare moments where a choice can really cost something (a bite, a broken leg, a life).
// The dog's text stays in its senses; `know` is what only the player sees (principle 1).
// Odds are game assumptions, not statistics, and depend on the dog's age, body and past marks.
// What a crossroad leaves behind is a mark that later moments can read back.
import { mix } from './world.js';
import { canAct } from './species.js';
import { beginIllness } from './health.js';
import { josa } from './korean.js';
import { SETTINGS, LURES, HAZARDS, SETTING_FAMILIES, settingFamily } from './crossroad-parts.js';
import { applyTurn } from './life-turns.js';

const YEAR = 365;
const has = (s, mark) => s.crossroads?.marks.includes(mark);
const siblings = (s) => s.relations.filter((r) => r.kind === 'sibling' && r.active !== false);
const motherNear = (s) => s.relations.some((r) => r.kind === 'mother' && r.active !== false);
const senior = (s) => s.day >= 8 * YEAR;
const frail = (s) => s.health < 50;
// One outcome: weight(s) decides how likely it is; hurt starts an injury, die ends the life.
// turn moves the life somewhere else (life-turns.js): [kind, the record that says so].
const o = (
  weight,
  text,
  { delta = {}, mark = null, hurt = null, die = null, illness = null, turn = null } = {},
) => ({
  weight: typeof weight === 'function' ? weight : () => weight,
  text,
  delta,
  mark,
  hurt,
  die,
  illness,
  turn,
});
// The records written when a crossroad turns a life.
const TURN_TEXT = {
  family: [
    'family',
    '손 냄새를 따라 한참 걸었다. 그 사람은 문 앞에서 멈추더니 안쪽에 물그릇을 놓았다. 오늘 밤은 지붕 아래에서 잔다.',
  ],
  rescued: [
    'rescued',
    '길가에 웅크린 나를 누군가 천으로 감싸 안아 들었다. 소독약 냄새가 나는 곳에서 상처를 살피는 손길이 느껴진다.',
  ],
  caught: [
    'caught',
    '흔들리는 차에 실려 낯선 곳에 내려졌다. 철문 너머로 여러 개의 울음소리가 들린다.',
  ],
  lost: ['lost', '익숙한 문도 익숙한 목소리도 없는 곳에서 밤을 맞는다.'],
  escaped: ['escaped', '철문 냄새가 멀어졌다. 이제 길이 잠자리가 된다.'],
};

export const CROSSROADS = [
  {
    id: 'milk-push',
    from: 3,
    to: 28,
    ok: (s) => siblings(s).length >= 2,
    text: (s) =>
      `젖 냄새가 가장 진한 자리에 작은 몸들이 겹겹이 모여 있다. ${siblings(s).length}마리가 서로를 밀어낸다. 배 속이 비어 있다.`,
    know: '한배 새끼가 많으면 밀려난 새끼는 첫 달에 젖을 덜 먹게 됩니다. (게임용 가정)',
    options: [
      {
        id: 'push',
        text: '머리를 들이밀고 형제들 사이로 파고든다',
        outcomes: [
          o(70, '형제를 밀어내고 젖에 닿았다. 배가 따뜻하게 찼다.', {
            delta: { hunger: -25, health: 3 },
            mark: 'pushy',
          }),
          o(30, '밀어내다 형제의 이빨이 귀에 닿았다. 짧게 울고 다시 파고들었다.', {
            delta: { hunger: -12, health: -4, stress: 6 },
            mark: 'pushy',
          }),
        ],
      },
      {
        id: 'wait',
        text: '한쪽에서 기다렸다가 비는 자리를 찾는다',
        outcomes: [
          o(55, '형제들이 잠든 뒤에야 남은 젖에 닿았다. 조금밖에 먹지 못했다.', {
            delta: { hunger: -8, health: -2 },
            mark: 'patient',
          }),
          o(45, '기다리는 사이 어미가 몸을 돌려 빈자리를 만들었다.', {
            delta: { hunger: -18 },
            mark: 'patient',
          }),
        ],
      },
      {
        id: 'cry',
        text: '어미 쪽으로 기어가며 작게 낑낑댄다',
        outcomes: [
          o((s) => (motherNear(s) ? 70 : 10), '어미가 코로 나를 밀어 젖 가까이 데려다 놓았다.', {
            delta: { hunger: -20, familyBond: 4 },
          }),
          o(30, '소리는 형제들의 울음에 묻혔다. 차가운 바닥 쪽으로 밀려났다.', {
            delta: { hunger: -5, comfort: -6 },
          }),
        ],
      },
    ],
  },
  {
    id: 'bone-quarrel',
    from: 60,
    to: 2 * YEAR,
    ok: (s) => siblings(s).length >= 1 || s.home !== 'family',
    text: (s) =>
      `${siblings(s).length ? '형제가' : '낯익은 개가'} 뼈를 물고 있다가 잠깐 내려놓았다. 기름 냄새가 코끝을 찌른다. 상대의 등털이 서 있다.`,
    know: '어린 개끼리의 다툼은 대부분 소리로 끝나지만, 가끔 깊이 물려 상처가 덧나기도 합니다.',
    options: [
      {
        id: 'grab',
        text: '재빨리 뼈를 물고 달아난다',
        outcomes: [
          o(60, '뼈를 물고 구석까지 달렸다. 한동안 혼자 씹었다.', {
            delta: { hunger: -10, happiness: 4 },
            mark: 'bold',
          }),
          o(30, '상대가 뒤쫓아와 엉덩이를 물었다. 뼈를 떨어뜨리고 웅크렸다.', {
            delta: { health: -6, stress: 8 },
          }),
          o((s) => (frail(s) ? 15 : 8), '깊게 물린 다리가 부어올랐다. 딛을 때마다 아프다.', {
            hurt: '다툼 끝에 물린 앞다리가 부어올랐다. 딛을 때마다 몸이 움찔한다.',
          }),
        ],
      },
      {
        id: 'growl',
        text: '몸을 낮추고 낮게 으르렁거린다',
        outcomes: [
          o(45, '상대가 귀를 눕히고 물러났다. 뼈는 내 것이 되었다.', {
            delta: { hunger: -8, stress: -2 },
            mark: 'bold',
          }),
          o(55, '상대도 으르렁거렸다. 한참 서로를 노려보다 둘 다 자리를 떴다.', {
            delta: { stress: 5 },
          }),
        ],
      },
      {
        id: 'yield',
        text: '고개를 돌리고 자리를 비켜 준다',
        outcomes: [
          o(100, '고개를 돌리자 상대의 등털이 가라앉았다. 나중에 그 개 옆에서 같이 잤다.', {
            delta: { dogBond: 5, hunger: 4 },
            mark: 'gentle',
          }),
        ],
      },
    ],
  },
  {
    id: 'street-meat',
    from: 90,
    to: 20 * YEAR,
    ok: (s) => s.home !== 'family' || s.needs.hunger > 60,
    text: () =>
      '길가 담장 아래에 고기 조각이 떨어져 있다. 진하고 단 냄새가 난다. 주변에 사람의 발자국 냄새가 섞여 있다.',
    know: '길에 놓인 먹이에는 상한 것이나 쥐약이 섞여 있기도 합니다.',
    options: [
      {
        id: 'eat',
        text: '배고픈 대로 한입에 먹어 치운다',
        outcomes: [
          o(70, '배가 묵직하게 찼다. 그늘에서 오래 잤다.', { delta: { hunger: -30 } }),
          o(22, '먹고 나서 배가 꼬이듯 아팠다. 밤새 몇 번이나 토했다.', {
            delta: { health: -10, hunger: -10, comfort: -8 },
            mark: 'stomach-wary',
          }),
          o(8, '단 냄새 속에 다른 것이 섞여 있었다. 다리가 떨리고 숨이 가빠졌다.', {
            die: {
              cause: '길에서 먹은 먹이의 독',
              text: '몸이 점점 무거워졌다. 담장 아래 그늘에서 숨이 천천히 멎었다.',
            },
          }),
        ],
      },
      {
        id: 'sniff',
        text: '오래 냄새를 맡고 조금만 먹는다',
        outcomes: [
          o(80, '조금 먹고 나머지는 남겼다. 배고픔이 조금 가라앉았다.', {
            delta: { hunger: -12 },
            mark: 'stomach-wary',
          }),
          o(20, '조금 먹었는데도 속이 울렁거렸다. 하루를 웅크려 보냈다.', {
            delta: { health: -5 },
            mark: 'stomach-wary',
          }),
        ],
      },
      {
        id: 'leave',
        text: '사람 냄새가 걸려 그냥 지나간다',
        outcomes: [
          o(100, '배는 고팠지만 걸음을 옮겼다. 그날 밤은 길었다.', {
            delta: { hunger: 10, stress: 3 },
          }),
        ],
      },
    ],
  },
  {
    id: 'road-smell',
    from: 120,
    to: 20 * YEAR,
    ok: (s) => s.home !== 'shelter',
    text: (s) =>
      `${has(s, 'traffic-fear') ? '바닥을 울리는 굉음이 들리자 몸이 먼저 굳는다. ' : ''}길 건너편에서 구운 고기 냄새가 바람을 타고 온다. 발밑이 단단하고 매끈하다. 무언가 큰 것들이 바람을 일으키며 지나간다.`,
    know: '이곳은 차가 쉬지 않고 다니는 넓은 도로입니다. 개는 차의 속도를 가늠하지 못합니다.',
    options: [
      {
        id: 'dash',
        text: '냄새를 따라 곧장 뛰어 건넌다',
        outcomes: [
          o(60, '굉음 사이로 달려 건넜다. 심장이 한참 뛰었다. 고기 조각을 찾았다.', {
            delta: { hunger: -15, stress: 10 },
            mark: 'traffic-fear',
          }),
          o(
            (s) => 26 + (senior(s) ? 8 : 0),
            '바로 옆을 스친 바퀴에 다리가 부딪혔다. 절뚝이며 건너편 풀숲에 숨었다.',
            {
              hurt: '도로에서 바퀴에 부딪힌 뒷다리가 붓고 뜨겁다. 몸을 일으키기 어렵다.',
              mark: 'traffic-fear',
            },
          ),
          o((s) => 6 + (frail(s) ? 4 : 0) + (senior(s) ? 4 : 0), '빛과 굉음이 한꺼번에 덮쳤다.', {
            die: {
              cause: '도로에서 차에 치임',
              text: '도로 위에서 몸이 멈췄다. 고기 냄새는 아직 바람에 실려 있었다.',
            },
          }),
        ],
      },
      {
        id: 'wait',
        text: '굉음이 멎을 때까지 기다렸다가 건넌다',
        outcomes: [
          o(85, '소리가 끊긴 틈에 건넜다. 냄새가 나던 자리는 이미 비어 있었다.', {
            delta: { hunger: 4 },
            mark: 'road-wise',
          }),
          o(15, '건너는 도중 굉음이 다시 다가왔다. 몸을 날려 연석 위로 굴렀다.', {
            delta: { health: -6, stress: 12 },
            mark: 'traffic-fear',
          }),
        ],
      },
      {
        id: 'stay',
        text: '이쪽 길가에 남아 냄새만 맡는다',
        outcomes: [
          o(100, '냄새가 사라질 때까지 코를 들고 있었다. 배는 비어 있었다.', {
            delta: { hunger: 8 },
          }),
        ],
      },
    ],
  },
  {
    id: 'cold-night',
    from: 150,
    to: 20 * YEAR,
    ok: (s) => s.home !== 'family' && s.world !== 'heat',
    text: () =>
      '밤바람이 털 사이로 파고든다. 방금 멈춘 큰 것 아래에서 따뜻한 기운이 새어 나온다. 저쪽 골목에는 다른 개들이 뭉쳐 자고, 젖은 상자 하나가 벽에 기대어 있다.',
    know: '주차된 차 밑은 따뜻하지만, 차가 다시 움직일 때 다치는 일이 잦습니다.',
    options: [
      {
        id: 'car',
        text: '따뜻한 기운이 나는 큰 것 아래로 기어든다',
        outcomes: [
          o(75, '따뜻한 바닥에서 깊이 잤다. 새벽에 진동이 오기 전에 빠져나왔다.', {
            delta: { comfort: 8, fatigue: -20 },
          }),
          o(
            (s) => 25 + (s.needs.fatigue > 70 ? 10 : 0),
            '깊이 잠든 사이 아래가 움직였다. 꼬리와 다리가 바닥에 쓸렸다.',
            {
              hurt: '잠든 사이 움직인 차 아래에서 다리가 쓸렸다. 상처가 쓰라리다.',
              mark: 'traffic-fear',
            },
          ),
        ],
      },
      {
        id: 'pack',
        text: '골목의 개 무리 쪽으로 다가간다',
        outcomes: [
          o(
            (s) => (has(s, 'gentle') ? 80 : 50),
            '가장자리 개가 몸을 비켜 주었다. 여러 몸의 온기 사이에서 잤다.',
            { delta: { comfort: 6, dogBond: 6, fatigue: -15 }, mark: 'gentle' },
          ),
          o(50, '무리의 큰 개가 이빨을 드러냈다. 물러나 벽 쪽에서 떨며 밤을 보냈다.', {
            delta: { stress: 10, health: -3 },
          }),
        ],
      },
      {
        id: 'box',
        text: '젖은 상자 안에 몸을 말아 넣는다',
        outcomes: [
          o(100, '바람은 막혔지만 몸이 끝내 마르지 않았다. 새벽에 기침이 났다.', {
            delta: { comfort: -4, health: -5, fatigue: -8 },
          }),
        ],
      },
    ],
  },
  {
    id: 'thunder-night',
    from: 180,
    to: 20 * YEAR,
    ok: (s) => s.world === 'rain',
    text: (s) =>
      `${has(s, 'sound-fear') ? '하늘이 갈라지는 소리가 들리기도 전에 몸이 떨리기 시작한다. ' : ''}하늘이 갈라지는 소리가 바닥까지 울린다. 귀가 아프고 숨이 가빠진다. ${s.home === 'family' ? '문 하나가 조금 열려 있다.' : '어두운 길이 사방으로 뻗어 있다.'}`,
    know: '큰 소리에 놀라 달아난 개는 익숙한 곳에서 멀어져 길을 잃거나 다치기 쉽습니다.',
    options: [
      {
        id: 'run',
        text: '소리에서 멀어지려고 무작정 달린다',
        outcomes: [
          o(55, '한참 달린 뒤 낯선 냄새 속에서 멈췄다. 돌아오는 데 하루가 걸렸다.', {
            delta: { fatigue: 25, stress: 12, hunger: 15 },
            mark: 'sound-fear',
          }),
          o(35, '어둠 속에서 무언가에 부딪혔다. 앞발이 찢어졌다.', {
            hurt: '천둥에 놀라 달리다 부딪힌 앞발이 찢어졌다. 피가 멈추지 않는다.',
            mark: 'sound-fear',
          }),
          o(
            (s) => (s.home === 'family' ? 4 : 8) + (senior(s) ? 4 : 0),
            '빗속에서 굉음과 빛이 한꺼번에 덮쳤다.',
            {
              die: {
                cause: '천둥에 놀라 달아나다 사고',
                text: '빗물이 흐르는 길 위에서 몸이 멈췄다. 소리는 그제야 멀어졌다.',
              },
            },
          ),
        ],
      },
      {
        id: 'hide',
        text: '가장 좁고 어두운 곳으로 파고든다',
        outcomes: [
          o(75, '좁은 틈에서 몸을 말고 소리가 지나가기를 기다렸다.', {
            delta: { stress: 4 },
          }),
          o(25, '틈에 몸이 끼었다. 소리가 멎은 뒤에야 겨우 빠져나왔다.', {
            delta: { stress: 10, health: -3 },
            mark: 'sound-fear',
          }),
        ],
      },
      {
        id: 'near',
        text: '아는 냄새가 있는 쪽으로 몸을 붙인다',
        outcomes: [
          o(
            (s) => (s.home === 'street' ? 30 : 85),
            '익숙한 온기에 몸을 붙였다. 떨림이 천천히 가라앉았다.',
            { delta: { stress: -6, trust: 5, familyBond: 4 } },
          ),
          o(
            (s) => (s.home === 'street' ? 70 : 15),
            '곁에 아무도 없었다. 벽에 몸을 붙이고 밤새 떨었다.',
            { delta: { stress: 8 }, mark: 'sound-fear' },
          ),
        ],
      },
    ],
  },
  {
    id: 'flood-stream',
    from: 200,
    to: 15 * YEAR,
    ok: (s) => s.world === 'rain' && s.home !== 'shelter',
    text: () =>
      '비에 불어난 물줄기가 길을 끊었다. 건너편에서 익숙한 냄새가 난다. 물은 흙빛이고 빠르게 흐른다.',
    know: '불어난 물은 보기보다 빠릅니다. 작은 개는 몇 걸음 만에 휩쓸릴 수 있습니다.',
    options: [
      {
        id: 'swim',
        text: '물속으로 뛰어들어 건너편으로 헤엄친다',
        outcomes: [
          o(65, '물살에 밀리면서도 건너편 흙을 딛었다. 몸을 털고 냄새를 따라갔다.', {
            delta: { fatigue: 25, comfort: -6 },
            mark: 'bold',
          }),
          o(25, '물살이 몸을 굴렸다. 돌에 옆구리를 부딪히고 겨우 기어 나왔다.', {
            hurt: '물살에 휩쓸려 돌에 부딪힌 옆구리가 아프다. 숨 쉴 때마다 결린다.',
          }),
          o((s) => 10 + (s.day < YEAR ? 6 : 0) + (senior(s) ? 6 : 0), '물이 귀와 코를 덮었다.', {
            die: {
              cause: '불어난 물에 휩쓸림',
              text: '흙빛 물살이 몸을 데려갔다. 건너편의 냄새는 끝내 닿지 않았다.',
            },
          }),
        ],
      },
      {
        id: 'along',
        text: '물가를 따라 좁아지는 곳을 찾는다',
        outcomes: [
          o(70, '한참 걸어 돌이 드러난 곳을 찾았다. 발을 적시며 건넜다.', {
            delta: { fatigue: 15 },
            mark: 'road-wise',
          }),
          o(30, '물가 흙이 무너졌다. 발이 빠졌다가 간신히 빠져나왔다.', {
            delta: { health: -4, stress: 8 },
          }),
        ],
      },
      {
        id: 'back',
        text: '돌아서서 물이 빠지기를 기다린다',
        outcomes: [
          o(100, '물이 빠진 다음 날 건넜다. 냄새는 희미해져 있었다.', {
            delta: { hunger: 8 },
          }),
        ],
      },
    ],
  },
  {
    id: 'big-dog',
    from: YEAR,
    to: 12 * YEAR,
    ok: (s) => s.home !== 'family',
    text: (s) =>
      `${has(s, 'bold') ? '' : '몸이 먼저 움츠러든다. '}음식 찌꺼기가 쌓인 곳 앞에 몸집이 두 배는 되는 개가 서 있다. 낮게 울리는 소리를 낸다. 찌꺼기 냄새가 진하다.`,
    know: '영역을 지키는 큰 개와 싸우면 작은 개는 깊은 상처를 입기 쉽습니다.',
    options: [
      {
        id: 'fight',
        text: '털을 세우고 맞선다',
        outcomes: [
          o(
            (s) => (has(s, 'bold') ? 35 : 20),
            '맞서자 큰 개가 한 발 물러났다. 찌꺼기를 배불리 먹었다.',
            { delta: { hunger: -25, stress: 5 }, mark: 'bold' },
          ),
          o(50, '목덜미를 물리고 내동댕이쳐졌다. 물린 자리가 뜨겁다.', {
            hurt: '큰 개에게 물린 목덜미와 어깨가 붓고 열이 난다.',
          }),
          o((s) => (frail(s) || senior(s) ? 12 : 4), '큰 몸이 나를 덮쳤다.', {
            die: {
              cause: '다른 개와의 싸움에서 입은 상처',
              text: '찌꺼기 냄새가 나는 자리 앞에서 몸을 일으키지 못했다.',
            },
          }),
        ],
      },
      {
        id: 'belly',
        text: '몸을 낮추고 배를 보인다',
        outcomes: [
          o(80, '큰 개가 냄새를 맡고 돌아섰다. 남은 찌꺼기 몇 조각을 먹었다.', {
            delta: { hunger: -8, dogBond: 3 },
            mark: 'gentle',
          }),
          o(20, '큰 개가 앞발로 나를 눌렀다. 한참 뒤에야 놓아주었다.', {
            delta: { stress: 10 },
          }),
        ],
      },
      {
        id: 'leave',
        text: '돌아서 다른 골목을 찾는다',
        outcomes: [
          o(100, '다른 골목에서 찾은 것은 빈 봉지 냄새뿐이었다.', { delta: { hunger: 10 } }),
        ],
      },
    ],
  },
  {
    id: 'stranger-hand',
    from: 120,
    to: 15 * YEAR,
    ok: (s) => s.home === 'street',
    text: (s) =>
      `낯선 사람이 쪼그려 앉아 손을 내민다. 손에서 고기 냄새와 낯선 기름 냄새가 같이 난다. ${has(s, 'traffic-fear') ? '등 뒤에서 큰 것의 진동이 느껴진다. ' : ''}`,
    know: '길의 개에게 다가오는 사람은 먹이를 주려는 사람일 수도, 개를 쫓아내거나 잡으려는 사람일 수도 있습니다.',
    options: [
      {
        id: 'approach',
        text: '꼬리를 낮게 흔들며 다가가 냄새를 맡는다',
        outcomes: [
          o(45, '손바닥의 고기를 받아먹었다. 사람은 한동안 같은 자리에 앉아 있었다.', {
            delta: { hunger: -15, trust: 8 },
            mark: 'trusting',
          }),
          o(15, '고기를 받아먹고 일어선 사람을 따라 걸었다.', {
            delta: { hunger: -15, trust: 10 },
            mark: 'trusting',
            turn: TURN_TEXT.family,
          }),
          o(30, '다가가자 다른 손이 목을 잡으려 했다. 몸을 비틀어 빠져나왔다.', {
            delta: { trust: -10, stress: 12 },
            mark: 'hand-shy',
          }),
          o(10, '돌이 날아와 옆구리에 맞았다. 깨갱대며 달아났다.', {
            delta: { trust: -15, health: -6 },
            mark: 'hand-shy',
          }),
        ],
      },
      {
        id: 'distance',
        text: '거리를 두고 앉아 사람이 놓고 가기를 기다린다',
        outcomes: [
          o(70, '사람이 고기를 바닥에 두고 물러났다. 다 먹을 때까지 사람을 지켜보았다.', {
            delta: { hunger: -10, trust: 3 },
          }),
          o(30, '사람은 한참 기다리다 일어나 가 버렸다.', { delta: { hunger: 4 } }),
        ],
      },
      {
        id: 'flee',
        text: '낯선 냄새가 싫어 몸을 돌려 달아난다',
        outcomes: [
          o(100, '골목 끝까지 달아났다. 그 사람의 냄새는 기억에 남았다.', {
            delta: { stress: 4 },
            mark: 'hand-shy',
          }),
        ],
      },
    ],
  },
  {
    id: 'high-bed',
    from: 7 * YEAR,
    to: 25 * YEAR,
    ok: (s) => s.home === 'family',
    text: () =>
      '사람이 높은 잠자리 위에서 나를 부른다. 예전에는 한 번에 뛰어오르던 곳이다. 뒷다리가 예전 같지 않다.',
    know: '나이 든 개가 높은 곳에서 뛰어오르내리다 다리나 허리를 다치는 일이 흔합니다.',
    options: [
      {
        id: 'jump',
        text: '예전처럼 힘껏 뛰어오른다',
        outcomes: [
          o(
            (s) => (frail(s) ? 35 : 60),
            '뒷발이 미끄러졌지만 겨우 올라섰다. 사람 옆에 몸을 붙였다.',
            { delta: { familyBond: 5, comfort: 4 } },
          ),
          o(
            (s) => (frail(s) ? 65 : 40),
            '뒷다리가 끝까지 밀어 주지 못했다. 바닥에 떨어지며 허리가 꺾였다.',
            { hurt: '높은 곳에서 떨어지며 허리와 뒷다리를 다쳤다. 일어서려 하면 몸이 떨린다.' },
          ),
        ],
      },
      {
        id: 'call',
        text: '아래에서 앞발을 걸치고 작게 낑낑댄다',
        outcomes: [
          o(85, '사람이 몸을 숙여 나를 안아 올렸다. 그날부터 계단이 놓였다.', {
            delta: { familyBond: 8, comfort: 6 },
            mark: 'trusting',
          }),
          o(15, '사람은 잠들어 있었다. 바닥에서 사람 냄새가 나는 쪽에 누웠다.', {
            delta: { comfort: -2 },
          }),
        ],
      },
      {
        id: 'floor',
        text: '바닥의 익숙한 방석으로 간다',
        outcomes: [
          o(100, '방석에 누워 위에서 들리는 숨소리를 들었다.', { delta: { fatigue: -10 } }),
        ],
      },
    ],
  },
];

export function initCrossroads(s) {
  s.crossroads ??= { version: 1, next: 20, seen: [], marks: [], history: [] };
  s.crossroads.genNext ??= 75 + (mix(s.seed, 2720) % 45);
  s.crossroads.used ??= [];
  return s.crossroads;
}

// Generated crossroads: setting × lure × hazard, plus the dog's need and who is near.
// The same lure and hazard never meet twice in one life while other pairs remain.
const WHO = {
  mother: '어미의 냄새가 등 뒤에 있다.',
  sibling: '형제 하나가 옆에 바짝 붙어 있다.',
  person: '익숙한 사람의 목소리가 조금 떨어진 곳에서 들린다.',
};
const WHO_OPTION = {
  mother: '어미 곁으로 파고든다',
  sibling: '형제 옆에 몸을 붙이고 기다린다',
  person: '익숙한 목소리 쪽으로 돌아간다',
};
// The mother is only near where the litter lives, never out on a walk or a road.
const DEN = ['yard', 'kitchen', 'kennel', 'barn', 'field', 'alley', 'shelteryard'];
function companionNear(s, setting) {
  if (s.day < 120 && motherNear(s) && DEN.includes(setting)) return 'mother';
  if (s.day < 365 && siblings(s).length) return 'sibling';
  if (s.home !== 'street' && s.caregiverId) return 'person';
  return null;
}
function needLine(s, lure) {
  if (s.needs.hunger > 65) return '배 속이 비어 있다.';
  if (s.needs.thirst > 65 && lure !== 'water') return '혀가 바싹 마른다.';
  if (s.needs.fatigue > 75) return '몸이 무겁다.';
  return null;
}
const pick = (list, n) => list[n % list.length];
function combos(s, state) {
  const out = [];
  for (const setting of [...new Set(settingFamilyList(s))]) {
    const st = SETTINGS[setting];
    for (const lure of st.lures) {
      const L = LURES[lure];
      if ((L.min && s.day < L.min) || (L.ok && !L.ok(s))) continue;
      for (const hazard of st.hazards) {
        const H = HAZARDS[hazard];
        if ((H.ok && !H.ok(s)) || (H.lures && !H.lures.includes(lure))) continue;
        out.push({ setting, lure, hazard, fresh: !state.used.includes(`${lure}:${hazard}`) });
      }
    }
  }
  const fresh = out.filter((c) => c.fresh);
  return fresh.length ? fresh : out;
}
const settingFamilyList = (s) => SETTING_FAMILIES[settingFamily(s)];
export function generatedText(s, g) {
  const st = SETTINGS[g.setting],
    L = LURES[g.lure],
    H = HAZARDS[g.hazard];
  return [
    needLine(s, g.lure),
    pick(st.text, g.v),
    L.sense(g.item, josa),
    pick(H.cue, g.v),
    has(s, `${g.hazard}-fear`) ? H.fear : null,
    g.who ? WHO[g.who] : null,
  ]
    .filter(Boolean)
    .join(' ');
}
function generate(s, state) {
  let pool = combos(s, state);
  if (!pool.length) return null;
  const n = mix(s.seed + s.day, 2721);
  // A street life is short and turns on people: give the moments that can change it
  // (someone calling, someone with a net) a fair share before it is over.
  const people = pool.filter((c) => c.lure === 'person' || c.hazard === 'hostile-human');
  if (s.home === 'street' && people.length && n % 10 < 4) pool = people;
  const c = pool[(n >>> 4) % pool.length],
    L = LURES[c.lure];
  return {
    setting: c.setting,
    lure: c.lure,
    hazard: c.hazard,
    item: L.items ? pick(L.items, n >>> 4) : null,
    v: (n >>> 8) % 4,
    who: companionNear(s, c.setting),
  };
}
// The risk model for a generated moment. Rushing is the most rewarding and the most dangerous;
// being careful halves the reward and cuts the danger to about a third; staying never hurts.
function generatedOptions(s, g) {
  const L = LURES[g.lure],
    H = HAZARDS[g.hazard],
    young = s.day < 180,
    wise = has(s, `${g.hazard}-wise`) ? 0.6 : 1,
    body = (young ? 1.3 : 1) * (senior(s) ? 1.3 : 1) * (frail(s) ? 1.2 : 1),
    base = { 3: 0.26, 2: 0.28, 1: 0.32 }[H.severity] * body * wise,
    deadly = H.death && (H.severity === 3 || young || senior(s) || frail(s)),
    share = H.severity === 3 ? 0.09 : 0.06;
  const reward = () => L.reward(g.item, josa),
    hit = {
      text: H.hit,
      hurt: H.noInjury ? null : H.hurt,
      delta: H.cost || {},
      mark: `${g.hazard}-fear`,
      illness: H.illness,
    };
  // How a moment can turn a life: a family dog lost, a shelter dog slipping out, a street dog
  // caught or picked up hurt, or a street dog following someone home. [share, outcome text, turn]
  const hitTurn =
    // A dog that was lost once keeps closer to home after that.
    g.hazard === 'lost' && s.home === 'family' && !has(s, 'wanderer')
      ? [
          0.35,
          '냄새를 따라가다 보니 아는 냄새가 하나도 없었다. 해가 지도록 돌아가는 길을 찾지 못했다.',
          TURN_TEXT.lost,
          { hurt: null, delta: H.cost || {}, mark: 'wanderer' },
        ]
      : g.hazard === 'lost' && s.home === 'shelter' && ['open', 'scent', 'dogcall'].includes(g.lure)
        ? [
            0.7,
            '울타리 틈을 빠져나와 한참을 달렸다. 돌아보니 아는 냄새가 보이지 않는다.',
            TURN_TEXT.escaped,
            { hurt: null, delta: H.cost || {}, mark: 'wanderer' },
          ]
        : g.hazard === 'hostile-human' && s.home === 'street'
          ? [
              0.6,
              '그물 같은 것이 몸을 덮었다. 버둥거릴수록 더 조여 왔다.',
              TURN_TEXT.caught,
              { hurt: null, mark: 'hand-shy' },
            ]
          : !H.noInjury && s.home === 'street'
            ? [0.4, H.hit, TURN_TEXT.rescued, {}]
            : null;
  const follow =
    g.lure === 'person' && s.home === 'street'
      ? Math.min(0.6, 0.35 + (has(s, 'trusting') ? 0.15 : 0) + (s.trust >= 50 ? 0.1 : 0))
      : 0;
  const hits = (w) =>
    hitTurn
      ? [
          o(w * (1 - hitTurn[0]), hit.text, hit),
          o(w * hitTurn[0], hitTurn[1], { ...hit, ...hitTurn[3], turn: hitTurn[2] }),
        ]
      : [o(w, hit.text, hit)];
  const rewards = (w, opts) => [
    o(w * (1 - follow), reward(), opts),
    o(w * follow, reward(), { ...opts, mark: 'trusting', turn: TURN_TEXT.family }),
  ];
  const rush = [
    o(deadly ? base * share : 0, H.hit, { die: H.death }),
    ...hits(base * (deadly ? 1 - share : 1)),
    ...rewards((1 - base) * 0.9, { delta: L.delta, mark: 'bold' }),
    o((1 - base) * 0.1, L.lack, { delta: L.miss }),
  ];
  const careful = [
    ...hits(base * 0.35),
    o(base * 0.5, `${H.near} ${L.lack}`, { delta: L.miss, mark: `${g.hazard}-wise` }),
    ...rewards((1 - base * 0.85) * 0.6, { delta: L.delta }),
    o((1 - base * 0.85) * 0.4, L.lack, { delta: L.miss }),
  ];
  const options = [
    { id: 'rush', text: L.rush, outcomes: rush },
    { id: 'careful', text: L.careful, outcomes: careful },
  ];
  if (g.who)
    options.push({
      id: 'near',
      text: WHO_OPTION[g.who],
      outcomes: [
        o(1, `곁의 온기에 몸을 붙였다. ${L.lack}`, {
          delta: { ...L.miss, stress: -4, [g.who === 'person' ? 'familyBond' : 'dogBond']: 4 },
        }),
      ],
    });
  options.push({ id: 'avoid', text: L.avoid, outcomes: [o(1, L.lack, { delta: L.miss })] });
  return options;
}
function generatedKnow(g) {
  return HAZARDS[g.hazard].know(g.setting);
}
function generatedStep(s, state, decision) {
  if (
    s.day < state.genNext ||
    !canAct(s, 'walk') ||
    s.medical?.episode ||
    s.clinical?.active ||
    s.story?.lost
  )
    return false;
  const g = generate(s, state);
  if (!g) return false;
  const options = generatedOptions(s, g);
  if (
    !decision(
      s,
      'crossroad:gen',
      generatedText(s, g),
      options.map((x) => [x.id, x.text]),
    )
  )
    return false;
  s.pending.know = generatedKnow(g);
  s.pending.gen = g;
  state.used.push(`${g.lure}:${g.hazard}`);
  const gap = mix(s.seed + s.day, 2722);
  state.genNext =
    s.day +
    (s.day < 2 * YEAR ? 50 + (gap % 60) : senior(s) ? 150 + (gap % 150) : 110 + (gap % 130));
  return true;
}
function eligible(s, c) {
  return (
    s.day >= c.from &&
    s.day <= c.to &&
    !s.crossroads.seen.includes(c.id) &&
    (c.id === 'milk-push' || canAct(s, 'walk')) &&
    !s.medical?.episode &&
    !s.clinical?.active &&
    !s.story?.lost &&
    c.ok(s)
  );
}
// Moments that only exist where the dog lives now; a street dog is often adopted or gone within
// a year, so these go first while they still can happen.
const PLACE_BOUND = ['street-meat', 'cold-night', 'big-dog', 'stranger-hand', 'high-bed'];
// Every 2–5 months in the first two years (when most street lives turn), then every 6–14 months.
export function crossroadStep(s, { decision }) {
  const state = initCrossroads(s);
  if (s.pending) return false;
  if (s.day < state.next) return generatedStep(s, state, decision);
  let pool = CROSSROADS.filter((c) => eligible(s, c));
  if (!pool.length) {
    state.next = s.day + 20;
    return generatedStep(s, state, decision);
  }
  const bound = pool.filter((c) => PLACE_BOUND.includes(c.id));
  if (bound.length) pool = bound;
  const c = pool[mix(s.seed + s.day, 2711) % pool.length];
  if (
    !decision(
      s,
      'crossroad:' + c.id,
      c.text(s),
      c.options.map((x) => [x.id, x.text]),
    )
  )
    return false;
  s.pending.know = c.know;
  state.seen.push(c.id);
  const gap = mix(s.seed + s.day, 2712);
  state.next = s.day + (s.day < 60 ? 45 : s.day < 2 * YEAR ? 60 + (gap % 90) : 180 + (gap % 240));
  return true;
}
// Picks an outcome by weight with a hash of the seed and decision, so a replay draws the same one.
export function pickOutcome(s, option) {
  const weights = option.outcomes.map((x) => Math.max(0, x.weight(s)));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = ((mix(s.seed + s.day, (s.decisionSerial || 0) + 2713) % 10000) / 10000) * total;
  for (let i = 0; i < weights.length; i++) {
    if (roll < weights[i]) return option.outcomes[i];
    roll -= weights[i];
  }
  return option.outcomes.at(-1);
}
export function crossroadChoice(s, p, id, { log, remember }) {
  if (!p.id.startsWith('crossroad:')) return false;
  const c =
      p.id === 'crossroad:gen' && p.gen
        ? {
            id: `gen:${p.gen.setting}:${p.gen.lure}:${p.gen.hazard}`,
            options: generatedOptions(s, p.gen),
          }
        : CROSSROADS.find((x) => 'crossroad:' + x.id === p.id),
    option = c?.options.find((x) => x.id === id);
  if (!option) return false;
  const out = pickOutcome(s, option),
    state = initCrossroads(s);
  for (const [k, v] of Object.entries(out.delta)) {
    const owner = k in s.needs ? s.needs : s;
    owner[k] = Math.max(0, Math.min(100, owner[k] + v));
  }
  log(s, 'crossroad-result', out.text);
  s.log.at(-1).storyId = 'crossroad:' + c.id;
  if (out.mark && !state.marks.includes(out.mark)) {
    state.marks.push(out.mark);
    (state.markDays ??= {})[out.mark] = s.day;
  }
  state.history.push({ id: c.id, day: s.day, option: id, outcome: option.outcomes.indexOf(out) });
  remember(s, `crossroad:${c.id}:${id}`);
  if (out.hurt) beginIllness(s, { log, random: () => 0 }, out.illness || 'injury', out.hurt);
  if (out.turn && !out.die) applyTurn(s, out.turn, { log, remember });
  if (out.die) {
    s.alive = false;
    s.pending = null;
    s.cause = out.die.cause;
    log(s, 'death', out.die.text);
    if (s.chronicle) s.chronicle.phase = 'ending';
  }
  return true;
}
export function validCrossroad(id) {
  return id === 'crossroad:gen' || CROSSROADS.some((c) => 'crossroad:' + c.id === id);
}
// A generated moment waiting in a save must still name parts that exist.
export function validGenerated(g) {
  return (
    g &&
    g.setting in SETTINGS &&
    g.lure in LURES &&
    g.hazard in HAZARDS &&
    Number.isInteger(g.v) &&
    (g.who == null || g.who in WHO) &&
    (g.item == null || (LURES[g.lure].items || []).includes(g.item))
  );
}
export function validateCrossroads(s) {
  const c = s.crossroads;
  if (
    c &&
    (!Number.isFinite(c.next) ||
      !Array.isArray(c.seen) ||
      !c.seen.every(validId) ||
      !Array.isArray(c.marks) ||
      !c.marks.every((m) => typeof m === 'string') ||
      !Array.isArray(c.history) ||
      (c.used != null && (!Array.isArray(c.used) || !c.used.every((u) => typeof u === 'string'))) ||
      (c.markDays != null &&
        (typeof c.markDays !== 'object' || !Object.values(c.markDays).every(Number.isInteger))) ||
      (s.pending?.id === 'crossroad:gen' && !validGenerated(s.pending.gen)))
  )
    throw Error('손상된 갈림길 기록');
}
const validId = (id) => CROSSROADS.some((c) => c.id === id);
