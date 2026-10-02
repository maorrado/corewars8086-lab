# Original-goal checkpoint before isolated engine acceleration

## Continuation update (2026-10-01)

Acceleration is now implemented and verified; original research was resumed
automatically and its next seven arms have already completed. Accepted quiet-host
balanced comparison: original 43.608804 seconds versus adopted persistent JVM +
War + INT87 overlay 21.139418 seconds for 600 complete battle executions each:
2.063x throughput / approximately 51.53% less wall time. The first two matrices
were affected by naturally finishing unrelated workloads and are not headline
speed estimates. No outside process was stopped. Default JVM flags unchanged.

Correctness: 2,700 integration executions gave exact original score and
per-warrior telemetry CSVs; edge fixtures covered full energy domain, RNG draws,
permissions, partial faults, wrap, self-modification and scan ordering. A further
full 2,500-battle panel replay matched all 50 original raw score CSVs exactly.
The original JAR/runner/configs and final/ remain untouched by this work.
See tools/engine-acceleration-20261001/README.md for commands, timings and hashes.

Automatically resumed screens (same frozen rosters/seeds/counts, new isolated
research execution directories; all complete):

| Arm | Points/battle | Evidence/next step |
| --- | ---: | --- |
| m050 control | 0.647000000 | 500 battles |
| c090 control | 0.641333330 | 500 battles |
| entry_lea | 0.667666662 | +0.020666662 vs m050; fresh holdout required |
| b_fallthrough | 0.637666664 | Negative screen; no advancement |
| both bootstrap changes | 0.680333330 | +0.033333330 vs m050 (~5.15% relative), selected-screen lead only |
| conditional-camper | 0.330000000 | 200 battles vs matched control 0.491666670; negative both seeds |

Artifacts: experiments/codex-goal-20261001/accelerated-screens/ contains full
inputs/runtime snapshots, per-block raw scores and audited analyses. `entry_lea`
and `both` advance to a newly preregistered holdout against BOTH exact m049 and
m050, with fresh regrouping/seeds. No champion or final replacement is justified
by these screens. The overall original goal remains active and incomplete.

An additional genuinely different B-STOSB-imp family completed its frozen
1,000-execution paired screen: candidate 0.400666668 versus m050 0.644666666,
delta -0.243999998. It is rejected, not advanced. The earlier assembly-guard
repair did not change its instruction design; exact 31-byte assembly and the
unchanged m050 B opener were verified before freezing.

The next holdout is now complete and audited: four arms (`entry_lea`, `both`,
exact m049 and exact m050), 2,500 battles per arm, one fresh 25-triple grouping
of all 62 senior teams, and two unused seeds. Manifest SHA-256:
`199c261970f36c1850100875fb20cac14935cd81a749fa55e081463bdecc253a`.
Inputs, accelerated runtime and a conservative four-comparison 99% cohort gate
were fixed before execution. Results belong under
`experiments/codex-goal-20261001/accelerated-bootstrap-holdout/`.
All 10,000 executions were validated. Entry_lea scored 0.697466670, both
0.698000000, m049 0.691333339 and m050 0.703400004. Both candidates failed
the predeclared holdout gate, with negative means in both seeds against m050.
The apparent screen improvements did not reproduce; no promotion. A separately
motivated B quantizer fusion then passed exhaustive original-Cpu arithmetic and
79 inert bootstrap tests, but failed its 1,000-execution paired field screen:
0.661999998 versus m050 0.663333332. It is also rejected. Post-acceleration
research now totals 14,900 new executions, no new champion, no owned active
battle processes. Continue with mechanistic telemetry for a different recurring
survival/offense mechanism. See the current research progress file for details;
the original goal remains active and is not marked complete.

All three pre-existing confirmation jobs completed naturally; none was stopped,
restarted, or migrated. The frozen analyzer checked all 15,000 battles, 300
blocks, 134 current inputs and 3,600 staged input copies. Scores per battle:
c090 0.651500004, m049 0.639266675, m050 0.652100004. c090 minus m050 is
-0.000600000, approximate 50-cohort 95% interval [-0.005454773, +0.004254773].
The prespecified gate fails. No promotion; no final/ change. Against m049 the
mean is +0.012233329, but panel/seed consistency also fails. Panel 2's difference
from m049 is effectively a tie (about -4.8e-9 from CSV rounding), not a meaningful
loss. The authoritative six result files remain in lea-confirmation/results/.

## Historical intermediate checkpoint (superseded by completion above)

At this intermediate checkpoint the next work was the already-frozen three
bootstrap variants and conditional-camper screen, after infrastructure
validation. Their seeds, sizes and selection rules were unchanged by the
negative c090 result.

Acceleration is isolated under tools/engine-acceleration-20261001/. Initial
sample profiling reproduced the original median fixture's full 50-battle CSV.
It identified INT87, opcodeFX and survivor-group stream work, plus substantial
JIT/startup activity. Four recorded GC pauses total about 0.221 seconds; GC is
not established as the primary bottleneck. Historical parent staging gaps were
only about 0.85% of summed launch spans, so no invasive scheduler rewrite.

Root reviewed the INT87 fast-path implementation, War group/speed patches,
serial batch wrapper and semantic fixtures. No actionable correctness findings
in the inspected changes. The INT87 path caches no bytes/matches: it checks full
segment permissions each invocation, reads current bytes, retains ordered
writes/listeners, and falls back to original code for unsupported memory.
39-line unit differential output is identical for original/source-control/INT87,
SHA256 1b0bbf13929db60c33033e8d41b176223592b7ac827b37f7bc96f0e9c5716d9f.
Full integration and balanced timing validation are still pending at this update;
do not interpret source-control timings under changing live load as speedups.

