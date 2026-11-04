import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, advance, choose, acknowledgeBirth, random } from '../dist/engine.js';
import { automaticAction } from '../dist/decisions.js';
import { setBirthDate } from '../dist/chronicle.js';
import { lifeRarity, oneIn, ukSurvival } from '../dist/rarity.js';
import { UK_REFERENCE } from '../dist/statistics.js';

const lived = (seed) => {
  const s = createLife(seed, `r-${seed}`, { birthMode: 'real' });
  setBirthDate(s, '2026-11-03');
  acknowledgeBirth(s);
  while (s.alive)
    s.pending ? choose(s, automaticAction(s, random), null, { auto: true }) : advance(s, 1);
  return s;
};

test('the UK life table gives the share dying at each age, summing to one', () => {
  assert.equal(ukSurvival(0), 1);
  let total = 0;
  for (let y = 0; y < UK_REFERENCE.annualQ.length; y++)
    total += ukSurvival(y) * UK_REFERENCE.annualQ[y];
  assert.ok(Math.abs(total - 1) < 1e-9);
});

test('one in N rounds to two significant figures', () => {
  assert.equal(oneIn(0.5), 2);
  assert.equal(oneIn(1 / 1234), 1200);
  assert.equal(oneIn(1 / 56789), 57000);
  assert.equal(oneIn(0), null);
});

test('every finished life gets sourced factors and a readable headline', () => {
  for (let seed = 1; seed <= 15; seed++) {
    const r = lifeRarity(lived(seed));
    assert.ok(r.factors.length >= 2);
    for (const f of r.factors) {
      assert.ok(f.p > 0 && f.p <= 1);
      assert.ok(f.source.length > 3);
      assert.doesNotMatch(f.text, /undefined|NaN|null/);
    }
    assert.match(r.headline, /^약 [\d,]+마리 중 한 마리의 삶$|^흔한 삶$/);
  }
});
