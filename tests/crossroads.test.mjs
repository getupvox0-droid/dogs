import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLife,
  advance,
  choose,
  acknowledgeBirth,
  serialize,
  restore,
} from '../dist/engine.js';
import { decisionUid } from '../dist/decisions.js';
import { CROSSROADS, pickOutcome } from '../dist/crossroads.js';
import { encodeLife, replayLife, decodeLife } from '../dist/share.js';
import { setBirthDate } from '../dist/chronicle.js';

const live = (seed, pick) => {
  const s = createLife(seed, `life-${seed}-x`, { birthMode: 'explore' });
  setBirthDate(s, '2026-11-03');
  acknowledgeBirth(s);
  let k = 0;
  while (s.alive) {
    if (!s.pending) {
      advance(s, 1);
      continue;
    }
    k++;
    choose(s, pick(s.pending, k).id, decisionUid(s));
  }
  return s;
};

test('every crossroad has player-only knowledge, 2–3 options and a safe way out', () => {
  assert.equal(CROSSROADS.length, 22);
  for (const c of CROSSROADS) {
    const know = typeof c.know === 'function' ? c.know({ country: { id: 'KR' } }) : c.know;
    assert.ok(know.length > 10, c.id);
    assert.ok(c.options.length >= 2 && c.options.length <= 3, c.id);
    // The last option never kills: a careful dog can always step back.
    assert.ok(
      c.options.at(-1).outcomes.every((o) => !o.die),
      c.id,
    );
    for (const opt of c.options) assert.ok(opt.outcomes.length >= 1);
  }
  assert.ok(CROSSROADS.some((c) => c.options.some((x) => x.outcomes.some((o) => o.die))));
});

test('outcomes are drawn from the seed, so the same moment always ends the same way', () => {
  const s = createLife(5);
  const road = CROSSROADS.find((c) => c.id === 'road-smell').options[0];
  const a = pickOutcome(s, road);
  assert.equal(pickOutcome(s, road), a);
  const seen = new Set();
  for (let serial = 0; serial < 300; serial++) {
    s.decisionSerial = serial;
    seen.add(road.outcomes.indexOf(pickOutcome(s, road)));
  }
  assert.equal(seen.size, 3, 'every road outcome can happen');
});

test('risky choices can end a life; careful ones never die at a crossroad', () => {
  let risky = 0,
    careful = 0,
    met = 0;
  for (let seed = 1; seed <= 120; seed++) {
    const a = live(seed, (p) => p.options[0]);
    const b = live(seed, (p) => p.options.at(-1));
    met += a.crossroads.history.length;
    if (a.crossroads.history.at(-1)?.day === a.day && a.log.at(-1).id === 'death') risky++;
    if (b.crossroads.history.at(-1)?.day === b.day && b.log.at(-1).id === 'death') careful++;
    assert.equal(a.log.at(-1).id, 'death');
  }
  assert.ok(risky > 5, `risky deaths ${risky}`);
  assert.equal(careful, 0);
  assert.ok(met / 120 >= 3, 'a life meets several crossroads');
});

test('marks from a crossroad change later moments and survive a save', () => {
  const s = createLife(8);
  s.crossroads.marks.push('traffic-fear');
  const road = CROSSROADS.find((c) => c.id === 'road-smell');
  assert.match(road.text(s), /굉음이 들리자 몸이 먼저 굳는다/);
  const back = restore(serialize(s));
  assert.deepEqual(back.crossroads.marks, ['traffic-fear']);
  const bad = JSON.parse(serialize(s));
  bad.crossroads.seen = ['not-a-crossroad'];
  assert.throws(() => restore(JSON.stringify(bad)));
});

test('a life with crossroads replays from its share link, and old links are refused', () => {
  const s = live(31, (p, k) => p.options[k % p.options.length]);
  assert.ok(s.crossroads.history.length > 0);
  const again = replayLife(encodeLife(s));
  assert.deepEqual(
    again.log.map((e) => [e.day, e.id, e.text]),
    s.log.map((e) => [e.day, e.id, e.text]),
  );
  const old = encodeLife(s).replace(/^v16./, 'v15.');
  assert.throws(() => decodeLife(old));
});

