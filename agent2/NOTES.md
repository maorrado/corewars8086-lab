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
