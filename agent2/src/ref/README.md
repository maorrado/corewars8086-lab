# Reference sources (copies, not agent2-authored)

Verbatim copies used only to rebuild reference binaries in `agent2/build/ref/`.
Original locations and authorship are unchanged:

| File | Copied from | Provenance |
|---|---|---|
| `b01dA/B.asm` | `candidates/generated/claude-b01d-e1p4-20261002/sources/b01d-*.asm` | Claude research candidate b01d |
| `e1p4A/B.asm` | same folder, `control-*.asm` | Claude research candidate e1p4 |
| `zrl03A/B.asm` | `candidates/generated/combo-zrl03-evaluation/Combo*.asm` | combo_zrl03 research candidate |
| `V6A/B.asm` | `study-notes/good-test-v6/source/V6_*.asm` | friend-provided Good_Test V6 (reconstructed source) |

m050 is assembled directly from `final/ChimeraA.asm` and `final/ChimeraB.asm`.
All rebuilt sizes and SHA-256 values in `agent2/build/ref/manifest.json` match the
hashes documented in `final/README.md`, `study-notes/b01d-e1p4-validation-20261002.md`,
`experiments/combo-zrl03-b01d-holdout-20261002/summary.json` and
`study-notes/good-test-v6/README.md`.
