# Good_Test V6 handover package

This directory preserves the **friend-provided V6 pair** separately from the
Chimera `final/` pair. V6 is an opponent and research baseline, not a Codex
original and not a promoted Chimera replacement. Do not rename its provenance.

## Exact inputs and reconstruction

| Warrior | Original binary | Size | SHA-256 |
|---|---|---:|---|
| 1 | `original-binaries/Good_Test_V6_1` | 221 | `3fa67bed880413901ad618b4f7b248e5782d98de93318271ac540ad1690ca2b7` |
| 2 | `original-binaries/Good_Test_V6_2` | 202 | `8579e2c2212d72a413a6daacfe3b91ceb72be648bfc085bfeed9430eeaf6657a` |

`source/V6_1.asm` and `source/V6_2.asm` are reconstructed, readable NASM
sources. Both were assembled again on 2026-10-02 and matched the original
binaries byte for byte. Some instructions use explicit `db` encodings to
retain the exact original bytes. Rebuild from the repository root with:

```powershell
node assemble.mjs build/good-test-v6-rebuild study-notes/good-test-v6/source/V6_1.asm study-notes/good-test-v6/source/V6_2.asm
```

The assembler wrapper requires the local simulator at `127.0.0.1:8123`,
Playwright, and Chrome as described by `assemble.mjs`. Compare the rebuilt
SHA-256 values with the table above before benchmarking.

## Experimental variants

`variants/` contains only mechanically valid source candidates: LEA-stack,
constant-segment, pointer-immediate, scan-range, and BP-band changes. Pair
same-suffix A/B files unless a variant changes only one warrior; in that case
use the unchanged original source for the other warrior. `generators/`
preserves the scripts that authored the variants. These scripts still target
`candidates/generated/good-test-v6-optimization/` and use create-only writes;
adapt their paths before rerunning them from this package. The earlier
`constseg1` and `constseg2` drafts were deliberately excluded because their
hard-coded internal offsets were not corrected after the layout change.

Every score below comes from 2,500 battles per arm against the same cohort
and seeds **within its comparison**. Scores from different rows of tests are
not directly comparable because the sampled contexts differ.

| Test | V6 control | Variant | Difference |
|---|---:|---:|---:|
| LEA-stack screen | 0.764800 | 0.763000 | -0.001800 |
| Constant-segment screen | 0.731400 | 0.739267 | +0.007867 |
| Constant-segment fresh holdout 1 | 0.733067 | 0.738800 | +0.005733 |
| Constant-segment fresh holdout 2 | 0.738733 | 0.732067 | -0.006666 |
| Pointer-immediate screen | 0.740600 | 0.735467 | -0.005133 |
| Scan-6 screen | 0.728867 | 0.728467 | -0.000400 |
| Scan-8 screen | 0.728867 | 0.728867 | 0.000000 |
| BP-band -2 screen | 0.729033 | 0.692333 | -0.036700 |
| BP-band +2 screen | 0.729033 | 0.680667 | -0.048366 |

The promising constant-segment screen did **not** reproduce consistently:
the second fresh holdout reversed its direction. Across the three equal-size
sets, the mean difference was about +0.00231 with a 95% interval crossing
zero. No variant here is established as better than the original V6 pair.

`evidence/` includes the original per-run result JSON and configs for the
constant-segment screen and both fresh holdouts. The configs contain absolute
paths from the original machine; update those paths to reproduce a run on
another checkout. The other screen results remain in
`experiments/good-test-v6-optimization/` in this workspace and are summarized
above; do not treat an uncommitted scratch result as a published artifact.
