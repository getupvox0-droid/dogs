// Rainbow Bridge Park API on D1. Every write needs a Turnstile token and a device id from the page;
// the device id is only stored as a salted hash, and no IP address is kept.
import { PARK_LIMITS, SPACE_KINDS, validateMemorial } from '../dist/park.js';

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
];
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
function card(row, device, lit) {
  return {
    id: row.id,
    kind: row.kind,
    createdAt: row.created_at,
    message: row.message,
    candles: row.candles,
    lit: Boolean(lit),
    mine: device != null && row.device_hash === device,
    ...JSON.parse(row.data),
  };
}
async function withCandles(db, rows, device) {
  if (!device || !rows.length) return rows.map((r) => card(r, device, false));
  const marks = rows.map(() => '?').join(','),
    { results } = await db
      .prepare(
        `SELECT memorial_id FROM candles WHERE device_hash = ? AND memorial_id IN (${marks})`,
      )
      .bind(device, ...rows.map((r) => r.id))
      .all(),
    lit = new Set(results.map((r) => r.memorial_id));
  return rows.map((r) => card(r, device, lit.has(r.id)));
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
    return json({ open: writable, siteKey: writable ? env.TURNSTILE_SITE_KEY || null : null });
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
    const m = /^\/api\/admin\/memorials\/([0-9a-f]{18})$/.exec(path);
    if (m && method === 'POST') {
      const body = await readBody(req);
      if (body?.action === 'restore')
        await db
          .prepare(`UPDATE memorials SET status = 'shown', reports = 0 WHERE id = ?`)
          .bind(m[1])
          .run();
      else if (body?.action === 'delete') await removeMemorial(db, m[1]);
      else return fail(400, '할 일을 고르세요.');
      return json({ ok: true });
    }
    return fail(404, '없는 주소입니다.');
  }

  const m = /^\/api\/memorials(?:\/([0-9a-f]{18})(?:\/(candle|report))?)?$/.exec(path);
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
    await removeMemorial(db, id);
    return json({ ok: true });
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
async function removeMemorial(db, id) {
  await db.batch([
    db.prepare(`DELETE FROM candles WHERE memorial_id = ?`).bind(id),
    db.prepare(`DELETE FROM reports WHERE memorial_id = ?`).bind(id),
    db.prepare(`DELETE FROM memorials WHERE id = ?`).bind(id),
  ]);
}
