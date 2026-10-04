# Claude-family population and duel stress: authoring draft

Status: authored for root review. No research entropy, freeze, or battles were
performed by the author. This is a bounded follow-on to the separate general
strength confirmation, not a substitute for it. Nothing here establishes
immunity, a new champion, or actual 2026 competition rules.

## What is being estimated

Four separately installed, hash-pinned candidate pairs: exact m049, m050, c090,
and e1. The public pool is the existing 75 published **2025 online-stage** pairs
(62 senior and 13 youth) and the same four online Zombies. This is not a verified
historical final roster. No unknown 2026 roster, rules, Zombies, or strategy
frequencies are asserted.

Scenario 0 has the candidate and those 75 opposing entrants. Scenario 5 adds
five distinct hypothetical entrants: two exact e1 copies, one exact c090 copy,
one exact synthesis copy, and one exact fixed-toggle (`XOR BP,2000h`) copy. Each
has a distinct fixed `CF01`–`CF05` name;
identical binaries are **not** deduplicated as entrants. This specified mix is a
sensitivity model, not a forecast or a worst-case pool of five identical counters.
The older fixed-toggle counter is included because the user's concern is not
limited to the newer startup/timing variants. These entrants can also
interfere with each other. They must never be treated as cooperating processes
unless the simulated behavior actually demonstrates that interaction.

Every population battle contains the candidate and exactly three opposing
teams. Five counters in the entry list do **not** mean five counters in a battle.
Candidate exposure is forced equally for all candidate arms so that differences
in participation cannot be mistaken for strength. All scores are **team points
per candidate appearance**, not battle win percentages.

Conditional on candidate inclusion and uniform selection of three from 80
opponents, the number K of family entrants has the following exact distribution:

| K | Number of opposing subsets | Probability |
|---|---:|---:|
| 0 | 67,525 | 0.8218719571567673 |
| 1 | 13,875 | 0.1688777994157741 |
| 2 | 750 | 0.00912852969814995 |
| 3 | 10 | 0.00012171372930866602 |

The denominator is `C(80,3)=82,160`; the numerator is
`C(5,K)*C(75,3-K)`. Probability of at least one family entrant is about 17.813%,
not 100%. Expected K is 0.1875. The executable self-test checks the exact integer
counts, unit sum, and expectation.

Scenario 0 uses the K=0 mean. Scenario 5 uses the weighted sum of all four means.
Using K=0 for both is intentional: absent teams have no game state. Do not take
an unweighted average of the four deliberately oversampled strata. If converting
to expected points per unconditioned tournament battle, multiply the respective
conditional score by candidate inclusion probability `4/76` or `4/81`; report
the denominator change explicitly. These estimates do not by themselves predict
the candidate's rank or all other entrants' scores.

## Population allocation: 6,400 executions

For each K, preselect 20 three-opponent cohorts. Public teams are drawn uniformly
without replacement within a cohort, independently across cohorts. Repetition
across cohorts is allowed. Family subsets are balanced exactly: all five
singletons four times, all ten pairs twice, and all ten triples twice. Their
schedule is uniformly permuted before any outcomes exist. Thus every slot has
the required uniform conditional subset distribution while rare strata receive
enough exposure to be visible. Do not describe this as exhaustively testing the
75-team public space or as balanced exposure of every individual public team.

Each cohort has one new ten-war seed range, shared across the four candidate
arms and the two name orientations. The 80 ranges are non-overlapping with each
other and all recorded prior/general-confirmation ranges. Different seed
strings alone are insufficient: the generator checks actual signed Java string
hashes and every incremented war seed.

The candidate is called `A00_TEST` in orientation 1 and `Z99_TEST` in orientation
2, placing it first/last in the sorted survivor directory. All public and family
names remain fixed, and each orientation's exact names, bytes, seed, Zombie
files and opponent set are identical across candidate arms. Orientation pairs
are paired controls, **not** independent samples. A/B order within every team
is unchanged. Each arm receives `4*20*2*10=1,600` appearances; total 6,400.

