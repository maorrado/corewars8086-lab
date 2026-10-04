# Coverage-dwell exploratory screen

Authoring only until root reviews the source and original-engine long-orbit validation. This stage has exactly three arms: exact m050, the `lower-strides` pair, and the `upper-strides` pair. No B-only arms, adaptive extension, or extra sweep is included.

## Inputs and mechanical gate

The candidate pairs come from the reviewed coverage-dwell design: A/B BP=3B00h/4300h with DX=3A00h/4200h, or BP=3D00h/4500h with DX=3C00h/4400h. Only the BP/DX immediate bytes change from exact m050. The generator checks the pinned source-design manifest, source and assembly identities, predicted two-byte binary differences, unchanged 189/117-byte lengths, and exact 17-byte worker. This retains full ideal stack-trail support with shorter dwell; it does not retain coverage speed, anchor order, or partner interactions. See `README.md` for the cost and historical negative evidence.

Freezing requires `validation/result.json` to match a **root-reviewed expected SHA-256 supplied explicitly on the command line**. Do not derive the expected value from an unreviewed current file merely to satisfy the check. The hash is stored as `validation.expectedSha256` alongside the file record and evidence in the frozen manifest. Missing, changed, or failing evidence aborts before writing or drawing entropy.

Required evidence fields are `status=PASS`, 119 offsets, 714 paired paths, 698 healthy pairs, 16 baseline-unhealthy pairs, 258 generations, and zero new failures. The gate verifies all six exact binary records, every listed input/source/class hash, the new fixture authoring/class files, successful commands, the original-only Java classpath, and the observed completion summary. The long fixture covers A, B, and direct captured-A paths, crossing a complete 256-anchor cycle. Existing baseline failures are reproduced, not repaired. It remains isolated mechanical evidence, not a competitive-score or hostile-memory guarantee.

## Fresh full-pool schedule

Use all 75 published 2025 online-stage teams: 62 senior and 13 youth, with exact binaries and four Zombies from the pinned original audit roster. These are the public field artifacts, not a claimed reconstruction of the historical final. A new crypto-salted unbiased Fisher-Yates permutation is divided into 25 triples; every team appears once and no team is repeated.

All three arms share that triple order, four Zombies, the exact name `COD_pair`, one new seed, 20 battles per triple, one thread, `parallel=false`, and no telemetry. This is 500 battles per arm and 1,500 total. Only candidate binaries and arm-specific experiment/output paths differ. Execute serially with the already-reviewed persistent research adapter, `int87/classes` and `war/combined/classes` overlays, and no extra JVM options. Its eventual original-engine confirmation requirement is unchanged.

The generator reads prior input/seed manifests, never prior or partial battle results. Exclude the latest shorter-dwell seed range `-1205286788..-1205286769` and all 27 transitive prior exclusions, including word-trigger and earlier screens/holdouts: 28 excluded ranges total. This design is fixed before this screen's results exist.

Only explicit `--freeze` draws entropy, after complete preflight. It exclusively claims a new `screen/` directory, draws one 32-byte shuffle salt and one 12-byte seed suffix, records them, and rejects any overlapping 20-war Java seed range. The shuffle uses a SHA-256 counter stream with rejection-sampled uint32 indices. Existing directories, interrupted attempts, and collisions remain visible; no overwrite or automatic redraw is allowed.

## Review, freeze and analysis commands

The following placeholders are deliberate; root supplies the reviewed evidence hash and later the frozen manifest hash. This authoring task does not invoke these commands or launch a JVM.

```powershell
node candidates/generated/codex-goal-20261001/coverage-dwell/generate-screen.mjs --preflight --validation-sha256 <REVIEWED_VALIDATION_SHA256>
node candidates/generated/codex-goal-20261001/coverage-dwell/generate-screen.mjs --freeze --validation-sha256 <REVIEWED_VALIDATION_SHA256>
node candidates/generated/codex-goal-20261001/coverage-dwell/generate-screen.mjs --verify --validation-sha256 <REVIEWED_VALIDATION_SHA256>
# Only after all three arm jobs complete:
node candidates/generated/codex-goal-20261001/coverage-dwell/analyze-screen.mjs --manifest-sha256 <FROZEN_MANIFEST_SHA256>
```

The frozen configs are `screen/{m050,lower-strides,upper-strides}.json`. Candidate copies, configs, source design, actual assembly, long-orbit evidence, full roster, Zombies, original engine/Java/runner, reviewed runtime sources/classes, and both authoring scripts are hash-recorded. `--verify` rechecks those files and reconstructs the shuffle, cohorts, arm mapping, and exact configs. Do not edit frozen configs or scripts after freeze.

Default derived result directories are `experiments/codex-goal-20261001/accelerated-coverage-dwell/{m050,lower-strides,upper-strides}`; these must be fresh runtime outputs, not reused runs. If root chooses another common output root before execution, pass it with analyzer `--results-dir <PATH>`. The analyzer writes only a new `coverage-dwell/screen/analysis.json`, refusing an existing analysis. It invokes Node integrity readers, never Java or the battle launcher.

The analyzer requires all three completion artifacts before comparisons, then checks 25 blocks and 500 battles per arm, successful process exit, the frozen config identities, exact runtime/classes/overlays without extra JVM flags, seed/cohort schedules, and the existing raw-score integrity/pairing audit. The latter checks staged inputs, Zombies, starts/ends, retained CSVs, per-run records, parsed scores, normalization and matching. The analyzer also independently checks the paired mean and descriptive interval. No selection is emitted if any audit fails.

## Fixed exploratory gate

For each candidate, calculate the equal-weight mean of the 25 paired cohort deltas against this screen's fresh exact m050 arm. Each cohort has 20 battles, so this equals the pooled team-points-per-battle difference. Report points per battle, not win percentages. The descriptive two-sided 95% t interval uses the 25 cohort deltas, df=24 and critical 2.0638985616280205; do not treat 500 battles as independent observations. A single common seed and fixed finite pool limit inference.

Only a strictly positive complete paired mean advances an arm. The interval is descriptive, not a significance gate; selection among two candidates is exploratory. Finish all three arms before interpreting scores. No partial-arm selection, adaptive stopping, outcome-driven schedule changes, extension, or pooling with old results is authorized. Every selected arm requires a newly frozen fresh matched holdout against BOTH exact m049 and m050. No automatic final-file replacement, screen champion, equal coverage-rate, immunity, unseen-population, or universal-superiority claim follows from a positive screen.
