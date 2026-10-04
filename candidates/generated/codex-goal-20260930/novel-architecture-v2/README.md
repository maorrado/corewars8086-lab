# Novel architecture v2: independent probe-and-interdict hunters

Status: **assembled and smoke-tested; poor result, not promoted**. No changes to `final/`.

This pair does not use Chimera's Phoenix bands, `CALL FAR` chain, or Zombie `INT 87h` capture. Each survivor saves its own load offset in `BP`, copies a compact hunter into a distant arena location (`+4000h` for A; `+C000h` for B), and transfers to that copy with `PUSH CS; PUSH BX; RETF`. `REP MOVSW` copies one word per turn in v6, so the relocation is interruptible. A and B use distinct odd probe strides (127 and 131 bytes) and scan origins.

The hunter reads one arena byte per probe. The arena starts filled with `CCh`, so a non-`CC` byte suggests an occupied region. For each survivor, the first two such detections trigger its own `INT 86h` charge, centered to write 256 bytes of `CC`; after both charges, it continues probing and writes `CCCC` only at occupied sampled words. The post-bomb loop includes the implemented `9B 9B` NRG opcode. This is occupancy-guided interdiction, **not opponent identification** or an AI: a non-`CC` byte can belong to our partner, a Zombie, data, or a harmless region. The current source checks whether a bomb would overlap its own relocated body and skips word writes inside that body (or at its immediately preceding byte). The original unguarded version had a deterministic self-corruption hazard, diagnosed below.

The official v6 CPU implements the assembled instruction forms used here: `REP MOVSW`, `RETF`, `CMP byte [SI],imm8`, `LOOP`, `MOV word [SI],imm16`, `INT 86h`, and `NRG`. `INT 86h` uses 64 dword stores per charge and leaves `CX` unchanged, so the two-charge `LOOP` counter is safe. There are no segment-override prefixes. The exact compiled binaries in `build/codex-goal-20260930/novel-architecture-v2/` are:

| Warrior | Bytes | SHA-256 |
| --- | ---: | --- |
| A, self-guarded | 103 | `b7b6698764bd44528564bd631ac973d45412e3620d5534a1d9a517ae678c07e7` |
| B, self-guarded | 105 | `1be29fe20ceb8d48b95495deff57c6e9db06e731166f1e34c638a81cf4ad6aea` |

The listing/manifest were produced by `assemble.mjs` using the local browser NASM assembler. Both are below the 2025 final's 256-byte limit. These hashes refer to the current sources. The original unguarded binaries were A 74 bytes (`4a6655a2bd76f64a6177de86ade134ccf4a72f9e7f6a122c4fa75f4fa6e8a3a1`) and B 76 bytes (`74e5f4ad9ce96692fc6d0887417ed119f2109eecbfdd0bc4210cb414654f3a16`).

## Smoke and diagnosis

The **original unguarded** pair scored 0.050000 team points/battle in the 20-battle smoke (`candidate-smoke.json`): A scored 0, B scored 0.05. This is a negative result, not evidence of competitive strength. In a replay of its first battle with v6 serial telemetry, both warriors had spent both `INT 86h` charges and accumulated energy, so neither suffered an immediate unsupported-opcode or relocation crash. A died in round 6,884 (memory exception) and B in round 3,460 (CPU exception).

There is a concrete self-corruption hazard in the original code. In B's replay, its load offset was 14,817 and relocated body began at 63,969. Probe 1,084 hits offset `load+C02Dh` = 64,014, **45 bytes into that same 50-byte body**; B's recorded death IP was exactly 64,014. In A, probe 2,150 hits byte 47, the last byte of its 48-byte relocated body. This exact B alignment is strong evidence for self-corruption, although telemetry alone cannot rule out a concurrent enemy write. The guarded sources skip the own-body span and 128-byte bomb margin; the guard is a real code-path protection, not a score improvement claim.

One same-seed, single-battle replay of the **self-guarded** pair still lost: A died in round 1,251 (memory exception, both bombs spent), and B in round 3,454 (CPU exception, both bombs spent). Thus the guard did **not** rescue even this battle. The repeated losses point to poor survival and/or other code damage in the contested arena, not a startup-only emulator incompatibility. No 20-battle retest or 500-battle field screen of the guarded pair has been run. Diagnostic CSVs are under `diagnostic/`.

## Prepared evaluation

- `candidate-smoke.json`: **already run on the original unguarded binaries**. Its result must not be attributed to the current guarded binaries; a new config/output path would be needed for a formal guarded smoke.
- `control-screen.json` versus `candidate-screen.json`: exact m050 A/B versus this pair, both named `COD_pair`, identical new seed, 25 freshly regrouped three-opponent cohorts covering all 75 online 2025 teams exactly once, 20 battles per cohort = 500 per arm, same Zombies and deterministic v6 engine. Unique output/run paths are currently unused. `analyze-screen.mjs` validates config/engine/binary hashes and opponent parity before reporting 25-cohort paired score delta and an approximate clustered interval.

The field screen has **not** been run. Given the poor original smoke and failed guarded single-battle replay, it is not justified yet. A 500-battle screen could eliminate an idea but cannot establish a small overall gain or justify `final/` promotion; any promising candidate would need independent fresh holdouts and targeted robustness checks.

Main risks: relocation may overwrite or be overwritten by an enemy; a non-`CC` sample is not a reliable enemy marker; an `INT 86h` hit can damage our partner; the slow probe may spend charges too late; and the unprotected hunter bodies lack Phoenix's layered survival mechanism. The guarded code only protects each warrior against its **own** intentional writes, not hostile writes or partner friendly fire.
