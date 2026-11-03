import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { handlePark } from '../worker/park-api.js';
import { validateMemorial, textProblem, PARK_LIMITS } from '../dist/park.js';

// The small part of the D1 API the park uses, on top of an in-memory SQLite database.
function fakeD1() {
  const db = new DatabaseSync(':memory:');
  const statement = (sql, args = []) => ({
    bind: (...a) => statement(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    first: async () => db.prepare(sql).get(...args) ?? null,
    run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } }),
  });
  return {
    prepare: (sql) => statement(sql),
    batch: async (list) => {
      const out = [];
      for (const s of list) out.push(await s.run());
      return out;
    },
  };
}
const env = () => ({
  DB: fakeD1(),
  TURNSTILE_SECRET: 'secret',
  TURNSTILE_SITE_KEY: 'site',
  DEVICE_SALT: 'salt',
  ADMIN_TOKEN: 'admin-token',
});
const A = 'a'.repeat(32),
  B = 'b'.repeat(32);
async function call(e, method, path, { body, device = A, token = 'ok', auth, now } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (device) headers['x-park-device'] = device;
  if (auth) headers.authorization = auth;
  const r = await handlePark(
    new Request('https://dogs.test' + path, {
      method,
      headers,
      body: method === 'POST' ? JSON.stringify({ ...body, turnstile: token }) : undefined,
    }),
    e,
    now,
  );
  return { status: r.status, body: await r.json() };
}
const gameLife = {
  kind: 'game',
  code: 'v1.abc.life-1.2026-11-03.r.d.%EB%B3%B5%EC%8B%A4.2s.1a.zz',
  name: '복실',
  breed: '진돗개',
  country: '한국',
  birthPlace: '마당 있는 집',
  birthHome: 'family',
  ageDays: 4800,
  paths: ['태어난 집에서 끝까지'],
  companion: '민지 (보호자)',
  lastLine: '민지의 냄새가 마지막까지 곁에 있었다.',
  daily: null,
  message: '잘 살았어',
};
test.beforeEach(() => {
  // Turnstile: the token "ok" passes, anything else fails.
  globalThis.fetch = async (_url, init) =>
    new Response(JSON.stringify({ success: init.body.get('response') === 'ok' }));
});

test('free text refuses links, contacts and listed words', () => {
  assert.equal(textProblem('보고 싶어', 60), null);
  assert.match(textProblem('https://spam.example', 60), /링크/);
  assert.match(textProblem('놀러와 dogs.com', 60), /링크/);
  assert.match(textProblem('010-1234-5678', 60), /연락처/);
  assert.match(textProblem('mail me a@b.kr', 60), /링크|연락처/);
  assert.match(textProblem('씨 발', 60), /쓸 수 없는/);
  assert.match(textProblem('가'.repeat(61), 60), /60자/);
});

test('memorial bodies are checked per kind', () => {
  assert.equal(validateMemorial(gameLife).kind, 'game');
  assert.ok(validateMemorial({ ...gameLife, birthHome: 'castle' }).error);
  assert.ok(validateMemorial({ ...gameLife, message: '가'.repeat(61) }).error);
  assert.ok(validateMemorial({ ...gameLife, code: 'javascript:alert(1)' }).error);
  const real = validateMemorial({
    kind: 'real',
    name: ' 콩이 ',
    breed: '말티즈',
    born: 2009,
    departed: 2024,
    message: '고마워',
  });
  assert.deepEqual(real.data, { name: '콩이', breed: '말티즈', born: 2009, departed: 2024 });
  assert.equal(
    validateMemorial({ kind: 'real', name: '콩이', message: '가'.repeat(200) }).error,
    undefined,
  );
  assert.ok(validateMemorial({ kind: 'real', name: '  ' }).error);
  assert.ok(validateMemorial({ kind: 'real', name: '콩이', born: 2024, departed: 2009 }).error);
  assert.ok(validateMemorial({ kind: 'real', name: '콩이', born: 24 }).error);
  assert.ok(validateMemorial({ kind: 'robot' }).error);
});

