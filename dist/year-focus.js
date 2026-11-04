// The year's direction: after weaning and on every birthday (and after moving to a new kind of
// home) the player picks what this dog leans toward for the coming year. It is a decision like
// any other, so it goes in the trail and a replay makes the same choice. The direction shifts
// which moments come and how risky they are; the size of each shift is a game assumption,
// shown to the player next to the field figures it plays against.
import { STREET_REPRODUCTION } from './reproduction-data.js';
import { UK_REFERENCE } from './statistics.js';
import { SHELTER_OUTCOMES } from './shelter-outcomes.js';

const YEAR = 365;
const pct = (x) => `${Math.round(x * 1000) / 10}%`;
// effect keys, all read through focusEffect(s):
//   lures  — generated crossroads lean to these lures half of the time (crossroads.js)
//   people — street: how often people moments are favoured (×)
//   danger — street pup daily danger (×, street-survival.js)
//   food   — food availability (+, physiology.js)
//   gap    — time between generated crossroads (×)
//   appeal — shelter adoption appeal (×, shelter-outcomes.js)
//   bond / joy / calm — small daily changes to family bond, happiness and stress
export const FOCUS = {
  street: [
    {
      id: 'forage',
      text: '먹이 냄새를 따라 멀리 다닌다',
      line: '먹이를 찾아 더 멀리 다닌',
      effect: { lures: ['food', 'prey', 'scent'], food: 0.1, danger: 1.1 },
      know: '먹이를 만나는 갈림길이 늘고 먹이 찾기가 쉬워지지만, 강아지 때의 위험이 1.1배가 됩니다',
    },
    {
      id: 'pack',
      text: '다른 개들 곁에 붙어 지낸다',
      line: '다른 개들 곁에 붙어 지낸',
      effect: { lures: ['dogcall', 'buddy', 'warmth'], danger: 0.75, people: 0.5, food: 0.03 },
      know: '개들 사이의 갈림길이 늘고 강아지 때의 위험이 0.75배로 줄지만, 사람을 만날 일은 절반이 됩니다',
    },
    {
      id: 'people',
      text: '사람 사는 곳을 기웃거린다',
      line: '사람 곁을 기웃거린',
      effect: { lures: ['person', 'kids', 'food'], people: 1.8 },
      know: '배가 고파도 사람을 만나는 갈림길이 먼저 옵니다. 집이 생길 수도, 붙잡히거나 쫓겨날 수도 있습니다',
    },
    {
      id: 'hide',
      text: '조용한 자리에 숨어 지낸다',
      line: '조용한 자리에 숨어 지낸',
      effect: { gap: 1.6, danger: 0.7, food: -0.01 },
      know: '갈림길이 드물어지고 강아지 때의 위험이 0.7배로 줄지만, 먹이를 찾기가 어려워집니다',
    },
  ],
  family: [
    {
      id: 'close',
      text: '보호자 곁에 붙어 지낸다',
      line: '보호자 곁에 붙어 지낸',
      effect: { lures: ['person', 'warmth', 'toy'], bond: 0.06 },
      know: '사람과 함께하는 갈림길이 늘고, 보호자와의 정이 조금씩 더 깊어집니다',
    },
    {
      id: 'explore',
      text: '바깥 냄새를 쫓아다닌다',
      line: '바깥 냄새를 쫓아다닌',
      effect: { lures: ['scent', 'prey', 'open'], joy: 0.08 },
      know: '냄새와 사냥감, 열린 문을 만나는 갈림길이 늘어납니다. 즐겁지만 집 밖으로 나갈 일도 늘어납니다',
    },
    {
      id: 'friends',
      text: '다른 개들과 어울린다',
      line: '다른 개들과 어울린',
      effect: { lures: ['dogcall', 'buddy', 'toy'], joy: 0.04 },
      know: '다른 개를 만나는 갈림길이 늘어납니다. 친구가 생기기도, 다투기도 합니다',
    },
    {
      id: 'rest',
      text: '몸을 아끼며 천천히 지낸다',
      line: '몸을 아끼며 천천히 지낸',
      effect: { gap: 1.6, calm: 0.05 },
      know: '갈림길이 드물어지고 마음이 차분해집니다',
    },
  ],
  shelter: [
    {
      id: 'approach',
      text: '철문 앞으로 다가가 있는다',
      line: '철문 앞으로 다가가 있던',
      effect: { lures: ['person', 'kids'], appeal: 1.25 },
      know: '찾아온 사람 눈에 띌 일이 늘어 입양될 가능성이 1.25배가 됩니다',
    },
    {
      id: 'endure',
      text: '구석에서 조용히 견딘다',
      line: '구석에서 조용히 견딘',
      effect: { gap: 1.4, calm: 0.05, appeal: 0.9 },
      know: '마음은 덜 흔들리지만 사람 눈에 덜 띄어 입양될 가능성이 0.9배가 됩니다',
    },
  ],
};

export function initFocus(s) {
  s.focus ??= { current: null, years: [] };
  return s.focus;
}
const optionsFor = (s) => FOCUS[s.home] || null;
const findOption = (home, id) => FOCUS[home]?.find((o) => o.id === id) || null;

