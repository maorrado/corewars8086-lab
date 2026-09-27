# Chimera optimization against the official 2025 field

## Outcome

`m049` is the promoted pair in `final/ChimeraA.asm` and
`final/ChimeraB.asm`. It keeps the exact strategy, constants, code sizes, and
instruction counts of `m048`, while reordering three Phoenix initialization
sequences to remove the exact signature exploited by `New_Best`.

| m049 promotion protocol | Battles per pair | m048 | m049 | Difference |
|---|---:|---:|---:|---:|
| Full tune validation | 1,000 | 0.639667 | **0.639667** | 0.000000 |
| Three-seed synthetic future pool | 960 | 0.393966 | **0.393966** | 0.000000 |
| Fresh all-2025 holdout `cd1` | 6,000 | 0.646806 | **0.646806** | 0.000000 |
| Initial direct-counter screen | 480 | 0.292153 | **0.463819** | **+0.171667** |
| Fresh direct-counter contexts | 1,600 | 0.281875 | **0.453979** | **+0.172104** |

Every paired run in the three general-purpose gates was an exact score tie.
On the fresh direct-counter test, all 32 run units favored `m049` over `m048`;
the 95% interval for the improvement was `[+0.154111,+0.190097]`. In those
same contexts `New_Best` scored 0.441240, so `m049` led the aggregate by
`+0.012740`, although that narrower direct matchup interval crossed zero
(`[-0.008005,+0.033484]`, 18 wins and 14 losses). The compact promotion record
is `experiments/m049-promotion-2026-09-27.json`.

### Historical m048 promotion

| m048 promotion protocol | Battles per pair | m047 | m048 | Difference | 95% interval |
|---|---:|---:|---:|---:|---:|
| Full tune validation | 1,000 | 0.669167 | **0.682333** | **+0.013167** | `[-0.019558,+0.045892]` over 40 paired runs |
| Three-seed synthetic future pool | 960 | 0.396240 | **0.403748** | **+0.007507** | `[-0.013173,+0.028188]` over 24 paired runs |
| Untouched all-field holdout `cp3` | 6,000 | 0.647000 | **0.660431** | **+0.013431** | `[+0.000267,+0.026594]` over 150 paired runs |

All six partition/seed units in `cp3` favored `m048`. The holdout gain is about
2.08% relative to `m047`; 85 of 150 paired cohort/seed runs favored `m048`, 9
tied, and 56 favored `m047`. The exact final binaries match the tested
`rb_p34` candidate. The compact promotion record is
`experiments/m048-promotion-2026-09-27.json`.

### Historical m047 promotion

| m047 promotion protocol | Battles per pair | m046 | m047 | Difference | 95% interval |
|---|---:|---:|---:|---:|---:|
| Fresh all-field holdout H1 | 6,000 | 0.636889 | **0.637194** | **+0.000306** | `[-0.019320,+0.019931]` |
| Fresh all-field holdout H2 | 6,000 | 0.649972 | **0.667347** | **+0.017375** | `[+0.007017,+0.027733]` |
| Fresh all-field holdout H3 | 6,000 | 0.658839 | **0.672783** | **+0.013944** | `[+0.005043,+0.022846]` |
| Combined H1-H3 | 18,000 | 0.648567 | **0.659108** | **+0.010542** | `[+0.003332,+0.017752]` over 18 partition/seed units |

Fifteen of the 18 fresh partition/seed units favored `m047`. The same candidate
also improved by `+0.008333` on the 1,000-battle tune validation and by
`+0.005986` on the synthetic future-strategy pool. The compact promotion record
is `experiments/m047-promotion-2026-09-26.json`.

### Historical m046 promotion

