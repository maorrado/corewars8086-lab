# DET2 - promoted pair (2026-10-04)

`DET2A.asm` and `DET2B.asm` are the exact confirmed sources (same files as `strong-codes/01_DET2/`).

| File | Size | Binary SHA-256 |
|---|---:|---|
| `DET2A` | 214 | `2153532daca9095acc71f0a2bdc7560024fc81972171c02f1b7f8cc41d1b1ce4` |
| `DET2B` | 233 | `15f5c4dabec14a62af067a9593e3ce6f207167c78b4b6f8e5c89fc4e3e8de8a1` |

Rebuild: `node agent2/tools/nasm-node.cjs build/final final/DET2A.asm final/DET2B.asm`

## What it is
rev1 (KPHL, the night's best: Good_Test V6 -> V6nohunt -> night edits) plus one change: warrior B checks at startup
whether a V6-family team wrote the hook cell [4A17h]; if so, the whole team (A, B, captured zombies) uses lattice
42h (FAR_SEG 0FFAh, 10h below the V6 family), otherwise 52h as in rev1.

## Evidence
Preregistered confirmation on a fresh field (agent2/day2/PROTOCOL-leaders.md, results agent2/day2/leaders/CONFIRM-RESULTS.md):
vs rev1 +0.075 [0.046,0.104] per battle (z=2.5), all zombie cohorts; plain field +0.009 (n.s., not worse);
cohorts with V6/V4/V6Guard/V6nohunt/zchain/zrl03/ah02 leaders +0.21. 40 sampled jobs byte-identical on the original engine.

## Limits
Not a confirmed gain on the plain field alone. Known weak point: a team that writes [4A17h] early triggers the move
to 42h without a V6-family team present. No immunity claimed.

## Provenance and previous pairs
Good_Test V6 is friend-provided code; V6nohunt, rev1 and DET2 are agent2 edits (DET2 by day-2 research role D4).
Previous final/ contents (Chimera zchain3, Phoenix) are in git history (`git show 7e011c3:final/ChimeraA.asm`) and
zchain3 is also in `strong-codes/08_zchain3_final/`.
