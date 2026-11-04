// A street pup's first months: most do not reach adulthood (reproduction-data.js, pupReachMaturity
// ≈ 19%, Paul et al. 2016). This adds the daily danger the rest of the engine does not model,
// with the causes in the proportions that study reports: about 63% of deaths come from people,
// directly (accidents, poison, beatings) or by taking the pup away; the rest from illness, cold
// and weakness. The dog's own choices change the odds: being fed, knowing how to find food,
// staying near its mother, and knowing the road.
import { mix } from './world.js';
import { STREET_REPRODUCTION } from './reproduction-data.js';
import { focusEffect } from './year-focus.js';

// Daily base chance, fitted so that average play reaches maturity at about the field figure
// (game calibration against pupReachMaturity; see tests/street-survival.test.mjs and
// scripts/measure-street-pups.mjs: automatic play ≈18%, rotating ≈21%, careful ≈23%).
export const PUP_BASE_DAILY = 0.0105;
const CAUSES = [
  // [weight, id, cause, record]; weights follow the human/other split above.
  [
    25,
    'accident',
    '길에서 차에 치임',
    '굉음과 함께 몸이 길가로 튕겨 나갔다. 작은 몸이 다시 일어나지 못했다.',
  ],
  [
    18,
    'poison',
    '길에 놓인 독을 먹음',
    '주워 먹은 것 뒤로 배가 뒤틀렸다. 웅크린 자리에서 숨이 가늘어지다 멎었다.',
  ],
  [
    12,
    'beaten',
    '사람에게 맞은 상처',
    '쫓겨 달아나다 무언가에 세게 맞았다. 숨을 곳까지 기어갔지만 그곳에서 움직임이 멈췄다.',
  ],
  [
    8,
    'taken',
    '사람에게 데려가진 뒤 행방을 알 수 없음',
    '낯선 손이 몸을 들어 올렸다. 어미의 냄새가 멀어졌고, 그 뒤의 일은 기록되지 않았다.',
  ],
  [
    20,
    'illness',
    '어린 날의 병',
    '열이 오르고 젖도 먹지 못했다. 형제들 사이에서 몸이 점점 차가워졌다.',
  ],
  [
    10,
    'cold',
    '추위와 비',
    '젖은 털이 마르지 않은 채 밤이 지났다. 아침이 되어도 몸이 다시 데워지지 않았다.',
  ],
  [7, 'weak', '먹이 부족에 따른 쇠약', '며칠째 배를 채우지 못했다. 일어설 힘이 남지 않았다.'],
];
const TOTAL = CAUSES.reduce((n, c) => n + c[0], 0);

// The day's danger for this pup, from its state. Every factor is a game assumption.
export function pupDanger(s) {
  const c = s.crossroads || {},
    near = s.relations?.some((r) => r.kind === 'mother' && r.active !== false);
  let d = PUP_BASE_DAILY;
  if (s.needs.hunger > 70) d *= 1.6;
  if (s.health < 50) d *= 1.5;
  if (near && s.day < 120) d *= 0.7;
  d *= 1 - Math.min(0.45, (c.forage || 0) / 60);
  if (c.marks?.includes('road-wise') || c.marks?.includes('traffic-wise')) d *= 0.85;
  if (c.marks?.includes('patient')) d *= 0.9;
  d *= focusEffect(s).danger ?? 1;
  return d;
}
export function streetPupStep(s, { log }) {
  if (s.home !== 'street' || !s.alive || s.story?.lost) return false;
  const mature = s.reproduction?.matureAt ?? 240;
  if (s.day < 21 || s.day >= mature) return false;
  const roll = (mix(mix(s.seed, 2801) + s.day, 2801) % 1000000) / 1000000;
  if (roll >= pupDanger(s)) return false;
  let pickRoll = mix(mix(s.seed, 2802) + s.day, 2802) % TOTAL;
  const [, id, cause, text] = CAUSES.find((c) => (pickRoll -= c[0]) < 0);
  s.alive = false;
  s.pending = null;
  s.cause = cause;
  s.streetPupCause = id;
  log(s, 'death', text);
  if (s.chronicle) s.chronicle.phase = 'ending';
  return true;
}
export const PUP_SURVIVAL_SOURCE = STREET_REPRODUCTION.pupReachMaturity;
