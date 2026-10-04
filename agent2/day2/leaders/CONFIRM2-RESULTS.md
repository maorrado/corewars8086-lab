# Day 2 round 2 - confirmation results (protocol agent2/day2/PROTOCOL-round2.md, commit 2ad36ca)

Fresh field (salt agent2-day2-confirm-2): 202 zombie cohorts + 25 no-Zombie cohorts, 40 battles each (9,080 battles per arm).
Original cold-JVM re-run of 32 sampled jobs: 32/32 byte-identical. Full table: confirm2-analysis.txt.

Primary (candidate - DET2, all zombie cohorts, z=2.5):
- CF  +0.0052 [-0.0017,+0.0120] -> reject (2025 -0.0039 [-0.0062,-0.0016])
- CC2 +0.0088 [+0.0010,+0.0166] -> accept
- **CC3 +0.0096 [+0.0011,+0.0181] -> accept, highest primary mean = winner**
  plain (2025+strong+2024live) +0.0088 [+0.0002,+0.0175]; 2025 +0.0017 (n.s.); leaders +0.0112; nozombie +0.0022.
Extra fresh 2025-only check (salt agent2-day2-f2025-check-2, 250 cohorts x 40 battles): CC3 0.7575 vs DET2 0.7531,
paired +0.0044 [+0.0009,+0.0079] (z=1.96), W/L 51/37.
Where the gain comes from: zchain4 cohorts (+0.10: merged zchain streams running our worker die), 2024live (+0.05),
strong (+0.013). The screen value (+0.023) shrank to about +0.01 on the fresh field, as expected after selection.
CC3 = DET2 + E2 CF (cell 0300h, worker call far [00300h]) + E6 c18E (FF 18 anchors and E1 decoys) + E5 C1 (B write order).