test('generated crossroads come often, vary within a life, and stay well formed', async () => {
  const { HAZARDS } = await import('../dist/crossroad-parts.js');
  let total = 0,
    ratio = 0,
    lives = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const s = createLife(seed * 17, null, { birthMode: 'explore' });
    acknowledgeBirth(s);
    const combos = [];
    let k = 0;
    while (s.alive) {
      if (!s.pending) {
        advance(s, 1);
        continue;
      }
      const p = s.pending;
      if (p.id === 'crossroad:gen') {
        combos.push(`${p.gen.setting}/${p.gen.lure}/${p.gen.hazard}`);
        assert.ok(!/undefined|null/.test(p.text + p.know), p.text);
        // The player's line never leaks into the dog's senses.
        assert.ok(!p.text.includes(p.know));
        if (p.gen.hazard === 'poison') assert.ok(['food', 'water'].includes(p.gen.lure));
        assert.ok(p.options.length >= 3 && p.options.length <= 4);
        assert.equal(p.know, HAZARDS[p.gen.hazard].know(p.gen.setting));
      }
      k++;
      choose(s, p.options[k % p.options.length].id, decisionUid(s));
    }
    if (!combos.length) continue;
    total += combos.length;
    ratio += new Set(combos).size / combos.length;
    lives++;
  }
  assert.ok(total / lives >= 8, `generated per life ${total / lives}`);
  assert.ok(ratio / lives >= 0.85, `distinct within a life ${ratio / lives}`);
});

test('a waiting generated crossroad survives a save, and staying put never hurts', () => {
  let s;
  for (let seed = 222; ; seed++) {
    s = createLife(seed, null, { birthMode: 'explore' });
    acknowledgeBirth(s);
    while (s.alive && s.pending?.id !== 'crossroad:gen') {
      if (s.pending) choose(s, s.pending.options.at(-1).id, decisionUid(s));
      else advance(s, 1);
    }
    if (s.pending) break;
  }
  const back = restore(serialize(s));
  assert.deepEqual(back.pending.gen, s.pending.gen);
  const broken = JSON.parse(serialize(s));
  broken.pending.gen.hazard = 'dragon';
  assert.throws(() => restore(JSON.stringify(broken)));
  const before = s.log.length;
  choose(s, 'avoid', decisionUid(s));
  assert.ok(s.alive);
  assert.ok(!s.log.slice(before).some((e) => e.id === 'illness-onset'));
});

test('each turn moves the life and leaves the records later systems read', async () => {
  const { applyTurn } = await import('../dist/life-turns.js');
  const { lifeEntry, PATHS } = await import('../dist/collection.js');
  const ctx = {
    log: (s, id, text) => s.log.push({ day: s.day, id, text }),
    remember: (s, id) => s.memories.push(id),
  };
  const street = () => {
    const s = createLife(41, null, { birthMode: 'explore' });
    s.home = 'street';
    s.day = 400;
    return s;
  };
  let s = street();
  assert.ok(applyTurn(s, ['family', '따라갔다'], ctx));
  assert.equal(s.home, 'family');
  assert.equal(s.adoptionRoute, 'followed-home');
  assert.equal(s.log.at(-1).id, 'adopt');
  s = street();
  assert.ok(applyTurn(s, ['caught', '잡혔다'], ctx));
  assert.equal(s.home, 'shelter');
  assert.equal(s.environmentModel.facility, 'shelter');
  s = street();
  assert.ok(applyTurn(s, ['rescued', '구조됐다'], ctx));
  assert.equal(s.log.at(-1).id, 'rescued-shelter');
  assert.ok(applyTurn(s, ['escaped', '빠져나왔다'], ctx));
  assert.equal(s.home, 'street');
  s = street();
  s.home = 'family';
  assert.ok(applyTurn(s, ['lost', '길을 잃었다'], ctx));
  assert.equal(s.home, 'street');
  assert.equal(s.story.lost, true);
  assert.equal(s.story.returnHome, 'family');
  // A turn that does not fit where the dog lives does nothing.
  assert.equal(applyTurn(s, ['lost', '또'], ctx), false);
  assert.equal(applyTurn(s, ['escaped', '?'], ctx), false);
  // The book names these paths.
  s.alive = false;
  const e = lifeEntry(s);
  assert.ok(PATHS.find((p) => p.id === 'lost').test(e));
  assert.ok(restore(serialize(s)));
});

