// Turning points where the player can leave one line for the dog. The life itself does not
// change; the lines are kept with the record (chronicle.notes) and come back at the ending.
// They are never put in share links.
export const NOTE_MAX = 80;
export const MILESTONES = [
  {
    key: 'eyes',
    ids: ['eyes'],
    prompt: '눈을 떴다. 처음 보는 세상 앞에 선 이 아이에게 건네고 싶은 말이 있나요?',
  },
  {
    key: 'turn',
    ids: [
      'adopt',
      'rescued-shelter',
      'caught-shelter',
      'gate-out',
      'shelter-escape',
      'shelter-return',
      'guardian-changed',
    ],
    prompt: '사는 곳이 바뀌었다. 낯선 자리에 선 이 아이에게 해 주고 싶은 말은?',
  },
  { key: 'reunion', ids: ['reunion'], prompt: '다시 만났다. 지금 이 아이에게 하고 싶은 말은?' },
  {
    key: 'maturity',
    ids: ['maturity'],
    prompt: '어른 개의 몸이 되었다. 여기까지 자란 이 아이에게 한마디.',
  },
  {
    key: 'litter',
    ids: ['litter-born'],
    prompt: '새끼들이 태어났다. 부모가 된 이 아이에게 한마디.',
  },
  {
    key: 'ill',
    ids: ['illness-worsening'],
    prompt: '몸이 많이 아프다. 곁에 있다면 해 주고 싶은 말은?',
  },
  {
    key: 'aging',
    ids: ['aging'],
    prompt: '쉬어 가는 시간이 길어졌다. 나이 들어 가는 이 아이에게 한마디.',
  },
];
export const FAREWELL = {
  key: 'farewell',
  prompt: '이 아이가 떠났습니다. 마지막으로 건네고 싶은 말이 있나요?',
};
const LABELS = {
  eyes: '눈을 뜬 날',
  turn: '사는 곳이 바뀐 날',
  reunion: '다시 만난 날',
  maturity: '어른이 된 날',
  litter: '새끼가 태어난 날',
  ill: '많이 아팠던 날',
  aging: '나이 들기 시작한 날',
  farewell: '마지막 인사',
};
export const noteLabel = (key) => LABELS[key] || key;

// Sets up the notes of a life. A life that had none before asks only about what comes next.
export function initNotes(s) {
  const c = s.chronicle;
  if (!c || Array.isArray(c.notes)) return;
  c.notes = [];
  c.noteAsked = [];
  c.notesFrom = s.day;
  c.notesOff = false;
}
// The milestone waiting for a line, or null.
export function dueMilestone(s) {
  const c = s.chronicle;
  if (!c?.notes || c.notesOff || !s.alive || c.phase !== 'living') return null;
  if (s.pending || s.presentation || c.reading) return null;
  for (const m of MILESTONES) {
    if (c.noteAsked.includes(m.key)) continue;
    const e = s.log.find((e) => e.day >= c.notesFrom && m.ids.includes(e.id));
    if (e) return { key: m.key, day: e.day, prompt: m.prompt, moment: e.text };
  }
  return null;
}
export function cleanNote(raw) {
  return String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NOTE_MAX);
}
// Keeps the line (or nothing when it is empty) and marks the milestone as asked.
export function answerMilestone(s, key, raw, day = s.day) {
  const c = s.chronicle;
  initNotes(s);
  if (!c.noteAsked.includes(key)) c.noteAsked.push(key);
  const text = cleanNote(raw);
  c.notes = c.notes.filter((n) => n.key !== key);
  if (text) c.notes.push({ key, day, text });
  c.notes.sort((a, b) => a.day - b.day);
  return !!text;
}
export function stopAsking(s) {
  initNotes(s);
  s.chronicle.notesOff = true;
}
export function notesOf(s) {
  return s.chronicle?.notes || [];
}
export function validateNotes(s) {
  const c = s.chronicle;
  if (!c || c.notes === undefined) return;
  if (
    !Array.isArray(c.notes) ||
    !Array.isArray(c.noteAsked) ||
    !Number.isFinite(c.notesFrom) ||
    c.notes.some(
      (n) =>
        typeof n.key !== 'string' ||
        !Number.isFinite(n.day) ||
        typeof n.text !== 'string' ||
        n.text.length > NOTE_MAX,
    )
  )
    throw Error('손상된 한 줄 기록');
}
