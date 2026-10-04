# CC3 - promoted pair (2026-10-04, day 2 round 2)

`CC3A.asm` and `CC3B.asm` are the exact confirmed sources (same files as `strong-codes/01_CC3/`).

| File | Size | Binary SHA-256 |
|---|---:|---|
| `CC3A` | 216 | `aaa5db8734d93b843891bfe8a105f6e39ff589868acf1706fc32ea4469fcf4ee` |
| `CC3B` | 235 | `e8f9b1b6a0b948072e3ee7381b7369f967bc1c56efa5b8a53c23e1adb4a6c744` |

Rebuild: `node agent2/tools/nasm-node.cjs <outdir> final/CC3A.asm final/CC3B.asm`

## What it is
DET2 (rev1 + adaptive lattice: 42h when a V6-family team wrote [4A17h], else 52h) plus three small changes:
1. CF: all our streams use one private pointer cell 0300h and the worker ends with `call far [00300h]`; a foreign stream
   of the same design that merges with ours and runs our worker copy reads its own empty cell and dies.
2. c18E: anchors and A's decoy block use `FF 18` (call far [bx+si], SI = 0) instead of `FF 1F`.
3. C1: B's startup hook-cell writes reordered (detection read first; same turn count).

## Evidence
Preregistered round-2 confirmation on a fresh field (agent2/day2/leaders/CONFIRM2-RESULTS.md): vs DET2 +0.0096
[0.0011,0.0181] (z=2.5); fresh 2025-only check +0.0044 [0.0009,0.0079]. vs rev1 and V6 much higher in fields with leaders.

## Limits
Small gain over DET2 (about +0.01 per battle). Inherits DET2's known weak point (an early [4A17h] writer triggers the
42h move without a V6-family team). No immunity claimed.

## Provenance and previous pairs
Good_Test V6 is friend-provided code; V6nohunt, rev1, DET2 and CC3 are agent2 edits (round-2 roles E2, E5, E6; combined
by the coordinator). Previous pairs: DET2 in `strong-codes/02_DET2/`, zchain3 in `strong-codes/09_zchain3/`, and in git history.
