// "내 나라에서" birth: guess the player's country from the browser's language and time zone.
// Nothing leaves the device and no location permission is asked; the player can change it.
const BY_ZONE = {
  'Asia/Seoul': 'KR',
  'Asia/Tokyo': 'JP',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Europe/Istanbul': 'TR',
  'Asia/Istanbul': 'TR',
  'Asia/Shanghai': 'CN',
  'Asia/Chongqing': 'CN',
  'Asia/Harbin': 'CN',
  'Asia/Urumqi': 'CN',
  'Asia/Manila': 'PH',
  'Africa/Lagos': 'NG',
  'Asia/Bangkok': 'TH',
  'America/Mexico_City': 'MX',
  'America/Monterrey': 'MX',
  'America/Cancun': 'MX',
  'America/Tijuana': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Fortaleza': 'BR',
  'America/Recife': 'BR',
  'America/Manaus': 'BR',
  'America/Bahia': 'BR',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'America/St_Johns': 'CA',
  'America/Regina': 'CA',
};
// Zones shared by several countries (US and Canada share most North American zones).
const US_ZONES =
  /^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Indiana\/|Kentucky\/)|^Pacific\/Honolulu$/;

// Returns a country id from `ids`, or null when the guess is not one of them.
export function detectCountry({ language = '', timeZone = '' } = {}, ids = []) {
  const region = (/[-_]([A-Za-z]{2})\b/.exec(language)?.[1] || '').toUpperCase();
  const zone = BY_ZONE[timeZone] || (US_ZONES.test(timeZone) ? 'US' : null);
  // The region in the language tag is the clearest signal; the zone helps when it is missing.
  for (const guess of [region, zone]) if (guess && ids.includes(guess)) return guess;
  const lang = language.slice(0, 2).toLowerCase();
  const byLang = { ko: 'KR', ja: 'JP', tr: 'TR', zh: 'CN', th: 'TH', pt: 'BR', hi: 'IN' }[lang];
  return byLang && ids.includes(byLang) ? byLang : null;
}
export function browserCountry(ids) {
  try {
    return detectCountry(
      {
        language: globalThis.navigator?.language || '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      },
      ids,
    );
  } catch {
    return null;
  }
}
