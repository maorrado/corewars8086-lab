# LES bootstrap experiment (2026-09-30)

Research only; do not promote to `final/`.

In both m050 sources, the common pointer-ready path originally used three
instructions to set `DI` from `AX` and `ES` to `FAR_SEG`. After storing the far
pointer at private `DS:[BX]`, `LES DI,[BX]` performs both loads in one opcode.
`Cpu.java` implements LES, and the copied worker body and its 9-word copy count
remain unchanged. The binary sizes are A 184 bytes and B 112 bytes; their
SHA-256 values are `5c16e6f82b59a7601d7f5c0dd1ee735a1aa7ec6f8220790bc7762bfb4f69d109`
and `a9e83451784e1bbfe9db029a96c83790f20f9caab0168cc8506f1129ae39950e`.

The strict `$review-agent` inspection of source, engine opcode implementation,
listings, manifests and four matched-name 2025-field configs found no actionable
defect. Each arm used the same 25 cohorts, 75 published online teams, 2025 online
Zombies, one seed, 20 battles per cohort, and one engine thread. The m050 control
binary hashes were exact.

| Arm | Score per battle, 500 battles | Delta versus m050 | Approximate cohort 95% interval on delta |
| --- | ---: | ---: | ---: |
| m050 control | 0.657000 | — | — |
| LES A only | 0.652333 | -0.004667 | [-0.025687, +0.016354] |
| LES B only | 0.649333 | -0.007667 | [-0.024488, +0.009154] |
| LES A+B | 0.657667 | +0.000667 | [-0.016588, +0.017922] |

No variant has a credible broad-field gain; none advances to holdout. The
experiment also shows that removing two bootstrap turns can change the
collision/timing path without reliably increasing score.

The `generate.mjs` script documents source derivation and intentionally refuses
to overwrite these existing files. Assemble the saved sources via repository
`assemble.mjs` with the local browser NASM setup. Compare recorded runs with
`node analyze-codex-goal-paired-screen.mjs <control-result> <arm-result>`.
