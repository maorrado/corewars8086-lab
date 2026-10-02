# Preregistered holdout 1 — zchain (written before any holdout run)

Date: 2026-10-03. Candidate frozen at commit c855c87.

## Arms (exact binaries)
| Arm | A | B |
|---|---|---|
| zchain (candidate) | agent2/build/cand/zchainA 251 B `94071cb2…e655` | agent2/build/cand/zchainB = b01d B 115 B `884b4d52…c7` |
| b01d (research reference) | agent2/build/ref/b01dA 192 B `77508022…315e` | agent2/build/ref/b01dB 115 B `884b4d52…c7` |
| m050 (final/ reference) | agent2/build/ref/ChimeraA 189 B `0268ce4f…bd44` | agent2/build/ref/ChimeraB 117 B `06b5a1ff…1782` |
| zrl03 (extra reference) | agent2/build/ref/zrl03A 195 B `605880ba…b051` | agent2/build/ref/zrl03B 122 B `011720f6…f334` |

All arms are staged under the same team name `CAND`; every arm faces identical
cohorts, seeds and zombies (paired design). Fresh salts `agent2-holdout1-*`
were never used before. Cohorts are fresh random partitions of each field into
three-opponent cohorts; each cohort has its own fresh seed; 40 battles per cohort.

## Fields
- H1 (primary): all 75 published 2025 online teams, 2025 live zombies, 8 partitions (200 cohorts, 8,000 battles/arm).
- H2: 42 cgx2024 live-stage teams + 3 counter codes (Good_Test V6 original, Claude fixed-toggle, Claude synthesis), 2025 zombies, 6 partitions (90 cohorts, 3,600 battles/arm).
- H3: strong/peer field: 12 cgx2024 final-2 teams + 3 counters + 4 peers (m050, b01d, e1p4, zrl03 as opponents), 2025 zombies, 8 partitions (56 cohorts, 2,240 battles/arm).
- H4: 2025 field with the cgx2024 final zombie pack (zom19*), 4 partitions (4,000 battles/arm).
- H5: 2025 field with no zombies, 4 partitions (4,000 battles/arm).
- H6: 42 cgx2023 phase-3 single-survivor teams, 2025 zombies, 4 partitions (56 cohorts, 2,240 battles/arm).

## Decision rule (fixed in advance)
zchain is a measured improvement over a reference if: H1 paired mean difference
> 0 with the 95% cohort-cluster t interval excluding 0; and in each of H2, H3, H6
the point estimate is >= -0.01 with no interval entirely below 0; and H4/H5 show
no interval entirely below 0 (expected ~tie: the chain only acts on zom20a).
Original-engine check: a random sample of H1 jobs is re-run with cold
`java -jar` on the deterministic JAR and must give byte-identical scores.csv.
