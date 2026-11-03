// Wall-clock pacing never changes the day-based engine's random sequence.
export const TIME_CONFIG = {
  dayMs: 10000,
  speeds: [1, 2, 4, 8],
  pollMs: 100,
  maxCatchupDays: 1,
  readBaseMs: 3000,
  readMaxMs: 30000,
};
// How long a reader gets per character. Normal is about 9 Korean characters a second, a calm pace
// for this kind of prose; the setting belongs to the reader, not the life, so it never changes a seed.
export const READING_SPEEDS = {
  slow: { label: '천천히', charMs: 160 },
  normal: { label: '보통', charMs: 110 },
  fast: { label: '빠르게', charMs: 70 },
};
let readCharMs = READING_SPEEDS.normal.charMs;
export function setReadingSpeed(name) {
  readCharMs = (READING_SPEEDS[name] ?? READING_SPEEDS.normal).charMs;
}
export function readingMs(text = '') {
  return Math.min(
    TIME_CONFIG.readMaxMs,
    Math.max(TIME_CONFIG.readBaseMs, text.length * readCharMs),
  );
}
export function clockState() {
  return { elapsed: 0, last: null, speed: 1 };
}
export function clockDays(clock, now, speed = 1, blocked = false) {
  speed = TIME_CONFIG.speeds.includes(Number(speed)) ? Number(speed) : 1;
  if (clock.last === null) {
    clock.last = now;
    clock.speed = speed;
    return 0;
  }
  const dt = Math.max(0, now - clock.last);
  clock.last = now;
  if (blocked) {
    clock.elapsed = 0;
    clock.speed = speed;
    return 0;
  }
  if (clock.speed !== speed) {
    clock.elapsed = 0;
    clock.speed = speed;
    return 0;
  }
  clock.elapsed += Math.min(dt, 1000) * speed;
  if (clock.elapsed < TIME_CONFIG.dayMs) return 0;
  clock.elapsed -= TIME_CONFIG.dayMs;
  return 1;
}
export function importantEvent(e) {
  return /^(eyes|ears|walking|weaning|maturity|adopt|moving|settled|reunion|companion-close|companion-parting|litter-born|child-departure|child-reunion|illness-onset|illness-worsening|illness-recovered|vet-visit|clinical-symptom|clinical-diagnosis|surgery-performed|clinical-managed|rescued-shelter|caught-shelter|shelter-escape|gate-out|guardian-changed|shelter-return|lost-long-separation|death)$/.test(
    e.id,
  );
}
export function readingGate(s, from) {
  const events = s.log.slice(from).filter((e) => importantEvent(e));
  if (!events.length) return null;
  return {
    id: `read:${s.day}:${s.log.length}`,
    day: s.day,
    text: events.map((e) => e.text).join(' '),
    events: events.map((e) => e.id),
    minimumMs: readingMs(events.map((e) => e.text).join(' ')),
  };
}
