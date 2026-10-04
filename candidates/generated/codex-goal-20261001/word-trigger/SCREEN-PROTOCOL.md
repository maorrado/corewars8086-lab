# Word-trigger broad screen protocol

Four arms are fixed: exact m050, WordA + m050 B (`a_only`), m050 A + WordB (`b_only`), and WordA + WordB (`both`). The reviewed sources, assembled 189/117-byte candidates, exact 16-byte workers and private eight-word/seven-word recurrence counts are checked before any entropy draw. The original-engine recurrence evidence at `validation/result.json` is mandatory; absence, wrong hashes, failure status or any new failure aborts preflight.

The required evidence is pinned to SHA-256 `a5d5f58d03a23aae8a2fd9298c3f590b50917d0ea51243aa20cd686ac60a9aba`: 119 offsets, 357 paired A/B/captured paths, 349 healthy five-generation pairs, and three steady opcodes saved. Eight already-unhealthy baseline B paths are reproduced, **not fixed**; the gate requires zero new unhealthy paths. Fixture sources, compiled classes, exact original-JAR execution command and all evidence-file hashes are rechecked. This inert fixture is not a hostile-battle guarantee.

This screen uses **all 75 published 2025 teams**, not the senior-only pool: 62 senior and 13 youth teams, verified against `claude-synthesis-audit-20260930/fresh-m050.json` and its frozen manifest. A newly crypto-salted unbiased Fisher–Yates permutation is partitioned into 25 triples. Every published team appears exactly once; there are no repeated teams. All four arms use that same order, four Zombies, `COD_pair` label, one thread, `parallel=false`, no telemetry, and one new seed with 20 battles per cohort: 500 battles per arm, 2,000 total.

Randomness is drawn only by explicit `--freeze`, after complete input and recurrence preflight. The generator first exclusively claims the new `screen/` directory. It records one 32-byte shuffle salt and one 12-byte seed suffix. Java's 20-battle seed range must not overlap any range recorded by the latest frozen shift-quantizer screen, including bootstrap holdout, imp, camper, bootstrap, LEA and earlier synthesis ranges. Collisions and interrupted attempts remain visible; no automatic redraw or overwrite is allowed. No previous or current benchmark outcomes are read.

After reviewing this script and evidence:

```powershell
node candidates/generated/codex-goal-20261001/word-trigger/generate-screen.mjs --preflight
node candidates/generated/codex-goal-20261001/word-trigger/generate-screen.mjs --freeze
node candidates/generated/codex-goal-20261001/word-trigger/generate-screen.mjs --verify
```

The four configs are `screen/{m050,a_only,b_only,both}.json`. They retain absolute original-JAR paths for compatibility with the reviewed research adapter. Sources, assembly, recurrence evidence, controls, full roster, Zombies, config files, original runner and reviewed adapter/wrapper/overlay versions are hash-recorded. The new runtime outputs must be separate derived directories; frozen configs must not be edited.

Use the existing reviewed adapter with the frozen `int87/classes` and `war/combined/classes` overlays and no additional JVM options. For each complete candidate arm, the existing read-only `audit-derived.mjs pair <candidate-directory> <fresh-m050-directory>` supplies paired cohort metrics and provenance checks. Verify this screen's manifest and exact config hashes before interpreting those results. No partial-arm reading or adaptive extension is part of this protocol.

The only selection gate is a strictly positive mean of the 25 matched cohort deltas against this screen's fresh exact m050 arm. Report the descriptive two-sided 95% t interval (df=24, critical 2.0638985616280205), but do not use it as a significance gate. Selection across three candidates is exploratory, not proof. A selected candidate requires a **new matched holdout against both m049 and m050**. No pooling with old results, screen champion, final promotion or universal/unseen-opponent claim is justified.
