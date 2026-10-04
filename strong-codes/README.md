# Strong codes - ordered from strongest/newest (01) to reference (10)

Every folder has `A.asm`, `B.asm` (sources), `A`, `B` (binaries) and a README with size, SHA-256 and what changed.
Each source was reassembled and checked byte-for-byte against the binary that was actually tested
(`agent2/tools/make-strong-codes.mjs`). Provenance: Good_Test V6 is friend-provided code; the variants are edits of it
or of our Chimera line. Scores are mean team points per battle on the CoreWars8086 v6 engine (local simulator).

| # | code | date | A / B bytes | status |
|---|---|---|---|---|
| 01 | **DET2** | 2026-10-04 day 2 | 214 / 233 | **current best** (confirmed vs rev1 on a fresh field) |
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
