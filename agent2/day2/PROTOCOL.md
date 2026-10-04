# Day 2 field check: rev1 vs KPH (rev1 without locpatA) - preregistered 2026-10-04

Goal: a pair with a higher plain-field score (no counter codes, no threat cohorts).
Hypothesis (from NIGHT_REPORT section 7, "new: 2024 live field"): rev1's 2024-live loss comes from locpatA in warrior A.
KPH = rev1 with A = B099 KP_A (K_A without locpatA, 196 B sha 6d5bbfa6...), B = rev1 B (222 B sha dd73fad4...).

Arms (same team name CAND, paired cohorts/seeds): KPH, rev1, rev0 (V6nohunt), V6 (friend original), zchain4.
Fields (salt agent2-day2-field-1, never used before; size-3 cohorts, 40 battles each):
- 2025: field2025, 10 partitions (250 cohorts), zombies z2025
- strong: field2024final+counters+peers, 6 partitions (42 cohorts), z2025
- 2024live: field2024live+counters, 4 partitions (60 cohorts), z2025
- nozombie: field2025, 3 partitions (75 cohorts), no zombies
Primary: KPH - rev1, pooled over 2025+strong+2024live cohorts (cohort = unit), z=2.5 interval.
Decision rule: KPH replaces rev1 as best pair only if the primary lower bound > 0 and no group (2025, strong,
2024live, nozombie) has a z=1.96 interval entirely below 0. Otherwise rev1 stays. Same rule reported for rev1 - rev0.
Engine: persistent A2Batch over the unmodified deterministic JAR; a sample is re-run on the original engine.
