# Post-m049 Code_Jokers defense candidates

These are the exact diagnostic sources used in the post-m049 adversarial
audit.  None was promoted.  Each candidate keeps Chimera B byte-identical to
m049 and changes only Chimera A's captured-Zombie `INT 87h` payload, except
for the two 198-byte split-signature variants.

| Candidate | A bytes | A binary SHA-256 | Purpose |
|---|---:|---|---|
| `ChimeraA-jtiny.asm` | 189 | `66925396e41a79a9b109a2f0a739be2351772a903cc37e6239a6cf553dcbb10a` | Target the 12-byte Code_Jokers partner signature `90 1E 06 1F` |
| `ChimeraA-jworker.asm` | 189 | `423f42d161f27907967e16e6c887689e04233ca8b4efb329196f98f96e0d477d` | Target the replicated worker signature `F3 A5 89 D6` |
| `ChimeraA-shared-movsi.asm` | 189 | `c76c6f777deedddef87c2e30a739ed91ecd8c5445eeb2476ac67e103806ac1ad` | Target shared sequence `89 C6 81 C6` |
| `ChimeraA-shared-worker.asm` | 189 | `96398194fc115ce1fe6a02c24bc97c352b3c3ffaceed4adb80112cacf132867e` | Target shared sequence `FF 1F F3 A5` |
| `ChimeraA-shared-pointer.asm` | 189 | `0f46d9f4b4c9cef353ee8551bdd5a02d19df7b11922c7d75ac79abebc0e99f95` | Target shared sequence `8C 4F 02 89` |
| `ChimeraA-shared-callpad.asm` | 189 | `d5b4cdb69bbd696ba2fdda061316327a60b06b3c68f4ba7a7e135f0d289a3901` | Target shared sequence `FF 1F 90 90` |
| `ChimeraA-split-broad-b.asm` | 198 | `6ad5ae4acb66276fb4bba217c1718afc5eaaf7b2180f966e69b90afda889f6af` | Zombie B keeps m049's broad target; Zombie D targets Code_Jokers |
| `ChimeraA-split-joker-b.asm` | 198 | `7d7db68bf5b62aa49e5cb361ef1766c2730cecf0f0b034e4ce8bb4ce5e77888c` | Zombie B targets Code_Jokers; Zombie D keeps m049's broad target |

`ChimeraB-m049.asm` assembles to the promoted 117-byte B binary with SHA-256
`7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77`.
The exact configs and result records are in
`experiments/post-m049-adversarial/`; the decision summary is in
`optimization-2025-report.md`.
