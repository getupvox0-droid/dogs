import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLife,
  advance,
  choose,
  acknowledgeBirth,
  serialize,
  restore,
} from '../dist/engine.js';
import { decisionUid } from '../dist/decisions.js';
import { CROSSROADS, pickOutcome } from '../dist/crossroads.js';
import { encodeLife, replayLife, decodeLife } from '../dist/share.js';
import { setBirthDate } from '../dist/chronicle.js';

const live = (seed, pick) => {
  const s = createLife(seed, `life-${seed}-x`, { birthMode: 'explore' });
  setBirthDate(s, '2026-11-03');
  acknowledgeBirth(s);
  let k = 0;
  while (s.alive) {
    if (!s.pending) {
      advance(s, 1);
      continue;
    }
    k++;
    choose(s, pick(s.pending, k).id, decisionUid(s));
  }
  return s;
};

test('every crossroad has player-only knowledge, 2–3 options and a safe way out', () => {
  assert.equal(CROSSROADS.length, 10);
  for (const c of CROSSROADS) {
    assert.ok(c.know.length > 10, c.id);
    assert.ok(c.options.length >= 2 && c.options.length <= 3, c.id);
    // The last option never kills: a careful dog can always step back.
    assert.ok(
      c.options.at(-1).outcomes.every((o) => !o.die),
      c.id,
    );
    for (const opt of c.options) assert.ok(opt.outcomes.length >= 1);
  }
  assert.ok(CROSSROADS.some((c) => c.options.some((x) => x.outcomes.some((o) => o.die))));
});

test('outcomes are drawn from the seed, so the same moment always ends the same way', () => {
  const s = createLife(5);
  const road = CROSSROADS.find((c) => c.id === 'road-smell').options[0];
  const a = pickOutcome(s, road);
  assert.equal(pickOutcome(s, road), a);
  const seen = new Set();
  for (let serial = 0; serial < 300; serial++) {
    s.decisionSerial = serial;
    seen.add(road.outcomes.indexOf(pickOutcome(s, road)));
  }
  assert.equal(seen.size, 3, 'every road outcome can happen');
});

test('risky choices can end a life; careful ones never die at a crossroad', () => {
  let risky = 0,
    careful = 0,
    met = 0;
  for (let seed = 1; seed <= 120; seed++) {
    const a = live(seed, (p) => p.options[0]);
    const b = live(seed, (p) => p.options.at(-1));
    met += a.crossroads.history.length;
    if (a.crossroads.history.at(-1)?.day === a.day && a.log.at(-1).id === 'death') risky++;
    if (b.crossroads.history.at(-1)?.day === b.day && b.log.at(-1).id === 'death') careful++;
    assert.equal(a.log.at(-1).id, 'death');
  }
  assert.ok(risky > 5, `risky deaths ${risky}`);
  assert.equal(careful, 0);
  assert.ok(met / 120 >= 3, 'a life meets several crossroads');
});

test('marks from a crossroad change later moments and survive a save', () => {
  const s = createLife(8);
  s.crossroads.marks.push('traffic-fear');
  const road = CROSSROADS.find((c) => c.id === 'road-smell');
  assert.match(road.text(s), /굉음이 들리자 몸이 먼저 굳는다/);
  const back = restore(serialize(s));
  assert.deepEqual(back.crossroads.marks, ['traffic-fear']);
  const bad = JSON.parse(serialize(s));
  bad.crossroads.seen = ['not-a-crossroad'];
  assert.throws(() => restore(JSON.stringify(bad)));
});

test('a life with crossroads replays from its share link, and old links are refused', () => {
  const s = live(31, (p, k) => p.options[k % p.options.length]);
  assert.ok(s.crossroads.history.length > 0);
  const again = replayLife(encodeLife(s));
  assert.deepEqual(
    again.log.map((e) => [e.day, e.id, e.text]),
    s.log.map((e) => [e.day, e.id, e.text]),
  );
  const old = encodeLife(s).replace(/^v2\./, 'v1.');
  assert.throws(() => decodeLife(old));
});
