# Requested 2025-field joint runs — 2026-09-30

These runs are **not a replay of the historical 2025 final**. The repository contains 75 published online-stage survivor pairs and four online-stage Zombies, but not the final's new Zombies or its complete field. The local deterministic v6 runner was used as a field proxy. A battle admits four teams.

Both scenarios used one configured seed (`requested-2025-joint-20260930-v1`), 75 cohorts, and 50 battles per cohort (3,750 battles per scenario). The same 75 published teams occur in each scenario, but the opponent composition changes: the first scenario includes two published teams per battle, the second only one because Claude occupies the fourth slot. **Do not compare absolute scores across the two scenarios as a controlled treatment effect.**

| Scenario | m049 score/battle | m050 score/battle | Claude score/battle | m050 − m049 |
| --- | ---: | ---: | ---: | ---: |
| m049 + m050 + two 2025 teams | 0.424782 | 0.454351 | — | +0.029569 |
| m049 + m050 + Claude + one 2025 team | 0.268280 | 0.304578 | 0.266187 | +0.036298 |

Scores are team points divided by 3,750 battles. In the first scenario, m050 placed first or tied first on 50/75 cohort aggregates, m049 on 23/75. In the second, the counts were m050 43/75, m049 11/75, Claude 19/75. These are cohort rankings, **not** individual-battle win counts. The difference between m049 and Claude in the second scenario is small; this one suite does not establish which is generally stronger.

Verification: each result has 75 runs of 50 battles with exactly four teams, the same configured seed, and engine JAR SHA-256 `31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d`. The recorded input hashes match m049 (A `106765da…`, B `7ed87893…`), m050 (A `0268ce4f…`, B `06b5a1ff…`), and Claude's latest fixed-toggle variant (A `bea990bb…`, B `97610542…`). See `analyze-requested-2025-joint-20260930.mjs` for the full-hash checks and score calculation.

Reproduction inputs and results:

- `config-requested-2025-joint-m049-m050-20260930.json` → `experiments/requested-2025-field-20260930/joint-m049-m050.json`
- `config-final-2025-m049-m050-claude-together-once.json` → `experiments/m050-search/requested-final-2025-m049-m050-claude-together-once-20260930.json`

No candidate was promoted to `final/`; the historical final cannot be inferred from this proxy alone.

## Completed solo controls with the joint seed

The follow-up request was completed with separate m049 and m050 runs, each
25 cohorts × 50 battles = 1,250 battles. These use the same published opponent
triples, Zombies, configured seed, and four-thread runner settings. Config and
engine hashes, contender hashes, all recorded source hashes, and paired opponent
and Zombie hashes were checked by `analyze-requested-2025-solo-20260930.mjs`.

| Scenario | Battles | m049 points per 100 battles | m050 points per 100 battles | Claude points per 100 battles |
| --- | ---: | ---: | ---: | ---: |
| Each tested separately with three published teams | 1,250 per version | 65.4800 | 64.9200 | — |
| Both together with two published teams | 3,750 | 42.4782 | 45.4351 | — |
| Both plus Claude with one published team | 3,750 | 26.8280 | 30.4578 | 26.6187 |

The solo totals are 818.500010 points for m049 and 811.500006 for m050.
The m050-minus-m049 solo difference is −0.005600 points/battle (−0.855% relative),
with a descriptive 25-cohort t interval of [−0.026576, +0.015376]. This small
single-seed solo difference does not establish general superiority of m049.
m050 has the higher observed total in both joint scenarios. Cohort intervals
are approximate; repeated field members and a single configured seed limit
generalization.

These numbers are scoring rates, not win percentages or percentages of all
awarded points. The opponent composition changes between rows. Joint results
were already completed earlier on the same date and were re-audited; the solo
controls were completed for this follow-up. The four result files cover 10,000
battles in total.

Additional reproduction inputs:

- `generate-requested-2025-solo-20260930.mjs`
- `config-requested-2025-solo-m049-matched-20260930.json` → `experiments/requested-2025-field-20260930/solo-m049-matched.json`
- `config-requested-2025-solo-m050-matched-20260930.json` → `experiments/requested-2025-field-20260930/solo-m050-matched.json`
- `node analyze-requested-2025-solo-20260930.mjs`
- `node analyze-requested-2025-joint-20260930.mjs`
