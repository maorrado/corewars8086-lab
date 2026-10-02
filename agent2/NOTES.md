# agent2 research notes (2026-10-03)

Working log for the second-agent study. Results that matter for a decision are
in `agent2/results/*.json` (raw per-cohort scores, all input hashes) and the
analyses quoted here can be regenerated with `agent2/tools/compare.mjs`.

## Tooling (all observer-only, unmodified v6 engine)

- `tools/nasm-node.cjs`: runs the simulator's own Emscripten NASM build in Node
  (no shared 127.0.0.1:8123 server, no Playwright). Rebuilt m050, b01d, e1p4,
  combo_zrl03 and Good_Test V6 byte-identically to their documented hashes.
- `tools/java/A2Batch.java`: persistent JVM, independent jobs in parallel, each
  job one serial `Competition` exactly as `HeadlessCompetitionRunner`
  (adapted from the other agent's `SerialBatchMain`). Verified byte-identical
  `scores.csv` against cold `java -jar` runs (8/8) and against archived b01d/e1p4
  results (6/6 runs, 300 battles). ~80 battles/s on this 4-core/8-thread host.
- `tools/java/A2Trace.java`: listener-based death attribution (last writer and
  round of every arena byte; 24-round instruction history of each candidate
  member). Attaching it leaves scores byte-identical (25/25 cohort runs).
- `tools/bench.mjs` + `tools/make-plan.mjs` + `tools/fields.mjs`: paired plans;
  every arm staged under the same team name `CAND` so cohort, seed, load order
  and zombie set are identical across arms. `tools/compare.mjs`: paired cohort
  t intervals.

## Reproduction of a reference point

Archived `b01d-e1p4-validation-20261002-parallel` panel p01, cohorts c01-c03,
exact same binaries/opponents/zombies/seed: b01d and e1p4 arms reproduce the
archived `rawScoreText` byte-for-byte (`agent2/repro/*.json`).

## Mechanism findings (m050 on the 2025 field, 1,000 traced battles)

- 971 member deaths. 46% happen while a stream dwells on its 2-byte `FF 1F`
  anchor and an opponent overwrites it; ~21% during worker rebuild/execution
  (opponent bytes); ~15% end in our own old trail after an earlier foreign
  corruption; partner interference ~2%; zombies ~9%; initializer ~6%.
- Most common corruption: anchor `FF 1F` -> `FF A5` (`jmp [di+d16]`, faults
  reading outside the private segment): 157 of 459 classified dwell deaths.
- Far-call opponents leave a 4-byte trail `[IPlo IPhi CSlo CShi]`. For any
  self-consistent design with a 2-byte call, `IPlo` is the rebuild trigger and
  always lands at a fixed residue: MOVSB-trigger designs put `A4` at addr = 2
  (mod 4); MOVSW-trigger designs put `A5` at addr = 3 (mod 4). Measured in the
  2025 field: SKYENT, Registered_Winners, VanLavan, callfart, OpcodeHunter,
  GoonSquad, stuxnet = A4@2; Baltika9, TrojanByte, cgx123123, Code_Killer,
  LowKey, K0F1M, AnotherBitInTheWall, Fishandpoultry, BinaryBandits = A5@3.
- Our anchor at residue 2 is therefore immune to MOVSB-family trails (their A4
  lands on our opcode byte and just triggers our own rebuild) and fatal against
  MOVSW-family trails (their A5 lands on our ModRM byte). A MOVSW-family
  anchor (`mov al,0A3h`, no other change) is the mirror image. Screen 1:
  B-only switched -0.170 (partner cross-fire), all switched -0.017 (n.s.).
- Zombies: zom20a writes one word; zom20b/d write 16 fixed words; zom20c writes
  a 0x200-stride column. zom20b/d contain four `EB F9 CC CC` tails (live one has
  two decoys below and one above), so the two backward INT 87h searches of A and
  B capture only the higher of b/d. zom20a's live loop has a unique 4-byte
  pattern `41 93 E2 F2`; zom20c hides its live loop among 8 identical copies.
- Zombie capture is worth ~0.11-0.13 points/battle for m050/b01d/e1p4 (2025
  field with zom20 pack vs zom19 pack vs no zombies).

## Candidate: zchain

b01d A + B; the captured zom20b/d spends its own INT 87h on `41 93 E2 F2`
-> `FF 26 15 5D` (`jmp [5D15h]`), after storing the zom20a entry address there;
captured zom20a sets ES to the arena, performs the original `F3 A5 06 1F`
counter search, and joins the replicator at its own phase. Screen 1
(4,000 battles/arm, 100 cohorts): +0.0453 vs b01d, 95% CI [+0.0285,+0.0622].
Mechanism check (1,000 battles): zom20a alive at battle end 449/1000 vs
101/1000 with b01d. This is a 2025-zombie-pack-specific gain.

## Holdout 1 (preregistered, `protocols/holdout1-zchain.md`)

Fresh salts, 40 battles/cohort, paired cohort-cluster 95% t intervals.
zchain minus b01d: H1 2025 field (8,000 battles/arm) +0.0433 [+0.0303,+0.0563],
130/25/45; H2 2024 live + counters (3,600) +0.0414 [+0.0264,+0.0564];
H3 2024 final + counters + peers (2,240) +0.0174 [+0.0003,+0.0345];
H4 zom19 pack -0.0008 [-0.0050,+0.0034]; H5 no zombies -0.0025
[-0.0085,+0.0034]; H6 2023 final (2,240) +0.0301 [+0.0136,+0.0466].
zchain minus m050: H1 +0.0519 [+0.0368,+0.0670]; H3 +0.0045 (n.s.);
H4 +0.0194; H5 +0.0252; H6 +0.0395. All preregistered criteria pass.
Original engine: 48/48 sampled H1 jobs byte-identical with cold `java -jar`.

combo_zrl03 was also strong in holdout 1 (H1 +0.0361 vs b01d) and dominant in
the peer field H3 (+0.135 vs b01d). 2025 entrant HRZ_Registered_Winners is a
Chimera-style replicator on the same anchor lattice (FAR_SEG 0FFC, AL=A2).

## Screen 2 (selection data for holdout 2)

zchain2 = zrl03 + chain (FAR_SEG 0FF9, anchors at in-page 0x32);
zchain3 = the same with FAR_SEG 0FFC. Relative to zchain: 2025 field
zchain2 +0.0098 (n.s.), zchain3 +0.0109 (n.s.); peer field zchain2 +0.1073
[+0.063,+0.152], zchain3 +0.0161 (n.s.). So zrl03's peer advantage comes from
the FAR_SEG/lattice offset, not from its planted capture decoy.
Geometry note: a Chimera-family generation at anchor P pushes exactly
[P, P+0x400), so streams on the same 0x400 lattice never overwrite each
other's anchors unless they occupy the same lattice point.

## Holdout 2 (preregistered, `protocols/holdout2-zchain2.md`)

zchain2 (zrl03 + chain, FAR_SEG 0FF9) minus reference, 95% cohort intervals:
| Field | vs b01d | vs m050 | vs zchain | vs zrl03 | vs zchain3 |
|---|---|---|---|---|---|
| H1 2025 + zom20 (8,000/arm) | +0.0518 [+0.034,+0.069] | +0.0693 [+0.051,+0.088] | +0.0165 [-0.001,+0.034] | +0.0229 [+0.010,+0.035] | +0.0045 n.s. |
| H2 2024 live + counters | +0.0696 | +0.1153 | +0.0258 [+0.0003,+0.051] | +0.0456 | +0.0237 |
| H3 2024 final + counters + peers | +0.1229 | +0.1264 | +0.0974 | +0.0192 n.s. | +0.0849 |
| H4 2025 + zom19 | -0.0191 [-0.043,+0.005] | +0.0020 | -0.0154 n.s. | -0.0004 | -0.0101 n.s. |
| H5 2025, no zombies | -0.0319 [-0.056,-0.008] | -0.0137 n.s. | -0.0320 [-0.056,-0.008] | -0.0003 | -0.0298 [-0.054,-0.006] |
| H6 2023 final | +0.0222 | +0.0286 | -0.0078 n.s. | +0.0128 n.s. | -0.0031 n.s. |
zchain3 (FAR_SEG 0FFC) has no H5 regression but loses most of the H3 gain.
Conclusion: the anchor lattice offset is a field-dependent tradeoff, not a free
gain; the zombie chain itself is robustly positive with the zom20 pack.
