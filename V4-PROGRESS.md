# v4 implementation checkpoint — Phase 0 and world foundation

## Source and audit

Requested repository: https://github.com/getupvox0-droid/dogs (renamed from aura).
GitHub baseline: `6cb18ad926e6ca9e10f9a217da989d96abb2f71a`.
Sites source baseline: `8c6d2ab22d837cbeda36ad294162c81d81465ad0`.
The GitHub export was behind the hosted source in 26 text files. This increment
retains the newer custody, regional evidence, 6 multi-stage journeys, 31 scenes
and 40 journey actions rather than discarding them to match the older export.
No image bytes or hosting identity are changed.

Baseline reruns: exported code 102/102 tests; current source 120/120 tests.
Each suite includes 1,000 complete lifetimes. The current-source report is the
comparison baseline for this increment, not the older 102-test export.

## Actual call paths and existing functionality

| System | Actual modules / call path | Audit status |
|---|---|---|
| Birth / images / ending | engine.createLife → world, visuals, chronicle; app route screens | Implemented, automated checks; browser visuals unverified |
| Day simulation | advance → daily step → growth/world/custody/people/neighbors/behavior/needs/health/clinical/family/journeys/stories/threads/life-events/opportunities | Implemented and tested |
| Clock | app interval → nextStoryBeat → advance one day repeatedly → beatDelay | Implemented; 13-year/240-second pacing and 16× still pending |
| Legacy clock | time-config.clockDays(dayMs=10000) imported by app, not called by its live interval | Exists; changing dayMs alone would not change story pacing |
| Timeline | newest-first, 40-record pages; readingPast and pauseOnRecords stop live interval | Implemented, static and model checks; browser interaction unverified |
| Physiology | people access → dailyBehavior → needsStep → four-period physiologyStep | Implemented and tested |
| Humans / adoption | people-world, custody, stories, chronological adoption reviews | Implemented; bounded household autonomy |
| Nearby animals | neighbors, social, persistent IDs/ages/location/health | Implemented in part; no complete multiscale offscreen simulation |
| Medical / reproduction | health, clinical, clinical-extra, family | Implemented and tested; game probabilities are not calibrated clinical rates |
| Memory | episodes, delta, persistence, target → behavior / life-state influences | Implemented in part; unified causal event model remains pending |
| Long stories | threads + journeys with actor/area guards and saved stages | Implemented; not every requested v4 causal arc exists |
| Repetition | template caps, actor/purpose histories, exact prompt metric | Partial; global semantic/choice-structure metric not yet implemented |
| Genetics | birth appearance / inborn trait snapshot | Partial; parent-derived genotype/environment separation not implemented |
| Other species | explicit dog gates in species.js | Unsupported species are rejected; other species not implemented |

## Phase 1 changes

- `dist/world-profile.js`: versioned, seeded locality with 5 region types,
  correlated settlement density, traffic, nature, animal density, water and
  veterinary reach. Settlement archetypes constrain regional combinations.
- Existing 24 birth settings, 6-country uniform exploration, appearance, family,
  milestones and independent medical RNG are preserved. All new scores and
  schedules are explicitly authored assumptions, not national statistics.
- Separate immutable birth snapshot and current locality. Moving changes the
  current locality; it never edits the birth snapshot or previous timeline.
- Saved world changes: human work schedule/economy, shelter crowding, street
  water access and route/resource changes. Humans change their own scores;
  these are not presented as a dog's control over human decisions.
- Real downstream connections: caregiver attention and care scores, medical and
  water access, coastal event eligibility, exploration/care candidate weights.
- `world.js` reuses existing seeded origin and daily weather/growth pipeline;
  the older household drift block is replaced by the saved change schedule so
  two independent household simulations do not double-apply effects.
- `people-world.js` reuses its existing intake/access/clinic/adoption gates.
- `engine.js` validates new saved world state. Old saves initialize future state
  without inventing a historical birth world or consuming the main RNG.
- `app.js` world details show the current region, density, access and changes.

Changed source: world-profile.js, world.js, people-world.js, engine.js, app.js.
Added tests: tests/world-profile.test.mjs. Original user plan is retained in
V4-DEVELOPMENT-PLAN.md. Quantitative report: dist/data/v4-world-quality.json.

## Measurements

