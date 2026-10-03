# Preregistered holdout 5 — V6nohunt vs frontier leaders (written before any holdout-5 run)

Date: 2026-10-03. Selection evidence: screen 5 (`agent2/results/s5-*.json`) and
holdout 4. Candidate selected from the screen: **V6nohunt** (Good_Test V6 with
A's `[7A00h]` redirect patch removed; A 194 B `6861894f…`, B = original V6 B
`8579e2c2…`). Leaders use the frozen copies in `agent2/frontier-20261003/arms/`
(verified by `verify-frontier.mjs`). The package's own plans are NOT run here.

## Arms (team `CAND`, identical cohorts/seeds/Zombies)
V6nohunt, Good_Test_V6, Good_Test_V4, zchain4, zchain3, combo_zrl03,
combo_ah02, b01d, m050.

## Fields (fresh salts `agent2-holdout5-*`, 40 battles per cohort)
- F1: 2025 online field, 2025 Zombies, 8 partitions (200 cohorts).
- F2: 2024 final + counters + peers, 2025 Zombies, 8 partitions (56 cohorts).
- F3: 2024 live + counters, 2025 Zombies, 6 partitions (90 cohorts).
- F4: 2025 field, no Zombies, 4 partitions (100 cohorts).
- D-V4, D-V6, D-zchain4, D-zrl03: 20 cohorts each = that leader + two random
  2025 teams, 2025 Zombies (leader-present stress).

## Primary comparisons (4, Bonferroni: 98.75% two-sided intervals)
V6nohunt minus each of Good_Test_V6, Good_Test_V4, zchain4, combo_zrl03 on the
pooled cohort units of F1+F2+F3 (equal weight per cohort).

## Decision rule
V6nohunt "beats leader X in the opponent field" if the pooled F1+F2+F3 98.75%
interval excludes 0 in its favour, and no single field F1–F4 or leader-present
group has a 95% interval entirely below 0 for that comparison. Otherwise the
comparison is reported as inconclusive (or as a loss if the interval is
entirely below 0). Leader-present groups are reported separately from the
opponent field. All other pairwise numbers are descriptive only. Any decisive
result is checked with a sampled `--engine original` re-run. `final/` is not
changed on the basis of this test alone.
