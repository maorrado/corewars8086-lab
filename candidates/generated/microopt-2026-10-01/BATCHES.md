# Batches run on 2026-10-01 (exact commands)

Configs are deterministic and not committed (the partition configs total ~9 MB). Regenerate
them with the commands below; each compacted result in `results/` records the `configSha256`
of the config it ran, and regenerated configs were checked to match it byte for byte.
Run from the lab root. `M=candidates/generated/microopt-2026-10-01`.

| batch | configs | runner |
|---|---|---|
| micro-oct1 (standard partition all-v1, 10 shared seeds) | `node $M/make-configs.mjs micro-oct1 1 10 m049 m050 c090 d1 d2 d3 d4 e1 e2` | Java 8 |
| micro-oct1 timing scan | `node $M/make-configs.mjs micro-oct1 1 10 mA mB pA1 pA2 pA3 pB1 pB2 pB3` | Java 25 |
| gen-oct1 (8 partitions, 2 shared seeds) | `node $M/make-partition-configs.mjs gen-oct1 all-v2,...,all-v9 1 2 m049 m050 c090 pA2 d3 e1` and `... e1p1 e1p2 e1p3 e1m e2 mA pA1 pA3 d4` | Java 25 |
| hold-oct1 (8 new partitions, 2 shared seeds; e1 pre-registered) | `node $M/make-partition-configs.mjs hold-oct1 all-v10,...,all-v17 1 2 m049 m050 c090 e1` | Java 25 |
| ind-oct1 (16 partitions, independent seeds) | `node $M/make-partition-configs.mjs ind-oct1 all-v18,...,all-v33 1 1 --seed-per-cohort m049 m050 c090 e1 e1m e1p1 e1p3 e1x z1 z2 z3` | Java 25 |
| conf-oct1 (16 new partitions, independent seeds; e1p3 pre-registered) | `node $M/make-partition-configs.mjs conf-oct1 all-v34,...,all-v49 1 1 --seed-per-cohort m049 m050 c090 e1p3 e1p2 e1p4 e1p5` | Java 25 |
| holdind-oct1 (v10-v17 again, independent seeds) | `node $M/make-partition-configs.mjs holdind-oct1 all-v10,...,all-v17 1 1 --seed-per-cohort c090 m050` | Java 25 |

(`all-v2,...,all-v9` = `$(seq -s, -f "all-v%g" 2 9)`.)

Runner: `node fast-benchmark.mjs --threads 8 --spot-check 3 [--java C:/Users/ronyr/.jdks/openjdk-25.0.1/bin/java.exe --jvm-opts "-XX:+UseParallelGC"] <configs...>`.
Every batch's spot checks were byte-identical to the original engine (--parallel=false).

Analysis: `node $M/compare.mjs --baseline m050 --baseline c090 [--by-partition | --partition-only] name=results/<file>.json ...`
(`--partition-only` uses the partition as the unit; with `--seed-per-cohort` batches the default
unit is the single independent run).

Candidates (all derived from c090 = m050 + `lea sp,[di+imm]` fusion; sources in `<name>/`):
d1-d4, e1, e2 (dead/fusible bootstrap instructions), mA/mB/pA*/pB* (A or B main loop -1..+3
rounds), e1m/e1p1-e1p5 (e1 + A main loop -1..+5 rounds), e1x (e1 + int 87h one more round
earlier), z1-z3 (captured-zombie path 1-3 rounds faster).
