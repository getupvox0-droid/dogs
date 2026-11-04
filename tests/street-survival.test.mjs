import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, advance, choose, acknowledgeBirth } from '../dist/engine.js';
import { decisionUid } from '../dist/decisions.js';
import { pupDanger, PUP_SURVIVAL_SOURCE } from '../dist/street-survival.js';

// Street-born pups reach adulthood about as often as the field study reports (≈19%).
test('street pups reach adulthood near the field figure, and careful play helps', () => {
  const run = (pick) => {
    let n = 0,
      grown = 0;
    for (let seed = 1; n < 160; seed++) {
      const s = createLife(seed * 31, null, { birthMode: 'explore' });
      if (s.home !== 'street') continue;
      acknowledgeBirth(s);
      let k = 0;
      while (s.alive && s.day < s.reproduction.matureAt) {
        if (!s.pending) {
          advance(s, 1);
          continue;
        }
        k++;
        const o = s.pending.options;
        choose(
          s,
          (s.pending.id.startsWith('crossroad:') ? pick(o, k) : o[k % o.length]).id,
          decisionUid(s),
        );
      }
      n++;
      if (s.alive) grown++;
    }
    return grown / n;
  };
  const average = run((o, k) => o[k % o.length]),
    careful = run((o) => o[1]);
  assert.ok(average > 0.1 && average < 0.32, `average ${average}`);
  assert.ok(careful > average, `careful ${careful} vs ${average}`);
  assert.equal(PUP_SURVIVAL_SOURCE.value, 0.19);
});

test('being fed, near the mother and knowing food lower the daily danger', () => {
  const s = createLife(3);
  s.home = 'street';
  s.day = 60;
  s.health = 80;
  s.needs.hunger = 30;
  s.relations = [];
  s.crossroads = { forage: 0, marks: [] };
  const base = pupDanger(s);
  s.needs.hunger = 90;
  assert.ok(pupDanger(s) > base);
  s.needs.hunger = 30;
  s.relations = [{ kind: 'mother', active: true }];
  assert.ok(pupDanger(s) < base);
  s.crossroads.forage = 30;
  assert.ok(pupDanger(s) < base * 0.7);
});
