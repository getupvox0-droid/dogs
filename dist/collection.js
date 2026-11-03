// Collection book: what the player has seen across finished lives. Stored apart from the life save.
// Paths describe what happened, never how lucky a life was (see docs/ROADMAP.md, principle 2).
import { BREED_IMAGES } from './visuals.js';
import { cleanName } from './engine.js';
import { longestCompanion } from './album.js';

export const COLLECTION_KEY = 'dogs-life-collection';
export const COLLECTION_MAX = 200;
export const HOMES = ['family', 'street', 'shelter'];
const has = (e, id) => e.events.includes(id);
export const PATHS = [
  {
    id: 'family-whole-life',
    label: '태어난 집에서 끝까지',
    test: (e) => e.birthHome === 'family' && e.finalHome === 'family' && !e.adoptionRoute,
  },
  {
    id: 'street-to-family',
    label: '길에서 태어나 가족을 만났다',
    test: (e) => e.birthHome === 'street' && e.finalHome === 'family',
  },
  {
    id: 'shelter-to-family',
    label: '보호시설에서 새 가족에게',
    test: (e) => e.birthHome === 'shelter' && e.finalHome === 'family',
  },
  {
    id: 'street-whole-life',
    label: '길과 동네에서 한평생',
    test: (e) => e.birthHome === 'street' && e.finalHome === 'street',
  },
  { id: 'rescued', label: '사람의 손에 구조되었다', test: (e) => has(e, 'rescued-shelter') },
  { id: 'reunion', label: '헤어졌다가 다시 만났다', test: (e) => has(e, 'reunion') },
  { id: 'companion', label: '곁을 지킨 동료가 있었다', test: (e) => has(e, 'companion-close') },
  { id: 'parent', label: '새끼들을 길렀다', test: (e) => has(e, 'litter-born') },
  { id: 'new-guardian', label: '돌보는 사람이 바뀌었다', test: (e) => has(e, 'guardian-changed') },
  {
    id: 'surgery',
    label: '수술 뒤 회복하는 시간을 보냈다',
    test: (e) => has(e, 'surgery-performed'),
  },
  { id: 'long-life', label: '열다섯 해를 넘겼다', test: (e) => e.ageDays >= 15 * 365 },
];
const EVENT_IDS = [
  'adopt',
  'rescued-shelter',
  'reunion',
  'companion-close',
  'litter-born',
  'guardian-changed',
  'surgery-performed',
];

export function emptyCollection() {
  return { version: 1, lives: [] };
}
// Keeps only well-formed entries; anything else (old formats, other keys' data) becomes an empty book.
export function parseCollection(raw) {
  try {
    const c = JSON.parse(raw);
    if (c?.version !== 1 || !Array.isArray(c.lives)) return emptyCollection();
    return { version: 1, lives: c.lives.filter(validEntry).slice(-COLLECTION_MAX) };
  } catch {
    return emptyCollection();
  }
}
function validEntry(e) {
  return (
    e &&
    typeof e.lifeId === 'string' &&
    typeof e.country === 'string' &&
    typeof e.countryName === 'string' &&
    HOMES.includes(e.birthHome) &&
    HOMES.includes(e.finalHome) &&
    typeof e.breed === 'string' &&
    Number.isInteger(e.ageDays) &&
    e.ageDays >= 0 &&
    Array.isArray(e.events) &&
    (e.companion == null ||
      (typeof e.companion.name === 'string' && typeof e.companion.kindName === 'string')) &&
    (e.name === null || typeof e.name === 'string')
  );
}
// A finished life reduced to what the book needs.
export function lifeEntry(s) {
  if (s.alive) throw Error('아직 살아 있는 생애');
  const b = s.chronicle.birth;
  return {
    lifeId: String(s.lifeId || s.seed),
    name: s.name ? cleanName(s.name) || null : null,
    breed: s.breed,
    lookId: s.appearance?.lookId || null,
    country: s.country.id,
    countryName: s.country.name,
    birthHome: b.home,
    birthPlace: b.place,
    finalHome: s.home,
    adoptionRoute: s.adoptionRoute || null,
    ageDays: s.day,
    events: EVENT_IDS.filter((id) => s.log.some((e) => e.id === id)),
    birthDate: s.chronicle.birthDate,
    companion: (({ name, kindName } = {}) => (name ? { name, kindName } : null))(
      longestCompanion(s) || undefined,
    ),
  };
}
// Adds or replaces a life by id. Returns a new collection.
export function addLife(c, entry) {
  const lives = c.lives.filter((e) => e.lifeId !== entry.lifeId);
  lives.push(entry);
  return { version: 1, lives: lives.slice(-COLLECTION_MAX) };
}
export function summarize(c, countries) {
  const births = {};
  for (const ct of countries) births[ct.id] = Object.fromEntries(HOMES.map((h) => [h, 0]));
  for (const e of c.lives) if (births[e.country]) births[e.country][e.birthHome]++;
  const breeds = Object.keys(BREED_IMAGES).map((breed) => ({
    breed,
    count: c.lives.filter((e) => e.breed === breed).length,
  }));
  const paths = PATHS.map((p) => {
    const hits = c.lives.filter(p.test);
    return { id: p.id, label: p.label, count: hits.length, first: hits[0] || null };
  });
  const filled = Object.values(births).reduce(
    (n, row) => n + HOMES.filter((h) => row[h] > 0).length,
    0,
  );
  return {
    total: c.lives.length,
    births,
    birthCells: { filled, all: countries.length * HOMES.length },
    breeds,
    paths,
    recent: c.lives.slice(-12).reverse(),
  };
}
