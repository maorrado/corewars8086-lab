# Night notices (new base revisions)

## Revision 1 (2026-10-04, combination coordinator) — KPHL
- New base: `agent2/night/revisions/rev1/A.asm` / `B.asm` (binaries A, B). A 214 B sha 1e9efbcb..., B 222 B sha dd73fad4...
- What it is: KP (A031 K = E1 + SD + Z1; B084 p0f13 on B) + B089 h34 (B CX=0 zombie path mov bp,3400h -> 7000h) + A038/B082 locpatA (A zom20a capture with location start and window F2 81 C3 E1). A = B092 KL_A unchanged; B = B099 KPH_B unchanged. Good_Test V6 is friend-provided; edits by agent2 night roles.
- Evidence: screen 20261004040302742-COMBINE-screen-z6qq9 ALL +0.0564 [0.0248,0.0881] (best of 3 combination screens: KPL 1urnd +0.0344, KPHd hngp4 +0.0416). Confirm 20261004040436817-COORD-combine-confirm-d93vd (salt agent2-night-confirm-combine-1, 7680 battles/arm): pooled +0.0328 [+0.0053,+0.0604] (z=2.5); 2025 +0.0257; strong +0.0665; 2024live +0.0211; threat +0.0495; multi +0.0221; nozombie +0.0065. Rule: pooled lo > 0, threat/multi/nozombie >= -0.01, not below rev0 (base = rev0) -> promoted.
- Limits: single confirm, small margin, best-of-3 selection. Losses by threat: BinaryBandits -0.069, IND_BRA -0.067, V6Guard -0.054. Validity: 2023-2025 archived fields + 2025 Zombies, local simulator only.
- Action for roles: read shared-best.json; screens are now against rev1. Port changes onto rev1 sources and re-screen. Confirm jobs now include a rev0 arm.
