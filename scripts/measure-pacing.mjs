// Plays lives the way the page does (story mode, normal reading speed, 1×) and reports how long a
// life takes on screen, how often the player is stopped, and how much text arrives faster than
// it can be read.
import { createLife, choose, acknowledgeBirth, random } from '../dist/engine.js';
import { automaticAction, decisionUid } from '../dist/decisions.js';
import { setBirthDate } from '../dist/chronicle.js';
import { nextStoryBeat, beatDelay } from '../dist/story-runner.js';
import { readingMs } from '../dist/time-config.js';
import { initNotes, dueMilestone, answerMilestone } from '../dist/milestones.js';

const N = Number(process.argv[2] || 30),
  length = process.argv[3] || 'normal',
  CHAR_MS = 110;
const pairs = {};
const all = { ms: 0, stops: 0, kinds: {}, close: 0, rushed: 0, chars: 0, lives: 0, gaps: [] };
for (let seed = 1; all.lives < N; seed++) {
  const s = createLife(seed * 104729, `p${seed}`, { birthMode: 'real' });
  setBirthDate(s, '2026-11-03');
  acknowledgeBirth(s);
  s.chronicle.preferences.lifeLength = length;
  initNotes(s);
  all.lives++;
  let t = 0,
    lastStop = 0,
    lastKind = 'birth',
    lastDay = 0;
  const stop = (kind, text) => {
    // The player reads the prompt and decides: reading time plus a few seconds.
    const wait = readingMs(text) + 3000;
    if (t - lastStop < 20000) {
      all.close++;
      const key = `${lastKind}→${kind} (${s.day - lastDay}d)`.replace(/\(\d+d\)/, (m) =>
        s.day - lastDay < 3 ? '(same)' : '(later)',
      );
      pairs[key] = (pairs[key] || 0) + 1;
    }
    lastKind = kind;
    lastDay = s.day;
    all.gaps.push(t - lastStop);
    all.stops++;
    all.kinds[kind] = (all.kinds[kind] || 0) + 1;
    t += wait;
    lastStop = t;
  };
  while (s.alive) {
    const note = dueMilestone(s);
    if (note) {
      stop('note', note.moment + note.prompt);
      answerMilestone(s, note.key, '', note.day);
      continue;
    }
    if (s.pending) {
      const id = s.pending.id.split(':')[0];
      stop(id, s.pending.text + ' ' + (s.pending.know || ''));
      choose(s, automaticAction(s, random), decisionUid(s));
      s.presentation = null;
      continue;
    }
    const beat = nextStoryBeat(s, { length });
    const delay = beatDelay(beat, 1),
      read = (beat.readText ?? beat.text).length;
    all.chars += read;
    if (read * CHAR_MS > delay + 500) all.rushed += read - Math.floor(delay / CHAR_MS);
    t += delay;
  }
  s.chronicle.reading = null;
  all.ms += t;
}
const min = all.ms / all.lives / 60000;
all.gaps.sort((a, b) => a - b);
console.log(`${length}: ${all.lives} lives, ${min.toFixed(1)} min per life on screen`);
console.log(
  `stops per life ${(all.stops / all.lives).toFixed(1)} · one every ${(min / (all.stops / all.lives)).toFixed(2)} min · median gap ${(all.gaps[all.gaps.length >> 1] / 1000).toFixed(0)}s · within 20s of the last ${((all.close / all.stops) * 100).toFixed(0)}%`,
);
console.log(
  'by kind:',
  Object.entries(all.kinds)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${(v / all.lives).toFixed(1)}`)
    .join(', '),
);
console.log(
  `text rushed past reading speed: ${((all.rushed / all.chars) * 100).toFixed(1)}% of characters`,
);
console.log(
  'close pairs:',
  Object.entries(pairs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([k, v]) => `${k} ${(v / all.lives).toFixed(1)}`)
    .join(' | '),
);
