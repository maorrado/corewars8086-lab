# Day 2 round 2 - confirmation protocol (preregistered before any round-2 candidate result was read)

Selection: 8 agents screen candidates vs DET2 on field L2 (agent2/day2/leaders/L2.json). The coordinator may build
combinations of screened candidates and screen them too. At most 3 candidates go to ONE confirmation run.
Confirmation field (salt agent2-day2-confirm-2, never used before; size-3 cohorts, 40 battles, built by
agent2/day2/leaders/build-confirm.mjs with the salt changed): 2025 x4 (100), strong x3 (21), 2024live x1 (15),
leader1 48, leader2 12, leader3 6; nozombie 25. Arms: candidates, DET2, rev1, V6.
Primary: candidate - DET2 pooled over ALL zombie cohorts, z=2.5. Accept only if primary lower bound > 0, AND group 2025
z=1.96 upper bound >= 0, AND plain (2025+strong+2024live) z=1.96 upper bound >= 0, AND nozombie z=1.96 upper bound >= 0.
Also reported (not part of the rule): candidate - DET2 on group 2025 alone. If several pass, highest primary mean wins.
