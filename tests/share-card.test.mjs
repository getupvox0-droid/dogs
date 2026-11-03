import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife } from '../dist/engine.js';
import { createLife as born, advance } from '../dist/engine.js';
import { downloadLifeCard, keyMoments, lastLine, wrapText, CARD } from '../dist/share-card.js';
test('PNG card uses the selected atlas crop and actual memories, then initiates one download', async () => {
  const keys = ['document', 'Image', 'setTimeout'],
    old = Object.fromEntries(keys.map((k) => [k, globalThis[k]]));
  const lines = [],
    draws = [];
  let downloads = 0;
  const ctx = {
    fillRect() {},
    fillText(t) {
      lines.push(t);
    },
    measureText(t) {
      return { width: t.length * 15 };
    },
    drawImage(...args) {
      draws.push(args);
    },
  };
  const canvas = {
    getContext: () => ctx,
    toBlob(fn) {
      fn(new Blob(['png'], { type: 'image/png' }));
    },
  };
  globalThis.document = {
    createElement: (tag) =>
      tag === 'canvas'
        ? canvas
        : {
            click() {
              downloads++;
            },
          },
  };
  globalThis.Image = class {
    naturalWidth = 1448;
    naturalHeight = 1086;
    set src(v) {
      queueMicrotask(() => this.onload());
    }
  };
  globalThis.setTimeout = (fn) => {
    fn();
    return 1;
  };
  try {
    const s = createLife(8);
    s.day = 500;
    await downloadLifeCard(s);
    assert.equal(downloads, 1);
    assert.equal(canvas.width, CARD.width);
    assert.equal(canvas.height, CARD.height);
    assert.equal(CARD.height / CARD.width, 16 / 9);
    assert.ok(lines.includes(lastLine(s)));
    for (const e of keyMoments(s))
      assert.ok(lines.some((t) => e.text.startsWith(t.replace('…', ''))));
    assert.equal(draws.length, 1);
    assert.equal(draws[0].length, 9);
    assert.ok(lines.some((t) => t === s.breed));
    assert.ok(!lines.some((t) => t.includes('새 가족')));
  } finally {
    for (const k of keys) {
      if (old[k] === undefined) delete globalThis[k];
      else globalThis[k] = old[k];
    }
  }
});

function lived(seed) {
  const s = born(seed);
  while (s.alive) {
    advance(s, 30);
    if (s.pending) s.pending = null;
  }
  return s;
}

test('key moments are the three rarest kinds, each once, in the order they happened', () => {
  for (const seed of [3, 7, 12]) {
    const s = lived(seed),
      m = keyMoments(s);
    assert.ok(m.length > 0 && m.length <= 3);
    assert.equal(new Set(m.map((e) => e.id)).size, m.length);
    for (let i = 1; i < m.length; i++) assert.ok(m[i - 1].day <= m[i].day);
    assert.ok(!m.some((e) => ['birthday', 'death'].includes(e.id)));
    for (const e of m)
      assert.equal(
        s.log.find((x) => x.id === e.id),
        e,
      );
  }
});

test('the last line stays in the senses and never judges the life', () => {
  for (let seed = 1; seed < 25; seed++) {
    const line = lastLine(lived(seed));
    assert.ok(line.length > 5 && line.length < 60, line);
    for (const word of ['불쌍', '운이', '행복', '불행', '좋은', '나쁜'])
      assert.ok(!line.includes(word), line);
  }
});

test('long text wraps within width and ends with an ellipsis when cut', () => {
  const c = { measureText: (t) => ({ width: t.length * 10 }) };
  assert.deepEqual(wrapText(c, 'abcdef', 30, 3), ['abc', 'def']);
  const cut = wrapText(c, 'a'.repeat(100), 30, 2);
  assert.equal(cut.length, 2);
  assert.ok(cut[1].endsWith('…'));
  assert.ok(cut.every((l) => l.length * 10 <= 30));
});
