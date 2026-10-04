# B quantizer fusion: negative screen

Source was reviewed in full before assembly. Exact assembled 117-byte B:
`3350df45df4dc08636e27ffc1b49c7562b81dee4bd9861defa482a3e1e9c0c4f`.
The original Cpu/Warrior semantic fixture passed before field testing; its
result and source/class/runtime hashes are in `validation/result.json`.

Frozen screen manifest:
`6550f6a7480d5eccd6eac9598244d613c556c0cec6699f2149e85ac3efb134cc`.
Seed `shift-quantizer-screen-20261001-8ffa1630348132d6bfebbae4` maps to
war seeds 1183447430..1183447449, disjoint from the declared previous ranges.
Two arms, same names/field/Zombies/settings, 25 senior panel-2 triples, 500
battles each, all completed. No old-result pooling or adaptive extension.

| Pair | Team points per battle |
| --- | ---: |
| Exact m050 A + quantizer B | 0.661999998 |
| Exact m050 A+B | 0.663333332 |

Matched delta -0.001333334 (-0.2010% relative); descriptive 25-cohort 95%
interval [-0.014268196,+0.011601528]. Four positive, three negative and eighteen
tied cohorts. The predeclared positive-mean screen gate fails. Reject this
version; no holdout or champion claim. A saved opcode is not automatically a
score improvement, even with identical unopposed post-bootstrap state.

All archived input/runtime hashes, raw score CSVs, actual starts/completions,
run counts, normalized scores and exact source-config identities were checked.
Full artifacts and read-only paired analysis:
`experiments/codex-goal-20261001/accelerated-shift-quantizer/`.