## Duels: 5,600 physical / 6,400 logical executions

Each of m049, m050, c090 and e1 is compared against each of e1, c090, synthesis,
and fixed-toggle with the same four Zombies: 16 requested matchups. Each has eight new independent
25-war seed ranges and two name assignments (`DUEL_A`/`DUEL_B`). Binary identity,
not the config's `candidate` field, determines which score is reported.

Mirrored e1/c090 runs and identical self-duel configurations are computed only
once and routed to the relevant logical comparisons using `logicalDuels` in the
manifest. There are thirteen non-self unordered matchups with two orientations and
two self-matchups with one physical configuration: 28 physical configurations
times eight seeds times 25 wars = 5,600 executions. The 800 saved logical
executions must never be counted as additional evidence. Self-duels average the
two score columns; they are a name/order control, not evidence of superiority.

Report candidate points and opponent points, plus their difference, separately
for every matchup and orientation. Do not label aggregate fractional points as
a percentage of battles won. The eight seed-block means (each averaging the
two orientations) are the uncertainty units; mirrored records are not new units.

## Engine facts underlying the design

Primary source inspection, no web inference:

- `official-benchmark.mjs` copies the candidate plus one to three opponents and
  uses `comboSize=1+opponents.length`. Hence each generated population config
  includes all four specified teams; duel configs include both specified teams.
- `CompetitionIterator.next()` calls `rnd.nextPermutation(...)`. Despite the
  comment in `Competition.java`, it samples combinations/permutations; it does
  not exhaustively enumerate unique combinations before repeating them.
- `WarriorRepository.readWarriorsFileFromPath()` sorts filenames, groups suffix
  `1`/`2`, and `createGroupList()` appends the Zombie group. Therefore merely
  reversing JSON array order is not a sufficient name/order control.
- `War.loadWarriorGroups()` then randomizes group loading. Same seed/name mapping
  preserves the randomization control, but unequal binary lengths can change
  placement rejection outcomes. Equal starting coordinates are not promised.
- Zombie files are not sorted by that reader. Preserve their copied names/order
  and audit actual loaded input order and original-engine replay; do not silently
  rename Zombie H or change Zombie speed.
- `Competition.MAX_ROUND` remains 200,000, with original scoring, no reduced
  rounds, no modified energy, and no altered instruction/game semantics.

## Analysis and decisions, fixed before freeze

First finish and audit every planned arm. For each K and candidate, average the
20 cohort means; each cohort mean averages both orientations and all ten wars.
Compute **paired** cohort differences against each exact control, not a
difference between unrelated confidence intervals. Show K=0,1,2,3 separately,
their sample sizes, and the naturally weighted scenario-5 result. Show each
name orientation as a sensitivity check without choosing the favorable one.

Use descriptive 95% paired-cohort t intervals for each conditional stratum
(`n=20`, critical 2.0930240544). For a weighted paired delta, combine the four
stratum variance estimates as `sum(p[K]^2 * s[K]^2 / 20)` and use the same
conservative t critical. Counter-subset balancing and finite public-opponent
reuse limit the interpretation of these approximate intervals; they are not
distribution-free guarantees. For duels use eight paired seed-block units and
`t(7)=2.3646242511`. Report all sixteen duel comparisons and all seven prespecified
arm contrasts (including both directions between the controls, which are
redundant descriptions, not independent evidence)
openly; these are nominal descriptive intervals, not a familywise promotion test.

Scenario 0 and scenario 5 share their K=0 estimate. For their difference, use
coefficients `[p0-1,p1,p2,p3]` with the independent stratum variances; do **not**
add the two scenario variances as if they were independent. The same paired
method applies to changes in the advantage between two candidate arms. Both
names belong to one cohort cluster; neither their two means nor individual
battles are additional primary uncertainty units.

