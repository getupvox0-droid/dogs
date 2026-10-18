# v4 Phase 5 — routine meanings, recognition and autonomous behavior

## Implemented scope

Added a shared authored taxonomy for 16 ordinary opportunities, 16 short threads and 7 canine interaction purposes. Meaning descriptors include functional cause, goal, conflict, relation role, routine stage and broad outcome types. Canonical action aliases group equivalent behavior IDs; actor IDs and wording are excluded from meaning type keys. This is an explicit partial ontology, not NLP similarity or proof that every legacy event has been semantically reviewed.

Opportunity, short-thread and composed-situation candidate selection now weighs recent meanings and action structures. Social purpose selection uses the same novelty factor. This is a soft priority policy, not a blanket ban: a valid sole candidate remains possible. Actual needs still prioritize food/water contexts. Critical health/family choices, lost-dog decisions and required long-story followups are outside this candidate filter.

A bounded routine-memory state distinguishes recognition from a fixed habit. Recognizing a basic skill can transfer to another room or caregiver; it does not transplant the old person's trust or force the same action. Strong action habits require repeated positive exposure in the same material context. New/changed contexts use current personality, motives and memories. High stress disables a fixed habit rather than erasing familiarity and asking the same question every time. New illness, lost state, newborn age or severe mobility limitation prevents this routine takeover.

Known ordinary opportunities now create actual autonomous actions, physiological/relationship effects and saved experiences without a result popup. Social routines use the actual local animal and update its reciprocal memory. An unknown dog's first encounter/purpose is retained; quiet contact with an already encountered dog can become routine. Food/territory/cautious contexts are not merged into a generic friendly greeting. Existing per-actor asked-purpose and prior opportunity exposure counts remain usable evidence of familiarity, without inventing past selected actions or contexts.

An animal must have an available local counterpart; an immediately seen animal is replaced with an available local animal when possible, or the meeting is deferred. Automatic records receive an “익숙한 행동” label in the existing timeline. Core birth, image, ending, search/filter, saving and progression modes are retained.

## Data and safeguards

`routineMemory` version 1 contains at most 128 actual context entries and 64 applied automatic event IDs. Each entry stores semantic key, context, last day, chosen action, exposure count and positive count. Old saves initialize an empty state prospectively and retain previous logs, RNG, asked-purpose markers and exposure counts. Automatic event IDs prevent applying a single event twice. Results are logged and remembered while the previous presentation state is preserved, including the absence of a presentation property.

New contextual ordinary choices check age, physical ability, environment and actual current actor before effects and during restoration. Stale choice rejection no longer first updates relationship contacts via initialization. Legacy context-free pending opportunities remain compatible rather than inventing their missing original context.

## Changed files

- dist/routine-taxonomy.js: shared authored meanings and normalization.
- dist/routine-memory.js: recognition, context-specific habit, weighted action, actual effects, idempotence and validation.
- dist/event-semantics.js: canonical actions, runtime routine descriptors, bounded recent action structures and candidate weights.
- dist/engine.js: lifecycle/migration/validation, pre-effect stale guards and player-action learning.
- dist/stories.js, dist/neighbors.js: meaningful first encounters, local availability and autonomous social behavior.
- dist/opportunities.js: candidate weighting, recognition, real automatic results and contextual eligibility.
- dist/threads.js, dist/situations.js: routine candidate priority; mandatory followups remain intact.
- dist/app.js: familiar-action timeline label.
- scripts/evaluate-semantics.mjs: fair before/after normalization and protected/routine repetition breakdown.
- tests/routine-diversity.test.mjs: 19 targeted tests.
- tests/situations.test.mjs: isolate the intended known situation rather than depending on an old random candidate index.

## Verification

Focused command: `node --test tests/routine-diversity.test.mjs tests/completion.test.mjs tests/world-profile.test.mjs tests/situations.test.mjs tests/social.test.mjs tests/causal-memory.test.mjs`: 71 passed. Checks cover semantic aliases, candidate priority without starvation, familiarity versus fixed habit, skill transfer, new counterparts, high stress, critical-choice exemption, real automatic effects and reciprocal memory, single application, unchanged RNG, stale opportunities, old saves and corruption.

