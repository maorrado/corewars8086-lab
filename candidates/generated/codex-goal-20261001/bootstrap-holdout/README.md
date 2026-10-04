# Fresh bootstrap holdout

This predeclared holdout tests the exact `entry_lea` and `both` screen-selected binaries against exact frozen m049 and m050. Neither sources nor binaries are changed. Prior screen/confirmation outcomes are not pooled into this result.

One new crypto-salted shuffle of the verified 62-team senior-2025 pool gives 25 triples: every team appears once, 13 uniformly selected distinct teams appear a second time, and no triple contains duplicate teams. Two new crypto-generated seed strings run 50 battles per cohort: 2,500 per arm, 10,000 executions total. Every arm uses the same `COD_pair` label, roster, order, seeds, four Zombies and serial engine settings.

The four planned comparisons are each selected candidate against each reference. Each candidate must have a positive pooled mean, a strictly positive cohort-interval lower bound, and a positive mean in each of the two seeds against **both** controls. The gate uses a conservative two-sided 99% Student-t interval on 25 cohort means (average the two seed-block deltas within each cohort), df=24 and critical 2.79694. This is stricter than four-test Bonferroni 98.75% intervals. The interval is approximate: repeated teams and shared seed strings limit independence. Fifty-battle aggregates are not 50 individually observed points.

The generator draws no entropy during authoring, syntax checks, imports or `--preflight`. After review:

```powershell
node candidates/generated/codex-goal-20261001/bootstrap-holdout/generate.mjs --preflight
node candidates/generated/codex-goal-20261001/bootstrap-holdout/generate.mjs --freeze
node candidates/generated/codex-goal-20261001/bootstrap-holdout/analyze.mjs --check-inputs
```

`--freeze` refuses an existing `frozen/` directory, claims it before drawing entropy, then records its single panel salt and two seed draws. Overlap with known synthesis, realistic, LEA, bootstrap, camper, or already-frozen imp Java seed ranges stops the operation without automatic redraw. The imp manifest is checked dynamically; later studies must in turn exclude these holdout ranges. Failed/interrupted attempts remain visible and must not be silently replaced.

The four generated configs are `frozen/{entry_lea,both,m049,m050}.json`, with absolute Java, original-JAR, binary and field paths. Their normal output paths remain isolated under `frozen/official-results` and `frozen/official-runs`. Exact config, source/binary, original runner, accelerated adapter/wrapper/classes and engine hashes are recorded in `frozen/manifest.json`. New copies of all four pairs are retained under `frozen/build/`.

After review/freeze, prepare each arm into a new research-output directory using the reviewed accelerated adapter; no config edits are needed:

```powershell
node tools/engine-acceleration-20261001/runtime/research-batch.mjs prepare candidates/generated/codex-goal-20261001/bootstrap-holdout/frozen/entry_lea.json experiments/codex-goal-20261001/bootstrap-holdout/entry_lea --overlay tools/engine-acceleration-20261001/int87/classes --overlay tools/engine-acceleration-20261001/war/combined/classes
node tools/engine-acceleration-20261001/runtime/research-batch.mjs run experiments/codex-goal-20261001/bootstrap-holdout/entry_lea
```

Repeat for `both`, `m049` and `m050`. Preserve each complete arm; no partial-result selection or adaptive extension. The generator/analyzer never launches Java. The read-only analyzer requires all four explicitly supplied directories, in this order:

```powershell
node candidates/generated/codex-goal-20261001/bootstrap-holdout/analyze.mjs experiments/codex-goal-20261001/bootstrap-holdout/entry_lea experiments/codex-goal-20261001/bootstrap-holdout/both experiments/codex-goal-20261001/bootstrap-holdout/m049 experiments/codex-goal-20261001/bootstrap-holdout/m050
```

It reuses the frozen read-only `audit-derived.mjs` validation for all four arms, then checks this holdout's exact configs, runtime versions, current/archived input identities, completed counts, score conservation and paired metrics. Output identifies the accelerated result source explicitly. A pass supports this fixed senior-2025 protocol only: it is not evidence about unseen teams, a 2024 transfer pool, or universal superiority, and does not authorize a final replacement. Original-engine final confirmation remains required.
