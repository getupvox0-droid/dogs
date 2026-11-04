// Four other dogs born on the same day somewhere in the world. They are drawn with the real
// birth ratios (birth-odds.js) and live on their own; their lives follow from this life's seed,
// so a shared life shows the same four. Only their turning points reach the player, as news
// from far away, with a published figure where one exists.
import { createLife, advance, choose, acknowledgeBirth, random } from './engine.js';
import { automaticAction } from './decisions.js';
import { setBirthDate, ageText } from './chronicle.js';
import { mix } from './world.js';
import { josa } from './korean.js';
import { STREET_REPRODUCTION } from './reproduction-data.js';
import { UK_REFERENCE } from './statistics.js';
import { SHELTER_OUTCOMES } from './shelter-outcomes.js';

export const DAYMATE_COUNT = 4;
const MAX_DAYS = 30 * 365;
const HOME = { family: '가정', street: '길', shelter: '보호소' };
const pct = (x) => `${Math.round(x * 1000) / 10}%`;

export function daymateSeeds(seed) {
  return Array.from({ length: DAYMATE_COUNT }, (_, i) => mix(seed, 3101 + i) >>> 0);
}

// Lives one daymate to its end with the automatic choices of observe mode.
export function liveDaymate(seed, birthDate) {
  const s = createLife(seed, `daymate-${seed}`, { birthMode: 'real' });
  if (birthDate) setBirthDate(s, birthDate);
  acknowledgeBirth(s);
  const path = [{ day: 0, home: s.home, lost: false }];
  while (s.alive && s.day < MAX_DAYS) {
    if (s.pending) {
      choose(s, automaticAction(s, random), null, { auto: true });
      continue;
    }
    advance(s, 1);
    const last = path.at(-1),
      lost = !!s.story?.lost;
    if (last.home !== s.home || last.lost !== lost) path.push({ day: s.day, home: s.home, lost });
  }
  const birth = s.chronicle.birth;
  return {
    seed,
    countryId: s.country.id,
    country: birth.country,
    place: birth.place,
    born: birth.home,
    breed: s.breed,
    sex: s.sex,
    days: s.day,
    alive: s.alive,
    cause: s.cause || null,
    path,
    events: s.log
      .filter((e) => NEWS[e.id])
      // Growing up is news only for a street pup, where few do (newsFact).
      .filter((e) => e.id !== 'maturity' || birth.home === 'street')
      .filter((e, i, all) => all.findIndex((x) => x.id === e.id && x.day === e.day) === i)
      .map((e) => ({ day: e.day, id: e.id })),
  };
}

export function liveDaymates(seed, birthDate) {
  const lives = daymateSeeds(seed).map((x) => liveDaymate(x, birthDate));
  // Names for the news: the country and the breed, told apart when two match.
  for (const d of lives) {
    const same = lives.filter((o) => o.country === d.country && o.breed === d.breed),
      bySex = same.filter((o) => o.sex === d.sex);
    d.who =
      same.length === 1
        ? `${d.country}의 ${d.breed}`
        : bySex.length === 1
          ? `${d.country}의 ${d.sex} ${d.breed}`
          : `${d.country}의 ${bySex.indexOf(d) ? '또 다른 ' : ''}${d.breed}`;
  }
  return lives;
}

const NEWS = {
  maturity: (w) => `${josa(w, '이', '가')} 어른 개의 몸이 되었다.`,
  adopt: (w) => `${w}에게 새 집이 생겼다. 처음으로 남의 집 문턱을 넘었다.`,
  'rescued-shelter': (w) => `${josa(w, '이', '가')} 다친 몸으로 구조되어 보호소에 들어갔다.`,
  'caught-shelter': (w) => `${josa(w, '이', '가')} 붙잡혀 보호소로 옮겨졌다.`,
  'gate-out': (w) => `${josa(w, '이', '가')} 집 밖으로 나갔다가 돌아가는 길을 잃었다.`,
  reunion: (w) => `${josa(w, '이', '가')} 잃어버렸던 가족을 다시 만났다.`,
  'shelter-escape': (w) => `${josa(w, '이', '가')} 보호소 철문 틈으로 빠져나갔다.`,
  'shelter-return': (w) => `${josa(w, '이', '가')} 사람 손에 보호소로 보내졌다.`,
  'guardian-changed': (w) => `${w}의 보호자가 바뀌었다.`,
  'litter-born': (w) => `${josa(w, '이', '가')} 새끼를 낳았다.`,
  death: (w, d) => `${josa(w, '이', '가')} ${ageText(d.days)}에 세상을 떠났다.`,
};

