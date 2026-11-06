// How a dog's life ends when it is not cut short by an accident or the street: a last illness
// begins with the UK companion-dog life table's daily hazard (statistics.js, Teng et al. 2022),
// and its cause is drawn with the shares VetCompass recorded for UK dogs under primary care
// (Pegram et al. 2021). Most owned dogs in that study were euthanased (89.3%); so are most here.
export const END_SOURCE = {
  id: 'pegram-2021-uk',
  title: 'Proportion and risk factors for death by euthanasia in dogs in the UK',
  authors: 'Pegram et al.',
  published: 2021,
  journal: 'Scientific Reports 11:9145',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8096845/',
  n: 29865,
  euthanasia: 0.893,
  unassisted: 0.083,
  note: 'Shares combine euthanased and unassisted deaths by their counts; groups the game does not model ("other", not recorded, endocrine, blood) are left out and the rest rescaled. The age shaping (young dogs: behaviour, gut, accidents; older: tumours, joints, brain — O\'Neill et al. 2013, cited there) is a game assumption.',
};
// share: % of recorded deaths (euthanased × 0.915 + unassisted × 0.085, from Table 2).
// young / old: game multipliers for under 3 years and 10 years and over.
// last: the part of the share left to last illnesses, where everyday illnesses that fail to heal
// (health.js) already reach the rest (measured with scripts/measure-lifespan.mjs).
export const END_CAUSES = {
  cancer: { share: 18.7, young: 0.2, old: 1.2, days: [30, 90] },
  decline: { share: 16.0, young: 0, old: 1.6, days: [14, 45], from: 8 },
  joint: { share: 8.8, young: 0.4, old: 1.1, days: [30, 90] },
  brain: { share: 7.1, young: 0.8, old: 1, days: [3, 20] },
  behaviour: { share: 6.7, young: 2, old: 0.2, days: [10, 30] },
  heart: { share: 5.9, young: 0.4, old: 1.1, days: [20, 60] },
  respiratory: { share: 5.5, last: 2.5, young: 1, old: 1, days: [7, 20] },
  digestive: { share: 3.8, last: 1.5, young: 3, old: 0.8, days: [7, 20] },
  kidney: { share: 3.2, young: 0.4, old: 1.2, days: [30, 60] },
  trauma: { share: 2.5, young: 4, old: 0.5, days: [1, 3] },
};
// Picks the cause for a last illness at this age with a roll in [0, 1).
export function endCause(s, roll) {
  const years = s.day / 365,
    // Behaviour is a reason people give a dog up to be put to sleep; it needs people.
    // Decline is the 'old age' of the records; a younger dog's last illness has another name.
    entries = Object.entries(END_CAUSES).filter(
      ([k]) =>
        (k !== 'behaviour' || (s.home !== 'street' && years >= 0.5 && years < 8)) &&
        (k !== 'decline' || years >= END_CAUSES.decline.from),
    ),
    w = entries.map(
      ([, c]) => (c.last ?? c.share) * (years < 3 ? c.young : years >= 10 ? c.old : 1),
    );
  let r = roll * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < entries.length; i++) {
    if (r < w[i]) return entries[i][0];
    r -= w[i];
  }
  return entries.at(-1)[0];
}
export function endDuration(kind, roll) {
  const [a, b] = END_CAUSES[kind].days;
  return a + Math.floor(roll * (b - a + 1));
}