| Promotion protocol | Pair | Battles | Team | Difference vs m045 | 95% interval |
|---|---|---:|---:|---:|---:|
| Fresh randomized all-field holdout R1 | **`m046`** | 6,000 | **0.629000** | **+0.008722** | `[+0.001973, +0.015472]` over 6 partition/seed units |
| Same R1 | `m045` | 6,000 | 0.620278 | — | — |
| Independent fresh holdout R2 | **`m046`** | 6,000 | **0.656319** | **+0.009500** | `[+0.003553, +0.015447]` over 6 partition/seed units |
| Same R2 | `m045` | 6,000 | 0.646819 | — | — |
| Official all-2025 final check | **`m046`** | 2,500 | **0.638867** | **+0.019933** | `[+0.002211, +0.037656]` over 50 paired runs |
| Same official check | `m045` | 2,500 | 0.618933 | — | — |

Across the two fresh holdouts, all 12 partition/seed superunits favored
`m046`. Their combined mean improvement was `+0.009111`, with a 95% t
interval of `[+0.005431, +0.012791]`. The later official check independently
confirmed the direction and had a positive paired-run interval. These are the
promotion gates; the older table below records the evidence that originally
established `m045` as the foundation.

The two holdout definitions and score summaries are
`experiments/m046-fresh-holdout-r1-{definition,summary}.json` and
`experiments/m046-fresh-holdout-r2-{definition,summary}.json`. Their combined
analysis is `experiments/comparison-m046-vs-m045-fresh-holdouts.json`; the
official paired-run analysis is
`experiments/comparison-m046-vs-m045-payload-final-6101.json`.

### Historical m045 foundation

| Protocol | Pair | Battles | Team | Survivor A | Survivor B |
|---|---|---:|---:|---:|---:|
| Fresh final holdout, 5 cohorts x 10 new seeds | **Chimera `m045`** | 5,000 | **0.578600** | **0.289200** | **0.289400** |
| Same final holdout | `l022` | 5,000 | 0.578333 | 0.287500 | 0.290833 |
| Same final holdout | `l056` | 5,000 | 0.578867 | 0.276033 | 0.302833 |
| Same final holdout | old champion `w003` | 5,000 | 0.555067 | 0.283333 | 0.271733 |
| All 75 official 2025 teams, 25 cohorts x 2 seeds | **Chimera `m045`** | 2,500 | **0.637267** | **0.308733** | **0.328533** |
| Same all-2025 protocol | `l022` | 2,500 | 0.635400 | 0.306567 | 0.328833 |
| Same all-2025 protocol | `l056` | 2,500 | 0.625467 | 0.301767 | 0.323700 |
| Same all-2025 protocol | old champion `w003` | 2,500 | 0.608000 | 0.298600 | 0.309400 |
| Fresh tuning validation, 20 cohorts x 2 seeds | **Chimera `m045`** | 1,600 | **0.621771** | **0.298281** | **0.323490** |
| Same tuning protocol | `l022` | 1,600 | 0.621979 | 0.299531 | 0.322448 |

The final 5,000-battle paired holdout comparison against `w003` gives a mean
improvement of `+0.023533` team points per battle (about 4.24% relative), with
a run-cluster 95% t interval of `[+0.000101, +0.046966]`. The all-2025
improvement is `+0.029267`; its 95% interval is
`[-0.000797, +0.059331]`. Thus the new pair has a measured repeatable
holdout advantage over the former champion, but the all-field interval remains
just wide enough to include zero.

`m045`, `l022`, and `l056` are statistically tied on the second holdout.
`m045` was selected because it preserves the same team score, is essentially
identical to `l022` on both tune and all-2025, and gives the most even final
holdout contribution from the two survivors. This evidence does not prove that
no unknown 2026 survivor can beat it.

## Strategy

Both survivors quantize their initial load address into `0x3C00`-spaced bands
and run a protected private-stack Phoenix loop through segment `0x0FFC`.
Survivor A uses phase `0x10`, target step `0x3C00`, stack motion `0x3800`, and
an eight-word first replication. Survivor B uses phase `0x34`, a wider
`0x4400` target step, `0x4000` stack motion, and a `0x0280` initial stack gap.
Their private pointer cells are separate (`0x0200` and `0x0240`).

