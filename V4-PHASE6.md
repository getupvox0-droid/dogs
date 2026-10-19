# Phase 6 increment: pacing preferences and scene locality

Implemented: 16× in the actual story beat controls, normalized persisted speed
preferences (legacy defaults to 1×), important/long text reading floor retained,
and no live story ticks while the document is hidden. Speed changes never call
the day engine and do not shorten a previously scheduled reading window.

Current visual selection ignores scene records from another area, another home,
or a future date. Legacy records without location remain supported. Clinical
recovery can select the existing recovery scene asset. Breed/appearance assets,
chronicle, save version and daily simulation calculations are preserved.

Changed: dist/app.js, dist/index.html, dist/story-runner.js,
dist/time-config.js, dist/visuals.js; tests/pacing-context.test.mjs.

Focused verification: 22 tests passed. Full regression: 198 passed, 0 failed (143.53 seconds), including the existing
1,000 complete lifetime simulation test. Final focused scene/pacing run: 10/10. No browser/mobile visual verification claimed.

Not complete: 13-year/240-second experimental pacing target, complete contextual
asset coverage, actual mobile play testing, and Phase 7 larger lifetime samples.
The 500ms ordinary-beat minimum and protected reading times mean 16× is not a
promise of 16 times faster total life playback. No fixed death date is introduced.

## Follow-up: daily output density

- Shared ordinary-record classification recognizes bounded learned automatic
  routines. Story beats can cross routine-only stretches up to 7 days (story)
  or 30 days (observation); other events immediately stop the slice. Every day
  still runs through advance(s,1), and unresolved choices block intervention.
- Ordinary timeline rows group within 30 days and the same home/area in both
  modes. Original indices are retained. Search/type/story filters request raw
  rows, so earlier words in a summary remain searchable.
- Reading floors apply to the meaningful event text, not concatenated routine
  rows. Important event reading remains protected at every speed.
- Timeline presentation no longer initializes progress preferences while read.

Measurement: scripts/evaluate-pacing.mjs; 12 identical seeds per output mode,
weighted player actions held identical, 24 before/after mode pairs. Average
lifespan 4,332.83 days; days, raw record counts and question counts matched.
These are scheduled reading/playback waits, not measured browser play times.
Human decision time, rendering and computation are excluded.

| Mean metric | Before | After |
|---|---:|---:|
| Story beat count | 419.42 | 358.08 |
| Story scheduled seconds at 1× | 1,335.00 | 1,278.92 |
| Story scheduled seconds at 16× | 611.00 | 568.17 |
| Observation beat count | 366.58 | 289.50 |
| Observation scheduled seconds at 1× | 1,058.25 | 948.25 |
| Observation scheduled seconds at 16× | 634.00 | 533.92 |

Full raw measurements: dist/data/v4-pacing-quality.json. The first trial exposed
routine concatenation triggering long-text gates; this was corrected before
publication. This is a measured reduction, not attainment of the experimental
13-year/240-second goal. Meaningful choices and protected reading still dominate.
The evaluation deliberately fixes intervention choices in both output modes to
isolate pacing; it does not benchmark fully autonomous observation gameplay.

Follow-up verification: npm test — 202 passed, 0 failed (including the existing
1,000 complete lifetime sample); focused pacing/choice/UI-model checks 18/18.
Actual mobile browser play remains unverified.