// The published figure that fits a piece of news, or null.
export function newsFact(d, id) {
  const R = STREET_REPRODUCTION,
    src = (x) => x.source.split(',')[0];
  if (id === 'maturity' && d.born === 'street')
    return `길에서 태어난 강아지가 어른이 될 때까지 살아남는 비율은 약 ${pct(R.pupReachMaturity.value)}입니다. (${src(R.pupReachMaturity)})`;
  if (id === 'death' && d.born === 'street' && d.days <= 90)
    return `길에서 태어난 강아지의 ${pct(R.pupDeathBy3Months.value)}가 생후 3개월 안에 죽습니다. (${R.pupDeathBy3Months.source.split('(')[0].trim()})`;
  if (id === 'death' && d.born === 'street' && d.days < 365)
    return `길에서 태어난 강아지 가운데 어른이 되는 것은 약 ${pct(R.pupReachMaturity.value)}뿐입니다. (${src(R.pupReachMaturity)})`;
  if (id === 'death' && d.days >= 365 && d.path.at(-1).home === 'family')
    return `영국 반려견의 평균 기대수명은 ${UK_REFERENCE.e0}년입니다. (${UK_REFERENCE.authors} ${UK_REFERENCE.published})`;
  if (id === 'litter-born')
    return `길과 마을에서 사는 개의 한배 새끼는 평균 ${R.litterSize.mean}마리입니다. (${src(R.litterSize)})`;
  const shelter = SHELTER_OUTCOMES[d.countryId];
  if (shelter && ['rescued-shelter', 'caught-shelter', 'shelter-return'].includes(id))
    return `이 나라 보호소에 들어온 동물의 ${pct(shelter.shares.adopted)}가 입양되고, ${pct(shelter.shares.euthanized)}가 인도적 처리됩니다. (${shelter.source.split('(')[0].trim()})`;
  return null;
}

// What the player has heard by `day`: each daymate's news so far, newest first.
export function daymateNews(lives, day = Infinity) {
  const out = [];
  for (const d of lives)
    for (const e of d.events)
      if (e.day <= day)
        out.push({
          day: e.day,
          id: e.id,
          who: d.who,
          text: NEWS[e.id](d.who, d),
          cause: e.id === 'death' ? d.cause : null,
          fact: newsFact(d, e.id),
        });
  return out.sort((a, b) => b.day - a.day);
}

// Where a daymate is on `day`.
export function daymateStatus(d, day) {
  if (d.days <= day && !d.alive) return `${ageText(d.days)}에 떠남`;
  const at = d.path.filter((p) => p.day <= day).at(-1);
  return at.lost ? '가족을 잃고 헤매는 중' : `${HOME[at.home]}에서 지내는 중`;
}

// The homes a daymate passed through: 길 → 보호소 → 가정.
export function daymatePath(d) {
  const names = d.path.map((p) => (p.lost ? '길 잃음' : HOME[p.home]));
  return names.filter((n, i) => n !== names[i - 1]).join(' → ');
}

// The five lives side by side, longest first, with the player's dog marked.
export function compareFive(mine, lives) {
  const all = [{ ...mine, mine: true }, ...lives].sort((a, b) => b.days - a.days);
  return { rows: all, rank: all.findIndex((r) => r.mine) + 1 };
}