Both search backward with `INT 87h` for the `EB F9 CC CC` tail used by the
live 2025 Zombie B/D loops and replace it with an indirect jump through cell
`0x5D13`. Survivor A owns that hook and routes a captured Zombie into a
position-independent entry, where it joins the protected replication engine.
The stolen process therefore becomes another spatially separated replicator.
In `m046`, it first performs a second backward `INT 87h`
search for `F3 A5 06 1F` (`REP MOVSW; PUSH ES; POP DS`) and changes `F3` to
`CC`, disrupting matching opponent code before it becomes a replicator. In
`m047`, the captured process then uses its own pointer cell (`0x0280`) and
phase `0x54`; the original A path keeps pointer cell `0x0200` and phase
`0x10`. `m048` retained that A exactly and retuned only B's initial phase from
`0x2C` to `0x34`. `m049` preserves all of those values but moves each
Phoenix-init `MOV BX` before `PUSH CS; POP SS`, eliminating the targeted
`0E 17 BB 00` byte sequence without changing the resulting register state.

## Search history

- `x001-x012`, `y001-y016`, `z001-z012`, `w001-w006`, and `v001-v010`
  produced the former `w003` champion through broad and local searches over
  bands, phases, hooks, theft direction, gaps, and stack motion.
- `k001-k037` tested new Zombie/opponent signatures, heavy writers, target low
  bytes, far segments, steps, gaps, and bands. Apparent 200-battle gains did
  not survive 1,600-battle validation.
- `l001-l057` separated A and B motion, phase, segment, copy-count, and gap
  parameters. `l022` and `l056` emerged as complementary finalists.
- `m001-m054` performed a focused sweep around those finalists. Phase `0x26`
  (`m014`) scored 0.651771 on tune but collapsed to 0.541333 on holdout, a
  concrete overfitting example. Phase `0x30` (`m021`) also failed holdout.
- The four A/B hybrids were then measured. `m045` matched the best holdout
  score, slightly led the all-2025 field, and was the most balanced pair.
- The payload search then tested direct Zombie bombs, chaining, position and
  direction variants, two-byte replacements, and more than 50 four-byte
  signatures. The simple `F3 A5 06 1F` backward search was frozen as `m046`.
  Two independently shuffled all-field holdouts improved by `+0.008722` and
  `+0.009500`; a separate official all-2025 run improved by `+0.019933`.

## Post-m046 robustness search (2026-09-26)

A new telemetry pass covered 1,000 wars over all 20 tune cohorts. The two
original survivors finished every war with both `INT 86h` charges unused.
Capturing Zombie B or D correlated with a higher per-survivor alive rate
(`0.5264`/`0.5337`) than capturing neither (`0.4393`), confirming that the
existing common-tail theft is valuable. This evidence motivated several new
families, all compared against the frozen `m046` binaries.

- Reducing the later worker copy from 20 to 18 bytes and changing the initial
  copy counts produced a large screen result that disappeared on 1,000 fresh
  battles. The best candidate was only `+0.001333`, with 95% interval
  `[-0.012555,+0.015222]`.
- Reordering every dependency-safe worker block found an apparent early-seed
  pattern in B, but all five representatives lost slightly on 1,000 fresh
  battles (`-0.000333` to `-0.000833`).
- A split B/D thief with dedicated signatures and hooks lost at least
  `-0.115833`; spatially separated initial capture searches lost at least
  `-0.035000`; self-signature “mirror breakers” lost at least `-0.085000`.
- A one-instruction faster A hook increased measured B/D captures and led
  `m046` by `+0.009333` on 1,000 tune battles. It then scored `-0.000972` on a
  freshly generated 6,000-battle all-field holdout, with 95% interval
  `[-0.008228,+0.006283]`, and `-0.002385` on the synthetic future pool.
