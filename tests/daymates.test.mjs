import test from 'node:test';
import assert from 'node:assert/strict';
import {
  liveDaymates,
  daymateNews,
  daymateStatus,
  daymatePath,
  daymateSeeds,
  compareFive,
} from '../dist/daymates.js';

test('daymates follow from the seed and differ from one another', () => {
  const a = liveDaymates(77, '2026-11-03'),
    b = liveDaymates(77, '2026-11-03');
  assert.equal(a.length, 4);
  assert.deepEqual(a, b);
  assert.equal(new Set(daymateSeeds(77)).size, 4);
  assert.equal(new Set(a.map((d) => d.who)).size, 4);
});

test('news reads cleanly and only shows what has happened by that day', () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const lives = liveDaymates(seed, '2026-11-03');
    const all = daymateNews(lives);
    assert.ok(all.some((n) => n.id === 'death'));
    for (const n of all) {
      assert.doesNotMatch(n.text + (n.fact || ''), /undefined|null|NaN|\d[이가은는]\s/);
      assert.match(n.text, /다\.$/);
    }
    const mid = Math.min(...lives.map((d) => d.days));
    assert.ok(daymateNews(lives, mid).every((n) => n.day <= mid));
    for (const d of lives) {
      assert.ok(daymateStatus(d, 0).endsWith('지내는 중'));
      assert.match(daymateStatus(d, d.days), /떠남$/);
      assert.ok(daymatePath(d).length > 0);
    }
  }
});

test('the comparison ranks the player dog among the five', () => {
  const lives = liveDaymates(9, '2026-11-03');
  const { rows, rank } = compareFive({ who: '보리', days: 0, path: [] }, lives);
  assert.equal(rows.length, 5);
  assert.equal(rank, 5);
});
