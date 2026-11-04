import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLife,
  advance,
  choose,
  acknowledgeBirth,
  random,
  serialize,
  restore,
} from '../dist/engine.js';
import { automaticAction } from '../dist/decisions.js';
import { setBirthDate } from '../dist/chronicle.js';
import { encodeLife, replayLife } from '../dist/share.js';
import { FOCUS, focusEffect, focusYears } from '../dist/year-focus.js';
import { pupDanger } from '../dist/street-survival.js';

const untilFocus = (s) => {
  while (s.alive && s.pending?.id !== 'year-focus')
    s.pending ? choose(s, automaticAction(s, random), null, { auto: true }) : advance(s, 1);
  return s;
};
// The first life born in `home` that lives to its first direction (many street pups do not).
const born = (home) => {
  for (let seed = 1; ; seed++) {
    const s = createLife(seed, `y-${seed}`, { birthMode: 'real' });
    if (s.home !== home) continue;
    setBirthDate(s, '2026-11-03');
    acknowledgeBirth(s);
    const probe = restore(serialize(s));
    if (untilFocus(probe).alive && probe.home === home) return s;
  }
};

test('every direction reads cleanly and fits an option button', () => {
  for (const list of Object.values(FOCUS))
    for (const o of list) {
      assert.ok(o.text.length <= 28, o.text);
      assert.match(o.know, /[^.]$/);
      assert.ok(o.line && Object.keys(o.effect).length);
    }
});

test('the direction is asked after weaning and on birthdays, and reviewed each year', () => {
  const s = untilFocus(born('family'));
  assert.ok(s.day >= 60 && s.day < 120);
  assert.match(s.pending.know, /Teng et al\. 2022/);
  choose(s, 'explore');
  assert.deepEqual(focusEffect(s).lures, ['scent', 'prey', 'open']);
  untilFocus(s);
  if (!s.alive) return;
  assert.equal(s.day % 365 === 0 || s.focus.current === null, true);
  assert.match(s.log.findLast((e) => e.id === 'year-review').text, /한 해였다\.|시간이었다\./);
  choose(s, 'rest');
  assert.deepEqual(
    focusYears(s).map((y) => y.id),
    ['explore', 'rest'],
  );
});

test('a street pup that keeps to the pack is in less daily danger than one roaming for food', () => {
  const a = untilFocus(born('street')),
    b = restore(serialize(a));
  choose(a, 'pack');
  choose(b, 'forage');
  assert.ok(pupDanger(a) < pupDanger(b));
});

test('the direction survives saving and replays from a share link', () => {
  const s = untilFocus(born('street'));
  choose(s, 'people');
  const back = restore(serialize(s));
  assert.deepEqual(back.focus, s.focus);
  while (s.alive)
    s.pending ? choose(s, automaticAction(s, random), null, { auto: true }) : advance(s, 1);
  const again = replayLife(encodeLife(s));
  assert.deepEqual(again.focus, s.focus);
  const broken = JSON.parse(serialize(back));
  broken.focus.current.id = 'fly';
  assert.throws(() => restore(JSON.stringify(broken)));
});
