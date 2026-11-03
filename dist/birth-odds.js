// Dog population figures for the "real ratio" birth mode.
// Every number carries its source and confidence; values without a source are marked as game assumptions.
// Units: millions of dogs.
export const BIRTH_MODES = {
  explore: { label: '골고루 둘러보기', note: '6개 나라와 출생 환경을 같은 확률로 뽑습니다.' },
  real: {
    label: '현실 비율',
    note: '나라별 개 수와 길·마을에서 사는 개의 추정치로 뽑습니다. 현재 6개 나라만 포함합니다.',
  },
};
// Newborns in shelters or foster care: no comparable data, so a small fixed share is assumed.
export const SHELTER_SHARE = { value: 0.02, source: '게임용 가정', confidence: 'assumption' };
const fig = (value, source, confidence, year = null) => ({ value, source, confidence, year });
export const COUNTRY_DOGS = {
  KR: {
    owned: fig(4.99, '농림축산식품부 동물복지 국민의식조사 기반 추정', 'medium', 2024),
    freeRoaming: fig(0.1, '전국 추정치 없음 · 게임용 가정', 'assumption'),
  },
  JP: {
    owned: fig(6.79, '일본펫푸드협회 전국 개·고양이 사육실태 조사', 'medium', 2024),
    freeRoaming: fig(0.01, '전국 추정치 없음 · 게임용 가정', 'assumption'),
  },
  IN: {
    owned: fig(10, '공식 추정치 미확보 · 게임용 가정', 'assumption'),
    freeRoaming: fig(15.3, '인도 가축 센서스 (독립 추정은 5천만~7천만으로 훨씬 높음)', 'low', 2019),
  },
  US: {
    owned: fig(87.3, 'AVMA 반려동물 소유 통계', 'medium', 2025),
    freeRoaming: fig(1.5, '방법이 밝혀지지 않은 추정 · 게임용 가정', 'assumption'),
  },
  TR: {
    owned: fig(1, '공식 추정치 미확보 · 게임용 가정', 'assumption'),
    freeRoaming: fig(4, '튀르키예 농림부 장관 발언 추정', 'low', 2024),
  },
  CA: {
    owned: fig(7.9, '캐나다 동물건강연구소(CAHI) 추정 · 출처 확인 필요', 'low', 2022),
    freeRoaming: fig(0.2, '전국 추정치 없음 · 게임용 가정', 'assumption'),
  },
};
export function homeShares(countryId) {
  const d = COUNTRY_DOGS[countryId],
    total = d.owned.value + d.freeRoaming.value,
    shelter = SHELTER_SHARE.value;
  return {
    family: (d.owned.value / total) * (1 - shelter),
    street: (d.freeRoaming.value / total) * (1 - shelter),
    shelter,
  };
}
export function countryShares(countries) {
  const total = countries.reduce(
    (n, c) => n + COUNTRY_DOGS[c.id].owned.value + COUNTRY_DOGS[c.id].freeRoaming.value,
    0,
  );
  return Object.fromEntries(
    countries.map((c) => [
      c.id,
      (COUNTRY_DOGS[c.id].owned.value + COUNTRY_DOGS[c.id].freeRoaming.value) / total,
    ]),
  );
}
// r must be in [0, 1). Falls back to the last entry for floating-point edge cases.
export function weightedPick(entries, r) {
  let acc = 0;
  for (const [item, w] of entries) {
    acc += w;
    if (r < acc) return item;
  }
  return entries.at(-1)[0];
}
// Short, player-facing summary of what is known about dogs in a country.
export function countryFacts(countryId) {
  const d = COUNTRY_DOGS[countryId],
    m = (x) =>
      x.confidence === 'assumption'
        ? '공식 추정치 없음'
        : `약 ${Math.round(x.value * 100).toLocaleString('ko-KR')}만 마리`;
  return {
    owned: m(d.owned),
    freeRoaming: m(d.freeRoaming),
    sources: [d.owned, d.freeRoaming]
      .filter((x) => x.confidence !== 'assumption')
      .map((x) => `${x.source}${x.year ? ` (${x.year})` : ''}`),
  };
}
