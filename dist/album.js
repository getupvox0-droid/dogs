// "곁의 존재들" album: who was near this dog over its life, from the relation records.
// It lists closeness the dog could feel (contact, familiarity, trust); it does not rank people as good or bad.
import { ageText } from './chronicle.js';

export const KIND_NAMES = {
  mother: '어미',
  father: '아비',
  sibling: '형제',
  caregiver: '보호자',
  visitor: '자주 만나는 사람',
  dog: '다른 개',
  companion: '곁을 찾는 동료',
  offspring: '자녀',
  'young-companion': '함께 돌본 새끼',
};
// Kinds whose contact count is one per shared day; for the rest it counts meetings.
const DAILY = ['mother', 'father', 'sibling', 'caregiver'];

// First contact days are only trusted when tracking began at birth or after the relation started.
export function firstMet(s, r) {
  if (r.firstContact == null) return null;
  return s.relationDatesFrom === 0 || r.firstContact > s.relationDatesFrom ? r.firstContact : null;
}
function closeness(r) {
  return r.trust + r.familiarity * 0.5 + Math.min(40, Math.log2(1 + r.contacts) * 4) - r.conflict;
}
export function companionAlbum(s, limit = 12) {
  return s.relations
    .filter((r) => r.contacts > 0)
    .map((r) => {
      const first = firstMet(s, r),
        last = r.lastContact ?? s.day,
        untilEnd = !s.alive && r.active && last >= s.day - 30;
      return {
        id: r.id,
        kind: r.kind,
        kindName: KIND_NAMES[r.kind] || r.kind,
        name: r.name.trim(),
        first,
        last,
        untilEnd,
        contacts: r.contacts,
        together: DAILY.includes(r.kind)
          ? `함께한 날 ${r.contacts}일`
          : `만난 횟수 ${r.contacts}번`,
        span:
          first == null
            ? `마지막으로 함께한 때 · ${ageText(last)}`
            : `${ageText(first)}부터 ${untilEnd ? '마지막까지' : ageText(last) + '까지'}`,
        score: closeness(r),
      };
    })
    .sort((a, b) => b.score - a.score || b.contacts - a.contacts)
    .slice(0, limit);
}
// The one who stayed longest within reach: most shared days, ties broken by closeness.
export function longestCompanion(s) {
  const album = companionAlbum(s, Infinity);
  return (
    album
      .filter((e) => e.kind !== 'sibling')
      .sort(
        (a, b) =>
          b.last - (b.first ?? b.last) - (a.last - (a.first ?? a.last)) || b.score - a.score,
      )[0] || null
  );
}
