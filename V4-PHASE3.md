# v4 Phase 3 — persistent nearby animal behavior

## Implemented scope

Nearby animals now retain their own hunger, thirst, fatigue and stress scores, food/water access, territory, autonomous goal, activity and bounded history. Local actors update daily; distant actors update at seven-day cadence using their own resources, in at most 366-day chunks. Existing aging, recovery and death state remains authoritative. This is a summary game model, not a veterinary physiology model or a complete autonomous ecosystem.

Every social interaction now also updates the other animal's own relation to the protagonist: trust, caution, conflict, contact count and a bounded emotional memory. Those memories and present needs affect later purpose weights and response probability. Positive and negative histories are compared with the same physical state in targeted tests. Familiarity does not guarantee a positive outcome.

A dead or remote actor cannot resolve a pending encounter. Daily upkeep selects a living local replacement so future encounters do not remain blocked by a dead focused friend. New arrivals own separate trait and behavior objects; old memory is not copied. Young animals are excluded from adult territorial interactions. The relation panel shows each local animal's current goal and number of contact memories.

## Data and compatibility

`animal.autonomy` version 1 stores `lastDay`, `home`, `territory`, `access`, `needs`, `goal`, `activity`, `history` (12), `relations`, `memories` (20), and last actual intake. The existing animal ID, birth day, health, area and relationship remain in use. New state initializes at the current save day when absent; it does not invent historical meals, meetings or records. Corrupted need scores and behavior records are rejected.

## Changed files

- dist/neighbor-behavior.js: independent needs, motives, reciprocal memory, weights and validation.
- dist/neighbors.js: daily integration, connected encounter weights and reciprocal results, local focus repair.
- dist/social.js: current actor locality and survival guards.
- dist/app.js: goal and contact-memory summary in the existing relation panel.
- tests/neighbor-autonomy.test.mjs: twelve targeted regressions.
- tests/social.test.mjs: use a real relocation in the adoption fixture.
- dist/data/life-quality.json and dist/data/v4-neighbor-quality.json: measured reports.

## Test results

Commands: `node --test tests/neighbor-autonomy.test.mjs tests/v32.test.mjs tests/completion.test.mjs` (32 passed), `node --test tests/social.test.mjs tests/neighbor-autonomy.test.mjs` (18 passed), `npm test`, and `node scripts/evaluate-semantics.mjs` (1,000 full lifetimes). Module syntax checks and `git diff --check` pass.

An initial full suite found an old test fixture that moved only the friend's location while leaving the actual animal in another area. The fixture now calls the real `changeArea` operation; the production location guard is retained. The corrected adoption test still verifies both accepted/deferred human decisions and friend archival only on actual moves.

| Same 1,000 seeds / three action policies | Previous increment | This increment |
|---|---:|---:|
| Questions | 89,101 | 88,903 |
| Authored semantic types | 170 | 171 |
| Meaning window repetition | 2.085% | 2.051% |
| Action-structure window repetition | 6.843% | 6.816% |
| Exact prompt repetition | 5.830% | 5.829% |
| Mean encountered actors / life | 7.323 | 7.333 |
| Immediate protagonist state-change ratio | 84.433% | 84.292% |
| Invalid composed choices | 0 | 0 |

These small changes do not establish a meaningful global diversity improvement. In particular, exact repetition remains above the Phase 1 baseline of 4.491%. Immediate state-change counts omit the new reciprocal NPC memory effects and are not a measure of total causal impact. Other unmeasured comparisons (long story diversity, global biology error rate, unique meaningful worlds) remain unmeasured. The evaluation runtime was 104.78s with overlapping jobs; it is not an isolated benchmark.

Frozen corrected full suite: **152 passed, zero failed**, 106.80s, including 1,000 full lifetimes and the existing 10,000 birth-condition sample. The latter is not 10,000 complete lives. No production code changed during this final run.

## Remaining scope

Human age/schedule/stress/family changes and richer offscreen NPC ecology remain open. Distant actors use their retained resource snapshot; this increment does not reconstruct unobserved weather or simulate remote facility changes. NPC need deficits change behavior but do not add uncalibrated death hazards. Offscreen population movement, independent NPC families, clinical disease progression and multi-species ecosystems remain unimplemented.

Global semantic repetition is still partial. Time/UI/16×, broader causal stories, 10,000 full lifetimes and conditional 100,000 full lifetimes remain open. Existing birth, image, ending and storage paths are retained. Actual mobile/browser QA is unavailable in this managed runtime, so the relation-panel text change has syntax/static checks but no visual verification.
