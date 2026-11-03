import { visualFor, diagramSvg } from './visuals.js';
import { endingData, ageText, dayDate } from './chronicle.js';
// Story-sized life card (9:16). Every line comes from the life's own records.
export const CARD = { width: 1080, height: 1920 };
// Rarer turns of a life come first; each kind of moment is used once (its first occurrence).
const MOMENT_PRIORITY = [
  'rescued-shelter',
  'adopt',
  'reunion',
  'litter-born',
  'guardian-changed',
  'moving',
  'companion-close',
  'surgery-performed',
  'first-name',
  'child-departure',
  'first-leash',
  'walking',
  'eyes',
  'illness-recovered',
  'aging',
];
export function keyMoments(s, count = 3) {
  const first = new Map();
  for (const e of s.log) if (MOMENT_PRIORITY.includes(e.id) && !first.has(e.id)) first.set(e.id, e);
  return MOMENT_PRIORITY.filter((id) => first.has(id))
    .slice(0, count)
    .map((id) => first.get(id))
    .sort((a, b) => a.day - b.day);
}
// One closing sentence in the dog's own senses. It says what was near, never how good the life was.
export function lastLine(s) {
  if (s.alive) return '오늘도 익숙한 냄새를 따라 하루를 보낸다.';
  const close = endingData(s).relations.find((r) => r.active !== false && r.trust >= 50);
  if (close) return `${close.name.trim()}의 냄새가 마지막까지 곁에 있었다.`;
  return {
    family: '마지막까지 익숙한 집의 냄새 속에 있었다.',
    street: '마지막까지 자기 길의 냄새를 알고 있었다.',
    shelter: '마지막까지 돌보는 손길이 오갔다.',
  }[s.home];
}
// Splits text into lines that fit `width`; the last allowed line ends with an ellipsis if cut.
export function wrapText(c, text, width, maxLines) {
  const lines = [];
  let line = '',
    cut = false;
  for (const ch of text) {
    if (c.measureText(line + ch).width > width) {
      if (lines.length === maxLines - 1) {
        cut = true;
        break;
      }
      lines.push(line);
      line = '';
    }
    line += ch;
  }
  if (cut) {
    while (line && c.measureText(line + '…').width > width) line = line.slice(0, -1);
    line += '…';
  }
  if (line) lines.push(line);
  return lines;
}
async function drawPortrait(c, s, x, y, size) {
  const v = visualFor(s),
    p = v.portrait,
    img = new Image();
  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = p
        ? p.url
        : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(diagramSvg(s, v.phase));
    });
    if (p) {
      const sw = img.naturalWidth / p.columns,
        sh = img.naturalHeight / p.rows,
        sx = (p.x / 100) * (p.columns - 1) * sw,
        sy = (p.y / 100) * (p.rows - 1) * sh,
        // Cells in some atlases carry a strip of the neighbouring row at the bottom; keep a centred square above it.
        k = 0.89;
      c.drawImage(img, sx + (sw * (1 - k)) / 2, sy + sh * 0.03, sw * k, sh * k, x, y, size, size);
    } else c.drawImage(img, x, y, size, size);
  } catch {
    c.fillStyle = '#e7eddf';
    c.fillRect(x, y, size, size);
  }
}
export async function drawLifeCard(canvas, s) {
  const { width: W, height: H } = CARD,
    M = 84,
    text = W - M * 2;
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d'),
    b = s.chronicle.birth;
  c.fillStyle = '#f6f2e9';
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#385d45';
  c.font = 'bold 32px sans-serif';
  c.fillText('작은 발자국 · 한 생의 기록', M, 120);
  await drawPortrait(c, s, (W - 760) / 2, 170, 760);
  let y = 1020;
  c.fillStyle = '#293a31';
  c.font = 'bold 72px sans-serif';
  c.fillText(s.name || s.breed, M, y);
  y += 60;
  c.font = '32px sans-serif';
  c.fillStyle = '#73796f';
  if (s.name) {
    c.fillText(s.breed, M, y);
    y += 50;
  }
  c.fillStyle = '#293a31';
  for (const line of wrapText(
    c,
    `${b.country}의 ${b.place}에서 태어나 ${ageText(s.day)}`,
    text,
    2,
  )) {
    c.fillText(line, M, y);
    y += 46;
  }
  y += 40;
  c.fillStyle = '#385d45';
  c.font = 'bold 28px sans-serif';
  c.fillText('가장 중요한 순간', M, y);
  y += 56;
  for (const e of keyMoments(s)) {
    c.fillStyle = '#73796f';
    c.font = '24px sans-serif';
    c.fillText(ageText(e.day), M, y);
    y += 40;
    c.fillStyle = '#293a31';
    c.font = '30px sans-serif';
    for (const line of wrapText(c, e.text, text, 2)) {
      c.fillText(line, M, y);
      y += 44;
    }
    y += 26;
  }
  y += 30;
  c.fillStyle = '#385d45';
  c.font = 'italic 36px serif';
  for (const line of wrapText(c, lastLine(s), text, 2)) {
    c.fillText(line, M, y);
    y += 52;
  }
  c.fillStyle = '#73796f';
  c.font = '22px sans-serif';
  const born = s.chronicle.birthDate;
  c.fillText(
    `${born ? `${born} – ${dayDate(s)} · ` : ''}기억 ${s.memories.length}개 · 실제 생애 기록으로 만든 카드`,
    M,
    H - 70,
  );
  return canvas;
}
export async function downloadLifeCard(s) {
  const canvas = await drawLifeCard(document.createElement('canvas'), s);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw Error('카드를 만들지 못했습니다');
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = `small-footprints-${(s.name || String(s.seed)).replace(/[\/:*?"<>|\s]/g, '_')}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