- Using B's two `INT 86h` charges only after the Zombie-capture attempt was the
  strongest new tune tactic. Three unrelated offset pairs improved on the
  1,000-battle validation; the leader gained `+0.037500`, with 95% interval
  `[+0.018650,+0.056350]`. The same leader lost `-0.032262` against the future
  pool, while all four bomb variants were negative there. This is a concrete
  2025-field overfit and was rejected.
- A dual-hook family led one tune validation by `+0.010667` but lost
  `-0.022835` on the future pool. The earlier adaptive-jitter leader also
  failed its untouched holdout (`-0.017500` versus its baseline).

The future pool combines protected Phoenix variants, adaptive variants,
mobile and REP bombers, a relocator, call cannon, Zombie carpet, signature
decoy, and `Registered_Winners`. This first post-`m046` batch did not improve
both the official-field evidence and the robustness gate, so none of those
candidates was promoted. Its compact decision record is
`experiments/post-m046-strategy-search-2026-09-26.json`.

## Separated captured-process search and m047 promotion

A later family separated the stolen Zombie from survivor A's original
replication state instead of changing the main worker. The search varied the
captured process's pointer cell and phase, then tested the best representatives
on tuning cohorts and the synthetic future pool. `sc_ptr280_p54` remained
positive on both and became `m047`.

Three newly shuffled all-field holdouts then compared the exact candidate
binary with frozen `m046`, using 6,000 battles per pair in each holdout. The
differences were `+0.000306`, `+0.017375`, and `+0.013944`. Combined, `m047`
improved by `+0.010542` (about 1.63% relative), with a 95% interval of
`[+0.003332,+0.017752]` over 18 partition/seed units. This reproducible result
passed the promotion gate. The complete compact record is
`experiments/m047-promotion-2026-09-26.json`.

## Post-m047 search and m048 promotion

The next search used telemetry from the synthetic future pool, broad partner
and phase screens, and strict fresh-data gates. Adaptive A/B placement,
stack-motion, copy-count, segment, captured-process, signature, and alternate
partner families produced several large screen results that reversed on new
seeds. Those variants were rejected and were not copied into `final/`.

A coverage audit then found that `rb_p34`, a previously validated B-phase
candidate, had not received a future-pool test. It changes only survivor B's
initial Phoenix phase from `0x2C` to `0x34`. It improved over `m047` by
`+0.013167` on the 1,000-battle tune validation and by `+0.007507` over 960
battles in a three-seed future pool. The preselected candidate was then opened
against untouched holdout `cp3`: 6,000 battles per pair over three fresh field
partitions and two battle seeds. It scored 0.660431 versus 0.647000 for `m047`,
a `+0.013431` absolute gain (about 2.08% relative). All six partition/seed
units were positive, and the 150 paired-run 95% interval was
`[+0.000267,+0.026594]`. This reproducible result promoted the exact candidate
binary as `m048`; see `experiments/m048-promotion-2026-09-27.json`.

## Post-m048 one-line micro search

A focused follow-up screened 122 candidates that each changed only one source
line or one placement/copy constant from `m048`. The search covered fine A,
captured-A, and B phases plus stack motion, target steps, stack gaps, pointer
cells, far segments, and copy counts. The strongest phase screen candidate,
which moved B from `0x34` to `0x25`, gained `+0.030833` on the 1,000-battle
tune validation but reversed to `-0.064747` on the 960-battle future pool and
was rejected.

Two spatial candidates stayed positive through the future pool. Reducing A's
first replication from eight words to seven then gained only `+0.000744` on a
fresh 6,000-battle all-field holdout, with a paired-run 95% interval of
`[-0.003211,+0.004700]`. Moving A's initial stack gap from `0x0200` to
`0x0260` lost `-0.003944` on a separate fresh 6,000-battle holdout. Neither is
a measurable reproducible improvement, so `m048` remained the baseline at
that stage. The compact audit record is
`experiments/post-m048-micro-search-2026-09-27.json`.

## Counter analysis and m049 promotion

