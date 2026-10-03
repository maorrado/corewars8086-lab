# agent2 research report — 2026-10-03

Branch `agent2/research-2026-10-03`, started from `cf37a4a`. Work stayed in this
worktree; the other agent's checkout was not read or modified; nothing was pushed.

## 1. What was checked first

- Path, branch, starting HEAD `cf37a4aab45e…` and clean status verified.
- Deterministic JAR SHA-256 `31639072…318d` verified before use.
- Read: `SECOND_AGENT_START_HERE.md`, `README.md`, rules/engine docs,
  `final-report.md`, `optimization-2025-report.md`, `final/` sources, the
  handover inventory, candidate/Good_Test READMEs, the progress notes, and the
  full 31-item lesson ledger in `study-notes/README.md`. I did not open the raw
  transcripts or frames: no conclusion here depends on a lesson-specific claim;
  every mechanism statement below was checked against the v6 source and against
  instruction-level traces of real battles.
- `experiment-log.md` was used as an index only.

## 2. Reproduction of a reference point

Archived b01d/e1p4 validation panel p01 (cohorts c01–c03, same binaries,
opponents, Zombies and seed) reproduced byte-for-byte for both arms
(`agent2/repro/`). All reference binaries were rebuilt with the simulator's own
NASM build run in Node and matched their documented hashes: m050, b01d, e1p4,
combo_zrl03, Good_Test V6 (`agent2/build/ref/manifest.json`).

## 3. Tooling (observer-only; game rules untouched)

