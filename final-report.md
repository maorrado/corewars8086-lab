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

The strongest robust pair produced by the measured search is Chimera `m049` in
`final/ChimeraA.asm` and `final/ChimeraB.asm`. The compiled survivors are 189
and 117 bytes.

| Evaluation | Battles per pair | m048 | m049 | New_Best with m049 |
|---|---:|---:|---:|---:|
| Fresh all-2025 holdout `cd1` | 6,000 | 0.646806 | **0.646806** | — |
| Fresh direct-counter contexts | 1,600 | 0.281875 | **0.453979** | 0.441240 |

`m049` keeps the strategy, constants, code sizes, and instruction counts of
`m048`. It only reorders three dependency-safe initializer sequences so that
`MOV BX` precedes `PUSH CS; POP SS`, removing the exact byte signature used by
the submitted counter.

## Comparison with the former champion

Against `New_Best`, the old `m048` scored 0.281875 on a fresh 1,600-battle
test. `m049` scored 0.453979 in the same contexts, a `+0.172104` improvement;
all 32 paired run units favored `m049` and the 95% interval for the improvement
was `[+0.154111,+0.190097]`. `m049` also narrowly led `New_Best` in the
aggregate, 0.453979 to 0.441240. That direct head-to-head margin is not yet
statistically decisive: its interval is `[-0.008005,+0.033484]` and individual
contexts split 18-14.

The change caused exact score ties with `m048` in every paired unit of the
1,000-battle tune validation, 960-battle future pool, and fresh 6,000-battle
all-2025 holdout. The promotion evidence is summarized in
`experiments/m049-promotion-2026-09-27.json`; the earlier m048 evidence remains
in `experiments/m048-promotion-2026-09-27.json`. These results do not establish
that the pair is unbeatable by unknown 2026 code.

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
replication phase. Starting with `m046`, that captured process first uses its remaining
`INT 87h` charge to find `F3 A5 06 1F` and overwrite the leading `F3` with
`CC`, disrupting matching opponent code before joining Phoenix. In `m047`, it
then uses pointer cell `0x0280` and phase `0x54`, rather than sharing A's
`0x0200` pointer and `0x34` captured-process phase. `m048` retained that A
unchanged and moved B's initial Phoenix phase from `0x2C` to `0x34`. `m049`
preserves those mechanics while reordering `MOV BX` before `PUSH CS; POP SS`
at all three Phoenix entry paths.

At browser round 4,006, the arena showed the expected near-arena-wide bands and
a live A worker at `CS=0FFCh`; all four Zombies had died by round 1,273. The
diagnostic screenshot and exact state are
`experiments/m045-arena-round4000.png` and its adjacent JSON. Scores come from
the official Java v6 engine, not the browser visualization.

## Search and reproducibility

The search covered conventional writers, AB50 families, Zombie theft,
runways, NRG launchers, worms, Zombie carpets, call cannons, protected Phoenix
variants, band quantization, asymmetric motion, signature alternatives, and
focused phase/copy-count hybrids. The latest payload stage added more than 100
signature, placement, direction, replacement, bomb, and chaining variants,
followed by two untouched randomized holdouts and an official all-field check.
After promoting `m048`, a further 122 one-line or one-constant micro mutations
were screened. The two candidates that reached fresh all-field holdouts were
not reproducibly better: the seven-word A first copy gained only `+0.000744`
with a confidence interval crossing zero, while an A stack-gap change lost
`-0.003944`. The exact rejection evidence is in
`experiments/post-m048-micro-search-2026-09-27.json`. A later adversarial audit
found that `New_Best` searched for `0E 17 BB 00` and replaced it with
`FF 26 17 4A`, an indirect jump that derailed m048 A during initialization.
The dependency-safe reorder in `m049` removes that signature at zero size cost.

`optimization-2025-report.md` records the final decision and key statistics.
`experiment-log.md` indexes every official result JSON. Each result preserves
the command, engine/config and binary hashes, opponents, Zombies, seeds, raw
score text, team score, and both survivor scores. Paired comparisons and their
per-run differences are saved as `experiments/comparison-*.json`.

## Remaining limitation

The available 2025 binaries are the strongest current evidence set, not future
2026 finalists. The competition final also releases new Zombies and may impose
new strategic pressure. The correct workflow is to keep `m049` as the measured
baseline, then revalidate and adapt it when the 2026 engine rules, Zombies, and
published Survivor 1 field are available.
