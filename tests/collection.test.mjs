import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, advance, COUNTRIES } from '../dist/engine.js';
import {
  PATHS,
  COLLECTION_MAX,
  emptyCollection,
  parseCollection,
  lifeEntry,
  addLife,
  summarize,
} from '../dist/collection.js';

function finished(seed) {
  const s = createLife(seed);
  for (let i = 0; i < 400 && s.alive; i++) {
    advance(s, 30);
    if (s.pending) s.pending = null;
  }
  if (s.alive) {
    s.alive = false;
    s.cause = '테스트';
  }
  return s;
}

test('a living dog cannot enter the book', () => {
  assert.throws(() => lifeEntry(createLife(1)));
});

test('finished lives are recorded once per id and survive a round trip', () => {
  const a = lifeEntry(finished(3)),
    b = lifeEntry(finished(4));
  let c = addLife(addLife(emptyCollection(), a), b);
  c = addLife(c, a);
  assert.equal(c.lives.length, 2);
  const back = parseCollection(JSON.stringify(c));
  assert.deepEqual(back, c);
  assert.equal(back.lives.at(-1).lifeId, a.lifeId);
});

test('bad or foreign data becomes an empty book instead of breaking', () => {
  for (const raw of [null, '', 'not json', '{}', JSON.stringify(createLife(1))])
    assert.deepEqual(parseCollection(raw), emptyCollection());
  const c = parseCollection(
    JSON.stringify({ version: 1, lives: [{ lifeId: 'x' }, lifeEntry(finished(5))] }),
  );
  assert.equal(c.lives.length, 1);
});

test('the book keeps at most the latest lives', () => {
  const e = lifeEntry(finished(6));
  let c = emptyCollection();
  for (let i = 0; i < COLLECTION_MAX + 5; i++) c = addLife(c, { ...e, lifeId: 'l' + i });
  assert.equal(c.lives.length, COLLECTION_MAX);
  assert.equal(c.lives[0].lifeId, 'l5');
});

test('summary counts births, paths and looks', () => {
  let c = emptyCollection();
  for (let seed = 10; seed < 30; seed++) c = addLife(c, lifeEntry(finished(seed)));
  const sum = summarize(c, COUNTRIES);
  assert.equal(sum.total, 20);
  const births = Object.values(sum.births).flatMap((r) => Object.values(r));
  assert.equal(
    births.reduce((a, b) => a + b, 0),
    20,
  );
  assert.equal(sum.birthCells.all, COUNTRIES.length * 3);
  assert.equal(sum.birthCells.filled, births.filter((n) => n > 0).length);
  assert.equal(
    sum.breeds.reduce((a, b) => a + b.count, 0),
    20,
  );
  assert.equal(sum.paths.length, PATHS.length);
  for (const p of sum.paths) assert.equal(p.count > 0, p.first !== null);
  assert.ok(sum.recent.length <= 12);
});

test('path labels describe what happened without judging the life', () => {
  for (const p of PATHS)
    for (const word of ['불쌍', '운이', '행복', '불행', '좋은', '나쁜', '성공', '실패'])
      assert.ok(!p.label.includes(word), `${p.id}: ${word}`);
});
