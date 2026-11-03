import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, choose, serialize, restore } from '../dist/engine.js';
import { createDailyLife, koreaDate, dailySeed, DAILY_BIRTH_MODE } from '../dist/daily.js';

const birth = (s) =>
  JSON.stringify([
    s.seed,
    s.lifeId,
    s.country.id,
    s.home,
    s.breed,
    s.appearance,
    s.worldModel.origin.factors,
    s.worldModel.litter,
    s.worldModel.traits,
    s.chronicle.birth,
  ]);

test('the same Korean date always gives the same dog', () => {
  const a = createDailyLife('2026-11-03'),
    b = createDailyLife('2026-11-03');
  assert.equal(birth(a), birth(b));
  assert.equal(a.daily, '2026-11-03');
  assert.equal(a.chronicle.birthDate, '2026-11-03');
  assert.equal(a.birthMode, DAILY_BIRTH_MODE);
});

test('different dates give different dogs', () => {
  const days = Array.from({ length: 30 }, (_, i) =>
    koreaDate(new Date(Date.UTC(2026, 10, 1 + i, 3))),
  );
  assert.equal(new Set(days.map(dailySeed)).size, 30);
  assert.ok(new Set(days.map((d) => birth(createDailyLife(d)))).size === 30);
});

test('the day turns over at midnight in Korea, not UTC', () => {
  assert.equal(koreaDate(new Date('2026-11-03T14:59:59Z')), '2026-11-03');
  assert.equal(koreaDate(new Date('2026-11-03T15:00:00Z')), '2026-11-04');
});

test('same daily dog and same choices replay the same life; other choices can differ', () => {
  const run = (pick) => {
    const s = createDailyLife('2026-11-03');
    let k = 0;
    while (s.alive && s.day < 9000) {
      if (s.pending) choose(s, s.pending.options[pick(s, k++) % s.pending.options.length].id);
      else advance(s, 1);
    }
    return s.log.map((e) => [e.day, e.id, e.text]);
  };
  const first = run(() => 0);
  assert.deepEqual(
    run(() => 0),
    first,
  );
  assert.notDeepEqual(
    run((s, k) => k),
    first,
  );
});

test('the daily mark survives saving and bad values are rejected', () => {
  const s = createDailyLife('2026-11-03');
  assert.equal(restore(serialize(s)).daily, '2026-11-03');
  assert.throws(() => restore(JSON.stringify({ ...JSON.parse(serialize(s)), daily: 'today' })));
});
