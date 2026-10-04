# Shorter-dwell exploratory screen protocol

Authoring complete, awaiting root review before freeze. No screen has been frozen or run by this authoring task.

## Fixed arms and inputs

Five arms are fixed: exact m050, `both-trail512`, `b-trail512`, `both-trail256`, and `b-trail256`. Only the DX immediate changes: A 3800h to 3A00h/3B00h and B 4000h to 4200h/4300h. BP, initial positions/gaps, copy counts, capture logic, 189/117-byte sizes, and the 17-byte private worker remain unchanged. Paired-A variants also affect the shared captured-zombie initializer. See `README.md` for the mechanics, reduced paint coverage tradeoff, and prior negative older-design screens.

Before any randomness, the generator verifies the reviewed source design manifest, exact m050 source and binary hashes, the four source/assembly mappings, actual binary equality to the predicted one-byte changes, and unchanged worker bytes. The new original-engine mechanical validation is mandatory; absence, wrong identities, failure, or new unhealthy recurrence paths must abort preflight. Passing this inert fixture is not a hostile-battle guarantee or evidence of better scores.

The required evidence is pinned to `validation/result.json` SHA-256 `22f8d7341e57c38ea1ba282506a806635ec531f804fa322ce7a0ac3f9cf8a04b`: 119 offsets, 714 paired paths, 698 healthy pairs, 16 baseline-unhealthy pairs, and zero new failures. This covers both margins across A, B, and direct captured-A entry for five generations. The first two anchor-event timings stay unchanged; subsequent cumulative instruction savings match `(eventIndex-1)*(1024-margin)/4`, using zero-based event indexing. All intended anchor coordinates are preserved. The unchanged baseline failures are not fixes. Every evidence input/source/class hash, all six binary identities, successful commands, exact original-only classpath, and observed completion summary are rechecked.

The pool is all 75 published 2025 online-stage teams: 62 senior and 13 youth teams, verified against the frozen synthesis-audit input manifest and full-pool m050 config. This is not a reconstruction of the historical final. A newly crypto-salted unbiased Fisher-Yates permutation is partitioned into 25 triples. Every team appears once; none is repeated or excluded based on prior outcomes.

All five arms use the same triple order, four frozen Zombies, exact `COD_pair` name, one thread, `parallel=false`, no telemetry, and one new seed with 20 battles per triple: 500 per arm and 2,500 total. Names, order, seeds, opponents, and other config fields match across arms except the candidate binaries and output/experiment paths.

## Freeze and provenance

Only explicit `--freeze` may draw entropy, after complete preflight. It first exclusively claims the new `screen/` directory, then records one 32-byte shuffle salt and one 12-byte engine-seed suffix. A SHA-256 counter stream with rejection sampling supplies unbiased Fisher-Yates indices; this is one permutation, with no outcome-dependent redraw.

The 20-battle Java seed range must not overlap the frozen word-trigger screen's range or any of its 26 transitive exclusions, including shift, bootstrap holdout, imp, camper, bootstrap, LEA, and earlier audit ranges. Collision attempts remain recorded and abort; an existing or interrupted `screen/` directory cannot be overwritten. The generator reads old input/seed manifests and new semantic evidence, not external or previous battle outcomes.

After root review:

```powershell
node candidates/generated/codex-goal-20261001/shorter-dwell/generate-screen.mjs --preflight
node candidates/generated/codex-goal-20261001/shorter-dwell/generate-screen.mjs --freeze
node candidates/generated/codex-goal-20261001/shorter-dwell/generate-screen.mjs --verify
```

The frozen configs are `screen/{m050,both-trail512,b-trail512,both-trail256,b-trail256}.json`. The manifest records source design, actual assembly, semantic evidence, controls, candidates, full roster, Zombies, configs, original engine/Java/runner, and the previously reviewed adapter/wrapper/overlay files. Later `--verify` rechecks provenance and reconstructs the shuffle, cohorts, arm mappings and exact configs without reading results. Derived runtime output directories must be new and separate; do not edit frozen configs.

Use the existing reviewed research adapter with the frozen `int87/classes` and `war/combined/classes` overlays and no additional JVM options. Its original-engine final-confirmation requirement remains in force. This authoring task launches no engine or adapter.

## Completion, analysis, and decision

Finish all five arms before interpreting comparative scores or selecting variants. Require all 25 expected seed/cohort blocks and all 500 battles per arm, correct name-to-binary mappings, config/runtime/input hash agreement, successful process completion, and complete score evidence. Missing or failed blocks are an execution problem, not permission for adaptive replacement, stopping, or extra sampling.

For each candidate, pair each of its 25 cohort scores with the exact m050 score for the same cohort/seed. The primary estimate is the equal-weight mean of the 25 candidate-minus-m050 deltas. All blocks have 20 battles, so this equals the pooled points-per-battle difference. Report team points per battle, not win percentages. Use the existing read-only `audit-derived.mjs pair <candidate-directory> <m050-directory>` and verify these new manifest/config identities before interpretation.

Advance a candidate only if its complete paired mean is strictly positive. This is a plain exploratory screen gate, not a significance test. Report a descriptive two-sided 95% t interval across the 25 cohort deltas (df=24, critical 2.0638985616280205); do not treat 500 battles as independent observations. A single common seed and fixed finite pool limit inference, and selection among four candidates is exploratory.

No adaptive stopping, partial-arm selection, outcome-driven schedule changes, old-result pooling, or external-result-driven extension is authorized. Every selected candidate requires a fresh matched holdout against BOTH exact m049 and m050, with its protocol fixed before drawing new randomness. No screen champion, automatic final-file promotion, broad/unseen-population superiority, same-coverage, or corruption-immunity claim follows from a positive screen.
