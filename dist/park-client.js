// Talks to the park API (worker/park-api.js). Writes carry a Turnstile token and this device's random id.
import { PATHS, lifeEntry } from './collection.js';
import { lastLine } from './share-card.js';
import { canShare, encodeLife } from './share.js';

const DEVICE_KEY = 'dogs-park-device',
  LEFT_KEY = 'dogs-park-left';
let config = null,
  turnstileLoad = null;

// A random id kept only on this device; the server stores just a salted hash of it.
export function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!/^[0-9a-f]{32}$/.test(id || '')) {
      id = [...crypto.getRandomValues(new Uint8Array(16))]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}
// Lives already left from this device, so the ending can say so.
export function leftLives() {
  try {
    const list = JSON.parse(localStorage.getItem(LEFT_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
function rememberLeft(lifeId) {
  try {
    localStorage.setItem(LEFT_KEY, JSON.stringify([...leftLives(), lifeId].slice(-200)));
  } catch {}
}
// A finished game life as the park or the shared lives keep it: only what the book and the card show.
export function gameMemorial(s, kind = 'game') {
  const e = lifeEntry(s);
  return {
    kind,
    code: canShare(s) ? encodeLife(s) : null,
    name: e.name,
    breed: e.breed,
    country: e.countryName,
    birthPlace: e.birthPlace || null,
    birthHome: e.birthHome,
    ageDays: e.ageDays,
    paths: PATHS.filter((p) => p.test(e)).map((p) => p.label),
    companion: e.companion ? `${e.companion.name} (${e.companion.kindName})` : null,
    lastLine: lastLine(s),
    daily: e.daily,
  };
}
async function api(path, { method = 'GET', body } = {}) {
  const headers = {},
    id = deviceId();
  if (id) headers['x-park-device'] = id;
  if (body) headers['content-type'] = 'application/json';
  let r;
  try {
    r = await fetch(path, { method, headers, body: body && JSON.stringify(body) });
  } catch {
    throw Error('공원에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.');
  }
  const data = await r.json().catch(() => null);
  if (!r.ok || !data) throw Error(data?.error || '공원에 연결하지 못했습니다.');
  return data;
}
export async function parkConfig() {
  config ??= await api('/api/config').catch((e) => {
    config = null;
    throw e;
  });
  return config;
}
function loadTurnstile() {
  turnstileLoad ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => resolve(globalThis.turnstile);
    s.onerror = () => {
      turnstileLoad = null;
      reject(Error('사람 확인 도구를 불러오지 못했습니다.'));
    };
    document.head.append(s);
  });
  return turnstileLoad;
}
// What a Turnstile error code means for the person in front of it (Cloudflare's code families).
export function turnstileMessage(code = '') {
  const c = String(code);
  const why = /^1102/.test(c)
    ? '이 사이트 주소가 사람 확인 설정에 등록되어 있지 않습니다. 운영자가 Turnstile의 Hostnames를 확인해야 합니다.'
    : /^1101/.test(c)
      ? '사람 확인 설정의 사이트 키가 맞지 않습니다. 운영자 확인이 필요합니다.'
      : /^1105/.test(c)
        ? '이 브라우저는 사람 확인을 지원하지 않습니다. 다른 브라우저에서 시도해 주세요.'
        : /^6000/.test(c)
          ? '브라우저 확인에 실패했습니다. 광고 차단·개인정보 보호 확장 프로그램을 잠시 끄거나, 다른 브라우저에서 시도해 주세요.'
          : /^(timeout|expired)$/.test(c)
            ? '확인 시간이 지났습니다. 다시 눌러 주세요.'
            : '사람 확인을 마치지 못했습니다. 잠시 뒤 다시 시도해 주세요.';
  return c ? `${why} (오류 ${c})` : why;
}
// One fresh token per write. The widget only shows itself if Cloudflare needs the person to act;
// an interactive check stays on screen until the person finishes it or it times out.
async function humanToken(box) {
  const { siteKey, open } = await parkConfig();
  if (!open || !siteKey) throw Error('공원에 남기는 기능이 아직 준비되지 않았습니다.');
  const ts = await loadTurnstile();
  return new Promise((resolve, reject) => {
    let id = null;
    const done = (fn, value) => {
      setTimeout(() => id != null && ts.remove(id), 0);
      fn(value);
    };
    id = ts.render(box, {
      sitekey: siteKey,
      appearance: 'interaction-only',
      callback: (token) => done(resolve, token),
      'error-callback': (code) => {
        done(reject, Error(turnstileMessage(code)));
        return true;
      },
      'timeout-callback': () => done(reject, Error(turnstileMessage('timeout'))),
      'expired-callback': () => done(reject, Error(turnstileMessage('expired'))),
      'unsupported-callback': () => done(reject, Error(turnstileMessage('110500'))),
    });
  });
}
export const listMemorials = (order, cursor) =>
  api(`/api/memorials?order=${order}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
export const listLives = (daily, cursor) =>
  api(
    `/api/lives?${daily ? `daily=${daily}&` : ''}${cursor ? `cursor=${encodeURIComponent(cursor)}` : ''}`,
  );
export const listDays = () => api('/api/lives/days');
export async function leaveMemorial(body, box, lifeId) {
  const out = await api('/api/memorials', {
    method: 'POST',
    body: { ...body, turnstile: await humanToken(box) },
  });
  if (lifeId) rememberLeft(lifeId);
  return out.memorial;
}
export async function lightCandle(id, box) {
  return api(`/api/memorials/${id}/candle`, {
    method: 'POST',
    body: { turnstile: await humanToken(box) },
  });
}
export async function reportMemorial(id, box) {
  return api(`/api/memorials/${id}/report`, {
    method: 'POST',
    body: { reason: 'user', turnstile: await humanToken(box) },
  });
}
export const removeMemorial = (id) => api(`/api/memorials/${id}`, { method: 'DELETE' });
