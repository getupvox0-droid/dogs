import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, serialize, restore, setName, cleanName, COUNTRIES } from '../dist/engine.js';
import { birthStory } from '../dist/chronicle.js';
import {
  COUNTRY_DOGS,
  countryShares,
  homeShares,
  weightedPick,
  countryFacts,
} from '../dist/birth-odds.js';

test('every country has sourced dog figures and shares sum to one', () => {
  for (const c of COUNTRIES) {
    const d = COUNTRY_DOGS[c.id];
    assert.ok(d, c.id);
    for (const f of [d.owned, d.freeRoaming]) {
      assert.ok(f.value > 0 && typeof f.source === 'string' && f.source.length > 0);
      assert.ok(['medium', 'low', 'assumption', 'derived'].includes(f.confidence));
    }
    const h = homeShares(c.id);
    assert.ok(Math.abs(h.family + h.street + h.shelter - 1) < 1e-9);
  }
  const shares = countryShares(COUNTRIES);
  assert.ok(Math.abs(Object.values(shares).reduce((a, b) => a + b, 0) - 1) < 1e-9);
});

test('weightedPick covers the whole [0, 1) range', () => {
  const e = [
    ['a', 0.25],
    ['b', 0.75],
  ];
  assert.equal(weightedPick(e, 0), 'a');
  assert.equal(weightedPick(e, 0.2499), 'a');
  assert.equal(weightedPick(e, 0.25), 'b');
  assert.equal(weightedPick(e, 0.999999), 'b');
});

test('explore mode is the default and stays uniform', () => {
  const n = 6000,
    count = {};
  for (let seed = 0; seed < n; seed++) {
    const s = createLife(seed);
    assert.equal(s.birthMode, 'explore');
    count[s.country.id] = (count[s.country.id] || 0) + 1;
  }
  for (const c of COUNTRIES)
    assert.ok(Math.abs(count[c.id] / n - 1 / COUNTRIES.length) < 0.02, c.id);
});

test('real mode follows the sourced country and home shares', () => {
  const n = 12000,
    country = {},
    home = {},
    shares = countryShares(COUNTRIES);
  for (let seed = 0; seed < n; seed++) {
    const s = createLife(seed, null, { birthMode: 'real' });
    assert.equal(s.birthMode, 'real');
    country[s.country.id] = (country[s.country.id] || 0) + 1;
    const k = s.country.id + '/' + s.home;
    home[k] = (home[k] || 0) + 1;
  }
  for (const c of COUNTRIES)
    assert.ok(Math.abs((country[c.id] || 0) / n - shares[c.id]) < 0.02, c.id);
  const inStreet = (home['IN/street'] || 0) / (country.IN || 1);
  assert.ok(Math.abs(inStreet - homeShares('IN').street) < 0.05);
});

test('same seed and mode replay the same birth', () => {
  for (const birthMode of ['explore', 'real'])
    for (let seed = 0; seed < 50; seed++)
      assert.equal(
        serialize(createLife(seed, 'x', { birthMode })),
        serialize(createLife(seed, 'x', { birthMode })),
      );
});

test('names are cleaned, saved and validated on restore', () => {
  assert.equal(cleanName('  보리\u0007  '), '보리');
  assert.equal(cleanName('가'.repeat(30)).length, 12);
  const s = createLife(3);
  assert.equal(s.name, null);
  assert.equal(setName(s, '   '), null);
  assert.equal(setName(s, ' 밤톨 '), '밤톨');
  assert.equal(restore(serialize(s)).name, '밤톨');
  assert.throws(() => restore(serialize({ ...s, name: 'x'.repeat(40) })));
  assert.throws(() => restore(serialize({ ...s, name: 42 })));
  assert.throws(() => restore(serialize({ ...s, birthMode: 'cheat' })));
});

test('saves from before naming and birth modes still load', () => {
  const s = JSON.parse(serialize(createLife(9)));
  delete s.name;
  delete s.birthMode;
  const r = restore(JSON.stringify(s));
  assert.equal(r.name, null);
  assert.equal(r.birthMode, 'explore');
});

test('the newborn senses its world without place names or judgement', () => {
  for (let seed = 0; seed < 200; seed++) {
    const s = createLife(seed),
      text = birthStory(s);
    assert.ok(text.length > 20);
    for (const word of [s.country.name, s.country.place, s.chronicle.birth.place, '불쌍', '운이'])
      assert.ok(!text.includes(word), `${seed}: ${word}`);
  }
});

test('real mode is no longer dominated by one country', () => {
  const shares = countryShares(COUNTRIES);
  assert.ok(COUNTRIES.length >= 12);
  for (const c of COUNTRIES) assert.ok(shares[c.id] < 0.3, c.id);
  assert.ok(shares.US * homeShares('US').family < 0.25);
});

test('countries known only by a total derive the owned part', () => {
  const d = COUNTRY_DOGS.TH;
  assert.equal(d.owned.confidence, 'derived');
  assert.ok(Math.abs(d.owned.value + d.freeRoaming.value - d.total.value) < 0.01);
  const f = countryFacts('TH');
  assert.equal(f.total, '약 670만 마리');
  assert.match(f.owned, /전체에서 계산/);
  assert.equal(f.sources.length, 1);
  assert.equal(countryFacts('KR').total, null);
});

test('country facts only quote sourced numbers', () => {
  assert.equal(countryFacts('KR').freeRoaming, '공식 추정치 없음');
  assert.match(countryFacts('US').owned, /^약 8,730만 마리$/);
  assert.ok(countryFacts('IN').sources.some((x) => x.includes('2019')));
});