This study diagnoses which conditions hurt a code and whether family density
changes the comparison. It cannot prove universal strength or immunity. New
defenses may be proposed only after examining actual losing mechanisms; a
targeted score gain does not excuse a broad-field regression. Any later modified
pair gets a **new** frozen study and fresh broad holdout against both exact
controls, plus appropriate family-density testing and original-engine evidence.
Do not append tuned candidates to this frozen confirmation or recycle its seeds
as an unseen holdout.

## Files and invocation after root review

`model.mjs` contains the pure schedule, exact weights, and logical duel routing.
`self-test.mjs` runs deterministic author tests without files, entropy, or wars.
`generate.mjs` reads the root-reviewed general-confirmation manifest and source
provenance; it has no battle launcher and never reads outcomes.
`analyze.mjs` refuses incomplete suites, reconstructs all 668 frozen configs,
checks all 864 actual blocks and completion markers, rehashes staged inputs and
runtime classes, verifies exact command lines and unsorted Zombie enumeration,
reparses raw score CSVs, and follows actual binary-to-name mappings in duels.
It reports conditional K results, natural-weighted scenarios, paired comparisons,
name-position variation, and clustered intervals. Its `--self-test` tests only
in-memory score parsing and raw-output framing; it does not need results or write
files. Root must still review these authoring files in full before any freeze.

Source provenance is explicitly pinned to
`f882f42bea0e77a6328580843a417d48e08e1668f1055da5accf5ed6974acddf`.
The older fixed-toggle source/assembly manifest is pinned separately to
`c8b5064e21ebe723b66cd200f16229dca615c311d788e4901964b5e1dbbe1c47`,
with A/B sizes 193/121 and hashes
`bea990bbf2c60cb4c39d80dd5b533f83a1eb62f1ad202020c6d4e93cbebc2747` /
`9761054288100948cfcf3610c8d989f16eba68f0f501b90c21b7de9ead380c8f`.
The independent general-study manifest hash must be supplied explicitly after
that study is frozen. Its entire prior range registry plus its 16 new ranges is
inherited. Any additional concurrent study must be registered before this freeze;
unrecorded external seed usage cannot be discovered automatically.

```powershell
node candidates/generated/claude-family-stress-20261001/self-test.mjs
node candidates/generated/claude-family-stress-20261001/analyze.mjs --self-test
node candidates/generated/claude-family-stress-20261001/generate.mjs --preflight --general-sha256 <reviewed-hash>
# Only after root review and the requested general-strength phase:
node candidates/generated/claude-family-stress-20261001/generate.mjs --freeze --general-sha256 <reviewed-hash>
node candidates/generated/claude-family-stress-20261001/generate.mjs --verify --general-sha256 <reviewed-hash>
# After all 12,000 physical executions finish and preserve their raw artifacts:
node candidates/generated/claude-family-stress-20261001/analyze.mjs --manifest-sha256 <stress-freeze-hash> --results-dir <668-config-run-root>
```

Freeze is exclusive and preserves failed/interrupted entropy attempts. It copies
all binaries and records source, config, runtime, seed, and candidate identities.
The 668 physical configs total **12,000** executions, meeting the initial
budget. Each run-root child must be named by its exact manifest config ID.
The analyzer's default run root is
`experiments/claude-family-stress-20261001/accelerated`; its new-only output is
`analysis.json` in this protocol directory. The generator freezes the analyzer
and statistical plan before results exist. It does not permit partial analysis
or overwrite an earlier analysis.

Keeping unique engine-seed ranges per cohort requires separate configs in the
existing verified runner. Reading timing metadata from twelve completed local
accelerated runs gave a process-minus-in-JVM-job residual of 0.210–1.876 seconds
per launch (upper median 0.589 seconds), projecting roughly 393 seconds for 668
launches, **excluding** JIT warm-up inside jobs and staging time. This is an
overhead estimate under varying host load, not a measured stress-suite runtime.
Do not alter the verified runtime or reduce the planned games to avoid it.

The parent owns launching, runtime isolation, score/input audits,
original-engine confirmation and promotion decisions. No `final/` edits,
checkout changes, commits, pushes, or writes in Claude's checkout are authorized
by this protocol.
