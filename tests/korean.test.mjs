import test from 'node:test';
import assert from 'node:assert/strict';
import { josa, euro } from '../dist/korean.js';
import { createLife, advance } from '../dist/engine.js';

test('particles follow the final consonant', () => {
  assert.equal(josa('보리', '은', '는'), '보리는');
  assert.equal(josa('밤톨', '은', '는'), '밤톨은');
  assert.equal(josa('흰 발끝의 개', '이', '가'), '흰 발끝의 개가');
  assert.equal(josa('콩', '과', '와'), '콩과');
  assert.equal(josa('Max', '은', '는'), 'Max는');
  assert.equal(euro('노년기 전신 쇠약'), '노년기 전신 쇠약으로');
  assert.equal(euro('위장 질환 악화'), '위장 질환 악화로');
  assert.equal(euro('길'), '길로');
});

test('no death record uses the wrong 로/으로', () => {
  for (let seed = 1; seed < 80; seed++) {
    const s = createLife(seed);
    while (s.alive) {
      advance(s, 30);
      if (s.pending) s.pending = null;
    }
    for (const e of s.log.filter((e) => e.id === 'death'))
      for (const m of e.text.matchAll(/([가-힣])(으로|로) 기력/g)) {
        const f = (m[1].charCodeAt(0) - 0xac00) % 28;
        if (m[2] === '로') assert.ok(f === 0 || f === 8, e.text);
        else assert.ok(f !== 0 && f !== 8, e.text);
      }
  }
});
