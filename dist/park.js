// Rainbow Bridge Park: what may be left there. Shared by the page and the Worker (worker/park-api.js),
// so both sides apply the same limits. The park never ranks: no score, no "best" (docs/PHASE3.md).
export const PARK_KINDS = ['game', 'real'];
export const PARK_LIMITS = {
  name: 20,
  breed: 30,
  message: { game: 60, real: 200 },
  code: 1500,
  dailyPosts: 3,
  reportsToHide: 3,
  pageSize: 20,
};
const HOMES = ['family', 'street', 'shelter'];
const LINK =
  /https?:|www\.|[a-z0-9-]+\.(com|net|org|kr|io|me|co|ly|gg|xyz|app|dev|link|site|shop)\b/i;
const CONTACT = /[\w.+-]+@[\w-]+\.|\d{2,4}[-. ]?\d{3,4}[-. ]?\d{4}/;
// A short starter list; the report button and the hidden-post page cover what it misses.
const BANNED = ['씨발', '시발', 'ㅅㅂ', '병신', 'ㅂㅅ', '좆', '개새끼', '미친놈', 'fuck', 'shit'];

// Trims, folds whitespace, drops control characters. Empty becomes null.
export function cleanText(text) {
  if (typeof text !== 'string') return null;
  const t = text
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f​-‏‪-‮]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return t || null;
}
// Why a piece of free text cannot be left, or null when it can.
export function textProblem(text, max) {
  if (text == null) return null;
  if ([...text].length > max) return `${max}자까지 쓸 수 있습니다.`;
  if (LINK.test(text)) return '링크는 넣을 수 없습니다.';
  if (CONTACT.test(text)) return '전화번호나 이메일 같은 연락처는 넣을 수 없습니다.';
  const folded = text.toLowerCase().replace(/[\s.·_*-]/g, '');
  if (BANNED.some((w) => folded.includes(w))) return '쓸 수 없는 말이 들어 있습니다.';
  return null;
}
const str = (v, max) => typeof v === 'string' && v.length > 0 && [...v].length <= max;
const optStr = (v, max) => v == null || str(v, max);
const year = (v) => v == null || (Number.isInteger(v) && v >= 1950 && v <= 2100);

// Checks a request body and returns { kind, data, message } ready to store, or { error }.
export function validateMemorial(body) {
  if (!body || !PARK_KINDS.includes(body.kind)) return { error: '남길 기록의 종류가 없습니다.' };
  const message = cleanText(body.message);
  const fail = textProblem(message, PARK_LIMITS.message[body.kind]);
  if (fail) return { error: `한마디: ${fail}` };
  if (body.kind === 'game') {
    const d = body;
    const name = cleanText(d.name);
    if (
      !optStr(d.code, PARK_LIMITS.code) ||
      (d.code != null && !/^v\d+\.[A-Za-z0-9._~%-]+$/.test(d.code)) ||
      !optStr(name, PARK_LIMITS.name) ||
      !str(d.breed, 40) ||
      !str(d.country, 20) ||
      !optStr(d.birthPlace, 30) ||
      !HOMES.includes(d.birthHome) ||
      !Number.isInteger(d.ageDays) ||
      d.ageDays < 0 ||
      d.ageDays > 12000 ||
      !Array.isArray(d.paths) ||
      d.paths.length > 12 ||
      !d.paths.every((p) => str(p, 30)) ||
      !optStr(d.companion, 50) ||
      !str(d.lastLine, 80) ||
      !(d.daily == null || /^\d{4}-\d{2}-\d{2}$/.test(d.daily))
    )
      return { error: '게임 기록의 형식이 맞지 않습니다.' };
    for (const t of [name, d.companion]) {
      const p = textProblem(t, 50);
      if (p) return { error: `이름: ${p}` };
    }
    return {
      kind: 'game',
      message,
      data: {
        code: d.code ?? null,
        name: name ?? null,
        breed: d.breed,
        country: d.country,
        birthPlace: d.birthPlace ?? null,
        birthHome: d.birthHome,
        ageDays: d.ageDays,
        paths: d.paths,
        companion: d.companion ?? null,
        lastLine: d.lastLine,
        daily: d.daily ?? null,
      },
    };
  }
  const name = cleanText(body.name),
    breed = cleanText(body.breed);
  if (!name) return { error: '반려견의 이름을 적어 주세요.' };
  for (const [label, t, max] of [
    ['이름', name, PARK_LIMITS.name],
    ['품종', breed, PARK_LIMITS.breed],
  ]) {
    const p = textProblem(t, max);
    if (p) return { error: `${label}: ${p}` };
  }
  if (!year(body.born) || !year(body.departed))
    return { error: '함께한 해는 네 자리 연도로 적어 주세요.' };
  if (body.born != null && body.departed != null && body.born > body.departed)
    return { error: '태어난 해가 떠난 해보다 늦습니다.' };
  return {
    kind: 'real',
    message,
    data: { name, breed: breed ?? null, born: body.born ?? null, departed: body.departed ?? null },
  };
}
