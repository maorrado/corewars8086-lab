# Checkpoint: original research task (saved before the benchmark-speedup detour)

Saved 2026-10-01 so the original task can be resumed exactly after the speedup work.

## Exact goal
Find warrior code (A+B pair) that is better than BOTH m049 (`final/ChimeraA/B`) and m050
(`candidates/generated/chimera-m050/`) **in general** -- on average across the full real 2025
field (the all-2025 "screen": 25 cohorts x N seeds x 50 battles), not in one narrow test.
Constraints: never modify `final/`; commit/push only to `claude/scout-executor-research-2026-09-29`;
no m051 promotion without reproducible, matched-baseline, multi-seed evidence.

## Methodology rule learned (the hard way)
Every comparison must run the baselines (m049, m050) ON THE SAME SEEDS in the same batch.
Comparing a candidate on new seeds against baseline numbers from a different seed set is invalid --
this produced false "wins" for the synthesis (seed2/holdout rows in arena-100 REPORT.md).

## Current matched results (10 fresh seeds `bigcheck-oct1-001..010`, 12,500 battles each)
| warrior | screen | vs m050 mean | seeds won | t |
|---|---|---|---|---|
| c090 alone (m050 + `lea sp,[di+imm]` fusion) | 0.67980 | +0.25pp | 9/10 | 2.28 |
| m050 | 0.67729 | -- | -- | -- |
| synthesis (c090 + c041 INT86h detour) | 0.67584 | -0.15pp | 3/10 | -0.62 |
| m049 | 0.66961 | -0.77pp | 2/10 | -4.46 |
Also 4 fresh seeds `audit-fresh-301..304` (5,000 each): m049 .6684, m050 .6759, c090 .6762, synth .6768.
Codex's independent 4-seed audit agrees: c090 67.90 > m050 67.60 > m049 67.18 > synth 67.15.

Conclusion so far: **c090 alone is the only candidate with a consistent matched edge over m050**
(small: +0.25pp). The INT86h detour (c041/c036/synthesis) is NOT a verified improvement.
Configs: `config-bigcheck-*.json`, `config-audit-screen-*.json`; results: `experiments/bigcheck-*.json`,
`experiments/audit-screen-*.json`.

## Known false claim to correct
`study-notes/night-session/arena-100-2026-09-30/REPORT.md` (pushed in bba07e4) says the synthesis
beats both on two seed pairs. Its seed2/holdout comparisons used stale baselines. Must add a
correction section in the next commit.

## Active processes at checkpoint time
None (the 10-seed bigcheck finished; nothing else running).

## Progress after resuming (2026-10-01, after the speedup; commit 4356415)

- Speedup done: `fast-benchmark.mjs` (+ `--java C:/Users/ronyr/.jdks/openjdk-25.0.1/bin/java.exe
  --jvm-opts "-XX:+UseParallelGC"`): one 10-seed screen config 852 s -> ~67 s, byte-identical.
- REPORT.md corrected and pushed.
- micro-oct1 (10 fresh seeds, standard partition all-v1): no bootstrap tweak beats c090; removing
  the "dead" xor di,di (d1) is consistently harmful (-0.48pp, 0/10). Timing scan (A/B main loop
  -1..+3 rounds): c090 sits at a sharp local optimum on all-v1 (B shifts up to -1.76pp).
- KEY METHOD FINDING: the standard screen uses ONE partition of the 75 teams into 25 triples
  (salt all-v1). Timing effects are triple-specific, so one partition is a large noise source
  that more seeds do not remove. `make-partition-configs.mjs` builds fresh partitions (salts
  all-v2...). On 8 fresh partitions x 2 seeds (gen-oct1, 20,000 battles each):
  e1 (c090 + A start fusion) +0.78pp vs m050 (14/16, t=3.81), +0.51pp vs c090 (14/16, t=3.99);
  c090 +0.27pp vs m050 (12/16); m049 -0.84pp vs m050 (0/16). (On all-v1, e1 was only +0.03 vs c090.)
- RUNNING at this point: pre-registered holdout for e1 (partitions all-v10..v17, seeds
  hold-oct1-001/002, with m049/m050/c090) + exploration around e1 on the gen-oct1 partitions
  (e1p1-3, e1m, e2, mA, pA1, pA3, d4). Log: build/fast-runs/hold-oct1.log.
  Compare: `node candidates/generated/microopt-2026-10-01/compare.mjs --by-partition --baseline m050 --baseline c090 name=experiments/part-hold-oct1-<name>.json ...`

### Update ~05:00
- Holdout (v10-v17, 2 shared seeds): e1 did NOT replicate (-0.01 vs c090); c090 +0.86 vs m050 (15/16).
- SECOND METHOD FINDING: all runs with the same seed string share the same 50 war seeds and group
  permutations, so "2 seeds x 8 partitions" has only 2 independent seed bases. Fixed with
  `--seed-per-cohort` (make-partition-configs.mjs; fast-benchmark supports cohort.seeds): every
  run gets its own seed. ind-oct1 (v18-v33, 400 independent runs per warrior):
  c090 vs m050 -0.05pp (t=-0.5) -- c090's edge does NOT generalize; e1p3 +0.79 vs c090 (t=3.96,
  14/16 partitions); zombie-path speedups z1-z3 monotonically harmful; m049 -0.83 vs m050.
- RUNNING: conf-oct1 (v34-v49, independent seeds; PRE-REGISTERED primary: e1p3 vs m049/m050/c090;
  exploration e1p2/e1p4/e1p5) + holdind-oct1 (v10-v17 with independent seeds: does c090's +0.86
  there survive? diagnostic for the shared-seed artefact). Log build/fast-runs/conf-oct1.log.

### Update ~05:45 -- RESULT
- conf-oct1 (pre-registered): e1p3 +0.58 vs m050, +1.33 vs m049 (16/16 partitions). CONFIRMED.
- expl-oct1: e1p3 +0.56 vs m050 (3rd replication); neighbourhood f1-f7: nothing significantly
  better (f6 +0.11 n.s.); B loop +1 costs ~1pp.
- Pooled e1p3 - m050 over 1,200 independent runs (48 fresh partitions): +0.62pp, t=5.35.
- Report: study-notes/night-session/microopt-2026-10-01/REPORT.md. Commits 4356415, 6dbbfc8 (+ this one).
- Note: Codex is running its own check in C:\Maor\CodeGuru\corewars8086-lab (experiments/
  claude-e1-confirmation-20261001); be considerate with threads while it runs.

## Next step when resuming
1. Correct the arena-100 REPORT.md and commit.
2. Using the faster benchmark infrastructure, keep searching for general improvements over m050,
   always with matched baselines and >=10 seeds for any claim:
   - confirm c090's edge with more seeds;
   - search more bootstrap timing micro-optimizations of the kind that consistently help
     (m050's dead `xor di,di` removal, c090's `lea` fusion) on top of c090;
   - re-screen other arena-100 near-misses (e.g. c093, c042, c052, c079) with matched baselines.
