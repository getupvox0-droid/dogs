// Rainbow Bridge Park API on D1. Every write needs a Turnstile token and a device id from the page;
// the device id is only stored as a salted hash, and no IP address is kept.
import { PARK_LIMITS, PHOTO_TYPES, SPACE_KINDS, validateMemorial } from '../dist/park.js';

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS memorials (
    id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, kind TEXT NOT NULL, data TEXT NOT NULL,
    message TEXT, candles INTEGER NOT NULL DEFAULT 0, reports INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'shown', device_hash TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS memorials_recent ON memorials (status, created_at DESC, id DESC)`,
  `CREATE INDEX IF NOT EXISTS memorials_device ON memorials (device_hash, created_at)`,
  `CREATE TABLE IF NOT EXISTS candles (memorial_id TEXT NOT NULL, device_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL, PRIMARY KEY (memorial_id, device_hash))`,
  `CREATE TABLE IF NOT EXISTS reports (memorial_id TEXT NOT NULL, device_hash TEXT NOT NULL,
    reason TEXT, created_at INTEGER NOT NULL, PRIMARY KEY (memorial_id, device_hash))`,
  // A photo waits as 'pending' until the park keeper shows it; the file itself lives in R2.
  `CREATE TABLE IF NOT EXISTS photos (memorial_id TEXT PRIMARY KEY, status TEXT NOT NULL,
    type TEXT NOT NULL, bytes INTEGER NOT NULL, device_hash TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS photos_status ON photos (status, created_at)`,
];
const photoKey = (id) => `photos/${id}`;
const DAY = 86400000;
const schemaReady = new WeakMap();

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
const fail = (status, error) => json({ error }, status);

// Tables are created on first use, so a fresh D1 database needs no migration step.
function ensureSchema(db) {
  if (!schemaReady.has(db))
    schemaReady.set(
      db,
      db.batch(SCHEMA.map((sql) => db.prepare(sql))).catch((e) => {
        schemaReady.delete(db);
        throw e;
      }),
    );
  return schemaReady.get(db);
}
async function sha256(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function deviceHash(req, env) {
  const id = req.headers.get('x-park-device');
  if (!id || !/^[0-9a-f]{32}$/.test(id) || !env.DEVICE_SALT) return null;
  return sha256(`${env.DEVICE_SALT}:${id}`);
}
async function human(token, env) {
  if (typeof token !== 'string' || !token || token.length > 4096) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    return (await r.json()).success === true;
  } catch {
    return false;
  }
}
function newId() {
  const b = crypto.getRandomValues(new Uint8Array(9));
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}
// photo: 'shown' for everyone once approved; the device that left it also sees 'pending'.
function card(row, device, lit, photo = null) {
  const mine = device != null && row.device_hash === device;
  return {
    id: row.id,
    kind: row.kind,
    createdAt: row.created_at,
    message: row.message,
    candles: row.candles,
    lit: Boolean(lit),
    mine,
    photo: photo === 'shown' || (mine && photo) ? photo : null,
    ...JSON.parse(row.data),
  };
}
async function withCandles(db, rows, device) {
  if (!rows.length) return [];
  const marks = rows.map(() => '?').join(','),
    ids = rows.map((r) => r.id),
    photos = new Map(
      (
        await db
          .prepare(`SELECT memorial_id, status FROM photos WHERE memorial_id IN (${marks})`)
          .bind(...ids)
          .all()
      ).results.map((p) => [p.memorial_id, p.status]),
    );
  if (!device) return rows.map((r) => card(r, device, false, photos.get(r.id)));
  const { results } = await db
      .prepare(
        `SELECT memorial_id FROM candles WHERE device_hash = ? AND memorial_id IN (${marks})`,
      )
      .bind(device, ...ids)
      .all(),
    lit = new Set(results.map((r) => r.memorial_id));
  return rows.map((r) => card(r, device, lit.has(r.id), photos.get(r.id)));
}
// A photo file from R2 with headers that keep a browser from treating it as anything but an image.
async function photoResponse(env, row, cache) {
  const obj = await env.PHOTOS.get(photoKey(row.memorial_id));
  if (!obj) return fail(404, '사진이 없습니다.');
  return new Response(obj.body, {
    headers: {
      'content-type': row.type,
      'cache-control': cache,
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'",
    },
  });
}
async function readBody(req) {
  if (Number(req.headers.get('content-length') || 0) > 8192) return null;
  try {
    const text = await req.text();
    return text.length > 8192 ? null : JSON.parse(text);
  } catch {
    return null;
  }
}
function adminOk(req, env) {
  const given = req.headers.get('authorization') || '',
    want = `Bearer ${env.ADMIN_TOKEN || ''}`;
  if (!env.ADMIN_TOKEN || given.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= given.charCodeAt(i) ^ want.charCodeAt(i);
  return diff === 0;
}

export async function handlePark(req, env, now = Date.now()) {
  const url = new URL(req.url),
    path = url.pathname,
    method = req.method;
  const writable = Boolean(env.DB && env.TURNSTILE_SECRET && env.DEVICE_SALT);
  if (path === '/api/config' && method === 'GET')
    return json({
      open: writable,
      siteKey: writable ? env.TURNSTILE_SITE_KEY || null : null,
      photos: writable && Boolean(env.PHOTOS),
    });
  if (!env.DB) return fail(503, '공원이 아직 준비되지 않았습니다.');
  const db = env.DB;
  await ensureSchema(db);
  const device = await deviceHash(req, env);

  if (path === '/api/memorials' && method === 'GET') {
    if (url.searchParams.get('order') === 'random') {
      const row = await db
        .prepare(
          `SELECT * FROM memorials WHERE status = 'shown' AND kind IN ('game', 'real')
           ORDER BY RANDOM() LIMIT 1`,
        )
        .first();
      return json({ memorials: await withCandles(db, row ? [row] : [], device), next: null });
    }
    return json(await page(db, `kind IN ('game', 'real')`, [], url, device));
  }
  // "함께 나눈 삶": shared lives, newest first; ?daily=YYYY-MM-DD keeps one day's daily dog.
  if (path === '/api/lives' && method === 'GET') {
    const daily = url.searchParams.get('daily');
    if (daily && !/^\d{4}-\d{2}-\d{2}$/.test(daily)) return fail(400, '날짜 형식이 맞지 않습니다.');
    return json(
      daily
        ? await page(
            db,
            `kind = 'shared' AND json_extract(data, '$.daily') = ?`,
            [daily],
            url,
            device,
          )
        : await page(db, `kind = 'shared'`, [], url, device),
    );
  }
  // An approved photo of a memorial that is still shown.
  const photo = /^\/api\/photos\/([0-9a-f]{18})$/.exec(path);
  if (photo && method === 'GET') {
    if (!env.PHOTOS) return fail(404, '사진이 없습니다.');
    const row = await db
      .prepare(
        `SELECT p.* FROM photos p JOIN memorials m ON m.id = p.memorial_id
         WHERE p.memorial_id = ? AND p.status = 'shown' AND m.status = 'shown'`,
      )
      .bind(photo[1])
      .first();
    return row ? photoResponse(env, row, 'public, max-age=86400') : fail(404, '사진이 없습니다.');
  }
  // Days whose daily dog has shared lives, newest day first (not by how many).
  if (path === '/api/lives/days' && method === 'GET') {
    const { results } = await db
      .prepare(
        `SELECT json_extract(data, '$.daily') AS daily, COUNT(*) AS lives FROM memorials
         WHERE status = 'shown' AND kind = 'shared' AND json_extract(data, '$.daily') IS NOT NULL
         GROUP BY daily ORDER BY daily DESC LIMIT 14`,
      )
      .all();
    return json({ days: results });
  }

  if (path.startsWith('/api/admin/')) {
    if (!adminOk(req, env)) return fail(404, '없는 주소입니다.');
    if (path === '/api/admin/memorials' && method === 'GET') {
      const { results } = await db
        .prepare(
          `SELECT * FROM memorials WHERE status = 'hidden' ORDER BY created_at DESC LIMIT 100`,
        )
        .all();
      return json({
        memorials: results.map((r) => ({ ...card(r, null, false), reports: r.reports })),
      });
    }
    // Photos waiting for a look, oldest first, with the memorial they belong to.
    if (path === '/api/admin/photos' && method === 'GET') {
      const { results } = await db
        .prepare(
          `SELECT m.*, p.status AS photo_status FROM photos p JOIN memorials m ON m.id = p.memorial_id
           WHERE p.status = 'pending' ORDER BY p.created_at LIMIT 100`,
        )
        .all();
      return json({ memorials: results.map((r) => card(r, null, false, 'shown')) });
    }
    const ph = /^\/api\/admin\/photos\/([0-9a-f]{18})$/.exec(path);
    if (ph && env.PHOTOS) {
      const row = await db
        .prepare(`SELECT * FROM photos WHERE memorial_id = ?`)
        .bind(ph[1])
        .first();
      if (!row) return fail(404, '사진이 없습니다.');
      if (method === 'GET') return photoResponse(env, row, 'no-store');
      const body = await readBody(req);
      if (body?.action === 'approve')
        await db
          .prepare(`UPDATE photos SET status = 'shown' WHERE memorial_id = ?`)
          .bind(ph[1])
          .run();
      else if (body?.action === 'reject') await removePhoto(db, env, ph[1]);
      else return fail(400, '할 일을 고르세요.');
      return json({ ok: true });
    }
    const m = /^\/api\/admin\/memorials\/([0-9a-f]{18})$/.exec(path);
    if (m && method === 'POST') {
      const body = await readBody(req);
      if (body?.action === 'restore')
        await db
          .prepare(`UPDATE memorials SET status = 'shown', reports = 0 WHERE id = ?`)
          .bind(m[1])
          .run();
      else if (body?.action === 'delete') await removeMemorial(db, m[1], env);
      else return fail(400, '할 일을 고르세요.');
      return json({ ok: true });
    }
    return fail(404, '없는 주소입니다.');
  }

  const m = /^\/api\/memorials(?:\/([0-9a-f]{18})(?:\/(candle|report|photo))?)?$/.exec(path);
  if (!m || method === 'GET') return fail(404, '없는 주소입니다.');
  if (!writable) return fail(503, '공원에 남기는 기능이 아직 준비되지 않았습니다.');
  if (!device) return fail(400, '기기 정보를 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.');
  const [, id, action] = m;

  if (!id && method === 'POST') {
    const body = await readBody(req);
    if (!body) return fail(400, '보낸 내용을 읽지 못했습니다.');
    const v = validateMemorial(body);
    if (v.error) return fail(400, v.error);
    if (!(await human(body.turnstile, env))) return fail(403, '사람 확인을 통과하지 못했습니다.');
    // The park and the shared lives each allow a few posts a day per device.
    const space = SPACE_KINDS.park.includes(v.kind) ? SPACE_KINDS.park : SPACE_KINDS.lives,
      recent = await db
        .prepare(
          `SELECT COUNT(*) AS n FROM memorials WHERE device_hash = ? AND created_at > ?
           AND kind IN (${space.map(() => '?').join(',')})`,
        )
        .bind(device, now - DAY, ...space)
        .first();
    if (recent.n >= PARK_LIMITS.dailyPosts)
      return fail(
        429,
        space === SPACE_KINDS.park
          ? `한 기기에서 하루에 ${PARK_LIMITS.dailyPosts}마리까지 남길 수 있습니다.`
          : `한 기기에서 하루에 ${PARK_LIMITS.dailyPosts}번까지 나눌 수 있습니다.`,
      );
    const newIdValue = newId();
    await db
      .prepare(
        `INSERT INTO memorials (id, created_at, kind, data, message, device_hash) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(newIdValue, now, v.kind, JSON.stringify(v.data), v.message, device)
      .run();
    const row = await db.prepare(`SELECT * FROM memorials WHERE id = ?`).bind(newIdValue).first();
    return json({ memorial: card(row, device, false) }, 201);
  }
  if (!id) return fail(404, '없는 주소입니다.');
  const row = await db.prepare(`SELECT * FROM memorials WHERE id = ?`).bind(id).first();
  if (!row) return fail(404, '이미 지워진 기록입니다.');

  if (!action && method === 'DELETE') {
    if (row.device_hash !== device) return fail(403, '남긴 기기에서만 지울 수 있습니다.');
    await removeMemorial(db, id, env);
    return json({ ok: true });
  }
  // A photo for a real dog's memorial, sent as the image itself; the Turnstile token comes in a
  // header because the body is not JSON. It waits for the park keeper before anyone sees it.
  if (action === 'photo' && method === 'POST') {
    if (!env.PHOTOS) return fail(503, '사진을 받는 기능이 아직 준비되지 않았습니다.');
    if (row.device_hash !== device) return fail(403, '남긴 기기에서만 사진을 올릴 수 있습니다.');
    if (row.kind !== 'real') return fail(400, '사진은 함께 살았던 반려견에게만 올릴 수 있습니다.');
    const type = (req.headers.get('content-type') || '').split(';')[0].trim();
    if (!PHOTO_TYPES[type]) return fail(415, 'JPEG나 WebP 사진만 올릴 수 있습니다.');
    if (Number(req.headers.get('content-length') || 0) > PARK_LIMITS.photoBytes)
      return fail(413, '사진이 너무 큽니다.');
    if (!(await human(req.headers.get('x-turnstile'), env)))
      return fail(403, '사람 확인을 통과하지 못했습니다.');
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (bytes.length > PARK_LIMITS.photoBytes) return fail(413, '사진이 너무 큽니다.');
    if (bytes.length < 12 || !PHOTO_TYPES[type](bytes))
      return fail(415, '사진 파일을 읽지 못했습니다.');
    // One photo per memorial: a rejected one is removed, so the owner can then try another.
    if (await db.prepare(`SELECT 1 FROM photos WHERE memorial_id = ?`).bind(id).first())
      return fail(409, '이미 사진이 있습니다.');
    const recent = await db
      .prepare(`SELECT COUNT(*) AS n FROM photos WHERE device_hash = ? AND created_at > ?`)
      .bind(device, now - DAY)
      .first();
    if (recent.n >= PARK_LIMITS.dailyPhotos)
      return fail(
        429,
        `한 기기에서 하루에 사진 ${PARK_LIMITS.dailyPhotos}장까지 올릴 수 있습니다.`,
      );
    await env.PHOTOS.put(photoKey(id), bytes, { httpMetadata: { contentType: type } });
    await db
      .prepare(
        `INSERT INTO photos (memorial_id, status, type, bytes, device_hash, created_at)
         VALUES (?, 'pending', ?, ?, ?, ?)`,
      )
      .bind(id, type, bytes.length, device, now)
      .run();
    return json({ photo: 'pending' }, 201);
  }
  if (method !== 'POST' || !action) return fail(404, '없는 주소입니다.');
  const body = (await readBody(req)) || {};
  if (!(await human(body.turnstile, env))) return fail(403, '사람 확인을 통과하지 못했습니다.');
  if (action === 'candle') {
    if (row.kind === 'shared') return fail(400, '촛불은 공원의 강아지에게만 켭니다.');
    const r = await db
      .prepare(
        `INSERT OR IGNORE INTO candles (memorial_id, device_hash, created_at) VALUES (?, ?, ?)`,
      )
      .bind(id, device, now)
      .run();
    if (r.meta.changes)
      await db.prepare(`UPDATE memorials SET candles = candles + 1 WHERE id = ?`).bind(id).run();
    const after = await db.prepare(`SELECT candles FROM memorials WHERE id = ?`).bind(id).first();
    return json({ candles: after.candles, lit: true });
  }
  const reason = typeof body.reason === 'string' ? body.reason.slice(0, 40) : null,
    r = await db
      .prepare(
        `INSERT OR IGNORE INTO reports (memorial_id, device_hash, reason, created_at) VALUES (?, ?, ?, ?)`,
      )
      .bind(id, device, reason, now)
      .run();
  if (r.meta.changes)
    await db
      .prepare(
        `UPDATE memorials SET reports = reports + 1,
         status = CASE WHEN reports + 1 >= ? THEN 'hidden' ELSE status END WHERE id = ?`,
      )
      .bind(PARK_LIMITS.reportsToHide, id)
      .run();
  return json({ ok: true });
}
// One page of shown rows matching `where`, newest first, continuing after ?cursor=created_id.
async function page(db, where, binds, url, device) {
  const [at, id] = (url.searchParams.get('cursor') || '').split('_'),
    size = PARK_LIMITS.pageSize,
    after = at ? ' AND (created_at < ? OR (created_at = ? AND id < ?))' : '',
    { results } = await db
      .prepare(
        `SELECT * FROM memorials WHERE status = 'shown' AND ${where}${after}
         ORDER BY created_at DESC, id DESC LIMIT ?`,
      )
      .bind(...binds, ...(at ? [Number(at) || 0, Number(at) || 0, id || ''] : []), size + 1)
      .all(),
    rows = results.slice(0, size),
    last = rows.at(-1);
  return {
    memorials: await withCandles(db, rows, device),
    next: results.length > size ? `${last.created_at}_${last.id}` : null,
  };
}
async function removePhoto(db, env, id) {
  await env.PHOTOS?.delete(photoKey(id));
  await db.prepare(`DELETE FROM photos WHERE memorial_id = ?`).bind(id).run();
}
async function removeMemorial(db, id, env = {}) {
  await removePhoto(db, env, id);
  await db.batch([
    db.prepare(`DELETE FROM candles WHERE memorial_id = ?`).bind(id),
    db.prepare(`DELETE FROM reports WHERE memorial_id = ?`).bind(id),
    db.prepare(`DELETE FROM memorials WHERE id = ?`).bind(id),
  ]);
}
