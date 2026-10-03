# Preregistered holdout 3 — zchain4 (FAR_SEG 0FFBh) (written before any holdout-3 run)

Date: 2026-10-03. Selection evidence: lattice sweep screen 3 (`agent2/results/s3-*.json`),
in which FAR_SEG 0FFBh was the only value with non-negative point estimates in all
four screen fields. Because it was chosen as the best of 8 values, only this
fresh holdout counts as evidence.

## Arms (exact binaries, all staged as team `CAND`)
| Arm | A | B |
|---|---|---|
| zchain4 (primary; zchain3 with FAR_SEG 0FFBh) | agent2/build/lat/L0FFBA 233 B `07c238b2…` | agent2/build/lat/L0FFBB 122 B `2fb8f412…` |
| zchain5 (secondary; FAR_SEG 0FFAh) | agent2/build/lat/L0FFAA `31716b92…` | agent2/build/lat/L0FFAB `97877683…` |
| zchain3 (FAR_SEG 0FFCh) | L0FFCA `636f045f…` | L0FFCB `201c409f…` |
| zchain2 (FAR_SEG 0FF9h) | L0FF9A `231512f4…` | L0FF9B `011720f6…` |
| zchain (b01d + chain) | zchainA `94071cb2…` | b01d B `884b4d52…` |
| b01d | b01dA `77508022…` | b01dB `884b4d52…` |
| m050 (final/) | ChimeraA `0268ce4f…` | ChimeraB `06b5a1ff…` |
Full hashes are recorded in each result JSON (`armHashes`).

Fields H1–H6 exactly as in holdout 1, fresh salts `agent2-holdout3-H1` … `H6`.

## Decision rule (fixed in advance)
zchain4 is preferred over a reference if: H1 diff > 0 with 95% interval
excluding 0 (vs b01d and m050), or for the zchain-family references H1 point
estimate >= 0 and H3 interval excluding 0 in its favour; H2 and H6 point
estimates >= -0.01; H4 and H5 point estimates >= -0.01 with no interval
entirely below 0. If zchain4 fails H4/H5 but zchain3 passes everything, the
recommendation is the more conservative zchain3, with the field-dependent
tradeoff reported explicitly.
