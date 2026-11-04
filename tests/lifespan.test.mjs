import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, advance, choose, acknowledgeBirth, random } from '../dist/engine.js';
import { automaticAction } from '../dist/decisions.js';
import { setBirthDate } from '../dist/chronicle.js';
import { UK_REFERENCE } from '../dist/statistics.js';
import { END_CAUSES, endCause } from '../dist/end-of-life.js';

const ukAlive = (y) => UK_REFERENCE.annualQ.slice(0, y).reduce((p, q) => p * (1 - q), 1);

test('family dogs live about as long as the UK life table, and mostly die of its common causes', () => {
  const N = 160,
    ages = [],
    causes = {};
  for (let seed = 1, n = 0; n < N; seed++) {
    const s = createLife(seed, `l${seed}`, { birthMode: 'real' });
    if (s.home !== 'family') continue;
    n++;
    setBirthDate(s, '2026-11-03');
    acknowledgeBirth(s);
    while (s.alive)
      s.pending ? choose(s, automaticAction(s, random), null, { auto: true }) : advance(s, 1);
    ages.push(s.day / 365);
    const k = s.cause.split(' · ')[0];
    causes[k] = (causes[k] || 0) + 1;
  }
  const mean = ages.reduce((a, b) => a + b, 0) / N;
  assert.ok(Math.abs(mean - UK_REFERENCE.e0) < 1.2, `mean ${mean}`);
  for (const y of [4, 8, 12, 16]) {
    const sim = ages.filter((a) => a >= y).length / N;
    assert.ok(Math.abs(sim - ukAlive(y)) < 0.1, `${y}y ${sim} vs ${ukAlive(y)}`);
  }
  const top = Object.entries(causes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);
  assert.ok(top.includes('종양') || top.includes('노년기 전신 쇠약'), top.join(','));
  // 160 lives is a small sample; on 400 the share is about 6% (scripts/measure-lifespan.mjs).
  assert.ok((causes['다리 부상 후 전신 상태 악화'] || 0) / N < 0.12);
});

test('young dogs end by behaviour, gut or accidents; old dogs by tumours and decline', () => {
  const tally = (days) => {
    const out = {};
    for (let i = 0; i < 2000; i++) {
      const k = endCause({ day: days, home: 'family' }, i / 2000);
      out[k] = (out[k] || 0) + 1;
    }
    return out;
  };
  const young = tally(365),
    old = tally(12 * 365);
  assert.ok(young.behaviour > young.cancer && young.digestive > young.cancer);
  assert.ok(old.cancer > 5 * (old.behaviour || 0) && old.decline > (old.trauma || 0));
  assert.equal(old.behaviour, undefined);
  const street = {};
  for (let i = 0; i < 2000; i++) street[endCause({ day: 365, home: 'street' }, i / 2000)] = 1;
  assert.equal(street.behaviour, undefined);
  assert.equal(Object.keys(END_CAUSES).length, 10);
});
