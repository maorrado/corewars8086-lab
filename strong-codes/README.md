# Strong code catalog

Folder numbers are navigation order, not a proof of pairwise dominance.
The first ten entries are Claude's 2026-10-04 measured catalog; entries 11 onward
are historical references. `final/` remains the already promoted zchain3 pair.
DET2 is the highest-mean candidate on the published mixed confirmation field,
not a verified winner against every opponent or a universally robust defense.

Every folder has `A.asm`, `B.asm` (sources), `A`, `B` (binaries) and a provenance README.
Sizes and complete SHA-256 identities are collected in `manifest.json`.
All 18 pairs were reassembled and checked byte-for-byte against the catalog binaries
(`node tools/check-strong-codes.mjs --rebuild`). This verifies identity, not a new performance result.
Provenance: Good_Test V6 is friend-provided code; the variants are edits of it
or of our Chimera line. Scores are mean team points per battle on the CoreWars8086 v6 engine (local simulator).

| # | code | date | A / B bytes | status |
|---|---|---|---|---|
| 01 | **DET2** | 2026-10-04 day 2 | 214 / 233 | leads the measured mixed confirmation field; not a universal champion |
| 02 | MC2 | 2026-10-04 day 2 | 214 / 222 | passed the same confirmation, slightly below DET2 |
| 03 | DETMC (DET2+MC2) | 2026-10-04 day 2 | 214 / 233 | passed the same confirmation, not better than DET2 |
| 04 | rev1 (KPHL) | 2026-10-04 night | 214 / 222 | night best; beats V6nohunt and V6 on the plain field |
| 05 | KPH | 2026-10-04 day 2 | 196 / 222 | rev1 without locpatA; not better overall |
| 06 | V6nohunt (rev0) | 2026-10-03 | 194 / 202 | beat V6 on day 1 |
| 07 | zchain4 | 2026-10-03 | 233 / 122 | strong on plain 2025 only, collapses vs strong teams |
| 08 | zchain3 | 2026-10-03 | 233 / 122 | the pair currently in `final/` |
| 09 | V6Guard | 2026-10-03 | 227 / 202 | Codex variant of V6, about equal to V6nohunt |
| 10 | Good_Test V6 | reference | 221 / 202 | friend-provided original |

## Confirmation field (day 2, salt agent2-day2-confirm-1, 9,080 battles per code)
| code | 2025 | strong | 2024 live | 1 leader | 2 leaders | 3 leaders | no zombies |
|---|---|---|---|---|---|---|---|
| DET2 | 0.761 | 0.702 | 0.726 | 0.769 | 0.762 | 0.825 | 0.545 |
| MC2 | 0.756 | 0.722 | 0.727 | 0.770 | 0.705 | 0.647 | 0.535 |
| DETMC | 0.760 | 0.688 | 0.716 | 0.765 | 0.708 | 0.744 | 0.536 |
| rev1 | 0.756 | 0.683 | 0.706 | 0.609 | 0.456 | 0.389 | 0.545 |
| V6 | 0.734 | 0.667 | 0.708 | 0.517 | 0.359 | 0.305 | 0.539 |
| zchain4 | 0.756 | 0.579 | 0.713 | 0.380 | 0.191 | 0.160 | 0.578 |

"Leader" cohorts contain V6, V4, V6Guard, V6nohunt, zchain3/4, zrl03 or ah02. Details: `agent2/day2/leaders/CONFIRM-RESULTS.md`.

## Plain-field check (day 2, salt agent2-day2-field-1, 17,080 battles per code)
| code | 2025 | strong | 2024 live | no zombies |
|---|---|---|---|---|
| rev1 | 0.749 | 0.683 | 0.698 | 0.582 |
| KPH | 0.740 | 0.683 | 0.713 | 0.583 |
| V6nohunt | 0.731 | 0.632 | 0.717 | 0.572 |
| V6 | 0.727 | 0.611 | 0.714 | 0.567 |
| zchain4 | 0.762 | 0.537 | 0.725 | 0.556 |

Details: `agent2/day2/RESULTS.md`. Earlier research: `agent2/REPORT.md` (day 1), `agent2/night/NIGHT_REPORT.md` (night).
No code is claimed to be immune to targeted counters.

## Historical pairs and rejected experiments

The exact m050 and m049 pairs have been moved out of the active final reference
and retained as sources plus hash-checked binaries:

- [Chimera m050](11_Chimera_m050_historical/README.md).
- [Chimera m049](12_Chimera_m049_historical/README.md).
- [combo_zrl03](13_combo_zrl03_historical/README.md),
  [b01d](14_b01d_historical/README.md),
  [combo_ah02](15_combo_ah02_historical/README.md),
  [e1p3](16_e1p3_historical/README.md), and
  [e1p4](17_e1p4_historical/README.md) retain earlier researched pairs.

[KPHLGuard](research/KPHLGuard/README.md) is a **rejected robust-defense claim**,
not another recommended champion. It beat the old-signature test 138 to 0 in
200 battles, but changing one byte in the opposing search reversed the result
to 0 versus 138. Its broad 2025-field scores tied KPHL exactly. Preserve both
the positive and the negative evidence; do not advertise it as an unconditional
improvement. Full Codex evidence: [research index](../study-notes/codex-research-20261004/README.md).
