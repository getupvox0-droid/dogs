import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, serialize, restore } from '../dist/engine.js';
import { nextStoryBeat, beatDelay, LIFE_LENGTHS, lifeLength } from '../dist/story-runner.js';

function watch(seed, length) {
  const s = createLife(seed);
  s.mode = 'observe';
  s.chronicle.preferences.lifeLength = length;
  let ms = 0,
    beats = 0;
  while (s.alive && beats < 20000) {
    ms += beatDelay(nextStoryBeat(s), 1);
    beats++;
  }
  return { s, ms, beats };
}

test('life length only changes pacing, never the life itself', () => {
  for (const seed of [2, 9, 21]) {
    const lives = Object.keys(LIFE_LENGTHS).map((k) => watch(seed, k).s);
    for (const s of lives.slice(1)) {
      assert.equal(s.day, lives[0].day);
      assert.deepEqual(
        s.log.map((e) => [e.day, e.id]),
        lives[0].log.map((e) => [e.day, e.id]),
      );
    }
  }
});

test('short is quicker than normal, and long is slower', () => {
  let short = 0,
    normal = 0,
    long = 0;
  for (let seed = 1; seed <= 8; seed++) {
    short += watch(seed, 'short').ms;
    normal += watch(seed, 'normal').ms;
    long += watch(seed, 'long').ms;
  }
  assert.ok(short < normal * 0.85, `${short} vs ${normal}`);
  assert.ok(long > normal * 1.5, `${long} vs ${normal}`);
});

test('short lives still stop for every important record', () => {
  const s = createLife(5);
  s.mode = 'observe';
  s.chronicle.preferences.lifeLength = 'short';
  while (s.alive) {
    const b = nextStoryBeat(s);
    const important = b.events.filter((e) => e.id === 'death' || e.id === 'adopt').length;
    assert.ok(important <= 1);
  }
});

test('life length defaults to normal and is checked on restore', () => {
  const s = createLife(1);
  assert.equal(lifeLength(s), 'normal');
  s.chronicle.preferences.lifeLength = 'long';
  assert.equal(lifeLength(restore(serialize(s))), 'long');
  s.chronicle.preferences.lifeLength = 'forever';
  assert.throws(() => restore(serialize(s)));
});
