// Builds every sentence a generated crossroad can show (setting × lure × hazard × variant × item
// × need × who is near × fear) for each weather it can happen in, and checks them with rules,
// so awkward combinations are found without playing them. `node scripts/check-crossroad-text.mjs`
// prints a report; tests/crossroad-text.test.mjs fails when any rule is broken.
import {
  SETTINGS,
  LURES,
  HAZARDS,
  SETTING_FAMILIES,
  COUNTRY_SETTINGS,
} from '../dist/crossroad-parts.js';
import { generatedText, generatedOptions, CROSSROADS, WHO, DEN } from '../dist/crossroads.js';
import { josa } from '../dist/korean.js';

const WORLDS = ['quiet', 'rain', 'heat', 'cold'];
const NEEDS = [{}, { hunger: 80 }, { thirst: 80 }, { fatigue: 90 }].map((n) => ({
  hunger: 30,
  thirst: 30,
  fatigue: 30,
  ...n,
}));

// Things that cannot be true in the same moment, or read badly together.
const CONFLICTS = [
  [/햇볕/, /빗줄기|빗물|흠뻑 젖|눈이 발목/, '볕이 드는 장면에 비나 눈'],
  [/바닥이 뜨겁게/, /털 사이로 찬 기운|눈이|얼어/, '뜨거운 바닥과 추위가 함께'],
  [/열려 있다/, /열려 있다/, '열려 있다가 두 번'],
  [/목줄/, /어미의 냄새/, '산책 중인데 어미가 곁에'],
];

function* moments() {
  const settings = new Map();
  for (const [family, list] of Object.entries(SETTING_FAMILIES))
    for (const id of list) settings.set(id, family.split('-')[0]);
  for (const c of Object.values(COUNTRY_SETTINGS))
    for (const [home, list] of Object.entries(c)) for (const id of list) settings.set(id, home);
  for (const [setting, home] of settings) {
    const st = SETTINGS[setting];
    for (const world of WORLDS) {
      const base = {
        world,
        home: home === 'street' ? 'street' : home === 'shelter' ? 'shelter' : 'family',
        day: 900,
        health: 80,
        trust: 30,
        caregiverId: 'carer',
        relations: [{ kind: 'sibling', active: true }],
        friend: { met: true, area: 'a' },
        areaId: 'a',
        reproduction: { matureAt: 300 },
        crossroads: { marks: [], debts: [] },
      };
      for (const lure of st.lures) {
        const L = LURES[lure];
        if (L.ok && !L.ok(base)) continue;
        for (const hazard of st.hazards) {
          const H = HAZARDS[hazard];
          if ((H.ok && !H.ok(base)) || (H.lures && !H.lures.includes(lure))) continue;
          for (const item of L.items || [null])
            for (let v = 0; v < 4; v++)
              for (const who of [null, ...Object.keys(WHO)]) {
                if (who === 'mother' && !DEN.includes(setting)) continue;
                for (const needs of NEEDS)
                  for (const fear of [false, true]) {
                    const s = {
                      ...base,
                      needs,
                      crossroads: { marks: fear ? [`${hazard}-fear`] : [], debts: [] },
                    };
                    const g = { setting, lure, hazard, item, v, who };
                    yield { s, g, text: generatedText(s, g), options: generatedOptions(s, g) };
                  }
              }
        }
      }
    }
  }
}

// Words this module inserts into sentences, with the particles it may attach.
function particleProblems(text, words) {
  const out = [];
  for (const w of words)
    for (const [withF, without] of [
      ['을', '를'],
      ['이', '가'],
      ['은', '는'],
      ['과', '와'],
    ]) {
      const right = josa(w, withF, without),
        wrong = w + (right.endsWith(withF) ? without : withF);
      if (text.includes(wrong + ' ') || text.endsWith(wrong)) out.push(`'${wrong}' → '${right}'`);
    }
  return out;
}
const sentences = (t) => t.split(/(?<=[.!?])\s+/).filter(Boolean);
const pairs = (t) => {
  const w = t.replace(/[.,!?]/g, '').split(/\s+/);
  return w.slice(1).map((x, i) => w[i] + ' ' + x);
};

export function checkCrossroadText({ limit = 3 } = {}) {
  const problems = new Map(),
    seen = new Set();
  let count = 0;
  const flag = (rule, text) => {
    const list = problems.get(rule) || [];
    if (list.length < limit && !list.includes(text)) list.push(text);
    problems.set(rule, list);
    list.total = (list.total || 0) + 1;
  };
  const items = Object.values(LURES).flatMap((L) => L.items || []);
  for (const m of moments()) {
    count++;
    const t = m.text;
    if (seen.has(t)) continue;
    seen.add(t);
    if (/undefined|null|NaN|\[object/.test(t)) flag('빈 값이 문장에 들어감', t);
    const ss = sentences(t);
    if (new Set(ss).size !== ss.length) flag('같은 문장이 두 번', t);
    const pp = pairs(t),
      twice = pp.filter((p, i) => pp.indexOf(p) !== i && !/^(\S+) \1$/.test(p));
    if (twice.length) flag(`같은 말이 두 번 ("${twice[0]}")`, t);
    if ((t.match(/냄새/g) || []).length >= 4) flag('"냄새"가 네 번 이상', t);
    if (t.length > 230) flag('장면이 230자를 넘음', t);
    for (const p of particleProblems(t, items)) flag(`조사 ${p}`, t);
    for (const [a, b, why] of CONFLICTS) {
      const both =
        a.source === b.source
          ? (t.match(new RegExp(a.source, 'g')) || []).length > 1
          : a.test(t) && b.test(t);
      if (both) flag(why, t);
    }
    if (/햇볕|볕이/.test(t) && ['rain', 'cold'].includes(m.s.world) && /빗|눈/.test(t))
      flag('볕과 궂은 날씨', t);
    for (const o of m.options) {
      if (o.text.length > 28) flag('보기가 28자를 넘음', o.text);
      for (const r of o.outcomes) {
        const x = r.text;
        if (/undefined|null|NaN/.test(x)) flag('결과에 빈 값', x);
        for (const p of particleProblems(x, items)) flag(`결과 조사 ${p}`, x);
      }
    }
  }
  // Written crossroads: their texts can read the dog's state, so build them for a few states.
  for (const c of CROSSROADS)
    for (const home of ['family', 'street', 'shelter']) {
      const s = {
        home,
        day: 900,
        relations: [
          { kind: 'sibling', active: true },
          { kind: 'sibling', active: true },
        ],
        reproduction: { children: [{ present: true, birthDay: 890 }], litters: [] },
        crossroads: { marks: ['traffic-fear', 'sound-fear', 'bold'] },
      };
      const t = typeof c.text === 'function' ? c.text(s) : c.text;
      if (/undefined|null|NaN/.test(t)) flag('손으로 쓴 갈림길에 빈 값', `${c.id}: ${t}`);
      for (const o of c.options) if (o.text.length > 28) flag('보기가 28자를 넘음', o.text);
    }
  return { moments: count, distinct: seen.size, problems };
}

if (
  import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` ||
  process.argv[1]?.endsWith('check-crossroad-text.mjs')
) {
  const { moments: n, distinct, problems } = checkCrossroadText({ limit: 3 });
  console.log(`조합 장면 ${n}개 (서로 다른 문장 ${distinct}개) 점검`);
  if (!problems.size) console.log('문제 없음');
  for (const [rule, list] of problems) {
    console.log(`\n■ ${rule} · ${list.total}건`);
    for (const t of list) console.log('  - ' + t);
  }
  process.exitCode = problems.size ? 1 : 0;
}
