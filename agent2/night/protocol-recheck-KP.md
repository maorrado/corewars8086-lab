# Preregistered re-check of the KP family (written 2026-10-04 ~04:05 UTC, before any re-check run)

Reason: KP (wave 9) was the first candidate whose fresh-field pooled interval cleared 0
(+0.0211, z=2.5 [+0.0037,+0.0385]) but it missed the preregistered multi-copy gate by 0.003
(multi -0.0130 on only 8 cohorts). KPT (wave 10) gave +0.0228 [-0.0030,+0.0486].
A second chance raises the false-positive rate, so the rule is stricter than the per-wave rule.

Test: after the night workflow ends (queue idle), run ONE new confirm job per candidate with fresh salts
`agent2-night-confirm-recheck-KP-1` (KP: A = agent2/night/scratch/A031/K_A.asm build sha 6d5bbfa6, B = scratch/B094/KP_B.asm sha b275310b)
and `agent2-night-confirm-recheck-KPT-1` (KPT: A = scratch/B100/KPT_A.asm sha af3bf51a, B = KP_B), plus a dedicated
multi-copy threat job for each (copies 3, cohortsPerThreat 8, threats lead_V6, lead_V4, movsw_cgx123123).

Promotion of a candidate requires ALL of:
1. the new confirm passes the original per-wave rule (pooled z=2.5 lo > 0; threat, multi, nozombie diff >= -0.01 and hi > 0);
2. the pooled difference over BOTH fresh confirms (the earlier one and the re-check, cohorts pooled) has a z=2.5 lower bound > 0;
3. the dedicated multi-copy threat job is not worse than -0.01 vs base.
If both candidates pass, promote the one with the larger combined pooled difference. Otherwise report "not promoted".