test('crossroads can turn lives: risky play changes homes more than staying put', () => {
  const count = (pick) => {
    let turns = 0;
    for (let seed = 1; seed <= 80; seed++) {
      const s = createLife(seed * 31, null, { birthMode: 'explore' });
      acknowledgeBirth(s);
      let k = 0;
      while (s.alive) {
        if (!s.pending) {
          advance(s, 1);
          continue;
        }
        k++;
        const p = s.pending,
          before = s.log.length;
        const opt = p.id.startsWith('crossroad:')
          ? pick(p.options)
          : p.options[k % p.options.length];
        choose(s, opt.id, decisionUid(s));
        if (p.id.startsWith('crossroad:'))
          turns += s.log
            .slice(before)
            .filter((e) =>
              ['adopt', 'rescued-shelter', 'caught-shelter', 'gate-out', 'shelter-escape'].includes(
                e.id,
              ),
            ).length;
      }
    }
    return turns;
  };
  assert.equal(
    count((o) => o.at(-1)),
    0,
  );
  assert.ok(count((o) => o[0]) >= 15);
});

test('marks read as traits, and the ending can name the choices that shaped a life', async () => {
  const { traitsOf, shapingChoices } = await import('../dist/traits.js');
  const s = createLife(9);
  s.crossroads.marks.push('traffic-wise', 'bold', 'road-wise');
  s.crossroads.markDays = { bold: 50, 'traffic-wise': 90, 'road-wise': 120 };
  // Two marks that mean the same show once, in the order they were gained.
  assert.deepEqual(
    traitsOf(s).map((t) => t.label),
    ['대담함', '길 건너는 요령이 있음'],
  );
  let found = null;
  for (let seed = 1; seed <= 60 && !found; seed++) {
    const life = live(seed, (p) => p.options[0]);
    const shaped = shapingChoices(life);
    if (shaped.some((c) => c.kind === 'turn' || c.kind === 'hurt')) found = shaped;
  }
  assert.ok(found, 'some risky life has a shaping choice');
  assert.ok(found.length <= 6);
  for (const c of found) {
    assert.ok(c.action && c.result);
    assert.ok(['death', 'turn', 'hurt', 'mark'].includes(c.kind));
  }
  assert.deepEqual(
    found.map((c) => c.day),
    [...found.map((c) => c.day)].sort((a, b) => a - b),
  );
});

test('finding food on the street builds know-how that feeds a street pup more often', async () => {
  const { physiologyStep } = await import('../dist/physiology.js');
  const eatDays = (forage) => {
    const s = createLife(77, null, { birthMode: 'explore' });
    s.home = 'street';
    s.day = 120;
    s.crossroads.forage = forage;
    let ate = 0;
    for (let d = 0; d < 60; d++) {
      s.day++;
      const before = s.needs.hunger;
      s.needs.hunger = 80;
      physiologyStep(s, () => {});
      if (s.needs.hunger < 80) ate++;
      s.needs.hunger = before;
    }
    return ate;
  };
  assert.ok(eatDays(30) > eatDays(0));
});

test('new parts keep their rules: ice only in the cold, traps only where something is baited', async () => {
  const { HAZARDS, SETTINGS } = await import('../dist/crossroad-parts.js');
  assert.equal(HAZARDS.ice.ok({ world: 'heat' }), false);
  assert.equal(HAZARDS.ice.ok({ world: 'cold' }), true);
  assert.deepEqual(HAZARDS.trap.lures, ['food', 'prey', 'scent']);
  for (const [id, st] of Object.entries(SETTINGS)) {
    for (const h of st.hazards) assert.ok(HAZARDS[h], `${id} → ${h}`);
    assert.ok(st.text.length >= 1);
  }
  assert.ok(Object.keys(SETTINGS).length >= 24);
});

