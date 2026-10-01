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

## Next step when resuming
1. Correct the arena-100 REPORT.md and commit.
2. Using the faster benchmark infrastructure, keep searching for general improvements over m050,
   always with matched baselines and >=10 seeds for any claim:
   - confirm c090's edge with more seeds;
   - search more bootstrap timing micro-optimizations of the kind that consistently help
     (m050's dead `xor di,di` removal, c090's `lea` fusion) on top of c090;
   - re-screen other arena-100 near-misses (e.g. c093, c042, c052, c079) with matched baselines.
