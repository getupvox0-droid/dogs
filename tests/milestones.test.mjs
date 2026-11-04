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
import {
  initNotes,
  dueMilestone,
  answerMilestone,
  stopAsking,
  notesOf,
  NOTE_MAX,
  FAREWELL,
} from '../dist/milestones.js';

// Lives a life the way the page does: time waits while a milestone is open.
function live(seed, answer) {
  const s = createLife(seed, `m-${seed}`, { birthMode: 'real' });
  setBirthDate(s, '2026-11-03');
  acknowledgeBirth(s);
  initNotes(s);
  const asked = [];
  while (s.alive) {
    const due = dueMilestone(s);
    if (due) {
      asked.push(due);
      answerMilestone(s, due.key, answer(due), due.day);
      continue;
    }
    if (s.pending) {
      choose(s, automaticAction(s, random), null, { auto: true });
      s.presentation = null; // the page closes the result card
    } else advance(s, 1);
  }
  return { s, asked };
}

test('a life asks for a line a handful of times, each turning point once', () => {
  let total = 0;
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const { s, asked } = live(seed, (d) => `${d.key} 기억할게`);
    const keys = asked.map((d) => d.key);
    assert.equal(new Set(keys).size, keys.length);
    assert.ok(keys.includes('eyes'));
    assert.equal(notesOf(s).length, asked.length);
    for (const d of asked) assert.ok(d.prompt && d.moment);
    total += asked.length;
  }
  assert.ok(total / 8 >= 2 && total / 8 <= 7, `per life ${total / 8}`);
});

test('notes are cleaned, capped, and empty lines are not kept', () => {
  const s = createLife(3, 'm', { birthMode: 'real' });
  initNotes(s);
  assert.equal(answerMilestone(s, 'eyes', '   '), false);
  assert.equal(notesOf(s).length, 0);
  answerMilestone(s, 'turn', '가\n나\t다'.padEnd(200, '라'));
  assert.equal(notesOf(s)[0].text.length, NOTE_MAX);
  assert.doesNotMatch(notesOf(s)[0].text, /[\n\t]/);
});

test('notes survive saving, and stopping ends the questions', () => {
  const s = createLife(5, 'm', { birthMode: 'real' });
  setBirthDate(s, '2026-11-03');
  acknowledgeBirth(s);
  initNotes(s);
  while (!dueMilestone(s))
    s.pending ? choose(s, automaticAction(s, random), null, { auto: true }) : advance(s, 1);
  const due = dueMilestone(s);
  answerMilestone(s, due.key, '반가워', due.day);
  answerMilestone(s, FAREWELL.key, '잘 가', s.day);
  const back = restore(serialize(s));
  assert.deepEqual(
    notesOf(back).map((n) => n.text),
    ['반가워', '잘 가'],
  );
  stopAsking(back);
  for (let i = 0; i < 4000 && back.alive; i++) {
    assert.equal(dueMilestone(back), null);
    back.pending
      ? choose(back, automaticAction(back, random), null, { auto: true })
      : advance(back, 1);
  }
  const broken = JSON.parse(serialize(s));
  broken.chronicle.notes[0].text = 'x'.repeat(NOTE_MAX + 1);
  assert.throws(() => restore(JSON.stringify(broken)));
});

test('an old save asks only about what comes after it is opened', () => {
  const s = createLife(8, 'm', { birthMode: 'real' });
  setBirthDate(s, '2026-11-03');
  acknowledgeBirth(s);
  for (let i = 0; i < 400; i++)
    s.pending ? choose(s, automaticAction(s, random), null, { auto: true }) : advance(s, 1);
  initNotes(s);
  assert.equal(dueMilestone(s), null);
});
