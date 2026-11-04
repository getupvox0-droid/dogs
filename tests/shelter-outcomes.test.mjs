import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife } from '../dist/engine.js';
import { shelterStep, SHELTER_OUTCOMES } from '../dist/shelter-outcomes.js';

const ctx = { log: (s, id, text) => s.log.push({ day: s.day, id, text }), remember: () => {} };
function stayOutcome(seed, { appeal = 1, returnable = false, country = 'KR' } = {}) {
  const s = createLife(seed, null, { birthMode: 'home', country });
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
// Shelter stays end the way each country's published figures report (Korea 2024 survey,
// US Shelter Animals Count 2024, Japan Ministry of the Environment FY2024).
for (const country of ['KR', 'US', 'JP'])
  test(`${country} shelter outcomes follow the published shares`, () => {
    const n = 600,
      count = { adopted: 0, natural: 0, euthanized: 0, returned: 0 };
    for (let seed = 1; seed <= n; seed++)
      count[stayOutcome(seed, { returnable: true, country }).shelterStay.outcome]++;
    // inCare (and transferred) stays are drawn again, so the shares are of finished stays.
    const sh = SHELTER_OUTCOMES[country].shares,
      done = 1 - sh.inCare;
    for (const k of Object.keys(count))
      assert.ok(
        Math.abs(count[k] / n - sh[k] / done) < 0.06,
        `${k} ${count[k] / n} vs ${sh[k] / done}`,
      );
  });
test('every country with shelter data has shares that sum to one and a source', () => {
  for (const [id, d] of Object.entries(SHELTER_OUTCOMES)) {
    const sum = Object.values(d.shares).reduce((a, b) => a + b, 0);
    // A survey can list outcomes the game does not model (Korea: release, donation ≈ 5.6%).
    assert.ok(sum > 0.9 && sum < 1.005, `${id} ${sum}`);
    assert.ok(d.source.length > 10 && d.year >= 2020);
  }
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
