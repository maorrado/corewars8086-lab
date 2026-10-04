# Day 2 leader search - confirmation protocol (preregistered before any candidate result was read)

Selection: 8 research agents screen candidates vs rev1 on field L (agent2/day2/leaders/L.json, salt agent2-day2-L).
The coordinator sends at most 3 candidates (best screen ALL with group 2025 >= -0.010) to ONE confirmation run.

Confirmation field C (salt agent2-day2-confirm-1, never used before; size-3 cohorts, 40 battles; zombies z2025 unless noted):
- 2025: field2025, 4 partitions (100 cohorts); strong: 2024final+counters+peers, 3 partitions (21); 2024live+counters, 1 partition (15)
- leader1: each leader (V6, V4, V6Guard, V6nohunt, zchain4, zchain3, zrl03, ah02) + 2 random 2025 teams, 6 cohorts each (48)
- leader2: 12 cohorts of 2 distinct random leaders + 1 random 2025 team; leader3: 6 cohorts of 3 distinct random leaders
- nozombie: field2025, 1 partition (25), no zombies
Arms: candidates, rev1, V6 (friend original), zchain4.
Primary (per candidate, vs rev1, cohort = unit, z = 2.5 Bonferroni-ish for up to 3 candidates):
pooled over ALL zombie cohorts (2025+strong+2024live+leader1+leader2+leader3).
Accept as new best only if: primary lower bound > 0, AND plain pooled (2025+strong+2024live) z=1.96 upper bound >= 0
(not significantly worse on the plain field), AND group 2025 z=1.96 upper bound >= 0, AND nozombie z=1.96 upper bound >= 0.
If several pass, the one with the highest primary mean. Otherwise rev1 stays. 40 sampled jobs re-run on the original engine.
