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