`New_Best2` loads `AX=0x170E`, `DX=0x00BB`, `BX=0x26FF`, and `CX=0x4A17`
before a backward `INT 87h`. In byte order this searches for `0E 17 BB 00`,
the start of m048 A's `PUSH CS; POP SS; MOV BX,0x0200`, and replaces it with
`FF 26 17 4A` (`JMP word [0x4A17]`). That redirected m048 A during Phoenix
initialization and explains its near-zero contribution in the matchup.

The selected defense, `cd_all_reorder`, moves `MOV BX` before `PUSH CS; POP SS`
in A's main entry, A's captured-process entry, and B. It adds no bytes or
instructions and leaves all later machine state unchanged. The exact candidate
tied m048 in every paired run of the tune, future, and fresh 6,000-battle
all-field gates. Its large advantage over m048 against the counter reproduced
on two independent seed sets, and it won the fresh 1,600-battle aggregate
matchup against `New_Best`. The exact binaries were promoted as `m049`; see
`experiments/m049-promotion-2026-09-27.json`.

Every official-engine result JSON records the command, engine/config and input
hashes, cohort, opponents, Zombies, seed, raw score, team score, and both
per-survivor scores. `experiment-log.md` is the generated index, and the
`comparison-*.json` files contain the paired differences and confidence
interval inputs.

## Post-m049 adversarial audit

A follow-up investigated the apparent strength of `Registered_Winners` and
`Code_Jokers4Life` in the old browser simulator.  The browser result was not a
2025-judge result: on a controlled 6,000-battle official-v6 comparison, m049
scored `0.5277503583` and `Registered_Winners` scored `0.3719172183`.

Across four official-v6 cohorts containing `Code_Jokers4Life`, two seeds and
1,600 battles, m049 scored `0.5122917225`; Code_Jokers scored only `0.061875`.
The long Code_Jokers member is a 377-byte writer/relocator, while its 12-byte
partner derives a jump target through shared memory.  Neither targets m049's
initializer signature.

Eight defensive A variants were then tested.  Direct targets for the
Code_Jokers worker and tiny partner improved the targeted screen by
`+0.033542` and `+0.020417`, respectively.  Broader shared signatures also
raised some target contexts, but collapsed on two preselected sentinel
cohorts: the strongest target variant (`shared-worker`) scored `0.533333` on
the target subset versus m049's `0.485000`, while scoring only `0.535000` on
the sentinels versus m049's `0.787500`.  Split-Zombie versions failed the same
gate.  Registered-style geometry also regressed official 2025 evaluation.

No candidate met the non-regression requirement, so m049 remained unchanged.
The compact decision record is
`experiments/post-m049-adversarial-audit-2026-09-27.json`; selected raw configs
and results are in `experiments/post-m049-adversarial/`, and the exact rejected
sources are in `candidates/generated/chimera-jokers-defense/`.

## Arena inspection

The saved round-4,006 inspection versus `Registered_Winners`, `GoonSquad`, and
`TrojanByte` shows near-arena-wide colored replication bands and a live Chimera
A worker executing from protected segment `0x0FFC`. All four Zombies had died
by round 1,273; Chimera B died at round 3,549 while A and the replicated/stolen
code continued. The screenshot and exact register/message dump are
`experiments/m045-arena-round4000.png` and `.json`.

## Reproduction

1. Start the local simulator server at `http://127.0.0.1:8123/page.html`.
2. Assemble with
   `node assemble.mjs build/final final/ChimeraA.asm final/ChimeraB.asm`.
3. Regenerate the 2025 cohort split with
   `node generate-2025-evaluation-configs.mjs`.
4. Re-run an official template with `official-sweep.mjs` and an explicitly
   recorded `SWEEP_TAG`, `SWEEP_BATTLES`, and `SWEEP_SEEDS`.
5. Regenerate the ledger with `node generate-experiment-log.mjs`.

The promoted binaries are 189 and 117 bytes. Their SHA-256 hashes are:

- Chimera A: `106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973`
- Chimera B: `7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77`