Early 100-life samples found two regressions before final verification: overly broad context resets re-asked learned tasks after moves, and a high-stress block re-asked routine questions indefinitely. Recognition now transfers separately from exact action habits; current stress affects action selection. These revisions were checked before the final full run. A stale-choice test also found initialization changing contacts before rejection; validation now precedes that mutation.

Final frozen `npm test`: **195 passed, zero failed**, 136.56 seconds, including 1,000 complete lives and the existing 10,000 birth-condition sample. Those births are not 10,000 complete lifetimes. The final focused suite passed 71 tests before this run. Syntax checks and `git diff --check` passed. No production code changed during the verified full run.

The before/after evaluator uses the same 1,000 seeds and first/last/weighted deterministic policies. Both runs use the same routine-v1 authored normalization and canonical aliases. This detects more equivalent action structures than the older historical metric, so its structure ratios must not be compared directly to the previously published unnormalized values. Runtime explicit metadata coverage is measured separately from offline normalization.

| Metric | Previous engine | This engine |
|---|---:|---:|
| All questions | 91,595 | 89,274 |
| Ordinary questions (known routine ontology, including composed cases) | 37,561 | 35,041 |
| Ordinary exact repeat count / ratio | 1,865 / 4.965% | 1,835 / 5.237% |
| Ordinary meaning repetition within previous 5 ordinary questions / 180 days | 1.408% | 0.962% |
| Ordinary action-structure repetition in same window | 3.924% | 3.767% |
| Protected questions | 54,034 | 54,233 |
| Protected exact repeats | 3,358 | 3,438 |
| Medical questions / medical exact repeats | 5,761 / 2,920 | 5,800 / 2,960 |
| All exact prompt repetitions | 5.702% | 5.907% |
| All meaning-window repetitions | 1.867% | 1.829% |
| All action-structure window repetitions | 7.891% | 7.973% |
| Invalid composed / journey pending choices | 0 / 0 | 0 / 0 |

Ordinary questions fell by 2,520 (6.71%) and their absolute exact repeat count fell by 30, but their exact-repeat ratio rose because the denominator fell. Overall exact repetition and overall action-structure repetition also worsened slightly. This increment does **not** solve global repetition. Medical recurrence and required story retries are retained rather than suppressed for a better score.

The new shared path records 87,421 automatic outcome episodes in 1,000 lives; the baseline did not flag/record these ordinary automatic episodes, so its zero is not a count of absent autonomous actions. Runtime explicit routine metadata increased from 3,478 to 35,041 decisions; this is coverage of existing content, not newly authored scenes. Full raw reports, type counts, actor-tag counts and per-decision repetition counts are in dist/data/v4-routine-quality.json. Actor tags include corrected environmental actor IDs and fewer visible routine questions, so they are not evidence of more distinct living individuals.

Before/after evaluator times: 113.41s / 120.11s under concurrent work; not isolated benchmarks. Targeted eligibility tests passed, but a global biological error rate and unique meaningful-world rate remain unmeasured. Existing causal story and clinical tests pass; no browser/mobile play test was performed.

## Limits and remaining plan

Critical medical recurrence can legitimately repeat the same symptom/choice. Those questions are preserved and reported separately; they are not hidden just to improve a score. The routine ontology and soft priority do not guarantee globally unique lives or zero repeated purposes. Same wording can also occur after a real move or with another actual animal. Required long stories, acute disease episodes and family transitions retain their own existing conditions and repetition rules.

The new recognition/action split covers ordinary opportunities and dog interactions; composed situations retain their prior context-aware learning plus the shared novelty priority. It is not a universal autonomous decision engine. Broader legacy semantics, human/NPC family arcs, inherited predispositions and regional calibration remain open.

Next: pacing/16×, contextual image coverage, full 10,000-life evaluation and conditional 100,000-life evaluation. The 10,000 birth-condition sample is not 10,000 complete lives. Actual browser/mobile visual QA is unavailable in the managed runtime; static and automated checks do not establish visual usability.
