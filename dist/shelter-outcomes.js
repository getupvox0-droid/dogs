// What happens to a dog that enters a public animal shelter, from national statistics where a
// country publishes them. Each stay ends in one outcome drawn with the published shares; the
// dog's own behaviour toward visitors (a crossroad) changes its chance of being adopted.
import { mix } from './world.js';
import { applyTurn } from './life-turns.js';

export const SHELTER_OUTCOMES = {
  KR: {
    year: 2024,
    source:
      '농림축산검역본부, 2024년 반려동물 보호·복지 실태조사 (구조동물 10만 6,824마리, 개 72.4%)',
    // Share of rescued animals by outcome. inCare = still in the shelter at the year's end.
    shares: { returned: 0.114, natural: 0.275, adopted: 0.235, euthanized: 0.185, inCare: 0.135 },
    meanStayDays: 28.1,
    rescued: 106824,
    dogShare: 0.724,
  },
};
const roll = (s, salt) => (mix(s.seed + s.day, salt) % 1000000) / 1000000;
// Stay length: spread around the published mean (game assumption on the shape).
function stayDays(s, mean) {
  return Math.round(5 + -Math.log(1 - roll(s, 2851) * 0.999) * (mean - 5));
}
export function shelterData(s) {
  return SHELTER_OUTCOMES[s.country?.id] || null;
}
// Starts a stay when a dog is in a shelter of a country with data, and ends it on its day.
export function shelterStep(s, { log, remember }) {
  const data = shelterData(s);
  if (!data || s.home !== 'shelter' || !s.alive || s.day < 60) return false;
  let stay = s.shelterStay;
  if (!stay || stay.area !== s.areaId) {
    stay = s.shelterStay = {
      area: s.areaId,
      start: s.day,
      due: s.day + stayDays(s, data.meanStayDays),
      appeal: 1,
      returnable: !!s.story?.returnHome,
    };
    return false;
  }
  if (s.day < stay.due || s.pending) return false;
  const sh = data.shares,
    weights = {
      // Only a dog someone is looking for can be returned; the share goes to the others.
      returned: stay.returnable ? sh.returned : 0,
      adopted: sh.adopted * stay.appeal,
      natural: sh.natural * (s.health < 50 ? 1.5 : 1) * (s.day > 8 * 365 ? 1.5 : 1),
      euthanized: sh.euthanized,
      inCare: sh.inCare,
    };
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = roll(s, 2852) * total,
    outcome = 'inCare';
  for (const [k, w] of Object.entries(weights)) {
    if (r < w) {
      outcome = k;
      break;
    }
    r -= w;
  }
  stay.outcome = outcome;
  const ctx = { log, remember };
  if (outcome === 'inCare') {
    stay.due = s.day + stayDays(s, data.meanStayDays);
    return false;
  }
  if (outcome === 'adopted')
    return applyTurn(
      s,
      [
        'adopted',
        '철문 앞에 여러 번 찾아오던 사람이 서류를 들고 왔다. 목줄이 걸리고, 처음으로 그 사람의 차에 올랐다.',
      ],
      ctx,
    );
  if (outcome === 'returned')
    return applyTurn(
      s,
      [
        'returned',
        '철문 너머에서 익숙한 목소리가 내 이름을 불렀다. 달려온 사람이 무릎을 꿇고 나를 안았다. 손 냄새가 기억과 같다.',
      ],
      ctx,
    );
  s.alive = false;
  s.pending = null;
  if (outcome === 'natural') {
    s.cause = '보호소에서 병과 쇠약으로 숨짐';
    log(
      s,
      'death',
      '철문 안쪽 담요 위에서 숨이 점점 느려졌다. 돌보는 손이 마지막까지 등을 쓸어 주었다.',
    );
  } else {
    s.cause = '보호 기간이 끝난 뒤 인도적 처리';
    log(
      s,
      'death',
      '낯선 방으로 옮겨졌다. 익숙해진 직원의 손이 몸을 감쌌고, 잠이 쏟아지듯 몰려왔다.',
    );
  }
  if (s.chronicle) s.chronicle.phase = 'ending';
  return true;
}
// One line for the birth screen's player-only facts.
export function shelterFact(countryId) {
  const d = SHELTER_OUTCOMES[countryId];
  if (!d) return null;
  const p = (x) => `${Math.round(x * 1000) / 10}%`;
  return `이 나라에서 한 해 구조되는 동물 · 약 ${Math.round(d.rescued / 1000)}천 마리 (개 ${p(d.dogShare)}) · 입양 ${p(d.shares.adopted)} · 자연사 ${p(d.shares.natural)} · 인도적 처리 ${p(d.shares.euthanized)} · 주인 반환 ${p(d.shares.returned)} (${d.source})`;
}
// What the player sees at the shelter crossroad (crossroads.js).
export function shelterKnow(s) {
  const d = shelterData(s);
  if (!d) return '';
  const p = (x) => `${Math.round(x * 1000) / 10}%`;
  return `이 나라의 동물보호센터에 들어온 동물은 평균 ${Math.round(d.meanStayDays)}일 보호됩니다. ${d.year}년에는 ${p(d.shares.adopted)}가 입양되고, ${p(d.shares.natural)}가 자연사하고, ${p(d.shares.euthanized)}가 인도적 처리되었습니다. (${d.source})`;
}
export function validateShelterStay(s) {
  const t = s.shelterStay;
  if (
    t &&
    (typeof t.area !== 'string' ||
      !Number.isFinite(t.due) ||
      !Number.isFinite(t.appeal) ||
      t.appeal <= 0)
  )
    throw Error('손상된 보호소 기록');
}
