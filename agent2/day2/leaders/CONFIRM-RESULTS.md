# Day 2 leader search - confirmation results (protocol PROTOCOL-leaders.md, commit 3ea2be9)

Fresh field C (salt agent2-day2-confirm-1): 202 zombie cohorts + 25 no-Zombie cohorts, 40 battles each (9,080 battles per arm).
Original cold-JVM re-run of 40 sampled jobs: 40/40 byte-identical. Full table: confirm-analysis.txt.

| arm | 2025 | strong | 2024live | leader1 | leader2 | leader3 | nozombie |
|---|---|---|---|---|---|---|---|
| DET2 | 0.761 | 0.702 | 0.726 | 0.769 | 0.762 | 0.825 | 0.545 |
| MC2 | 0.756 | 0.722 | 0.727 | 0.770 | 0.705 | 0.647 | 0.535 |
| DETMC | 0.760 | 0.688 | 0.716 | 0.765 | 0.708 | 0.744 | 0.536 |
| rev1 | 0.756 | 0.683 | 0.706 | 0.609 | 0.456 | 0.389 | 0.545 |
| V6 | 0.734 | 0.667 | 0.708 | 0.517 | 0.359 | 0.305 | 0.539 |
| zchain4 | 0.756 | 0.579 | 0.713 | 0.380 | 0.191 | 0.160 | 0.578 |

Primary (candidate - rev1, all zombie cohorts, z=2.5): DET2 +0.0750 [0.0464,0.1037]; MC2 +0.0658 [0.0426,0.0889];
DETMC +0.0659 [0.0404,0.0915]. All three meet the rule (plain, 2025 and no-Zombie not significantly worse).
Winner by the preregistered tie-break (highest primary mean): **DET2** (agent D4). Files: agent2/day2/best/A.asm, B.asm
(A 214 B sha 2153532d..., B 233 B sha 15f5c4da...).
Plain field only (2025+strong+2024live): DET2 +0.0088 [-0.0021,+0.0198] at z=1.96: not a confirmed plain-field gain;
the gain is in fields with leaders (+0.21 per battle). Known risk (D4): a team that writes [4A17h] before our B's
check moves us to the 42h lattice, where 32h teams (zrl03 lineage) undercut us; not seen as a loss in this field.
final/ is unchanged (by request; the user decides).
