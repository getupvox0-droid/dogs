import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, advance, serialize, restore } from '../dist/engine.js';
import { companionAlbum, longestCompanion, firstMet, KIND_NAMES } from '../dist/album.js';
import { lifeEntry, parseCollection, addLife, emptyCollection } from '../dist/collection.js';

function lived(seed) {
  const s = createLife(seed);
  while (s.alive) {
    advance(s, 30);
    if (s.pending) s.pending = null;
  }
  return s;
}

test('first contact days are recorded from birth', () => {
  const s = lived(3);
  assert.equal(s.relationDatesFrom, 0);
  const mother = s.relations.find((r) => r.kind === 'mother');
  if (mother) assert.equal(firstMet(s, mother), 0);
  for (const r of s.relations.filter((r) => r.contacts > 0)) {
    assert.ok(Number.isInteger(r.firstContact), r.id);
    assert.ok(r.firstContact <= (r.lastContact ?? s.day), r.id);
  }
});

test('saves from before first contact tracking keep earlier first days unknown', () => {
  const s = createLife(4);
  advance(s, 400);
  delete s.relationDatesFrom;
  for (const r of s.relations) delete r.firstContact;
  const back = restore(serialize(s));
  assert.ok(s.day > 30);
  assert.equal(back.relationDatesFrom, s.day);
  for (const r of back.relations.filter((r) => r.contacts > 0))
    assert.equal(firstMet(back, r), null);
  assert.ok(companionAlbum(back).every((e) => e.span.startsWith('마지막으로 함께한 때')));
});

test('album lists only beings with contact, closest first, with readable spans', () => {
  for (const seed of [3, 12, 36]) {
    const s = lived(seed),
      album = companionAlbum(s);
    assert.ok(album.length > 0);
    for (let i = 1; i < album.length; i++) assert.ok(album[i - 1].score >= album[i].score);
    for (const e of album) {
      assert.ok(e.contacts > 0);
      assert.equal(e.kindName, KIND_NAMES[e.kind]);
      assert.match(e.span, /부터|마지막으로/);
      assert.match(e.together, /^(함께한 날 \d+일|만난 횟수 \d+번)$/);
    }
    const longest = longestCompanion(s);
    assert.ok(longest && longest.kind !== 'sibling');
  }
});

test('the book keeps each life’s longest companion and tolerates older entries', () => {
  const s = lived(3),
    e = lifeEntry(s);
  assert.equal(e.companion.name, longestCompanion(s).name);
  const old = { ...e };
  delete old.companion;
  const c = parseCollection(
    JSON.stringify(addLife(addLife(emptyCollection(), old), { ...e, lifeId: 'x' })),
  );
  assert.equal(c.lives.length, 2);
  assert.equal(
    parseCollection(JSON.stringify({ version: 1, lives: [{ ...e, companion: { name: 3 } }] })).lives
      .length,
    0,
  );
});
