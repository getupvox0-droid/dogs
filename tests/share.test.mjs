import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLife,
  advance,
  choose,
  random,
  setName,
  acknowledgeBirth,
  serialize,
  restore,
  TRAIL,
} from '../dist/engine.js';
import { setBirthDate } from '../dist/chronicle.js';
import { automaticAction, decisionUid } from '../dist/decisions.js';
import { nextStoryBeat } from '../dist/story-runner.js';
import { createDailyLife } from '../dist/daily.js';
import { canShare, encodeLife, decodeLife, replayLife } from '../dist/share.js';

// Plays like the app: birth scene, then a mix of player picks and observe-mode auto picks.
function played(seed, { name = '콩이', autoEvery = 3, daily = false } = {}) {
  const s = daily
    ? createDailyLife('2026-11-03')
    : createLife(seed, `life-${seed}-a1b2c3`, { birthMode: seed % 2 ? 'real' : 'explore' });
  if (!daily) setBirthDate(s, '2026-11-03');
  setName(s, name);
  acknowledgeBirth(s);
  let k = 0;
  while (s.alive) {
    if (!s.pending) {
      advance(s, 1 + (k % 5));
      continue;
    }
    k++;
    if (autoEvery && k % autoEvery === 0)
      choose(s, automaticAction(s, random), decisionUid(s), { auto: true });
    else choose(s, s.pending.options[k % s.pending.options.length].id, decisionUid(s));
  }
  return s;
}
const sameLife = (a, b) =>
  assert.deepEqual(
    b.log.map((e) => [e.day, e.id, e.text]),
    a.log.map((e) => [e.day, e.id, e.text]),
  );

test('a shared link replays the exact same life', () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const s = played(seed),
      code = encodeLife(s),
      r = replayLife(code);
    sameLife(s, r);
    assert.equal(r.name, s.name);
    assert.equal(r.lifeId, s.lifeId);
    assert.equal(r.cause, s.cause);
    assert.ok(code.length < 220, `${code.length} chars`);
  }
});

test('lives watched in observe mode replay too', () => {
  const s = createLife(11, 'observe-11');
  setBirthDate(s, '2026-11-03');
  acknowledgeBirth(s);
  s.mode = 'observe';
  while (s.alive) nextStoryBeat(s, { observe: true });
  assert.ok(s.trail.includes(TRAIL.AUTO));
  sameLife(s, replayLife(encodeLife(s)));
});

test('daily dogs, names with symbols and lives without a name survive the link', () => {
  const d = played(0, { daily: true });
  const r = replayLife(encodeLife(d));
  assert.equal(r.daily, '2026-11-03');
  sameLife(d, r);
  for (const name of ['보리 & 콩.이#', null]) {
    const s = played(8, { name });
    assert.equal(replayLife(encodeLife(s)).name, s.name);
  }
});

test('living lives and old saves without a trail cannot be shared', () => {
  const s = createLife(2);
  assert.equal(canShare(s), false);
  const old = played(3);
  old.trail = null;
  assert.equal(canShare(old), false);
  assert.throws(() => encodeLife(old));
  const back = restore(serialize(played(4)));
  assert.equal(canShare(back), true);
});

test('tampered, truncated or other-version links are refused', () => {
  const code = encodeLife(played(5));
  const f = code.split('.');
  assert.throws(() => replayLife('v999' + code.slice(code.indexOf('.'))));
  assert.throws(() => replayLife(code.slice(0, -3)));
  assert.throws(() =>
    replayLife([...f.slice(0, 7), (parseInt(f[7], 36) + 1).toString(36), ...f.slice(8)].join('.')),
  );
  assert.throws(() =>
    replayLife([...f.slice(0, 1), (parseInt(f[1], 36) + 1).toString(36), ...f.slice(2)].join('.')),
  );
  assert.throws(() => decodeLife('nonsense'));
});
