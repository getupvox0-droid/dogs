import {
  initOpportunities,
  opportunityStep,
  opportunityChoice,
  validOpportunity,
  validateOpportunities,
} from './opportunities.js';
import {
  initCrossroads,
  crossroadStep,
  crossroadChoice,
  validCrossroad,
  validateCrossroads,
} from './crossroads.js';
import { initThreads, threadStep, threadChoice, validThread, validateThreads } from './threads.js';
import { dailyBehavior, learnAction } from './behavior.js';
import {
  initPeopleWorld,
  peopleStep,
  validatePeople,
  ensureHuman,
  currentFacility,
} from './people-world.js';
import { initClinical, clinicalStep, clinicalChoice, validateClinical } from './clinical.js';
import { initNeighbors, neighborStep, validateNeighbors } from './neighbors.js';
import { initChronicle, validateChronicle } from './chronicle.js';
import { familyStep, familyChoice, validFamilyDecision, validateFamily } from './family.js';
import { initLifeState, validateLifeState, needsStep, recordExperience } from './life-state.js';
import { decisionUid } from './decisions.js';
import { encounterScene, resolveEncounter } from './encounters.js';
import { initHealth, healthStep, healthChoice, validateHealth } from './health.js';
import { dailyMortality } from './statistics.js';
import { streetPupStep } from './street-survival.js';
import { shelterStep, validateShelterStay } from './shelter-outcomes.js';
import { validateNotes } from './milestones.js';
import { yearFocusStep, yearFocusChoice, yearFocusDaily, validateFocus } from './year-focus.js';
import {
  initWorld,
  initDevelopment,
  syncContext,
  birthText,
  worldStep,
  environmentAllows,
  adaptToChoice,
} from './world.js';
import {
  initLifeEvents,
  lifeEventStep,
  resolveLifeEvent,
  validLifeDecision,
  LIFE_AMBIENT,
  DAILY_VARIANTS,
} from './life-events.js';
import { changeArea, canMeetFriend } from './social.js';
import { EXTRA_EVENTS } from './daily-events.js';
import { initAppearance, validateAppearance } from './visuals.js';
import { initStories, growth, storyStep, storyChoice } from './stories.js';
import { BIRTH_MODES, countryShares, homeShares, weightedPick } from './birth-odds.js';
export const VERSION = 1;
// All weights and risks in this prototype are design assumptions, not population estimates.
// `areas` gives a country flavour to a birth setting's space type (see backgrounds.js).
// Each label must fit every setting of that space; spaces without a label show no region.
export const COUNTRIES = [
  {
    id: 'KR',
    name: '대한민국',
    climate: 'temperate',
    weight: 1,
    areas: { indoor: '아파트 단지가 많은 도시', rural: '산이 가까운 시골' },
  },
  {
    id: 'JP',
    name: '일본',
    climate: 'temperate',
    weight: 1,
    areas: { rural: '논이 이어진 시골', village: '오래된 골목 동네' },
  },
  {
    id: 'IN',
    name: '인도',
    climate: 'hot',
    weight: 1,
    areas: { market: '사람과 소가 함께 다니는 거리', village: '흙길 마을' },
  },
  {
    id: 'US',
    name: '미국',
    climate: 'temperate',
    weight: 1,
    areas: { garden: '넓은 주택가', rural: '농장이 흩어진 시골' },
  },
  {
    id: 'TR',
    name: '튀르키예',
    climate: 'temperate',
    weight: 1,
    areas: { market: '바닷가의 오래된 동네', rural: '고원 지대의 시골' },
  },
  {
    id: 'CA',
    name: '캐나다',
    climate: 'cold',
    weight: 1,
    areas: { garden: '눈이 오래 남는 주택가', rural: '숲이 가까운 시골' },
  },
  {
    id: 'BR',
    name: '브라질',
    climate: 'hot',
    weight: 1,
    areas: { indoor: '해안 대도시', rural: '열대 숲이 가까운 시골' },
  },
  {
    id: 'MX',
    name: '멕시코',
    climate: 'temperate',
    weight: 1,
    areas: { indoor: '고원 도시', rural: '건조한 고원의 시골' },
  },
  {
    id: 'CN',
    name: '중국',
    climate: 'temperate',
    weight: 1,
    areas: { indoor: '고층 아파트가 많은 도시', rural: '논밭이 넓은 시골' },
  },
  {
    id: 'PH',
    name: '필리핀',
    climate: 'hot',
    weight: 1,
    areas: { village: '바랑가이 동네', rural: '야자나무가 많은 시골' },
  },
  {
    id: 'NG',
    name: '나이지리아',
    climate: 'hot',
    weight: 1,
    areas: { market: '오토바이와 사람으로 붐비는 동네', village: '도시 외곽 마을' },
  },
  {
    id: 'TH',
    name: '태국',
    climate: 'hot',
    weight: 1,
    areas: { village: '사원 근처 동네', rural: '논이 이어진 시골' },
  },
];
// Every breed here needs an illustration family in visuals.js BREED_IMAGES.
const BREEDS = {
  KR: ['지역 믹스', '진돗개 믹스', '푸들'],
  JP: ['지역 믹스', '시바 믹스', '푸들'],
  IN: ['지역 믹스', '인디언 파리아 타입', '래브라도 믹스'],
  US: ['지역 믹스', '래브라도 믹스', '테리어 믹스'],
  TR: ['지역 믹스', '셰퍼드 믹스', '소형 믹스'],
  CA: ['지역 믹스', '허스키 믹스', '래브라도 믹스'],
  BR: ['지역 믹스', '소형 믹스', '래브라도 믹스'],
  MX: ['지역 믹스', '소형 믹스', '셰퍼드 믹스'],
  CN: ['지역 믹스', '소형 믹스', '푸들'],
  PH: ['지역 믹스', '소형 믹스', '래브라도 믹스'],
  NG: ['지역 믹스', '셰퍼드 믹스', '소형 믹스'],
  TH: ['지역 믹스', '소형 믹스', '테리어 믹스'],
};
export function random(s) {
  let t = (s.rng += 0x6d2b79f5);
  s.rng >>>= 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (s, a) => a[Math.floor(random(s) * a.length)];
const clamp = (x) => Math.max(0, Math.min(100, x));
function log(s, id, text) {
  s.log.push({
    day: s.day,
    id,
    text,
    home: s.home,
    area: s.areaId,
    facility: s.environmentModel ? currentFacility(s) : null,
  });
}
export const NAME_MAX = 12;
export function cleanName(raw) {
  return String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, NAME_MAX);
}
export function setName(s, raw) {
  const name = cleanName(raw);
  s.name = name || null;
  return s.name;
}
// Both modes draw exactly two random numbers so a seed's later RNG stream stays aligned.
function pickBirth(s, mode) {
  const a = random(s),
    b = random(s);
  // In one chosen country: the country is fixed, the home follows that country's real shares.
  if (mode === 'home') {
    const country = COUNTRIES.find((c) => c.id === s.homeCountry) || COUNTRIES[0];
    return { country, home: weightedPick(Object.entries(homeShares(country.id)), b) };
  }
  if (mode !== 'real')
    return {
      country: COUNTRIES[Math.floor(a * COUNTRIES.length)],
      home: HOMES[Math.floor(b * HOMES.length)],
    };
  const shares = countryShares(COUNTRIES),
    country = weightedPick(
      COUNTRIES.map((c) => [c, shares[c.id]]),
      a,
    );
  return { country, home: weightedPick(Object.entries(homeShares(country.id)), b) };
}
const HOMES = ['family', 'street', 'shelter'];
export function createLife(seed = Date.now(), lifeId = null, options = {}) {
  const birthMode = ['real', 'home'].includes(options.birthMode) ? options.birthMode : 'explore';
  const homeCountry =
    birthMode === 'home' && COUNTRIES.some((c) => c.id === options.country)
      ? options.country
      : null;
  const s = {
    version: VERSION,
    dataVersion: 'prototype-1',
    rng: Number(seed) >>> 0,
    seed: Number(seed) >>> 0,
    lifeId: lifeId || `seed-${Number(seed) >>> 0}`,
    day: 0,
    alive: true,
    pending: null,
    health: 90,
    comfort: 65,
    trust: 25,
    encounters: 0,
    memories: [],
    recent: {},
    log: [],
    world: null,
    birthMode: birthMode === 'home' && !homeCountry ? 'real' : birthMode,
    homeCountry,
    name: null,
    daily: /^\d{4}-\d{2}-\d{2}$/.test(options.daily || '') ? options.daily : null,
    // Every decision that changed this life, in order, so it can be replayed from the seed
    // (see share.js). null for saves made before the trail existed.
    trail: [],
  };
  const born = pickBirth(s, s.birthMode);
  s.country = born.country;
  s.home = born.home;
  s.breed = pick(s, BREEDS[s.country.id]);
  s.sex = pick(s, ['암컷', '수컷']);
  s.temperament = pick(s, ['호기심 많은', '조심스러운', '사람을 좋아하는']);
  s.person = '따뜻한 손 냄새의 사람';
  s.familyBond = s.home === 'family' ? 30 : 0;
  initStories(s);
  initAppearance(s);
  initLifeEvents(s);
  initWorld(s);
  log(s, 'birth', birthText(s));
  validateHealth(s);
  validateLifeState(s);
  validateFamily(s);
  validateChronicle(s);
  validatePeople(s);
  validateClinical(s);
  validateNeighbors(s);
  validateThreads(s);
  validateOpportunities(s);
  validateCrossroads(s);
  validateShelterStay(s);
  initHealth(s);
  initStories(s);
  validateAppearance(s);
  initAppearance(s);
  initLifeEvents(s);
  initWorld(s);
  initLifeState(s);
  initDevelopment(s);
  initPeopleWorld(s);
  initClinical(s);
  initNeighbors(s);
  initThreads(s);
  initOpportunities(s);
  initCrossroads(s);
  decisionUid(s);
  initChronicle(s, true);
  return s;
}
function remember(s, id) {
  if (!s.memories.includes(id)) s.memories.push(id);
}
// Trail tokens: 0–3 the option picked, AUTO when observe mode picked it, SKIPPED when the
// prompt closed itself without a choice.
export const TRAIL = { AUTO: 4, SKIPPED: 5 };
export function choose(s, id, expectedUid = null, { auto = false } = {}) {
  initLifeState(s);
  if (expectedUid && expectedUid !== decisionUid(s)) return false;
  if (!s.pending || !s.alive) return false;
  if (s.pending.id === 'dog-meet' && !canMeetFriend(s)) {
    s.pending = null;
    s.trail?.push(TRAIL.SKIPPED);
    return false;
  }
  const p = s.pending;
  const uid = decisionUid(s);
  if (s.resolvedDecisions.includes(uid) || !p.options.some((o) => o.id === id)) return false;
  s.trail?.push(auto ? TRAIL.AUTO : p.options.findIndex((o) => o.id === id));
  const before = {
    ...Object.fromEntries(
      ['health', 'comfort', 'trust', 'stress', 'familyBond', 'dogBond'].map((k) => [k, s[k]]),
    ),
    ...Object.fromEntries(['hunger', 'thirst', 'fatigue', 'happiness'].map((k) => [k, s.needs[k]])),
    logLength: s.log.length,
  };
  s.resolvedDecisions.push(uid);
  s.pending = null;
  log(s, 'choice', p.options.find((o) => o.id === id).text);
  opportunityChoice(s, p, id, { log, remember });
  crossroadChoice(s, p, id, { log, remember });
  yearFocusChoice(s, p, id);
  threadChoice(s, p, id, { log, remember });
  familyChoice(s, p, id, { log, remember });
  clinicalChoice(s, p, id, { log });
  if (p.id === 'health-response') healthChoice(s, id, log);
  if (p.id === 'encounter') s.visitorArea = s.areaId;
  if (p.id === 'encounter') resolveEncounter(s, p, id, { log, remember, clamp });
  if (p.id === 'door') {
    if (id === 'enter') {
      s.story.adoptionReview ??= {
        day: s.day + 3,
        area: s.areaId,
        actor: s.environmentModel?.candidate || null,
      };
      remember(s, 'carrier-ready');
      log(
        s,
        'adoption-wait',
        '천 위에 앞발을 올리고 잠시 머문다. 방문자는 돌보는 사람과 이야기를 나눈 뒤 돌아갔다. 오늘은 같은 잠자리에서 잔다.',
      );
    } else {
      log(s, 'outside', '이동장 바깥에 머문다. 사람은 문을 닫지 않고 오늘 만남을 마친다.');
      s.recent.door = s.day;
      s.story.adoptionReview ??= {
        day: s.day + 7,
        area: s.areaId,
        actor: s.environmentModel?.candidate || null,
      };
    }
  }

  if (p.id === 'walk') {
    if (id === 'sniff') {
      s.comfort = clamp(s.comfort + 5);
      remember(s, 'favorite-path');
      log(s, 'path', '나무 밑에 남은 냄새를 오래 읽는다. 익숙한 길이 하나 더 생겼다.');
    } else {
      s.familyBond = clamp(s.familyBond + 4);
      log(s, 'bond', '발걸음에 맞춰 곁에서 걷는다. 손이 등을 천천히 쓰다듬는다.');
    }
  }
  if (p.id === 'rain') {
    s.comfort = clamp(s.comfort + (id === 'cover' ? 2 : -7));
    log(
      s,
      'weather-result',
      id === 'cover'
        ? '처마 밑에서 비가 잦아들기를 기다린다.'
        : '젖은 길을 따라 움직인다. 발끝이 차갑다.',
    );
    remember(s, 'rain');
  }
  resolveLifeEvent(s, p, id, { log, remember, clamp });
  adaptToChoice(s, p, id);
  learnAction(s, p, id);
  storyChoice(s, p, id, log, remember, clamp, random);
  recordExperience(s, p, id, before);
  const outcome = s.presentation;
  log(s, 'decision-outcome', outcome.text);
  s.log.at(-1).decisionUid = uid;
  const linked = s.log.slice(before.logLength, -1).findLast((e) => e.storyId);
  if (linked) s.log.at(-1).storyId = linked.storyId;
  s.log.at(-1).prompt = p.text;
  s.log.at(-1).action = p.options.find((o) => o.id === id).text;
  if (auto) s.log.at(-1).auto = true;
  for (let i = before.logLength; i < s.log.length - 1; i++) s.log[i].resolvedDecisionUid = uid;
  // A choice that ends the life (a crossroad) still keeps death as the last record.
  const died = s.log.findIndex((e, i) => i >= before.logLength && e.id === 'death');
  if (died >= 0 && died < s.log.length - 1) s.log.push(...s.log.splice(died, 1));
  return true;
}
// Choices that cannot wait: the body, a lost dog, a litter, the year's direction, and the steps
// of a person coming back again and again until a door opens (the street's way home).
const URGENT_DECISION =
  /^(health-response|pain-response|lost-help|year-focus|litter|encounter$|door$|crossroad:(den-|milk-push|shelter-visitor))/;
