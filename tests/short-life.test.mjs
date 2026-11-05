import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, choose, acknowledgeBirth, urgentDecision } from '../dist/engine.js';
import { decisionUid } from '../dist/decisions.js';
import { setBirthDate } from '../dist/chronicle.js';
import { nextStoryBeat, SHORT_ASK_DAYS, timelineEntries } from '../dist/story-runner.js';
import { encodeLife, replayLife } from '../dist/share.js';
import { TRAIL } from '../dist/engine.js';

function live(seed, length) {
  const s = createLife(seed, `short-${seed}`, { birthMode: 'real' });
  setBirthDate(s, '2026-11-03');
  acknowledgeBirth(s);
  s.chronicle.preferences.lifeLength = length;
  const asked = [];
  while (s.alive) {
    if (s.pending) {
      asked.push({ id: s.pending.id, day: s.day, urgent: urgentDecision(s, s.pending.id) });
      choose(s, s.pending.options[s.day % s.pending.options.length].id, decisionUid(s));
      continue;
    }
    nextStoryBeat(s, { length });
  }
  return { s, asked };
}

test('a short life leaves small choices to the dog and asks at most once a season', () => {
  for (const seed of [11, 23, 37]) {
    const { s, asked } = live(seed * 7919, 'short');
    const ordinary = asked.filter((a) => !a.urgent);
    for (let i = 1; i < ordinary.length; i++) {
      const before = asked.filter((a) => a.day < ordinary[i].day && !a.urgent).at(-1);
      if (before) assert.ok(ordinary[i].day - before.day >= SHORT_ASK_DAYS, `seed ${seed}`);
    }
    assert.ok(s.trail.includes(TRAIL.AUTO), 'some choices were the dog’s own');
    assert.ok(timelineEntries(s).some((e) => e.action?.startsWith('아이가 스스로 정함 · ')));
    const again = replayLife(encodeLife(s));
    assert.equal(again.day, s.day);
  }
});

test('a normal life still puts every choice to the player', () => {
  const { s } = live(5 * 7919, 'normal');
  assert.ok(!s.trail.includes(TRAIL.AUTO));
  assert.equal(replayLife(encodeLife(s)).day, s.day);
});