test('leaving, listing, candles and deleting', async () => {
  const e = env();
  assert.deepEqual((await call(e, 'GET', '/api/config')).body, { open: true, siteKey: 'site' });
  const made = await call(e, 'POST', '/api/memorials', { body: gameLife, now: 1000 });
  assert.equal(made.status, 201);
  const id = made.body.memorial.id;
  assert.equal(made.body.memorial.name, '복실');
  await call(e, 'POST', '/api/memorials', {
    body: { kind: 'real', name: '콩이' },
    device: B,
    now: 2000,
  });

  const list = await call(e, 'GET', '/api/memorials');
  assert.deepEqual(
    list.body.memorials.map((m) => m.name),
    ['콩이', '복실'],
  );
  assert.equal(list.body.memorials[1].mine, true);
  assert.equal(list.body.memorials[0].mine, false);
  assert.equal(list.body.memorials[0].device_hash, undefined);

  // One candle per device; a second press changes nothing.
  const candle = (d) => call(e, 'POST', `/api/memorials/${id}/candle`, { device: d });
  assert.equal((await candle(B)).body.candles, 1);
  assert.equal((await candle(B)).body.candles, 1);
  assert.equal((await candle(A)).body.candles, 2);
  const seen = (await call(e, 'GET', '/api/memorials', { device: B })).body.memorials.find(
    (m) => m.id === id,
  );
  assert.equal(seen.lit, true);
  assert.equal(seen.candles, 2);

  assert.equal((await call(e, 'DELETE', `/api/memorials/${id}`, { device: B })).status, 403);
  assert.equal((await call(e, 'DELETE', `/api/memorials/${id}`)).status, 200);
  assert.equal((await call(e, 'GET', '/api/memorials')).body.memorials.length, 1);
});

test('writes need a person check, a device and a working setup', async () => {
  const e = env();
  assert.equal(
    (await call(e, 'POST', '/api/memorials', { body: gameLife, token: 'bot' })).status,
    403,
  );
  assert.equal(
    (await call(e, 'POST', '/api/memorials', { body: gameLife, device: null })).status,
    400,
  );
  assert.equal(
    (await call(e, 'POST', '/api/memorials', { body: { ...gameLife, message: 'www.spam.kr' } }))
      .status,
    400,
  );
  const closed = { ...env(), TURNSTILE_SECRET: undefined };
  assert.equal((await call(closed, 'GET', '/api/config')).body.open, false);
  assert.equal((await call(closed, 'POST', '/api/memorials', { body: gameLife })).status, 503);
  assert.equal((await call(closed, 'GET', '/api/memorials')).status, 200);
  assert.equal((await call({}, 'GET', '/api/memorials')).status, 503);
});

test('one device can leave a few dogs a day', async () => {
  const e = env(),
    day = 86400000;
  for (let i = 0; i < PARK_LIMITS.dailyPosts; i++)
    assert.equal(
      (await call(e, 'POST', '/api/memorials', { body: gameLife, now: day })).status,
      201,
    );
  assert.equal((await call(e, 'POST', '/api/memorials', { body: gameLife, now: day })).status, 429);
  assert.equal(
    (await call(e, 'POST', '/api/memorials', { body: gameLife, now: day * 2 + 1 })).status,
    201,
  );
});

test('reports hide a memorial until the admin looks at it', async () => {
  const e = env();
  const id = (await call(e, 'POST', '/api/memorials', { body: gameLife })).body.memorial.id;
  const report = (d) => call(e, 'POST', `/api/memorials/${id}/report`, { device: d });
  const shown = async () => (await call(e, 'GET', '/api/memorials')).body.memorials.length;
  // The same device reporting twice counts once.
  await report('1'.repeat(32));
  await report('1'.repeat(32));
  await report('2'.repeat(32));
  assert.equal(await shown(), 1);
  await report('3'.repeat(32));
  assert.equal(await shown(), 0);

  const admin = { auth: 'Bearer admin-token' };
  assert.equal((await call(e, 'GET', '/api/admin/memorials')).status, 404);
  assert.equal(
    (await call(e, 'GET', '/api/admin/memorials', { auth: 'Bearer wrong-tokenx' })).status,
    404,
  );
  const hidden = await call(e, 'GET', '/api/admin/memorials', admin);
  assert.equal(hidden.body.memorials[0].reports, 3);
  await call(e, 'POST', `/api/admin/memorials/${id}`, { ...admin, body: { action: 'restore' } });
  assert.equal(await shown(), 1);
  await call(e, 'POST', `/api/admin/memorials/${id}`, { ...admin, body: { action: 'delete' } });
  assert.equal(await shown(), 0);
  assert.equal(
    (await call({ ...e, ADMIN_TOKEN: '' }, 'GET', '/api/admin/memorials', { auth: 'Bearer ' }))
      .status,
    404,
  );
});

