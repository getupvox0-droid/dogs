# v4 Phase 2 — situation foundation checkpoint

Implemented six causal situation models with 13 connected actions: sibling play boundaries, changed home routes, caregiver time shortage, crowded shelter rest, interrupted street water access, and wet sleeping places. They reuse actual local actors, capabilities, needs, weather and world changes. This is a bounded foundation, not an unlimited generator or 1,100 validated templates.

Choices store cause, actor, place, semantic action structure, outcome and followup. Outcomes update real state and memory. Prior human experiences influence later responses without fixing every outcome. Followups require the same area and actual actor; caregiver replacement closes stale followups. Duplicate choice application and invalid saved pending decisions are rejected. Existing save records are retained; missing new state initializes prospectively.

Known situations can become autonomous routines without another popup. Strong learned responses require repeated experience; a single experience permits motive-based autonomous behavior rather than forcing one answer. Material context changes invalidate familiarity. Semantic repetition uses authored cause/goal/conflict/role/action categories, excluding wording and actor IDs. Legacy classifications are partial and this guard does not suppress critical medical, family or journey events.

## Changed files

- dist/situations.js: six situations, eligibility, outcomes, followups, routine behavior.
- dist/event-semantics.js: authored signatures, bounded history, learned responses, validation and metrics.
- dist/engine.js: daily integration, save migration, pending choice validation and causal records.
- dist/life-state.js, dist/decisions.js: actual actor memory targets and timeline event categorization.
- scripts/evaluate-semantics.mjs, tests/situations.test.mjs: comparison and ten targeted regressions.
- dist/data/life-quality.json, dist/data/v4-situation-quality.json: measured results.

## Frozen validation

140 tests passed, zero failed (69.11 seconds), including 1,000 full lifetimes and the existing 10,000 birth-condition sample. Ten new targeted tests cover eligibility, actual effects, stale actors/areas, idempotence, followups, memory, routines and save corruption. The birth sample is not 10,000 full lifetimes.

Separate before/after comparisons use the same 1,000 seeds and first/last/weighted deterministic action policies. After: 89,101 choices, 3,464 explicit composed choices, 4,055 completed followups, 599 automatic routines, zero invalid composed choices. Mean actor count per life: 6.509 → 7.323. Authored semantic types: 164 → 170.

| Metric | Before | After |
|---|---:|---:|
| Authored meaning repetition within previous 5 questions / 180 days | 2.180% | 2.085% |
| Canonical action-structure repetition in same window | 7.154% | 6.843% |
| Exact prompt repetition within a life | 4.491% | 5.830% |

Exact prompt repetition worsened. The small taxonomy metric improvement is not proof that global repetition is solved; legacy ontology coverage and all engine repetition policies remain unfinished. More cases also change the denominator. Evaluation took 51.29s before and 55.41s after on this runtime; concurrent activity prevents treating this as an isolated benchmark.

## Remaining work

Broader Phase 2 composition, richer NPC/human autonomy, long causal arcs, global semantic repetition control, inherited predispositions, 16×/presentation pacing, contextual image coverage and 10,000 full-life evaluation remain open. Conditional 100,000-life evaluation has not run. No browser/mobile visual QA was possible with the available managed runtime. Existing birth/image/ending code is retained and covered by automated regressions; actual screen behavior remains unverified.
