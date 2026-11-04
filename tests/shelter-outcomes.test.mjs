import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife } from '../dist/engine.js';
import { shelterStep, SHELTER_OUTCOMES } from '../dist/shelter-outcomes.js';

const ctx = { log: (s, id, text) => s.log.push({ day: s.day, id, text }), remember: () => {} };
function stayOutcome(seed, { appeal = 1, returnable = false } = {}) {
  const s = createLife(seed, null, { birthMode: 'home', country: 'KR' });
  s.home = 'shelter';
  s.day = 400;
  s.health = 80;
  shelterStep(s, ctx);
  s.shelterStay.appeal = appeal;
  s.shelterStay.returnable = returnable;
  for (let i = 0; i < 400 && (!s.shelterStay.outcome || s.shelterStay.outcome === 'inCare'); i++) {
    s.day++;
    shelterStep(s, ctx);
  }
  return s;
}
// Korean shelter stays end the way the 2024 national survey reports.
test('Korean shelter outcomes follow the published shares', () => {
  const n = 600,
    count = { adopted: 0, natural: 0, euthanized: 0, returned: 0 };
  for (let seed = 1; seed <= n; seed++)
    count[stayOutcome(seed, { returnable: true }).shelterStay.outcome]++;
  // inCare stays are drawn again, so the shares are of finished stays.
  const sh = SHELTER_OUTCOMES.KR.shares,
    done = 1 - sh.inCare;
  for (const k of Object.keys(count))
    assert.ok(
      Math.abs(count[k] / n - sh[k] / done) < 0.06,
      `${k} ${count[k] / n} vs ${sh[k] / done}`,
    );
});
test('meeting visitors well raises the adoption chance; only a looked-for dog is returned', () => {
  let shy = 0,
    friendly = 0,
    returned = 0;
  for (let seed = 1; seed <= 300; seed++) {
    if (stayOutcome(seed, { appeal: 0.6 }).shelterStay.outcome === 'adopted') shy++;
    if (stayOutcome(seed, { appeal: 1.7 }).shelterStay.outcome === 'adopted') friendly++;
    if (stayOutcome(seed).shelterStay.outcome === 'returned') returned++;
  }
  assert.ok(friendly > shy * 1.8, `${friendly} vs ${shy}`);
  assert.equal(returned, 0);
});
