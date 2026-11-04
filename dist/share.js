// Share links: a finished life packed into a URL fragment and rebuilt by replaying it from the seed.
// Nothing is sent to a server; the fragment after # never leaves the browser.
import { createLife, advance, choose, random, setName, acknowledgeBirth, TRAIL } from './engine.js';
import { setBirthDate } from './chronicle.js';
import { automaticAction } from './decisions.js';

// Bump whenever the simulation changes, so links from an older game are refused instead of
// silently replaying into a different life.
export const SHARE_VERSION = 8;
const MAX_DAYS = 30 * 365;

// Two trail tokens (0–5 each) fit one base-36 digit.
function packTrail(trail) {
  let out = '';
  for (let i = 0; i < trail.length; i += 2)
    out += (trail[i] * 6 + (trail[i + 1] ?? 0)).toString(36);
  return out;
}
function unpackTrail(text, length) {
  const trail = [];
  for (const ch of text) {
    const n = parseInt(ch, 36);
    if (!(n >= 0 && n < 36)) throw Error('bad trail');
    trail.push(Math.floor(n / 6), n % 6);
  }
  if (trail.length < length || trail.length > length + 1) throw Error('bad trail length');
  return trail.slice(0, length);
}
// Fields are joined with '.', which encodeURIComponent leaves alone.
const enc = (x) => encodeURIComponent(x).replace(/\./g, '%2E');
// Which life this is, for the book and the park. Everyone's daily dog shares one lifeId, so a daily
// life is told apart by its choices (the share code); the same choices make the same life anyway.
export function lifeKey(s) {
  const id = String(s.lifeId || s.seed);
  if (!s.daily || !canShare(s)) return id;
  let h = 0x811c9dc5;
  for (const ch of encodeLife(s)) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193);
  return `${id}-${(h >>> 0).toString(36)}`;
}
export function canShare(s) {
  return !s.alive && Array.isArray(s.trail) && !!s.chronicle?.birthDate;
}
export function encodeLife(s) {
  if (!canShare(s)) throw Error('공유할 수 없는 생애');
  const fields = [
    'v' + SHARE_VERSION,
    s.seed.toString(36),
    enc(s.lifeId),
    s.chronicle.birthDate,
    s.birthMode === 'real' ? 'r' : 'e',
    s.daily ? 'd' : '-',
    enc(s.name || ''),
    s.day.toString(36),
    s.trail.length.toString(36),
    packTrail(s.trail),
  ];
  return fields.join('.');
}
export function decodeLife(code) {
  const f = String(code).split('.');
  if (f[0] !== 'v' + SHARE_VERSION) throw Error('version');
  if (f.length !== 10) throw Error('format');
  const birthDate = f[3];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) throw Error('date');
  return {
    seed: parseInt(f[1], 36) >>> 0,
    lifeId: decodeURIComponent(f[2]),
    birthDate,
    birthMode: f[4] === 'r' ? 'real' : 'explore',
    daily: f[5] === 'd' ? birthDate : null,
    name: decodeURIComponent(f[6]) || null,
    day: parseInt(f[7], 36),
    trail: unpackTrail(f[9], parseInt(f[8], 36)),
  };
}
// Rebuilds the life. Throws if the replay does not end exactly where the original did.
export function replayLife(code) {
  const d = decodeLife(code);
  const s = createLife(d.seed, d.lifeId, { birthMode: d.birthMode, daily: d.daily });
  setBirthDate(s, d.birthDate);
  setName(s, d.name);
  acknowledgeBirth(s);
  let i = 0;
  while (s.alive && s.day <= MAX_DAYS) {
    if (!s.pending) {
      advance(s, 1);
      continue;
    }
    const t = d.trail[i++];
    if (t === undefined) throw Error('trail ended early');
    const before = s.trail.length;
    if (t === TRAIL.AUTO) choose(s, automaticAction(s, random), null, { auto: true });
    else if (t === TRAIL.SKIPPED) choose(s, s.pending.options[0]?.id);
    else choose(s, s.pending.options[t]?.id);
    if (s.trail.length !== before + 1 || s.trail.at(-1) !== t) throw Error('trail mismatch');
  }
  if (s.alive || i !== d.trail.length || s.day !== d.day) throw Error('replay mismatch');
  return s;
}
