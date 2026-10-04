# Word-trigger candidate family — authoring only

`WordA.asm` and `WordB.asm` derive exclusively from the pinned exact m050 final sources. No assembly, entropy, configuration generation or battles are part of this authoring task. These are hypotheses, not final replacements.

Baseline identities:

- A source SHA-256: `b05ae79647c65b67d8486205597dc28c3c6467a80efbd9017bc257e2014999d8`; binary 189 bytes, `0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44`.
- B source SHA-256: `6c909366137b736bf693090093d83a8c1436f7817ccc2cea51b3ea53bfc46144`; binary 117 bytes, `06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782`.

Only the coordinated word-trigger changes are made:

| Component | Exact change |
| --- | --- |
| All quantized destination low bytes, including A's captured entry | `MOV AL,A2h` → `MOV AL,A3h` |
| Private bootstrap/template copy, including A's captured path | `MOV CX,9` → `MOV CX,8` |
| Initial post-pointer copy count | A: 8 → 7; B: 9 → 7 |
| Recurring worker | Remove its first standalone `MOVSW`; start with `REP MOVSW`; `MOV CL,9` → `MOV CL,7` |
| Skipped padding | Increase existing jump-over `times 2 db 0CCh` to `times 3 db 0CCh`, before A's `zombie_entry` / B's `phoenix_init`; no trailing padding |

The worker changes from 17 bytes to 16, and the private template copy is exactly eight words. The extra CC is in the already skipped region, so it adds no intended executed instruction. Labels after that region, including the initializers and worker, move forward by one byte; assembler-derived displacements follow them. Expected image sizes remain A=189 and B=117; expected worker offsets become A=0xAD and B=0x65. `worker_end` is a label only, with no emitted bytes after it. Assembly/listing verification is still required.

This padding location matters. For B loaded at 0x3400, the A3 target's arena alias is 0x3463. Shifting the bootstrap far call from offset 0x62 to 0x63 keeps its `FF 1F` word aligned with that target. Leaving the call at 0x3462 and appending a byte at the end instead would overwrite its ModR/M byte and could produce fatal `FF FF`. The 0x3400 load must be included in the fixture; this geometric safeguard is not itself an execution proof.

The mechanism being tested is a two-byte trigger matching a `REP MOVSW`-headed worker, with seven-word recurring copies and the A3 destination phase coordinated together. Nominal steady copying drops from standalone MOVSW plus nine repeated words to seven repeated words, potentially saving three copy turns. FAR_SEG, pointer cells, stack gaps, movement strides, quantization bands, capture routines and bomb payloads remain unchanged. Keeping those strides preserves the intended traversal geometry; full recurrence, arena coverage and self-collision behavior still need original-engine fixtures. This is not the earlier low-byte-only phase sweep.

Before any screen, verify long recurring-worker execution—not only the first far call—at representative legal load offsets and quantizer boundaries, including B load 0x3400 and A's captured path. Check template bytes, copy counts, far-call targets, stack progression, next-generation code and absence of execution in the skipped padding. Then any separately authorized screen can compare A-only, B-only and both against matched exact m050. No candidate is selected or claimed superior by source-level reasoning alone.
