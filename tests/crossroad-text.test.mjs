import test from 'node:test';
import assert from 'node:assert/strict';
import { checkCrossroadText } from '../scripts/check-crossroad-text.mjs';

// Every sentence a generated crossroad can build, checked by rules (scripts/check-crossroad-text.mjs).
test('no generated crossroad sentence breaks a text rule', () => {
  const { moments, problems } = checkCrossroadText({ limit: 2 });
  assert.ok(moments > 100000);
  const report = [...problems].map(([rule, list]) => `${rule} (${list.total}): ${list[0]}`);
  assert.deepEqual(report, []);
});
