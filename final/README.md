# Chimera zchain3 — promoted pair (2026-10-03)

`ChimeraA.asm` and `ChimeraB.asm` are the exact promoted sources. They assemble
to 233 and 122 bytes, below the 2025 final's 256-byte limit (no signature
bytes; like m050 they do not satisfy the online-stage 39-byte NOP signature).
The compiled binaries are byte-identical to the measured `zchain3` arm.

| File | Size | Binary SHA-256 |
|---|---:|---|
| `ChimeraA` | 233 | `636f045f50057969263530be61d25149ecf10f57d0a2df97e04312922e5c7669` |
| `ChimeraB` | 122 | `201c409fe0392d6714bf43ec55717fbbeb65f022d1ffd271231bc677fa204d6c` |

Rebuild from the lab root with either the browser assembler
(`node assemble.mjs build/final final/ChimeraA.asm final/ChimeraB.asm`) or the
same NASM build run directly in Node, which needs no shared 8123 server:

```powershell
node agent2/tools/nasm-node.cjs build/final final/ChimeraA.asm final/ChimeraB.asm
```

The previous promoted pair, m050 (189/117 bytes, A `0268ce4f…bd44`,
B `06b5a1ff…1782`), is retrievable with `git show cf37a4a:final/ChimeraA.asm`
(and `ChimeraB.asm`); its binaries are also in `agent2/build/ref/`.

## Provenance

This is not a from-scratch design. Lineage: m050 (Codex) → e1p3/e1p4/b01d
(Claude: LEA fusions, the `FF 18` decoy word at `FF90h`, timing NOPs, B phase
`70h`) → combo_zrl03 (planted `EB F9` decoys at `FFECh`/`FFE8h` that absorb other
teams' backward Zombie searches, and a two-step `0F EB F9 CC` capture of the
higher zom20b/d) → agent2 changes:

1. **Zombie chain.** The captured zom20b/d spends its own `INT 87h` on zom20a's
   unique live-loop bytes `41 93 E2 F2`, replacing them with `FF 26 15 CC`
   (`jmp [CC15h]`) after storing the zom20a entry address there. The captured
   zom20a sets `ES` to the arena (zom20a never does), runs the original
   `F3 A5 06 1F` counter search, and joins the replicator at band phase `2Ah`.
   With the 2025 pack this gives the team two speed-2 captured replicators
   instead of one.
2. **FAR_SEG `0FFCh`.** combo_zrl03 used `0FF9h`; that lattice is much better
   against Chimera-family opponents but regressed when no Zombie can be
   captured (see below), so the conservative arm keeps `0FFCh`.

## Evidence (paired, same cohorts/seeds/Zombies, team name `CAND`)

Fresh preregistered holdouts (`agent2/protocols/`); 95% cohort-cluster t
intervals; per-battle team score difference. H1 = all 75 published 2025 teams
with the 2025 Zombies (8,000 battles per arm per holdout). Full table:
`agent2/results/decision-summary.json`.

| Field | zchain3 − m050 (holdout 2) | zchain3 − m050 (holdout 3) | zchain3 − b01d (holdout 3) |
|---|---|---|---|
| H1 2025 field, zom20 | **+0.0649** [+0.050,+0.080] | **+0.0607** [+0.044,+0.077] | **+0.0527** [+0.039,+0.067] |
| H2 2024 live + counters | +0.0916 | +0.1002 | +0.0526 |
| H3 2024 final + counters + Chimera peers | +0.0415 | +0.0411 | +0.0474 |
| H4 2025 field, zom19 pack | +0.0121 (n.s.) | +0.0129 (n.s.) | −0.0023 (n.s.) |
| H5 2025 field, no Zombies | +0.0161 (n.s.) | +0.0156 (n.s.) | −0.0024 (n.s.) |
| H6 2023 final (single survivors) | +0.0318 | +0.0266 | +0.0224 |

A separate fresh 2025-field panel run entirely through cold `java -jar` on the
deterministic JAR (no persistent driver) gave zchain3 − m050 = +0.0576
[+0.028,+0.087] over 3,000 battles per arm. 132 sampled holdout jobs re-run
with the original cold engine were byte-identical.

## Known costs and limits

- Most of the gain is specific to the 2025 Zombie pack (zom20a/b/d capture).
  With another pack or no Zombies the pair is about equal to b01d and slightly
  above m050; it does not regress there beyond noise.
- `HRZ_Grindo_Holics` (zom20a mimic, direct zom20b capture, and a startup that
  the early `F3 A5 06 1F` bomb used to kill) costs about −0.12 points per battle
  versus m050 in cohorts containing it, because the chain fires that bomb later.
  It is the only clearly negative 2025 opponent.
- Alternative `zchain4` (identical code, FAR_SEG `0FFBh`) scored higher on the
  2025 field (+0.0795 vs m050) and far higher against Chimera-derived peers,
  counters and clones, but −0.018 vs b01d with no Zombies; by the preregistered
  rule the conservative zchain3 was promoted. See `agent2/REPORT.md`.
- Unknown 2026 opponents and Zombies are not represented; the final event's
  Zombie code must be re-adapted, and the measured gain cannot be assumed there.
