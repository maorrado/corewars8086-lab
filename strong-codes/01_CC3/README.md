# CC3 - DET2 + shared cell + FF18 anchors + startup reorder (current best)

Date: 2026-10-04 day 2 round 2

A.asm -> A (216 bytes, sha256 aaa5db8734d93b843891bfe8a105f6e39ff589868acf1706fc32ea4469fcf4ee)
B.asm -> B (235 bytes, sha256 e8f9b1b6a0b948072e3ee7381b7369f967bc1c56efa5b8a53c23e1adb4a6c744)

DET2 + E2 CF (all streams use private cell 0300h; worker ends with call far [00300h], so merged foreign streams running our worker die) + E6 c18E (anchors and E1 decoys FF 18 instead of FF 1F) + E5 C1 (B startup write order). Confirmed vs DET2 on a fresh field: +0.0096 [0.0011,0.0181] (z=2.5); fresh 2025-only check +0.0044 [0.0009,0.0079].

Provenance: Good_Test V6 is friend-provided code; all variants here are edits of it or of our Chimera line (see comments in the sources).
