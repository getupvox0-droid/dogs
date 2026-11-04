// Free-roaming dog reproduction, from field studies. Each figure names its source; anything the
// game derives from them to fit its own day model is marked as such (docs/ROADMAP.md, principle 3).
export const STREET_REPRODUCTION = {
  litterSize: {
    mean: 4.9,
    range: [1, 13],
    source:
      'Czupryna et al. 2016, Ecology and Demography of Free-Roaming Domestic Dogs in Rural Villages near Serengeti National Park in Tanzania, PLoS ONE 11(11): e0167092',
  },
  littersPerYear: {
    value: 0.8,
    range: [0.6, 1],
    source:
      'Butler & Bingham, rural Zimbabwe: 0.6 litters per female per year (cited in Reece et al. 2008, Fecundity and longevity of roaming dogs in Jaipur, India, BMC Veterinary Research 4:6); West Bengal: one litter a year (Paul et al. 2016, Scientific Reports 6:19641)',
  },
  pupDeathBy3Months: {
    value: 0.56,
    source:
      'Pup rearing: The role of mothers and allomothers in free-ranging domestic dogs, Applied Animal Behaviour Science (2020), West Bengal',
  },
  pupReachMaturity: {
    value: 0.19,
    source:
      'Paul et al. 2016, High early life mortality in free-ranging dogs is largely influenced by humans, Scientific Reports 6:19641',
  },
};
// Derived for the game's day model (game assumptions fitted to the figures above):
// a street female in heat conceives with this chance, so with heat every 150–240 days and no
// new pregnancy within a year of the last, litters come about 0.8 times a year.
export const CONCEIVE_PER_HEAT = 0.6;
// Pups in a home or shelter: a daily chance of dying in the first three months (game assumption,
// about 5% in all). Street pups use pupDeathBy3Months directly (family.js decides at birth).
export const PUP_DAILY_DEATH = { cared: 0.0006 };
// Litter size: a binomial with mean 4.9 (12 tries at 0.41), at least one pup.
export function litterSize(random) {
  let n = 0;
  for (let i = 0; i < 12; i++) if (random() < 0.41) n++;
  return Math.max(1, n);
}
