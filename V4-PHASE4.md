# v4 Phase 4 — causal memory and long stories checkpoint

## Implemented

Reused the existing journey graph engine and added three history-triggered graphs (9 total graphs, 44 stages, 54 actions across the complete catalog):

- Friend history: requires at least two actual interactions and a matching actor-tagged encounter record. Later meetings can retain distance, reach shared rest, or end as brief encounters. Counterpart personality, stress and reciprocal memories affect uncertain outcomes. Same-area living actor checks run throughout; a dead or departed dog cannot return in a fabricated success scene.
- Guardian anchor: requires an actual adoption, guardian change or foster-start record in the current area. Encounters separated by weeks build either use of a quiet refuge or contact with that specific caregiver. Available human time, knowledge and actual prior experiences affect results. A replacement caregiver does not inherit the former person's experience.
- Mobility memory: requires an actual managed patella/joint/fracture episode and its exact clinical record, with sufficient current mobility. Activity and rest choices span months. Choice never cures the disease or overwrites clinical mobility. Renewed mobility limitation closes activity practice; active illness pauses it.

Every new graph stores an evidence record index/day, originating cause, actual actor and relevant source details. Pending choices and outcome memories retain source, actor, place, domain and future journey link. The timeline's existing story filter and relation panel reuse these IDs. The ending includes only actual completed graph text; it adds no hypothetical scenes.

Cross-actor transfer uses bounded, decaying domain memories for canine social experience and movement. Specific actor memories still apply independently. A single experience contributes a small weight adjustment, not a fixed response or a new immutable personality. Existing legacy episodes are retained without retroactive labels.

Existing short threads now capture their actual caregiver/sibling/environment actor and reject stale contextual choices before effects. Their followups close on a changed actor even when the area is unchanged. Life-ending closes waiting journeys/threads without adding success records or moving the death record from the final position. Old context-free pending short threads remain compatible; their missing historical actor is not invented.

## Files

- dist/causal-journey-content.js: three new causal graphs and trigger/response/effect rules.
- dist/journey-content.js and dist/journeys.js: reuse graph engine; evidence, context, closure reasons and life-end handling.
- dist/threads.js: actor-aware pending and followup guards.
- dist/engine.js: validation before effects, ordinary dog encounter context, death closure.
- dist/behavior.js, dist/neighbors.js: decaying domain transfer in action weights and social responses.
- dist/life-state.js: structured memory source/domain and future graph links; validation.
- dist/chronicle.js: actual completion text and closed-thread records in the ending.
- scripts/evaluate-semantics.mjs: graph/source/closure metrics and invalid pending-action checks.
- tests/causal-memory.test.mjs, tests/journeys.test.mjs: causal regressions and all graph/action validation.

## Validation

Focused command: `node --test tests/causal-memory.test.mjs tests/journeys.test.mjs tests/completion.test.mjs`: 36 passed. All 54 graph actions are exercised, including the new causal fixtures. New tests compare opposing memories with held physical conditions, cross-actor transfer and decay, exact medical source linkage, saved pending decisions, idempotence, delayed followups, actor departure/death, replacement caregivers, renewed mobility limits, ending facts and corrupted source/domain rejection.

A source-tagging issue in the test callback path was found and corrected: when a decision callback creates no log row, the engine no longer tags the preceding source clinical record as a new journey. Production decision logging is retained. Full frozen run and comparison results follow below.

Final frozen full `npm test`: **176 passed, zero failed**, 124.77 seconds, including 1,000 complete lives and the existing 10,000 birth-condition sample. The birth sample is not 10,000 full lifetimes. Post-fix roundtrip focus (`node --test tests/causal-memory.test.mjs tests/journeys.test.mjs tests/world-profile.test.mjs`): 34 passed. `node --check` for changed modules and `git diff --check`: passed.

A full regression found an undefined optional semantic property that disappeared in JSON, breaking raw save/resume equality. It now stores an explicit serializable semantic object or null, and the new tests compare raw episode objects after restoration. Narrative review also removed an invented prior parallel walk from a generic earlier encounter. The verified final full run started after both fixes, with no subsequent production changes.

Independent comparison (`node scripts/evaluate-semantics.mjs`), same 1,000 seeds and first/last/weighted deterministic action policies, against the previous source worktree:

| Metric | Before | After |
|---|---:|---:|
| Started graph types | 6 | 9 |
| Questions | 88,864 | 91,595 |
| Authored semantic types | 172 | 182 |
| Meaning-window repetition | 2.050% | 1.867% |
| Action-structure window repetition | 6.814% | 6.815% |
| Exact prompt repetition | 5.838% | 5.702% |
| Mean encountered actors / life | 7.346 | 7.417 |
| Immediate protagonist state-change ratio | 84.293% | 84.308% |
| Active journeys/threads left after death | 38 | 0 |
| Source-linked new graphs | 0 | 1,690 |
| Source-linked outcome memories | 0 | 2,889 |
| Domain-tagged episodes | 0 | 19,595 |
| Invalid pending journey actions | 0 | 0 |
| Invalid composed choices | 0 | 0 |

New graph starts/completions: friend history 823/650, guardian anchor 409/393, mobility memory 458/408. These are game-run counts, not real-world rates. Other endings are explicit closures, not forced successes. The 1,000-life sample has not automatically covered every death/departure reason; targeted tests cover those branches.

Exact repetition improved slightly, while action-structure repetition is essentially unchanged and still above earlier desired breadth. More questions change the denominator. The taxonomy is partial; global meaningful diversity is not proved. Global biological error rate, sibling reunion breadth and meaningful-world uniqueness remain unmeasured. Evaluator times were 106.88s before / 110.59s after with concurrent work, not isolated performance benchmarks.

## Limits and remaining work

These are three authored causal graphs, not a general unlimited story generator. Each graph is limited to once per life by the existing used-graph policy, so a second friend/guardian/clinical episode does not start another copy. Other existing medical, family, custody and journey systems continue independently. Cross-domain interpretation is intentionally limited; legacy memories are not semantically reclassified. Statistical and clinical probabilities remain game assumptions.

Sibling reunion, independent NPC family arcs, inherited predispositions, broader regional evidence and complete human family changes are not added in this increment. Global semantic repetition and learned routine coverage remain partial. Presentation pacing/16×, contextual image coverage, full 10,000-life validation and conditional 100,000-life validation remain open. No actual browser/mobile visual QA was available; automated engine/static checks do not verify touch layout.