test('recent order pages without repeats; random shows one', async () => {
  const e = env(),
    ids = [];
  for (let i = 0; i < 25; i++) {
    const r = await call(e, 'POST', '/api/memorials', {
      body: { kind: 'real', name: `개${i}` },
      device: i.toString(16).padStart(32, '0'),
      now: 1000 + Math.floor(i / 2), // pairs share a timestamp
    });
    ids.push(r.body.memorial.id);
  }
  const first = await call(e, 'GET', '/api/memorials');
  assert.equal(first.body.memorials.length, PARK_LIMITS.pageSize);
  const second = await call(e, 'GET', `/api/memorials?cursor=${first.body.next}`);
  assert.equal(second.body.next, null);
  const all = [...first.body.memorials, ...second.body.memorials].map((m) => m.id);
  assert.equal(all.length, 25);
  assert.deepEqual(new Set(all), new Set(ids));
  assert.equal((await call(e, 'GET', '/api/memorials?order=random')).body.memorials.length, 1);
});

test('shared lives stay apart from the park and group by daily dog', async () => {
  const e = env(),
    shared = { ...gameLife, kind: 'shared', message: '같은 강아지, 다른 길' };
  assert.ok(validateMemorial({ ...shared, code: null }).error);
  assert.ok(validateMemorial({ ...shared, message: '가'.repeat(41) }).error);
  await call(e, 'POST', '/api/memorials', { body: gameLife, now: 1000 });
  await call(e, 'POST', '/api/memorials', { body: { ...shared, daily: '2026-11-03' }, now: 2000 });
  await call(e, 'POST', '/api/memorials', {
    body: { ...shared, daily: '2026-11-03' },
    device: B,
    now: 3000,
  });
  const other = await call(e, 'POST', '/api/memorials', {
    body: { ...shared, daily: '2026-11-04' },
    device: B,
    now: 4000,
  });
  await call(e, 'POST', '/api/memorials', { body: shared, now: 5000 });

  assert.deepEqual(
    (await call(e, 'GET', '/api/memorials')).body.memorials.map((m) => m.kind),
    ['game'],
  );
  assert.equal(
    (await call(e, 'GET', '/api/memorials?order=random')).body.memorials[0].kind,
    'game',
  );
  assert.equal((await call(e, 'GET', '/api/lives')).body.memorials.length, 4);
  const day = (await call(e, 'GET', '/api/lives?daily=2026-11-03')).body.memorials;
  assert.equal(day.length, 2);
  assert.ok(day.every((m) => m.daily === '2026-11-03' && m.kind === 'shared'));
  assert.equal((await call(e, 'GET', '/api/lives?daily=11-03')).status, 400);
  assert.deepEqual((await call(e, 'GET', '/api/lives/days')).body.days, [
    { daily: '2026-11-04', lives: 1 },
    { daily: '2026-11-03', lives: 2 },
  ]);
  assert.equal(
    (await call(e, 'POST', `/api/memorials/${other.body.memorial.id}/candle`)).status,
    400,
  );
});

test('the park and shared lives have separate daily limits', async () => {
  const e = env(),
    day = 86400000,
    shared = { ...gameLife, kind: 'shared' };
  for (let i = 0; i < PARK_LIMITS.dailyPosts; i++)
    await call(e, 'POST', '/api/memorials', { body: gameLife, now: day });
  assert.equal((await call(e, 'POST', '/api/memorials', { body: shared, now: day })).status, 201);
  for (let i = 1; i < PARK_LIMITS.dailyPosts; i++)
    await call(e, 'POST', '/api/memorials', { body: shared, now: day });
  const over = await call(e, 'POST', '/api/memorials', { body: shared, now: day });
  assert.equal(over.status, 429);
  assert.match(over.body.error, /나눌 수/);
});