test('country places only appear in their country, and the companion moment is capped', async () => {
  const { COUNTRY_SETTINGS } = await import('../dist/crossroad-parts.js');
  const own = new Set(
    Object.values(COUNTRY_SETTINGS).flatMap((c) => [...(c.street || []), ...(c.family || [])]),
  );
  for (let seed = 1; seed <= 60; seed++) {
    const s = createLife(seed * 41, null, { birthMode: 'explore' });
    acknowledgeBirth(s);
    const mine = new Set([
      ...(COUNTRY_SETTINGS[s.country.id]?.street || []),
      ...(COUNTRY_SETTINGS[s.country.id]?.family || []),
    ]);
    let k = 0,
      buddy = 0;
    while (s.alive) {
      if (!s.pending) {
        advance(s, 1);
        continue;
      }
      const p = s.pending;
      if (p.id === 'crossroad:gen') {
        if (own.has(p.gen.setting))
          assert.ok(mine.has(p.gen.setting), `${s.country.id} met ${p.gen.setting}`);
        if (p.gen.lure === 'buddy') buddy++;
        if (p.gen.hazard === 'snow') assert.equal(s.world, 'cold');
        if (p.gen.hazard === 'storm' || p.gen.lure === 'dry') assert.equal(s.world, 'rain');
      }
      k++;
      choose(s, p.options[k % p.options.length].id, decisionUid(s));
    }
    assert.ok(buddy <= 3, `buddy ${buddy}`);
  }
});

test('litter crossroads keep or lose the young, and people events can move a dog', async () => {
  const { crossroadChoice, CROSSROADS: ALL } = await import('../dist/crossroads.js');
  const { applyTurn } = await import('../dist/life-turns.js');
  const ctx = {
    log: (s, id, text) => s.log.push({ day: s.day, id, text }),
    remember: (s, id) => s.memories.push(id),
  };
  const s = createLife(55, null, { birthMode: 'explore' });
  s.day = 900;
  s.home = 'family';
  s.reproduction.litters.push({ id: 'litter-1', parentRole: 'mother', birthDay: 880 });
  for (let i = 0; i < 3; i++)
    s.reproduction.children.push({
      id: 'c' + i,
      name: `새끼 ${i}`,
      present: true,
      birthDay: 880,
      bond: 20,
      departAt: 960,
    });
  const stairs = ALL.find((c) => c.id === 'den-stairs');
  assert.ok(stairs.ok(s));
  // Force the losing outcome by trying serials until it comes up.
  let lost = false;
  for (let serial = 0; serial < 200 && !lost; serial++) {
    const t = structuredClone(s);
    t.decisionSerial = serial;
    crossroadChoice(t, { id: 'crossroad:den-stairs' }, 'bark', ctx);
    lost = t.log.some((e) => e.id === 'child-lost');
    if (lost) assert.equal(t.reproduction.children.filter((k) => k.present).length, 2);
  }
  assert.ok(lost);
  const home = createLife(56);
  home.home = 'family';
  assert.ok(applyTurn(home, ['surrendered', '맡겨졌다'], ctx));
  assert.equal(home.home, 'shelter');
  const moved = createLife(57);
  moved.home = 'family';
  const area = moved.areaId;
  assert.ok(applyTurn(moved, ['rehomed', '따라갔다'], ctx));
  assert.equal(moved.home, 'family');
  assert.notEqual(moved.areaId, area);
  assert.equal(moved.log.at(-1).id, 'guardian-changed');
});

test('a dog it once shielded can come back and turn a fatal moment into a wound', async () => {
  const { crossroadChoice } = await import('../dist/crossroads.js');
  const ctx = {
    log: (s, id, text) => s.log.push({ day: s.day, id, text }),
    remember: (s, id) => s.memories.push(id),
  };
  let saved = 0;
  for (let serial = 0; serial < 400; serial++) {
    const s = createLife(58);
    s.day = 900;
    s.home = 'street';
    s.decisionSerial = serial;
    s.crossroads.debts = ['buddy'];
    crossroadChoice(s, { id: 'crossroad:road-smell' }, 'dash', ctx);
    if (s.log.some((e) => /그때 앞을 막아 주었던 개/.test(e.text))) {
      saved++;
      assert.ok(s.alive);
      assert.deepEqual(s.crossroads.debts, []);
    }
  }
  assert.ok(saved > 0);
});
