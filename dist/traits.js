// Character the dog's own choices left in it: crossroad marks read as plain traits, and the
// choices that shaped a life. They describe, never judge (docs/ROADMAP.md, principle 2).
const LABELS = {
  bold: '대담함',
  gentle: '먼저 물러설 줄 앎',
  pushy: '먹이 앞에서 물러서지 않음',
  patient: '기다릴 줄 앎',
  trusting: '사람을 잘 따름',
  'hand-shy': '낯선 손을 경계함',
  'stomach-wary': '낯선 먹이를 경계함',
  wanderer: '멀리 헤매 본 적이 있음',
  forager: '먹이 찾는 요령이 있음',
  'road-wise': '길 건너는 요령이 있음',
  'traffic-fear': '굉음을 무서워함',
  'sound-fear': '큰 소리를 무서워함',
  'water-fear': '물을 꺼림',
  'height-fear': '높은 곳을 꺼림',
  'poison-fear': '낯선 단내를 피함',
  'hostile-dog-fear': '큰 개를 피함',
  'hostile-human-fear': '낯선 사람을 피함',
  'machine-fear': '땅 울림에 몸을 낮춤',
  'sharp-fear': '반짝이는 바닥을 피함',
  'lost-fear': '낯선 길을 꺼림',
  'heat-fear': '더위에 약함',
  'train-fear': '쇠줄의 떨림에 몸을 피함',
  'trap-fear': '쇠 냄새를 피함',
  'wild-fear': '짐승 냄새에 등털이 섬',
  'ice-fear': '얼음 위를 걷지 않음',
  'traffic-wise': '길 건너는 요령이 있음',
  'water-wise': '물가에서 조심할 줄 앎',
  'height-wise': '높은 곳에서 발을 고를 줄 앎',
  'poison-wise': '맛이 이상하면 뱉을 줄 앎',
  'hostile-dog-wise': '큰 개 앞에서 물러설 줄 앎',
  'hostile-human-wise': '사람의 몸짓을 읽을 줄 앎',
  'machine-wise': '기계 소리를 피할 줄 앎',
  'sharp-wise': '발밑을 살필 줄 앎',
  'lost-wise': '아는 냄새를 되짚을 줄 앎',
  'heat-wise': '그늘을 찾을 줄 앎',
  'train-wise': '철길에서 물러설 때를 앎',
  'trap-wise': '풀숲에서 발밑을 살필 줄 앎',
  'wild-wise': '짐승을 피해 돌아갈 줄 앎',
  'ice-wise': '얼음 위에서 몸을 낮출 줄 앎',
  'storm-fear': '거센 바람에 몸을 바닥에 붙임',
  'snow-fear': '눈 덮인 길을 꺼림',
  'storm-wise': '폭우 속에서 벽에 붙을 줄 앎',
  'snow-wise': '눈 속에서 발자국을 되짚을 줄 앎',
};
const TURNS = ['adopt', 'rescued-shelter', 'caught-shelter', 'gate-out', 'shelter-escape'];

// Traits in the order the dog gained them; two marks with the same meaning show once.
export function traitsOf(s) {
  const c = s.crossroads;
  if (!c) return [];
  const days = c.markDays || {},
    seen = new Set();
  return c.marks
    .filter((m) => LABELS[m])
    .map((m) => ({ mark: m, label: LABELS[m], day: days[m] ?? null }))
    .sort((a, b) => (a.day ?? 1e9) - (b.day ?? 1e9))
    .filter((t) => !seen.has(t.label) && seen.add(t.label));
}
// The crossroads that changed this life most: where it moved, ended, was hurt, or left a trait.
export function shapingChoices(s, limit = 6) {
  const out = [];
  const marked = new Set(Object.values(s.crossroads?.markDays || {}));
  for (let i = 0; i < s.log.length; i++) {
    const e = s.log[i];
    if (e.id !== 'crossroad-result') continue;
    const choice = s.log.slice(0, i).findLast((x) => x.id === 'choice' && x.day === e.day),
      after = s.log.slice(i + 1).filter((x) => x.day === e.day),
      kind = after.some((x) => x.id === 'death')
        ? 'death'
        : after.some((x) => TURNS.includes(x.id))
          ? 'turn'
          : after.some((x) => x.id === 'illness-onset')
            ? 'hurt'
            : marked.has(e.day)
              ? 'mark'
              : null;
    if (!kind || !choice) continue;
    const turn = after.find((x) => TURNS.includes(x.id));
    out.push({
      day: e.day,
      kind,
      action: choice.text,
      result: turn ? `${e.text} ${turn.text}` : e.text,
      weight: { death: 4, turn: 3, hurt: 2, mark: 1 }[kind],
    });
  }
  return out
    .sort((a, b) => b.weight - a.weight || a.day - b.day)
    .slice(0, limit)
    .sort((a, b) => a.day - b.day);
}