// The effect of this year's direction, or an empty one when the dog has moved to another kind
// of home since choosing it.
export function focusEffect(s) {
  const c = s.focus?.current;
  if (!c || c.home !== s.home) return {};
  return findOption(c.home, c.id)?.effect || {};
}
function due(s, f) {
  if (s.day < 60 || !optionsFor(s) || s.story?.lost) return false;
  if (!f.current) return true;
  if (f.current.home !== s.home) return s.day - (s.lastAreaChange?.day ?? f.current.start) >= 3;
  return s.day >= f.current.until;
}
// What the player knows when choosing: the field figures, then what each direction changes.
function focusKnow(s) {
  const R = STREET_REPRODUCTION,
    shelter = SHELTER_OUTCOMES[s.country?.id];
  const fact =
    s.home === 'street'
      ? `길에서 태어난 강아지 가운데 어른이 되는 것은 약 ${pct(R.pupReachMaturity.value)}이고, 죽음의 약 63%가 사람과 관련됩니다. (Paul et al. 2016)`
      : s.home === 'shelter' && shelter
        ? `이 나라 보호소에 들어온 동물의 ${pct(shelter.shares.adopted)}가 입양됩니다. (${shelter.source.split('(')[0].trim()})`
        : s.home === 'family'
          ? `영국 반려견의 평균 기대수명은 ${UK_REFERENCE.e0}년입니다. (${UK_REFERENCE.authors} ${UK_REFERENCE.published})`
          : '';
  const each = optionsFor(s)
    .map((o) => `'${o.text}' — ${o.know}.`)
    .join(' ');
  return `${fact} 고른 방향은 다음 생일까지 이어집니다. ${each} (변화의 크기는 게임 가정)`;
}
function focusText(s) {
  const age = Math.floor(s.day / YEAR);
  if (s.focus.current && s.focus.current.home !== s.home)
    return '사는 곳이 바뀌었다. 새 자리에서 무엇에 마음을 쓸까.';
  if (age === 0) return '젖을 떼고 혼자 먹기 시작했다. 앞으로의 한 해, 무엇에 마음을 쓸까.';
  return `${age}번째 생일이 지났다. 다가올 한 해, 무엇에 마음을 쓸까.`;
}
// Looks back on the direction that is ending, from the record of that year.
function review(s, f, log) {
  const c = f.current;
  if (!c) return;
  const o = findOption(c.home, c.id),
    since = s.log.filter((e) => e.day >= c.start),
    moments = since.filter((e) => e.id === 'crossroad-result').length,
    hurt = since.filter((e) => e.id === 'illness-onset').length,
    marks = (s.crossroads?.marks || []).length - c.marks,
    parts = [`갈림길 ${moments}번`];
  if (hurt) parts.push(`아프거나 다친 일 ${hurt}번`);
  if (marks > 0) parts.push(`새로 몸에 밴 것 ${marks}가지`);
  log(
    s,
    'year-review',
    `${o.line} ${s.day - c.start >= 300 ? '한 해였다' : '시간이었다'}. ${parts.join(', ')}.`,
  );
  f.years.push({ id: c.id, home: c.home, start: c.start, end: s.day, moments, hurt });
}
export function yearFocusStep(s, { decision, log }) {
  const f = initFocus(s);
  if (s.pending || !due(s, f)) return false;
  const options = optionsFor(s);
  if (
    !decision(
      s,
      'year-focus',
      focusText(s),
      options.map((o) => [o.id, o.text]),
    )
  )
    return false;
  s.pending.know = focusKnow(s);
  review(s, f, log);
  f.current = null;
  return true;
}
export function yearFocusChoice(s, p, id) {
  if (p.id !== 'year-focus') return false;
  const f = initFocus(s),
    o = findOption(s.home, id);
  if (!o) return false;
  f.current = {
    id,
    home: s.home,
    start: s.day,
    until: (Math.floor(s.day / YEAR) + 1) * YEAR,
    marks: (s.crossroads?.marks || []).length,
  };
  if (o.effect.appeal && s.shelterStay) s.shelterStay.appeal *= o.effect.appeal;
  return true;
}
// Small daily pulls of the direction.
export function yearFocusDaily(s) {
  const e = focusEffect(s),
    clamp = (v) => Math.max(0, Math.min(100, v));
  if (e.bond && s.home === 'family') s.familyBond = clamp(s.familyBond + e.bond);
  if (e.joy) s.needs.happiness = clamp(s.needs.happiness + e.joy);
  if (e.calm) s.stress = clamp(s.stress - e.calm);
}
// What the dog leaned toward, year by year, for the ending.
export function focusYears(s) {
  const f = s.focus;
  if (!f) return [];
  const all = [...f.years];
  if (f.current)
    all.push({ id: f.current.id, home: f.current.home, start: f.current.start, end: s.day });
  return all.map((y) => ({ ...y, text: findOption(y.home, y.id)?.text || y.id }));
}
export function validateFocus(s) {
  const f = s.focus;
  if (!f) return;
  if (
    !Array.isArray(f.years) ||
    (f.current &&
      (!findOption(f.current.home, f.current.id) ||
        !Number.isFinite(f.current.start) ||
        !Number.isFinite(f.current.until)))
  )
    throw Error('손상된 한 해 방향 기록');
}
