// Share of street-born pups that reach adulthood under three ways of playing, against the field
// figure (Paul et al. 2016, 19%).
import { createLife, advance, choose, acknowledgeBirth, random } from '../dist/engine.js';
import { automaticAction, decisionUid } from '../dist/decisions.js';
import { setBirthDate } from '../dist/chronicle.js';
const N = Number(process.argv[2] || 300);
const policies = {
  auto: (s) => automaticAction(s, random),
  rotate: (s, k) => s.pending.options[k % s.pending.options.length].id,
  careful: (s, k) =>
    s.pending.id.startsWith('crossroad:')
      ? s.pending.options[1].id
      : s.pending.options[k % s.pending.options.length].id,
};
for (const [name, pick] of Object.entries(policies)) {
  let n = 0,
    grown = 0;
  for (let seed = 1; n < N; seed++) {
    const s = createLife(seed * 7919, `p${seed}`, { birthMode: 'real' });
    if (s.home !== 'street') continue;
    n++;
    setBirthDate(s, '2026-11-03');
    acknowledgeBirth(s);
    let k = 0;
    while (s.alive && s.day < s.reproduction.matureAt) {
      if (!s.pending) advance(s, 1);
      else choose(s, pick(s, ++k), decisionUid(s));
    }
    if (s.alive) grown++;
  }
  console.log(`${name}: ${((grown / n) * 100).toFixed(1)}% of ${n} reached adulthood (field 19%)`);
}
