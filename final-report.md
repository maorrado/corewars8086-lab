# CodeGuru Xtreme 2025 study and survivor result

## Outcome

All 31 unique supplied recordings were reviewed end to end in their resolved
course order: 82,010.576 seconds (22.781 hours) of audio and screen content,
30,376 timestamped transcript segments, 16,418 five-second/change-triggered
frames, 5,250 retained keyframes and 342 contact sheets. Two additional Drive
files were byte-identical aliases and were hash-deduplicated. The completion
ledger is `study-notes/README.md`; the reconciled contract is
`rules-2025-consolidated.md`.

The strongest original pair produced by the measured search is Phoenix A/B in
`final/`. Each survivor is 81 bytes. The final official-v6 validation contains
9,000 Phoenix battles plus a 4,500-battle same-pool champion comparison.

| Evaluation | Battles | Team | Phoenix A | Phoenix B |
|---|---:|---:|---:|---:|
| Train, 9 known strong teams in 3 fixed cohorts | 4,500 | 0.446593 | 0.227111 | 0.219481 |
| Holdout, 9 unseen teams from 2025/2024/2023 | 4,500 | 0.412815 | 0.220370 | 0.192444 |

Both survivors materially contribute; neither is a dummy carried by the other.
Across the two large evaluations A earned 0.223741 per battle and B 0.205963.

## Honest champion comparison

`Registered_Winners` was rerun on the exact same holdout, Zombies, five seeds
and 4,500-battle count. It remains stronger overall.

| Holdout cohort | Phoenix | Registered Winners | Phoenix minus benchmark |
|---|---:|---:|---:|
| Unseen 2025 | 0.207333 | 0.541333 | -0.334000 |
| Unseen 2024 | 0.624556 | 0.594667 | +0.029889 |
| Unseen 2023 | 0.406556 | 0.398000 | +0.008556 |
| **All holdout** | **0.412815** | **0.511333** | **-0.098519** |

Therefore there is no evidence that Phoenix is “better than everyone.” It
generalizes well to the 2023–2024 field and is balanced, but its main remaining
weakness is the unseen 2025 cohort. The data also show why optimizing only
against `TOM_ATO` would have been misleading.

## What the pair does

The worker is first copied into the private 2,048-byte stack and `DS` is moved
there, so ordinary arena painting cannot erase the source. A far pointer stored
in private memory targets the shared arena through segment `0FF8h`. The first
`STOSW` installs `FF 1F` (`CALL FAR [BX]`). Recursive far calls then leave a
controlled return-address trail. The selected target low byte is `A2h`, so the
eventual return IP ends in `A4h` (`MOVSB`); that single copy exposes `A5h`
(`MOVSW`) followed by `REP MOVSW`, creating a live worker at the new site.
The worker moves both its stack and target and repeats. A and B aim at separated
bands and private cells, reducing collisions while retaining the same tested
engine.

At browser round 4,005, the inspected A process was alive at `CS=0FF8h` and the
arena contained the expected repeating far-call/MOVSB bands; all four Zombies
and both `TOM_ATO` processes in that visual run had already died. The snapshot
and exact state are `experiments/final-arena-round4000.png` and its adjacent
JSON. This visualization is diagnostic only; every score above comes from the
Java v6 engine.

## Search history and reproducibility

The search covered conventional writers, AB50 families, Zombie theft, runways,
NRG launchers, dual splits, worms, Zombie carpets, call cannons, protected-stack
Phoenix variants, a Zombie/Phoenix Hydra, target-band quantization and motion
parameter sweeps. The compact human lineage and all 39,150 controlled official
battles are indexed in `experiment-log.md`. Each result JSON records the exact
command, binaries and SHA-256 hashes, opponents, four live 2025 Zombies, seeds,
battle count, raw scores, team score and both warrior scores.

The scoring runner is the official Java v6 CPU/War implementation with a
minimal test-only deterministic cohort/seed wrapper. CPU semantics, placement,
Zombies and scoring are unchanged. Fixed four-team cohorts are enumerated
externally because the stock runner does not fully honor its seed for cohort
selection/order. The browser simulator is used only to assemble, disassemble,
step and inspect the arena.

## Remaining limitation

The available 2025 online binaries are the strongest current evidence set, not
unknown future finalist code. The final is also a clean-slate event with new
Zombies, so no static benchmark can guarantee the actual ranking. The correct
competition workflow is to preserve this general engine as a baseline, then
adapt at the event to the released Zombies and published Survivor 1 field.