export const QUIET_DAYS = 30;
// Choices that cannot wait or be left to the dog: health, getting lost, the year's direction,
// a litter, a person at the door, a street pup's first-year crossroads.
export function urgentDecision(s, id) {
  return (
    URGENT_DECISION.test(id) || (id.startsWith('crossroad:') && s.home === 'street' && s.day < 365)
  );
}
function decision(s, id, text, options) {
  if (s.pending) return false;
  if (
    options.length < 2 ||
    options.length > 5 ||
    new Set(options.map((o) => o[0])).size !== options.length
  )
    throw Error('잘못된 선택 구성');
  const caps = {
    walk: 1,
    rain: 1,
    alone: 1,
    'care-change': 1,
    'open-gate': 1,
    encounter: 4,
    door: 2,
  };
  if ((s.storyCounts[id] || 0) >= (caps[id] ?? Infinity)) return false;
  // Ordinary choices leave a few quiet days after the last one, so the life is read between
  // them; a system whose choice is refused simply offers it again later.
  // A street pup's first year turns on its crossroads, so those are not held back either.
  const urgent = urgentDecision(s, id);
  if (!urgent && s.day - (s.lastDecisionDay ?? -Infinity) < QUIET_DAYS) return false;
  s.lastDecisionDay = s.day;
  s.storyCounts[id] = (s.storyCounts[id] || 0) + 1;
  s.decisionSerial = (s.decisionSerial || 0) + 1;
  s.pending = {
    id,
    text,
    uid: `${s.lifeId}:${s.decisionSerial}:${id}:${s.day}`,
    options: options.map(([id, text]) => ({ id, text })),
  };
  log(s, 'decision', text);
  s.log.at(-1).decisionId = id;
  return true;
}
const EVENTS = [
  {
    id: 'smell',
    ok: () => true,
    text: '바람에 낯선 냄새가 섞여 온다. 코를 들고 한동안 가만히 서 있는다.',
  },
  {
    id: 'sleep',
    ok: () => true,
    text: '몸을 둥글게 말고 잠든다. 멀리서 들리던 소리가 천천히 흐려진다.',
  },
  {
    id: 'play',
    ok: (s) => s.day > 45 && s.day < 3000,
    text: '작은 것을 앞발로 건드린다. 굴러가는 것을 따라 뛰다가 다시 물고 돌아온다.',
  },
  {
    id: 'family',
    ok: (s) => s.home === 'family',
    text: '익숙한 발소리가 문 앞에서 멈춘다. 나도 모르게 꼬리가 먼저 움직인다.',
  },
  {
    id: 'street',
    ok: (s) => s.home === 'street',
    text: '가게 문이 열리기 전 골목을 돈다. 어제 먹이를 찾았던 자리를 살핀다.',
  },
  {
    id: 'shelter',
    ok: (s) => s.home === 'shelter',
    text: '복도 너머에서 발소리가 들린다. 문 가까이 다가가 냄새를 맡는다.',
  },
  {
    id: 'memory',
    ok: (s) => s.memories.includes('kind-person'),
    text: '멀리서 그 손에 남아 있던 냄새를 맡은 것 같다. 고개를 들고 한참 찾는다.',
  },
];
// Called once when the player leaves the birth scene: a known father who lives nearby
// becomes a relation.
export function acknowledgeBirth(s) {
  s.chronicle.phase = 'living';
  s.chronicle.birthAcknowledged = true;
  const b = s.chronicle.birth;
  if (b.father.known && !s.relations.some((r) => r.id === 'father'))
    s.relations.push({
      id: 'father',
      kind: 'father',
      name: '아비',
      area: s.areaId,
      familiarity: b.father.together ? 30 : 0,
      trust: b.father.together ? 35 : 0,
      caution: 20,
      conflict: 0,
      contacts: b.father.together ? 1 : 0,
      lastContact: b.father.together ? 0 : null,
      active: b.father.together,
      details: `출생 당시 ${b.father.ageYears}살 · ${b.father.breed}`,
    });
}
export function advance(s, days = 1) {
  if (!Number.isInteger(days) || days < 0) throw Error('Invalid days');
  if (days > 0 && s.chronicle?.phase === 'birth') {
    s.chronicle.phase = 'living';
    s.chronicle.birthAcknowledged = true;
  }
  let n = 0;
  while (n < days && s.alive && !s.pending) {
    step(s);
    n++;
  }
  return n;
}
function step(s) {
  initStories(s);
  initLifeEvents(s);
  initWorld(s);
  s.day++;
  yearFocusDaily(s);
  growth(s, log, remember);
  const review = s.story.adoptionReview;
  if (review && s.day >= review.day) {
    delete s.story.adoptionReview;
    if (s.areaId === review.area && s.home !== 'family' && !s.story.lost) {
      const applicant = review.actor ? ensureHuman(s, review.actor, 'guardian') : null;
      const arc = s.storylines?.find((a) => a.id === review.storyId);
      const ready = !applicant || (applicant.money >= 30 && applicant.time >= 30);
      const chance = applicant
        ? Math.min(
            0.9,
            0.2 +
              (applicant.care + applicant.knowledge + applicant.time) / 450 +
              s.worldModel.care / 500,
          )
        : Math.min(0.9, 0.45 + s.worldModel.care / 250 + s.trust / 500);
      if (ready && random(s) < chance) {
        if (arc) {
          arc.stage = 'settling';
          arc.next = s.day + 14;
        }
        const adoptionRoute =
          s.environmentModel?.route ||
          (s.home === 'shelter' ? 'shelter-adoption' : 'community-adoption');
        s.home = 'family';
        changeArea(s, 'adoption');
        s.adoptionRoute = adoptionRoute;
        s.caregiverId = applicant?.id || 'carer-adopt-' + s.areaSerial;
        if (applicant) {
          applicant.name = ' 함께 사는 사람'.trim();
          applicant.decisions.push({ day: s.day, kind: 'adopt' });
        }
        s.familyBond = 35;
        s.story.settleAt = s.day + 14;
        remember(s, 'new-home');
        log(
          s,
          'adopt',
          (adoptionRoute === 'sale'
            ? '판매점에서 나를 여러 번 보던 사람이 직원과 이야기를 나누고 내 물건을 챙겼다. 이동장이 열린 곳은 그 사람과 함께 지낼 집이다. '
            : adoptionRoute === 'rescue-adoption'
              ? '구조 뒤 보호시설에서 만나던 사람이 입양 절차를 마치고 데리러 왔다. 새 집에서 내 담요와 물그릇을 찾는다. '
              : '며칠 뒤 그 사람이 이동장을 들고 돌아왔다. 돌보는 사람과 인사를 나눈 뒤 함께 지낼 집으로 이동한다. ') +
            '물그릇과 잠자리부터 살펴본다.',
        );
      } else {
        if (arc) {
          arc.stage = 'declined';
          arc.end = s.day;
        }
        log(
          s,
          'adoption-deferred',
          '며칠이 지나도 그 사람은 데리러 오지 않았다. 돌보는 사람이 평소처럼 밥을 놓고 문을 닫는다. 이번 만남 뒤에도 같은 곳에서 생활한다.',
        );
        s.recent.door = s.day;
      }
    }
  }
  if (s.day === 40 && s.chronicle?.birth.father.together) {
    log(
      s,
      'father-near',
      '함께 지내던 아비가 잠자리 가까이에 몸을 낮춘다. 짧게 코를 맞댄 뒤 어미 곁으로 돌아온다.',
    );
    s.trust = clamp(s.trust + 1);
    remember(s, 'father-near');
  }
  worldStep(s, { log, random, clamp });
  peopleStep(s, { log, remember });
  neighborStep(s);
  dailyBehavior(s);
  needsStep(s, log);
  const medicalRandom = () => {
    s.medicalRng ??= (s.seed ^ 0x93ad571b) >>> 0;
    const state = { rng: s.medicalRng };
    const value = random(state);
    s.medicalRng = state.rng;
    return value;
  };
  if (s.day === s.reproduction.matureAt) {
    log(
      s,
      'maturity',
      '몸이 성숙해 가면서 다른 개의 흔적에 머무는 시간이 길어졌다. 태어났을 때와는 다른 몸짓과 반응이 나타난다.',
    );
    remember(s, 'maturity');
  }
  const medicalBusy = healthStep(s, { log, random: medicalRandom, decision }, dailyMortality(s));
  // A street pup's daily danger (street-survival.js): most do not reach adulthood.
  if (s.alive && !s.pending) streetPupStep(s, { log });
  // A stay in a shelter of a country with published outcomes (shelter-outcomes.js).
  if (s.alive && !s.pending) shelterStep(s, { log, remember });
  if (!s.alive) {
    if (s.chronicle) s.chronicle.phase = 'ending';
    return;
  }
  const clinicalBusy = clinicalStep(s, { log, decision });
  const familyBusy = familyStep(s, { log, remember, decision });
  const storyBusy =
    medicalBusy ||
    clinicalBusy ||
    familyBusy ||
    storyStep(s, { log, remember, decision, random, clamp });
  const threadBusy = !storyBusy && !s.pending && threadStep(s, { log, decision });
  const richBusy =
    !threadBusy && !storyBusy && !s.pending && lifeEventStep(s, { decision, log, random });
  if (s.day % 365 === 0) {
    log(s, 'birthday', `${Math.floor(s.day / 365)}번째 해. 익숙한 냄새와 기억이 쌓였다.`);
    if (s.day >= 2920) log(s, 'aging', '쉬었다 가는 시간이 길어졌다. 편한 자리를 먼저 찾는다.');
  }
  // Crossroads come before routine situations: they are rarer and can change the rest of a life.
  // The year's direction comes first on the day it is due (year-focus.js).
  const focusBusy =
    !threadBusy && !storyBusy && !richBusy && !s.pending && yearFocusStep(s, { decision, log });
  const crossroadBusy =
    !focusBusy &&
    !threadBusy &&
    !storyBusy &&
    !richBusy &&
    !s.pending &&
    crossroadStep(s, { decision });
  const opportunityBusy =
    !crossroadBusy &&
    !threadBusy &&
    !storyBusy &&
    !richBusy &&
    !s.pending &&
    opportunityStep(s, { log, decision });
  const cal = s.worldModel.calendar;
  if (
    !opportunityBusy &&
    !threadBusy &&
    !storyBusy &&
    !richBusy &&
    !s.pending &&
    s.day >= cal.contact &&
    s.day >= 90 &&
    s.home !== 'family' &&
    !s.story.lost
  ) {
    cal.contact = s.day + 35 + Math.floor(random(s) * 70);
    if (s.encounters >= 3 && s.trust >= 40 && (!s.recent.door || s.day - s.recent.door >= 90)) {
      decision(
        s,
        'door',
        s.home === 'shelter'
          ? '반복해서 찾아오던 사람이 돌보는 사람과 함께 왔다. 문 안쪽에 내 담요가 놓여 있다.'
          : '그동안 돌봐 주던 사람이 안전한 이동 공간을 열어 두었다. 익숙한 천이 안에 놓여 있다.',
        [
          ['enter', '익숙한 천 쪽으로 천천히 들어간다'],
          ['wait', '이번에는 조금 더 머무른다'],
        ],
      );
    } else {
      const scene = encounterScene(s);
      decision(
        s,
        'encounter',
        scene.text,
        scene.options.map((o) => [o.id, o.text]),
      );
    }
  }

  if (!medicalBusy && s.day >= s.worldModel.calendar.ambient) {
    s.worldModel.calendar.ambient = s.day + 12 + Math.floor(random(s) * 25);
    const pool = [...EVENTS, ...EXTRA_EVENTS, ...LIFE_AMBIENT].filter(
      (e) =>
        (s.lifeEvents.dailyCounts[e.id] || 0) < 1 + (DAILY_VARIANTS[e.id]?.length || 0) &&
        (!e.once || s.recent[e.id] == null) &&
        s.day >= 21 &&
        (!s.story.lost ||
          [
            'smell',
            'sleep',
            'street',
            'street-bed',
            'market-smell',
            'shade',
            'cold-paws',
            'puddle',
            'dream',
          ].includes(e.id)) &&
        environmentAllows(s, e.id) &&
        e.ok(s) &&
        (!s.recent[e.id] || s.day - s.recent[e.id] >= 180),
    );
    if (pool.length) {
      const e = pick(s, pool);
      const n = s.lifeEvents.dailyCounts[e.id] || 0;
      const text = [e.text, ...(DAILY_VARIANTS[e.id] || [])][n];
      log(s, e.id, text);
      s.lifeEvents.dailyCounts[e.id] = n + 1;
      s.recent[e.id] = s.day;
    }
  }
}
export function serialize(s) {
  return JSON.stringify(s);
}
export function restore(raw) {
  const s = JSON.parse(raw);
  if (
    s.version !== VERSION ||
    s.dataVersion !== 'prototype-1' ||
    !Number.isInteger(s.day) ||
    s.day < 0 ||
    !Number.isInteger(s.rng) ||
    !Array.isArray(s.log) ||
    !s.log.every(
      (e) => Number.isInteger(e.day) && typeof e.id === 'string' && typeof e.text === 'string',
    ) ||
    !Array.isArray(s.memories) ||
    !s.memories.every((x) => typeof x === 'string') ||
    !s.recent ||
    !['health', 'comfort', 'trust', 'familyBond'].every(
      (k) => Number.isFinite(s[k]) && s[k] >= 0 && s[k] <= 100,
    ) ||
    !(
      s.pending === null ||
      (s.pending &&
        ([
          'pain-response',
          'health-response',
          'encounter',
          'door',
          'walk',
          'rain',
          'dog-meet',
          'move-house',
          'open-gate',
          'lost-help',
          'alone',
          'care-change',
          'year-focus',
        ].includes(s.pending.id) ||
          validOpportunity(s.pending.id) ||
          validCrossroad(s.pending.id) ||
          validThread(s.pending.id) ||
          validLifeDecision(s.pending.id) ||
          validFamilyDecision(s.pending.id)) &&
        typeof s.pending.text === 'string' &&
        Array.isArray(s.pending.options) &&
        s.pending.options.length > 0 &&
        s.pending.options.every((o) => typeof o.id === 'string' && typeof o.text === 'string'))
    ) ||
    !COUNTRIES.some((c) => c.id === s.country?.id) ||
    !HOMES.includes(s.home) ||
    typeof s.alive !== 'boolean' ||
    !(s.name == null || (typeof s.name === 'string' && s.name === cleanName(s.name) && s.name)) ||
    !(s.birthMode == null || s.birthMode in BIRTH_MODES) ||
    (s.birthMode === 'home' && !COUNTRIES.some((c) => c.id === s.homeCountry)) ||
    !(s.daily == null || /^\d{4}-\d{2}-\d{2}$/.test(s.daily)) ||
    !(
      s.trail == null ||
      (Array.isArray(s.trail) && s.trail.every((t) => Number.isInteger(t) && t >= 0 && t <= 5))
    )
  )
    throw Error('지원하지 않거나 손상된 기록');
  s.name ??= null;
  s.birthMode ??= 'explore';
  s.daily ??= null;
  s.trail ??= null;
  if (
    s.storyVersion === 2 &&
    (!s.story ||
      !s.friend ||
      !s.milestones ||
      !s.people ||
      typeof s.story.lost !== 'boolean' ||
      !Number.isFinite(s.stress) ||
      !Number.isFinite(s.dogBond))
  )
    throw Error('손상된 관계 기록');
  validateHealth(s);
  validateLifeState(s);
  validateFamily(s);
  validateChronicle(s);
  validatePeople(s);
  validateClinical(s);
  validateNeighbors(s);
  validateThreads(s);
  validateOpportunities(s);
  validateCrossroads(s);
  validateShelterStay(s);
  validateNotes(s);
  validateFocus(s);
  initHealth(s);
  initStories(s);
  validateAppearance(s);
  initAppearance(s);
  initLifeEvents(s);
  initWorld(s);
  initLifeState(s);
  initDevelopment(s);
  initPeopleWorld(s);
  initClinical(s);
  initNeighbors(s);
  initThreads(s);
  initOpportunities(s);
  decisionUid(s);
  initChronicle(s);
  return s;
}