| Metric | Current-source baseline | After world foundation |
|---|---:|---:|
| Complete lives sampled | 1,000 | 1,000 |
| Unique recorded histories | 1,000 | 1,000 |
| Decision template IDs | 117 | 117 |
| Exact-text prompt repeat fraction | 4.7359% | 4.4908% |
| Explicit correlated region types | not represented | 5 |
| New-world birth-condition sample | not measured in same representation | 10,000 distinct / 10,000 |
| Semantic repetition | not measured | not measured |
| Full 10,000-life / 100,000-life run | not executed | not executed |
| Browser visual QA | unavailable | unavailable |

Exact-text repetition is not a semantic diversity score. The birth-condition
sample excludes life IDs from its fingerprint but includes actual numeric world
conditions; it does not prove unique meaningful lives or real-world accuracy.
No country risk calibration or inherited genetics has been added here.

## Validation and remaining work

Commands: `npm test` (baseline),
`node --test tests/world-profile.test.mjs`, and `npm test` (after changes).
Tests cover 10,000 birth conditions, regional correlations, causal access/attention
changes, saved changes applied once, birth preservation on moves, legacy future-only
migration, corrupted profile rejection, daily/batched and save/resume equality.
Full post-change suite: 130 passed, 0 failed (including 1,000 full lifetimes),
63.66 seconds in this runtime. Baseline suite: 120 passed in 56.57 seconds.
These timings are test-suite wall times, not isolated engine benchmarks.

Phase 0 audit is complete. The initial Phase 1 world foundation is implemented.
Remaining Phase 1 breadth: breeding facilities/multi-dog household models,
heritable predispositions and new regional evidence are not claimed complete.
Phases 2–7 remain open: compositional situation ontology, richer actor autonomy,
long causal memories, semantic repetition control and learned routine automation,
16× and calibrated presentation pacing, contextual image coverage, full 10,000-life
evaluation, conditional 100,000-life evaluation, and actual browser/mobile QA.

Next implementation starts with Phase 2: explicit cause/actor/goal/action/outcome
records using the existing neighbors, opportunities and journeys; compare semantic
and choice-structure signatures without counting wording variations as new events.
Do not rerun image uploads: GitHub already contains all original lossless asset
parts and its restoration manifest. Update text files against the latest branch.
GitHub publication and production deployment are verified separately in the handoff.

## Phase 2 checkpoint — 2026-10-18

Six causal situations and 13 actions, saved followups, actor-specific memory effects, familiar routine automation and partial authored semantic metrics are implemented. See V4-PHASE2.md and dist/data/v4-situation-quality.json. Frozen suite: 140/140 passed including 1,000 complete lives. Exact prompt repetition regressed from 4.491% to 5.830%; global repetition remains open. Broader Phases 2–7 remain unfinished; no browser/mobile QA or 10,000 full-life run is claimed.

## Phase 3 animal-autonomy checkpoint — 2026-10-18

Nearby dogs now retain needs, intake, goals, activity, territory and reciprocal contact memories. Their own state and past contact affect social purpose and response. Dead/remote actors cannot resolve an encounter; local focus repairs safely. Existing saves initialize prospectively. See V4-PHASE3.md and dist/data/v4-neighbor-quality.json. Final full suite: 152/152 passed, including 1,000 full lifetimes. Meaning-tag repetition: 2.085% → 2.051%; exact prompt repetition remains about 5.83%, so global repetition remains unresolved.

Next priority: human age/schedule/stress and ongoing household changes, then broader causal arcs and global repetition/pacing. Remote NPC ecology, inherited genetics, 16×/contextual images, 10,000 full-life evaluation and actual browser/mobile QA remain open. This is the animal foundation of Phase 3, not completion of all v4 phases.

## Phase 3 human-life checkpoint — 2026-10-18

People now retain age, weekly schedule, stress, activity and bounded history; effective time feeds actual care/access calculations. Remote former guardians do not provide daily care to lost street dogs. Staff off-days retain coverage, and replaced caregivers become inactive relations. Existing saves initialize human state prospectively. Full suite: 162/162 passed, including 1,000 complete lives. See V4-PHASE3-HUMANS.md and dist/data/v4-human-quality.json. Exact prompt repetition is 5.838%, so no global repetition improvement is claimed.

Next: broader causal arcs and endings, global repetition and learned routines, presentation pacing/16×, contextual image coverage, 10,000 complete-life validation and actual mobile/browser QA. Human families/remote ecology and heritable genetics remain incomplete. Phase 3 foundations are implemented; full v4 remains open.
