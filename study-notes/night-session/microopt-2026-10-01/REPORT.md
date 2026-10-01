# Micro-optimization research, 2026-10-01: e1p3 beats m049 and m050 in general

Goal (user): a pair that is better than BOTH m049 and m050 *in general*, i.e. on average
against the whole 2025 field, not in one narrow test. `final/` untouched; no m051 promotion
here (left to the user).

All runs: `fast-benchmark.mjs` (byte-identical to the original engine, see
`../SPEEDUP-2026-10-01.md`), matched baselines on identical runs, 50 battles per run, every
batch spot-checked against the original engine. Sources, binaries, configs, compacted results
and scripts: `candidates/generated/microopt-2026-10-01/`.

## Result

**e1p3** (`candidates/generated/microopt-2026-10-01/e1p3/`, 187/115 bytes) is better than m050
and m049 on fresh, independent evaluations never used for selection:

| evaluation (all-2025 field, 400 independent runs = 20,000 battles each) | e1p3 vs m050 | e1p3 vs m049 | c090 vs m050 |
|---|---|---|---|
| ind-oct1: 16 fresh partitions (all-v18..v33), first test of e1p3 | **+0.73pp** (t=3.5; 14/16 partitions vs c090) | **+1.56pp** | -0.05pp |
| conf-oct1: 16 more fresh partitions (all-v34..v49), **pre-registered** | **+0.58pp** (13/16 partitions, t=3.7) | **+1.33pp** (16/16, t=7.7) | +0.04pp |

Screen scores in conf-oct1: e1p3 0.6784, c090 0.6730, m050 0.6726, m049 0.6650.

What e1p3 changes relative to m050 (only timing of the one-time bootstrap; the replication
loop `worker:` and every copy-count constant are byte-identical):

- A, start: `mov bx,ax / add bx,zombie_entry-start / mov [05D13h],bx` becomes
  `add ax,zombie_entry-start / mov [05D13h],ax`: A's `int 87h` fires one round earlier.
- A, end of `phoenix_init`: three `nop` (A's own main loop starts 1 round later than m050's,
  2 rounds later than c090's). The main-loop code (`phoenix_pointer_ready:` onward) sits at
  exactly c090's offsets with c090's bytes.
- A and B, `phoenix_pointer_ready`: c090's `lea sp,[di+imm]` instead of `mov sp,di / add sp,imm`
  (also used by captured zombies).

## How we got there (and three methodology lessons)

1. **Matched baselines** (lesson from the arena-100 correction): baselines on the same runs.
2. **One partition is not "general".** The standard screen splits the 75 teams into 25 fixed
   triples (salt `all-v1`). A one-round timing change can move a single triple by 5pp in either
   direction, so the result on one partition mostly reflects those 25 triples. Example: e1 was
   +0.03pp vs c090 on all-v1 but +0.51pp on 8 other partitions. `make-partition-configs.mjs`
   builds fresh partitions (each team exactly once per partition).
3. **Shared seed strings correlate runs.** Every run with the same seed string uses the same 50
   war seeds and group orders, so "2 seeds x 8 partitions" has only 2 independent seed bases.
   Diagnostic: c090 vs m050 on partitions v10-v17 was +0.86pp (15/16 units) with 2 shared
   seeds, but +0.24pp (t=1.5) on the same partitions with an independent seed per run.
   `--seed-per-cohort` gives every run its own seed; that is the design used for the result above.

Consequences for earlier claims: c090's edge over m050 (+0.25pp / +0.08pp on all-v1 with 10 seeds
each) did not generalize: about 0 on 32 fresh partitions with independent seeds (+0.24 on 8 more).
It was selected on all-v1 and is all-v1-specific. m050 > m049 does generalize (-0.76 to -0.84pp
for m049 in every design).

## Everything tried (vs c090 unless noted; negative results kept)

| batch | design | finding |
|---|---|---|
| micro-oct1 | all-v1, 10 seeds | d1 (dead `xor di,di` removed, A+B) -0.48pp 0/10; d2 -0.33; d3 +0.06; d4 -0.20; e1 +0.03; e2 (LES) +0.01 |
| micro-oct1 scan | all-v1, 10 seeds | A loop -1 (mA) -0.15; +1 (pA1) -0.46; +2 (pA2) +0.10; +3 (pA3) -0.10; B loop -1 (mB) -0.73; +1 -0.42; +2 -1.76; +3 -0.85 |
| gen-oct1 | 8 partitions x 2 shared seeds | e1 +0.51 (14/16), e1m +0.74, e1p1 +0.67, e1p2 +0.61, e1p3 +0.70, d3 +0.10, pA2 -0.04, e2 +0.11, pA1 -0.16, pA3 -0.18, mA -0.19, d4 -0.31 |
| hold-oct1 | 8 new partitions x 2 shared seeds, e1 pre-registered | **e1 did not replicate: -0.01** (c090 +0.86 vs m050: later shown to be a shared-seed artefact) |
| ind-oct1 | 16 partitions, independent seeds | e1p3 +0.79 (t=3.96); e1p1 +0.32; e1 +0.09; e1x +0.05; e1m -0.04; zombie-path speedups z1 -0.08, z2 -0.31, z3 -0.54 (monotonically harmful) |
| conf-oct1 | 16 new partitions, independent seeds, e1p3 pre-registered | **e1p3 confirmed: +0.53 vs c090, +0.58 vs m050, +1.33 vs m049**; e1p5 +0.42, e1p4 +0.36, e1p2 +0.17 |
| holdind-oct1 | v10-v17 with independent seeds | c090 vs m050 +0.24 (t=1.5), not +0.86 |

Removing a "dead" instruction is not automatically good: the bootstrap's exact timing against
the field matters in both directions, and B's timing is especially sensitive.

## Caveats

- The edge is moderate (+0.6pp of screen score vs m050). It is the average of large opposite
  effects on individual triples, so a specific final's lineup can still go either way.
- Evaluated against the 2025 field only (as the goal states), with comboSize 4 and 4 zombies.
- e1p3 was chosen from a family of variants on gen-oct1; the two later evaluations are fresh
  (ind-oct1 was its first independent test, conf-oct1 was pre-registered).

## Reproduce

```
P=candidates/generated/microopt-2026-10-01/make-partition-configs.mjs
node $P conf-oct1 $(seq -s, -f "all-v%g" 34 49) 1 1 --seed-per-cohort m049 m050 c090 e1p3
node fast-benchmark.mjs --threads 8 --spot-check 3 [--java .../openjdk-25.0.1/bin/java.exe --jvm-opts "-XX:+UseParallelGC"] config-part-conf-oct1-{m049,m050,c090,e1p3}.json
node candidates/generated/microopt-2026-10-01/compare.mjs --baseline m050 m049=experiments/part-conf-oct1-m049.json ...
```
