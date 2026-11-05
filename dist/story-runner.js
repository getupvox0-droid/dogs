import { advance, choose, random, urgentDecision } from './engine.js';
import { automaticAction, decisionUid } from './decisions.js';
import { importantEvent, readingMs } from './time-config.js';
export const STORY_CONFIG = {
  maxDaysPerSlice: 60,
  storyWaitMin: 1600,
  storyWaitMax: 9000,
  observeWaitMin: 800,
  observeWaitMax: 4500,
};
// How long one life takes to watch (measured with scripts/measure-pacing.mjs at normal reading
// speed, 1×, with time to read and answer each choice). Only presentation changes: beats group differently and wait
// longer or shorter. Every day is still simulated, so the same seed and choices give the same life.
const ORDINARY = [
  'smell',
  'sleep',
  'world',
  'play',
  'family',
  'street',
  'shelter',
  'companion-routine',
];
export const LIFE_LENGTHS = {
  short: {
    label: '짧게',
    note: '약 30분 · 평범한 하루는 읽지 않고 지나가고, 작은 선택은 아이가 스스로 합니다.',
    wait: 0.75,
  },
  normal: { label: '보통', note: '약 55분', wait: 1 },
  long: { label: '길게', note: '약 75분 · 장면마다 더 오래 머뭅니다.', wait: 1.8 },
};
// In a short life the player is asked at most once in this many days; other ordinary choices
// in between are left to the dog (picked the way watching picks them, and kept in the share trail).
export const SHORT_ASK_DAYS = 90;
function leaveToDog(s, short, observe) {
  if (observe) return true;
  if (!short || urgentDecision(s, s.pending.id)) return false;
  const c = s.chronicle;
  if (c.askedUid === s.pending.uid) return false;
  if (c.lastAskedDay != null && s.day - c.lastAskedDay < SHORT_ASK_DAYS) return true;
  return false;
}
// Marks the waiting choice as put to the player.
function asked(s) {
  if (!s.chronicle || s.chronicle.askedUid === s.pending.uid) return;
  s.chronicle.askedUid = s.pending.uid;
  s.chronicle.lastAskedDay = s.day;
}
export function lifeLength(s) {
  const v = s.chronicle?.preferences?.lifeLength;
  return v in LIFE_LENGTHS ? v : 'normal';
}
export function simulationMode(s) {
  const c = s.chronicle;
  c.preferences.progressMode ??= 'story';
  return c.preferences.progressMode;
}
export function nextStoryBeat(
  s,
  {
    maxDays = STORY_CONFIG.maxDaysPerSlice,
    observe = simulationMode(s) === 'observe',
    length = lifeLength(s),
  } = {},
) {
  const short = length === 'short',
    from = s.log.length,
    start = s.day;
  let days = 0;
  while (s.alive && days < maxDays) {
    if (s.pending) {
      if (!leaveToDog(s, short, s.mode === 'observe')) {
        asked(s);
        break;
      }
      choose(s, automaticAction(s, random), decisionUid(s), { auto: true });
      s.presentation = null;
      if (s.log.length > from) break;
    }
    const n = s.log.length;
    advance(s, 1);
    days++;
    if (!s.alive) break;
    if (s.pending) {
      if (!leaveToDog(s, short, s.mode === 'observe')) {
        asked(s);
        break;
      }
      choose(s, automaticAction(s, random), decisionUid(s), { auto: true });
      s.presentation = null;
      break;
    }
    const added = s.log.slice(n);
    if (added.some((e) => importantEvent(e) || e.id === 'decision-outcome')) break;
    if (
      !short &&
      added.some(
        (e) =>
          ![
            'smell',
            'sleep',
            'world',
            'play',
            'family',
            'street',
            'shelter',
            'companion-routine',
          ].includes(e.id),
      )
    )
      break;
    if (!observe && !short && added.length) break;
    if ((observe || short) && added.length && days >= (short ? 30 : 14)) break;
  }
  const events = s.log.slice(from);
  const important = events.some(importantEvent);
  // In a short life, ordinary days pass without being read; only notable records set the pace.
  const text = events
    .filter((e) => !short || !ORDINARY.includes(e.id))
    .map((e) => e.text)
    .join(' ');
  // The text a reader must be given time for, whatever the speed. A short life only waits for
  // important records, so grouping days never makes it slower than a normal life.
  const readText = short
    ? events
        .filter(importantEvent)
        .map((e) => e.text)
        .join(' ')
    : text;
  return {
    from,
    start,
    end: s.day,
    days,
    events,
    important,
    text,
    readText,
    observe,
    length,
    waitMs:
      LIFE_LENGTHS[length].wait *
      Math.max(
        observe ? 800 : 1600,
        Math.min(observe ? 7000 : 16000, readingMs(text) * (observe ? 0.55 : 0.8)),
      ),
  };
}
// Summaries are presentation only; every raw event and every internal day is retained.
export function timelineEntries(s, { observe = simulationMode(s) === 'observe' } = {}) {
  const result = [],
    resolved = new Set(s.log.filter((e) => e.id === 'decision-outcome').map((e) => e.decisionUid));
  let group = null;
  for (let i = 0; i < s.log.length; i++) {
    const e = s.log[i];
    if (e.id === 'choice' || (e.resolvedDecisionUid && resolved.has(e.resolvedDecisionUid)))
      continue;
    if (
      e.id === 'decision' &&
      s.log.slice(i + 1, i + 8).some((r) => r.id === 'decision-outcome' && r.prompt === e.text)
    )
      continue;
    const ordinary = [
      'smell',
      'sleep',
      'world',
      'play',
      'family',
      'street',
      'shelter',
      'companion-routine',
    ].includes(e.id);
    if (observe && ordinary) {
      if (group && e.day - group.start <= 30) {
        group.day = e.day;
        group.count++;
        group.text = `${group.start}일–${group.day}일 · ${group.count}개의 일상 기록. ${e.text}`;
        continue;
      }
      group = { ...e, index: i, start: e.day, count: 1, summary: true };
      result.push(group);
    } else {
      group = null;
      // A choice the dog made by itself while the player read on (a short life) says so;
      // watching marks none, since there every choice is its own.
      if (e.id === 'decision-outcome' && e.auto && !observe)
        result.push({ ...e, index: i, action: `아이가 스스로 정함 · ${e.action}` });
      else result.push({ ...e, index: i });
    }
  }
  return result;
}

export function beatDelay(beat, speed = 1) {
  const x = Math.max(1, Number(speed) || 1),
    scaled = Math.max(500, beat.waitMs / x);
  const read = beat.readText ?? beat.text;
  // Important or long records always get their full reading time; the rest get it at 1× and a
  // share of it when the player has chosen to go faster.
  if (beat.important || read.length > 120) return Math.max(scaled, readingMs(read));
  // Quick observation keeps its brisk pace; story mode never shows text faster than it reads.
  // A long life lingers on every scene, the reading floor included.
  const linger = Math.max(1, LIFE_LENGTHS[beat.length]?.wait ?? 1);
  return beat.observe || !read ? scaled : Math.max(scaled, (readingMs(read) * linger) / x);
}
