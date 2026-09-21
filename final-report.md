# CodeGuru Xtreme 2025 study and survivor result

## Material studied

All 31 unique supplied recordings were reviewed end to end in their resolved
course order: 82,010.576 seconds (22.781 hours) of audio and screen content,
30,376 timestamped transcript segments, 16,418 five-second/change-triggered
frames, 5,250 retained keyframes, and 342 contact sheets. Two additional Drive
files were byte-identical aliases and were hash-deduplicated. The completion
ledger is `study-notes/README.md`; the reconciled engine contract is
`rules-2025-consolidated.md`.

## Promoted pair

The strongest robust pair produced by the measured search is Chimera `m045` in
`final/ChimeraA.asm` and `final/ChimeraB.asm`. The compiled survivors are 157
and 117 bytes.

| Evaluation | Battles | Team | Chimera A | Chimera B |
|---|---:|---:|---:|---:|
| Fresh final holdout, 5 cohorts x 10 seeds | 5,000 | 0.578600 | 0.289200 | 0.289400 |
| All 75 official 2025 teams, 25 cohorts x 2 seeds | 2,500 | 0.637267 | 0.308733 | 0.328533 |
| Fresh tuning validation, 20 cohorts x 2 seeds | 1,600 | 0.621771 | 0.298281 | 0.323490 |

Both survivors materially contribute. On the final holdout their scores are
almost exactly equal, so the team is not relying on one survivor to carry a
dummy partner.

## Comparison with the former champion

The previous `w003` pair was rerun on the exact same fresh 5,000-battle
holdout. It scored 0.555067, compared with 0.578600 for `m045`. The paired
difference is `+0.023533` per battle, with a run-cluster 95% t interval of
`[+0.000101,+0.046966]`. On the identical 2,500-battle all-2025 protocol,
`m045` scored 0.637267 and `w003` 0.608000; that interval narrowly includes
zero.

The nearest finalists `l022` and `l056` are statistically tied with `m045` on
the second holdout. `m045` was promoted because it retained their team score,
slightly led the all-2025 test, and gave the best A/B balance. These results do
not establish that it is unbeatable by unknown 2026 code.

## What the pair does

The worker is copied into the private stack and `DS` is moved there, protecting
its source from ordinary arena painting. A far pointer stored in private memory
targets the shared arena through segment `0FFCh`. Recursive far calls leave a
controlled return-address trail; `MOVSB`, `MOVSW`, and `REP MOVSW` then expose
and copy a live worker into new spatial bands.

Survivor A uses a `0x3C00` target step and an eight-word first copy. Survivor B
uses a `0x4400` target step, `0x4000` stack motion, and `0x0280` initial gap.
Both also search backward with `INT 87h` for the live 2025 Zombie-B/D tail.
Survivor A redirects a captured process through `0x5D13` into a third protected
replication phase.

At browser round 4,006, the arena showed the expected near-arena-wide bands and
a live A worker at `CS=0FFCh`; all four Zombies had died by round 1,273. The
diagnostic screenshot and exact state are
`experiments/m045-arena-round4000.png` and its adjacent JSON. Scores come from
the official Java v6 engine, not the browser visualization.

## Search and reproducibility

The search covered conventional writers, AB50 families, Zombie theft,
runways, NRG launchers, worms, Zombie carpets, call cannons, protected Phoenix
variants, band quantization, asymmetric motion, signature alternatives, and
focused phase/copy-count hybrids. In the latest stage alone, 37 extension
variants, 57 asymmetric variants, and 54 focused variants were screened before
large validation.

`optimization-2025-report.md` records the final decision and key statistics.
`experiment-log.md` indexes every official result JSON. Each result preserves
the command, engine/config and binary hashes, opponents, Zombies, seeds, raw
score text, team score, and both survivor scores. Paired comparisons and their
per-run differences are saved as `experiments/comparison-*.json`.

## Remaining limitation

The available 2025 binaries are the strongest current evidence set, not future
2026 finalists. The competition final also releases new Zombies and may impose
new strategic pressure. The correct workflow is to keep `m045` as the measured
baseline, then revalidate and adapt it when the 2026 engine rules, Zombies, and
published Survivor 1 field are available.
