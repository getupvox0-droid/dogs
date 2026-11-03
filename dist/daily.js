// "오늘의 강아지": everyone who starts on the same Korean date is born as the same dog.
// Seed, life id and birth date all come from the date, so birth, looks and littermates match;
// the life then follows each player's own choices.
import { createLife } from './engine.js';
import { setBirthDate } from './chronicle.js';
import { mix } from './world.js';

// The daily dog is drawn with the sourced real-world ratios, so over many days it shows
// where dogs are actually born.
export const DAILY_BIRTH_MODE = 'real';

export function koreaDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function dailySeed(date) {
  return mix('daily:' + date, 900);
}
export function createDailyLife(date = koreaDate()) {
  const life = createLife(dailySeed(date), 'daily-' + date, {
    birthMode: DAILY_BIRTH_MODE,
    daily: date,
  });
  setBirthDate(life, date);
  return life;
}