Saved on 2026-10-01 local time, before beginning the user-requested acceleration
work. The active original goal remains: find a survivor pair that reproducibly
beats exact m049 and m050 in broad four-team competition, not only a counter
duel. Acceleration is an enabling subtask, not goal completion.

## Current branch and integrity

Branch: `codex/optimize-2025-survivors`. Preserve all existing dirty changes.
Do not switch branches, commit, push, overwrite the active JAR/runner, or alter
`final/`. Prior historical results and active configurations remain frozen.
Original deterministic engine SHA-256:
`31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d`.

Exact references:

- m049 A: `106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973`;
  B: `7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77`.
- m050 A: `0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44`;
  B: `06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782`.

## Established results, not new claims

See `codex-goal-20260930-progress.md` for the prior research. Several positive
screens failed fresh tests (pair swapping, XOR-SP, shorter B copy). Anchor-free
moving-body designs failed survival. Earlier XOR-B pointer defense improved
counter-present matchups but lost about 3.55% relatively in the 10,000-battle
general 2025 proxy. No new broad champion was established by those experiments.

The completed synthesis audit is in
`candidates/generated/claude-synthesis-audit-20260930/README.md`:
5,000 fresh battles/arm on the fixed published field gave c090 0.679000006,
m050 0.675966674, m049 0.671766674, synthesis 0.671533337.
c090's small gain was positive across four seed slices, but its cohort
sensitivity interval included zero; regrouped senior confirmation is underway.
Synthesis won direct matchups but not the broad comparison. Do not confuse it
with Claude's older stride-toggle counter.

## Live work — do not stop or restart

The following three unified-exec sessions were directly polled alive when this
checkpoint was saved. Each runs panel 1 and then, only on success, panel 2:

| Arm | Exec session | Node PID at snapshot | Last observed panel-1 progress |
| --- | ---: | ---: | --- |
| c090 | 94367 | 26604 | cohort 08, seed 2 executing |
| m049 | 15277 | 30676 | cohort 07, seed 1 executing |
| m050 | 57043 | 31900 | cohort 06, seed 2 executing |

Command template: `node official-benchmark.mjs candidates/generated/codex-goal-20261001/lea-confirmation/panel-1-<arm>.json`,
then panel 2. The per-cohort Java child PIDs change normally; parent sessions
are the authoritative continuation handles. Re-poll before concluding a job
ended. Do not rerun a job merely because it has not produced its final JSON.

Confirmation manifest SHA:
`e58f45cea58b81de33062edaa8e6275a378ee2433d7afa1d98fd08ef93eec17c`.
It freezes 5,000 battles/arm, 62 senior teams, two new 25-cohort panels, four
fresh seed strings, identical `COD_pair` names and one thread per arm.
Results and archived runs are inside the suite. Once all six configs finish:
`node candidates/generated/codex-goal-20261001/lea-confirmation/analyze.mjs`.
The analyzer has been authored but still requires root inspection before its
claims are relied on. Run the original frozen jobs to completion unchanged.

Another user's/Claude's checkout is running `official-benchmark.mjs
config-bigcheck-c090alone.json` (Node PID 16400 at snapshot) under
`C:/Users/ronyr/codeguru-work/corewars8086-lab`, with four Java threads.
It is not ours: do not stop it or modify that checkout/environment.
The machine has eight logical processors and about 32 GiB RAM. Isolated
profiling should be resource-conscious while these jobs remain live.

## Authored but not run

- `candidates/generated/codex-goal-20261001/bootstrap-designs/`: exact c090
  controls plus EntryLeaA (185 bytes, hash `2b7c71677831d5a78458519b20b2dbaddbb304b477ca828a90d2ff34c3adf052`)
  and FallthroughB (111 bytes, hash `74dcd3e0fb5a10089c58d66e6c7883f286367085ec1142d456961abbb9badb1a`).
  Three combinations save one startup instruction in A, B or both. Main
  inspected complete source/diffs: no actionable defects; workers remain
  exactly 17 bytes. No battle results yet. A five-arm 500-battle/arm screening
  protocol is being authored in its `screen/` child; inspect current files
  rather than assuming preparation or execution completed.
- `conditional-camper-screen/`: a prepared old alternative is now assembled
  and frozen. B is 66 bytes, hash `7dfc5e7d17cf0dbaeb1a37e44dfe74254d8d88020bc71463c6d01348bfd15ccd`;
  A is exact m050 A. Configs `control.json`/`camper.json` specify 200 battles/arm.
  Manifest SHA `e4cf9d05a76e6dbb0e27b7d3d920ea2474d094321d257deef5c626c2e56d29bd`.
  No Java has been launched. Main read the B source; config/analyzer review is
  still needed. This tests a tiny static arena loop, not a moving worker.

## Automatic next actions after worthwhile acceleration

1. Collect and verify all six original confirmation results; no interim
   selection or early favorable stopping. Retain original engine provenance.
2. Finish review and execute the unrun bootstrap and camper screens using
   only a correctness-validated accelerated path, with provenance identifying
   that path. Preserve frozen originals; author separate execution configs if
   acceleration requires a different runner/JAR.
3. Validate any promising candidate on fresh paired broad-field holdouts
   against BOTH original references. A screen win is not a promotion.
4. Continue seeking the broad-strength goal; do not mark it complete merely
   because the acceleration subtask passes.

Acceleration must preserve full battle counts, rounds, game semantics,
mutating-memory behavior, seeding and reproducibility. No unsafe instruction
or memory-content cache without complete invalidation semantics. Benchmark
individually and in combination, record negative attempts, and stop investing
when likely future savings no longer justify engineering/validation time.
