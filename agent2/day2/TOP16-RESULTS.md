# Online-stage (early) versions of the 16 2025 finalists - results (protocol PROTOCOL-top16.md, commit 974690a)

NOT a replay of the 2025 final (online-stage binaries, online-stage Zombies zom20a-d; final binaries/Zombies unavailable).
Confirmation: all 560 opponent triples, fresh salt agent2-day2-top16-confirm-1, 20 battles each with Zombies (11,200 per arm),
10 each without Zombies. Same opponents and seeds for every arm. 32 sampled jobs byte-identical on the original cold JVM.

| arm | with Zombies | no Zombies |
|---|---|---|
| CC3 | 0.686 | 0.445 |
| DET2 | 0.662 | 0.417 |
| rev1 | 0.646 | 0.417 |
| zchain4 | 0.606 | 0.418 |
| V6 | 0.592 | 0.397 |
| V6nohunt | 0.591 | 0.395 |

Primary (z=2.5, Zombies): DET2 - V6nohunt +0.0708 [+0.0544,+0.0872] CONFIRMED; CC3 - DET2 +0.0236 [+0.0171,+0.0302] CONFIRMED.
Descriptive: CC3 - V6nohunt +0.094; DET2 - rev1 +0.016; CC3 - zchain4 +0.080. No Zombies (z=1.96): CC3 - DET2 +0.028,
DET2 - V6nohunt +0.022, DET2 - rev1 -0.0001 (same), CC3 - zchain4 +0.026.
Exploratory run (agent2/day2/fin16.json) agreed: CC3 - DET2 +0.022, DET2 - V6nohunt +0.060.

## Per field (all paired, fresh seeds; z=1.96 unless noted)
| field | best | CC3 - DET2 | DET2 - V6nohunt |
|---|---|---|---|
| early top-16 finalists (this file) | CC3 | +0.024 (z=2.5 confirmed) | +0.071 (z=2.5 confirmed) |
| broad 2025 online field (f2025-check, f2025-check2) | CC3 | +0.0044 [0.0009,0.0079] | +0.025 [0.010,0.039] |
| V6/modern leaders + plain (round-2 confirm, confirm-2) | CC3 | +0.0096 [0.0011,0.0181] (z=2.5) | n/a (rev1 arm: DET2 - rev1 large in leader cohorts) |
| strong (2024 final + counters + peers), confirm-2 | CC3 0.709 vs DET2 0.696 | +0.013 (n.s. alone) | - |
No field so far shows V6nohunt above DET2 or DET2 above CC3. No claim about the real 2025 final or the 2026 field.
