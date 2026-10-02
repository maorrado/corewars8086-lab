# Preregistered holdout 2 — zchain2 (written before any holdout-2 run)

Date: 2026-10-03. Selection evidence: screen 2 (`agent2/results/screen2-*.json`).
Holdout 1 already established zchain over b01d and m050 (see holdout1 protocol).

## Arms (exact binaries, all staged as team `CAND`)
| Arm | A | B |
|---|---|---|
| zchain2 (primary candidate) | agent2/build/cand2/zchain2A 233 B `231512f4…e8fb` | zrl03 B 122 B `011720f6…f334` |
| zchain3 (secondary candidate) | agent2/build/cand2/zchain3A 233 B `636f045f…7669` | agent2/build/cand2/zchain3B 122 B `201c409f…4d6c` |
| zchain | agent2/build/cand/zchainA 251 B `94071cb2…e655` | b01d B |
| zrl03 | agent2/build/ref/zrl03A 195 B `605880ba…b051` | zrl03 B |
| b01d | agent2/build/ref/b01dA `77508022…315e` | b01d B `884b4d52…c7` |
| m050 (final/) | ChimeraA `0268ce4f…bd44` | ChimeraB `06b5a1ff…1782` |

Fields H1–H6 are defined exactly as in holdout 1, with fresh salts
`agent2-holdout2-H1` … `agent2-holdout2-H6` (never used before), 40 battles per cohort.

## Decision rule (fixed in advance)
zchain2 is a measured improvement over a reference if H1 diff > 0 with the 95%
interval excluding 0; H2, H3, H6 point estimates >= -0.01 with no interval entirely
below 0; H4/H5 intervals not entirely below -0.01. The same rule is applied to
zchain3 as a secondary comparison. The reference for promotion into `final/` is
m050 (current `final/`); b01d and zrl03 are the strongest research references.
Original-engine check on a random sample of H1 jobs (byte-identical scores).
