# v4 Phase 3 — human life and care availability foundation

## Implemented

People keep a persistent initial adult age, elapsed age, weekly work/rest schedule, stress, current activity and a bounded monthly history. Daily updates are guarded by `lastDay`. Retained former caregivers and applicants continue aging without meetings. New state is initialized prospectively for old saves, preserving existing identity, role, money, time, care, knowledge and decision records.

Available care time is computed from the person's existing time capacity, weekly schedule and stress. Existing care/access calculations now use this effective availability, so schedule changes affect attention, food/water access and medical reach without rewriting base capacity every day. Existing work/economy world changes still modify their original source values. Financial/time pressure and actual local medical care load affect stress. Remote former caregivers do not take on the current household's medical care load.

Staff rest days retain an explicit other-shift coverage factor; a shelter employee taking time off does not erase all care. A lost street dog no longer receives a remote guardian's feeding/attention through a stale caregiver ID. Current caregiver relations require the actual caregiver ID, preserving former caregivers as inactive memories. The existing relation card now shows the person's age, work/rest day, effective time and stress.

## Changed files

- dist/human-behavior.js: persistent human age, schedule, stress, availability and validation.
- dist/people-world.js: initialize/update identities and connect effective care; block remote guardian care.
- dist/life-state.js: current caregiver identity guard.
- dist/app.js: human state in existing relation cards.
- tests/human-autonomy.test.mjs: ten targeted tests.
- dist/data/v4-human-quality.json and dist/data/life-quality.json: measured reports.

## Model limits

These are authored game scores and weekly patterns, not demographic facts or real employment/medical statistics. Ages are initialized as adult game characters; historical birth dates are not inferred. No human death, illness, family member generation, relationship breakups, changing shifts or full economic simulation is added here. Staff coverage is a bounded approximation, not a roster of individually simulated replacement staff.

Remote people retain their own financial/time scores; unobserved remote world changes are not reconstructed. Distant catchup is capped at 366 days per call; ordinary daily and batched engine progression calls this every day. NPC need/goal scores remain summary simulation. The broader human family model and independent NPC reproduction/medical ecology remain open.

## Validation

Targeted tests compare work/rest care, pressure/stress, remote/local medical load, daily/chunk equality, duplicate update protection, identity persistence, old-save migration, corruption rejection, caregiver replacement and lost-dog care.

Final frozen `npm test`: **162 passed, zero failed**, 119.03s. Includes 1,000 full lifetimes and 10,000 birth-condition samples (not 10,000 full lifetimes). Corrected targeted command: `node --test tests/human-autonomy.test.mjs tests/health.test.mjs tests/world-profile.test.mjs`: 26 passed. `node --check` on changed modules and `git diff --check`: passed.

Independent semantic comparison: same 1,000 seeds and first/last/weighted deterministic actions. No invalid composed choices. Questions 88,903 → 88,864; authored semantic types 171 → 172; mean encountered actors/life 7.333 → 7.346; meaning-window repetition 2.051% → 2.050%; action-structure repetition 6.816% → 6.814%; exact prompt repetition **5.829% → 5.838%**. Immediate protagonist state-change ratio 84.292% → 84.293%. Changes are small, and exact repetition worsened slightly. Global diversity is not solved. Longer-story diversity, global biological error rate and meaningful world uniqueness remain unmeasured. Semantic evaluator took 106.37s with overlapping work, not an isolated benchmark.

No production changes occurred during the final full test run. Earlier superseded runs were cancelled before the final verification after the lost-dog care guard was added. Actual browser/mobile visual verification was not performed.

## Remaining plan

Phase 3 now has persistent dog and human state foundations. This does not complete all requested human/family or offscreen-world breadth. Next: broaden causal stories and their closures, global repetition/learning, presentation pacing and 16×, contextual image coverage, 10,000 complete lifetimes and conditional 100,000 complete lifetimes. Actual browser/mobile QA remains unavailable; module syntax, static dashboard and automated engine regressions do not prove visual layout quality.