| Tool | Purpose / validation |
|---|---|
| `tools/nasm-node.cjs` | Same Emscripten NASM as the browser page, no port 8123 |
| `tools/java/A2Batch.java` | Persistent JVM, parallel independent jobs, each a serial `Competition` (adapted from the other agent's `SerialBatchMain`). 8/8 cold-JVM and 6/6 archived runs byte-identical |
| `tools/bench.mjs`, `make-plan.mjs`, `fields.mjs` | Paired plans; every arm staged as team `CAND`; per-cohort fresh seeds; input hashes recorded |
| `tools/java/A2Trace.java` | Last-writer map of all arena bytes, per-round history of candidate members, end-of-battle A4/A5 alignment histogram; scores identical with/without it |
| `tools/compare.mjs`, `summarize-decision.mjs` | Paired cohort t intervals; decision table |
| `tools/verify-original.mjs` | Re-runs sampled jobs with cold `java -jar`; 132/132 byte-identical |

Throughput ~80 battles/s on this 4-core host. No accelerated or modified engine
classes were used; the persistent driver only reuses the JVM.

## 4. Mechanism findings

- m050 on the 2025 field (1,000 traced battles, 971 member deaths): ~46% die
  while dwelling on the 2-byte far-call anchor after an opponent overwrites it,
  ~21% during worker rebuild, ~15% in their own old trail after a foreign
  corruption, ~9% to Zombies, ~6% in the initializer, ~2% partner interference.
- The most common corruption is `FF 1F` → `FF A5` (`jmp [di+d16]`).
- Structural "families": a self-consistent far-call replicator with a 2-byte
  call leaves its rebuild trigger at a fixed residue: MOVSB designs put `A4` at
  address ≡ 2 (mod 4), MOVSW designs `A5` at ≡ 3. An anchor is immune to its
  own family's trails and vulnerable to the other's. Measured 2025 families:
  A4@2 (SKYENT, Registered_Winners, VanLavan, callfart, OpcodeHunter, GoonSquad,
  stuxnet) and A5@3 (Baltika9, TrojanByte, cgx123123, Code_Killer, LowKey,
  K0F1M, AnotherBitInTheWall, Fishandpoultry, BinaryBandits). Switching only B
  to the other family: −0.170 (partner cross-fire); switching all: −0.017 n.s.
- Lattice: a Chimera generation at anchor P pushes exactly [P, P+0x400) and
  rebuilds its worker at P+1..P+22, so all FAR_SEG 0FFC/AL A2 streams share one
  0x400 lattice (in-page 0x62; Registered_Winners is on it too). Moving the
  lattice 0x10–0x60 *below* that crowd gives large gains against Chimera-family
  opponents (+0.12…+0.21 on the peer screen); 0x10 above gives none.
- Zombies: zom20b/d hide their live `EB F9 CC CC` tail between decoys (two
  backward searches capture only the higher one); zom20a's live loop has the
  unique bytes `41 93 E2 F2`; zom20c hides its loop among eight copies. Zombie
  capture is worth ~0.11–0.13 points/battle for m050/b01d/e1p4.
- `INT 87h` scans through the caller's restricted memory view; a search with
  `ES` outside the arena faults. zom20b/d leave `ES` = arena, zom20a does not.

## 5. Experiments and decisions

All numbers are paired per-battle team-score differences with 95% cohort
intervals. Screens selected candidates; only preregistered fresh holdouts
(`agent2/protocols/`) were used for decisions.

| Step | Result |
|---|---|
| Screen 1 (4,000/arm) | zchain (b01d + zombie chain) +0.0453 vs b01d; family switches negative |
| Holdout 1 (6 fields) | zchain passes every criterion vs b01d and m050 (H1 +0.0433 / +0.0519) |
| Screen 2 | zchain2 = zrl03 + chain; zchain3 = same with FAR_SEG 0FFC; zrl03's peer advantage is its lattice, not its decoy |
| Holdout 2 | zchain2 H1 +0.0518 vs b01d but H5 (no Zombies) −0.032 [−0.056,−0.008]; zchain3 positive everywhere |
| Lattice sweep (screen 3) | FAR_SEG 0FFB only value non-negative in all four screen fields |
| Holdout 3 | zchain4 (0FFB) H1 +0.0715 vs b01d, +0.0795 vs m050, H3 +0.188; H5 −0.018 vs b01d fails the preregistered point-estimate rule → fallback to zchain3 |
| Original-engine panel | zchain3 − m050 +0.0576 [+0.028,+0.087]; zchain4 +0.0848 |
| Stress (post-decision) | With Good_Test V6 present zchain3 0.267 vs m050 0.088; with fixed-toggle/synthesis/clones zchain3 ≈ m050 (±0.04); zchain4 0.33–0.70 in every such group |

Pooled over the two fresh H1 holdouts (400 cohorts, 16,000 battles/arm):
zchain3 − m050 = +0.0628 [+0.0516,+0.0740], 275 wins / 28 ties / 97 losses.

**Promoted:** zchain3 into `final/` (see `final/README.md`).

## 6. Costs, regressions and limits of the evidence

- The gain is mostly 2025-Zombie-specific. With the zom19 pack or no Zombies
  zchain3 ≈ b01d (−0.002…−0.009) and ≥ m050 (+0.012…+0.016, n.s.).
- `HRZ_Grindo_Holics`: −0.163 vs b01d / −0.118 vs m050 in cohorts containing
  it. Cause: the chain moves the `F3 A5 06 1F` counter-bomb from the b/d Zombie
  (fired within ~15 rounds) to zom20a (later), missing Grindo1's startup
  `rep movsw; push es; pop ds`; Grindo2 also captures zom20b directly by address.
- zchain4 vs zchain3 is a genuine field-dependent tradeoff: much stronger
  against Chimera-family designs (likely in a strong final), slightly weaker in
  zombie-less and 2023 single-survivor fields. The rule chosen in advance
  favoured the conservative pair; the choice should be revisited once the real
  field and Zombies are known.
- New_Best (m050's documented regression) was not tested: its binaries exist
  only outside the permitted workspaces. Good_Test V6 (original binaries),
  Claude's fixed-toggle and synthesis pairs were used as counter codes; the
  in-repo Good_Test source is a modified "hardening" variant and was not used.
- Opponent pools are the published 2025 online roster plus 2024/2023 archives
  and our own lineage; cohort intervals treat the fixed rosters as given and
  do not cover unseen 2026 designs or Zombies.
- 40 battles per cohort, cohort-level clustering; partitions of the same roster
  reuse teams across cohorts, so intervals are approximate.

## 7. Where things are

- Promoted sources: `final/ChimeraA.asm`, `final/ChimeraB.asm`.
- Candidate sources: `agent2/src/cand/` (zchain, zchain2, zchain3, family
  variants), `agent2/src/lat/` (FAR_SEG sweep; `L0FFB*` = zchain4).
- Binaries + hashes: `agent2/build/*/manifest.json`.
- Plans (fields, cohorts, seeds): `agent2/plans/`; protocols: `agent2/protocols/`.
- Raw results (per cohort, all hashes): `agent2/results/*.json`; decision table
  `agent2/results/decision-summary.json`; working notes `agent2/NOTES.md`.
- Per-run staging copies and traces are regenerable and ignored (`agent2/runs/`).

## 8. Addendum: direct comparison with Good_Test V6 (run after promotion)

Original V6 binaries as a candidate arm, same cohorts/seeds (`v6check-*`):
- 2025 field + zom20, 3,000 battles/arm: V6 0.7312, zchain3 0.7338 (+0.0026
  [-0.039,+0.044]), zchain4 0.7526 (+0.0214 n.s.), b01d -0.0508, m050 -0.0809.
- 2025 field, no Zombies, 2,000/arm: V6 0.5846, zchain3 +0.0037 n.s.,
  zchain4 +0.0108 n.s., m050 -0.0114 n.s.
- Head-to-head (stress1: V6 + two random 2025 teams, 600 battles/arm):
  zchain3 0.267 vs V6 0.633; zchain4 0.334 vs V6 0.613; m050 0.088 vs V6 0.789.
So zchain3 is level with V6 on the broad field but clearly loses when V6 is in
the same battle. The promotion was against m050; it is not a claim of
superiority over V6.
