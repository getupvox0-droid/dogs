// How rare a finished life was, from published figures only: where it was born (birth-odds.js),
// how long it lived (UK life table, or the street-pup field studies) and, where a country
// publishes it, how its shelter stay ended. The combined "one in N" multiplies these as if they
// were independent, which they are not; it is a rough sense of scale and says so.
import { COUNTRIES } from './engine.js';
import { COUNTRY_DOGS, countryShares, homeShares } from './birth-odds.js';
import { UK_REFERENCE } from './statistics.js';
import { STREET_REPRODUCTION } from './reproduction-data.js';
import { SHELTER_OUTCOMES } from './shelter-outcomes.js';

const HOME = { family: '가정', street: '길·마을', shelter: '보호시설' };
const pct = (x) =>
  x >= 0.1
    ? `${Math.round(x * 100)}%`
    : x >= 0.01
      ? `${Math.round(x * 1000) / 10}%`
      : `${Math.round(x * 10000) / 100}%`;
const short = (src) => src.split(',')[0].split('(')[0].trim();

// Share of UK companion dogs alive at the start of year `y` (Teng et al. 2022).
export function ukSurvival(y) {
  let p = 1;
  for (let i = 0; i < Math.min(y, UK_REFERENCE.annualQ.length); i++)
    p *= 1 - UK_REFERENCE.annualQ[i];
  return p;
}
function birthFactor(s) {
  const born = s.chronicle?.birth?.home || s.home,
    id = s.country.id,
    pCountry = countryShares(COUNTRIES)[id],
    pHome = homeShares(id)[born],
    d = COUNTRY_DOGS[id],
    guess = [d.owned, d.freeRoaming].some((x) => x.confidence === 'assumption');
  return {
    id: 'birth',
    p: pCountry * pHome,
    text: `게임 속 12개 나라의 개 가운데 ${s.country.name}의 ${HOME[born]}에서 태어나는 비율은 약 ${pct(pCountry * pHome)}입니다.`,
    source: `나라별 개 수 추정치${guess ? ' · 일부는 공식 추정치가 없어 게임용 가정' : ''}`,
  };
}
function lifeFactor(s) {
  const born = s.chronicle?.birth?.home || s.home,
    years = Math.floor(s.day / 365);
  if (born === 'street') {
    const R = STREET_REPRODUCTION,
      mature = s.reproduction?.matureAt ?? 240;
    if (s.day < 90)
      return {
        id: 'life',
        p: R.pupDeathBy3Months.value,
        text: `길에서 태어난 강아지의 ${pct(R.pupDeathBy3Months.value)}가 생후 3개월 안에 떠납니다. 이 아이도 그 가운데 하나였습니다.`,
        source: short(R.pupDeathBy3Months.source),
      };
    if (s.day < mature) {
      const p = 1 - R.pupDeathBy3Months.value - R.pupReachMaturity.value;
      return {
        id: 'life',
        p,
        text: `길에서 태어나 석 달을 넘겼지만 어른이 되기 전에 떠나는 강아지는 약 ${pct(p)}입니다.`,
        source: `${short(R.pupDeathBy3Months.source)}; ${short(R.pupReachMaturity.source)}`,
      };
    }
    return {
      id: 'life',
      p: R.pupReachMaturity.value,
      text: `길에서 태어난 강아지 가운데 어른이 되는 것은 약 ${pct(R.pupReachMaturity.value)}입니다. 이 아이는 그 안에 들었습니다.`,
      source: short(R.pupReachMaturity.source),
    };
  }
  const ref = `${UK_REFERENCE.authors} ${UK_REFERENCE.published} · 영국 반려견 생명표`;
  if (years < 1)
    return {
      id: 'life',
      p: UK_REFERENCE.annualQ[0],
      text: `반려견 가운데 첫 해를 넘기지 못하는 것은 약 ${pct(UK_REFERENCE.annualQ[0])}입니다.`,
      source: ref,
    };
  // Dying in this year of age: alive at its start, then the year's death rate.
  const y = Math.min(years, UK_REFERENCE.annualQ.length - 1),
    p = ukSurvival(y) * UK_REFERENCE.annualQ[y];
  return {
    id: 'life',
    p,
    text: `반려견 가운데 ${years}살에 삶을 마치는 것은 약 ${pct(p)}입니다.`,
    source: ref,
  };
}
function shelterFactor(s) {
  const t = s.shelterStay,
    d = SHELTER_OUTCOMES[s.country.id];
  if (!t?.outcome || t.outcome === 'inCare' || !d) return null;
  const p = d.shares[t.outcome],
    what = {
      adopted: '입양되는',
      returned: '주인에게 돌아가는',
      natural: '보호소에서 자연사하는',
      euthanized: '인도적 처리되는',
    }[t.outcome];
  return {
    id: 'shelter',
    p,
    text: `이 나라 보호소에 들어온 동물 가운데 ${what} 비율은 ${pct(p)}입니다.`,
    source: short(d.source),
  };
}
// One in how many, rounded to two significant figures.
export function oneIn(p) {
  if (!(p > 0)) return null;
  const n = 1 / p;
  if (n < 10) return Math.max(1, Math.round(n));
  const mag = 10 ** Math.floor(Math.log10(n) - 1);
  return Math.round(n / mag) * mag;
}
export function lifeRarity(s) {
  const factors = [birthFactor(s), lifeFactor(s), shelterFactor(s)].filter((f) => f && f.p > 0);
  const p = factors.reduce((a, f) => a * f.p, 1),
    n = oneIn(p);
  return {
    factors,
    p,
    oneIn: n,
    headline: n > 1 ? `약 ${n.toLocaleString('ko-KR')}마리 중 한 마리의 삶` : '흔한 삶',
    note: '위 비율들을 서로 독립이라고 보고 곱한 대략의 크기입니다. 실제로는 서로 얽혀 있습니다.',
  };
}
