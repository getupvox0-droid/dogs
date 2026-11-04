// Measures how long family-born dogs live and what they die of, against the UK life table.
import { createLife, advance, choose, acknowledgeBirth, random } from '../dist/engine.js';
import { automaticAction } from '../dist/decisions.js';
import { setBirthDate } from '../dist/chronicle.js';
import { UK_REFERENCE } from '../dist/statistics.js';
const N = Number(process.argv[2] || 200);
const ages = [],
  causes = {};
let n = 0;
for (let seed = 1; n < N; seed++) {
  const s = createLife(seed, `m${seed}`, { birthMode: 'real' });
  if (s.home !== 'family') continue;
  n++;
  setBirthDate(s, '2026-11-03');
  acknowledgeBirth(s);
  while (s.alive)
    s.pending ? choose(s, automaticAction(s, random), null, { auto: true }) : advance(s, 1);
  ages.push(s.day / 365);
  const k = (s.cause || '?').split('·')[0].trim();
  causes[k] = (causes[k] || 0) + 1;
}
ages.sort((a, b) => a - b);
const mean = ages.reduce((a, b) => a + b, 0) / N;
console.log(
  `family-born n=${N} mean ${mean.toFixed(2)}y (UK e0 ${UK_REFERENCE.e0}) median ${ages[N >> 1].toFixed(1)}`,
);
let S = 1;
const row = [];
for (let y = 0; y <= 20; y += 2) {
  const sim = ages.filter((a) => a >= y).length / N;
  let uk = 1;
  for (let i = 0; i < y; i++) uk *= 1 - UK_REFERENCE.annualQ[i];
  row.push(`${y}y sim ${(sim * 100).toFixed(0)}% uk ${(uk * 100).toFixed(0)}%`);
}
console.log(row.join(' | '));
console.log(
  Object.entries(causes)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${((v / N) * 100).toFixed(1)}%`)
    .join('\n'),
);
