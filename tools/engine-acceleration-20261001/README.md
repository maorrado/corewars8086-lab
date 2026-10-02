# Isolated engine acceleration, 2026-10-01

## Git handover scope

The repository preserves the authored Java/JavaScript sources, validation
helpers, and the accepted `stable-v3` plan and summary. Compiled `.class`
overlays, staged battle copies, profiler output, and per-run logs remain local
regenerable artifacts; they are not part of this source handover. The local
research runtime is **not** a replacement for the original official-engine
JAR used to validate candidate scores.

This is an enabling research lane, not a new game or official-engine replacement.
The original objective remains a survivor pair generally better than exact m049
and m050. The pre-acceleration checkpoint is
`../../study-notes/engine-acceleration-resume-20261001.md`.

The original deterministic fat JAR, active runner, previous configurations,
running jobs and final/ were not edited. Their JAR identity is
`31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d`.
Existing worktree changes belong to the user and are not cleanup targets.

## Measurements and bounded scope

`profile-baseline.mjs median` reruns a complete archived 50-battle block with
Java 8's sampler and GC logging. The score CSV matches the archive exactly.
Compiled competition-thread samples include opcodeFX (15.3%), INT87 (13.5%),
War.nextRound (5.3%), and survivor-group/stream work. These are sampled methods,
including inline attribution effects, not precise independent wall-time shares.
The compilation statistic is not an additive fraction of elapsed battle time.
Four recorded GC pauses total roughly 0.221 seconds in the 33.73-second profiled
process under concurrent load. GC was not established as the main problem.

`runtime/summarize-history.mjs` found 1,541 launches and about 160 seconds of
inter-launch staging gaps against 18,640 seconds of child execution in fixed
completed suites. Parent staging accounts for about 0.85% of that sum. Replacing
the scheduler or introducing speculative result reuse has weak expected return.

`run-plan-v1.mjs` is the retained version of the first integration harness.
`measurements/differential-v1/` contains 2,700 full battle executions: three
50-battle fixtures, nine implementations, forward and reverse traversal.
These are 150 distinct scenarios repeated across implementations, not 2,700
independent scenarios. Every score CSV and per-warrior end/death telemetry CSV
matched byte-for-byte. The first original-engine run overlapped three older
research jobs which then finished, so this matrix's aggregate speed ratios are
**not accepted as reliable speedup estimates**.

`run-plan.mjs` separately measures complete identical fixtures, without telemetry
overhead, in forward/reverse variant order. It refuses old output directories,
retains commands/hashes/logs, preserves all battle counts, and checks the exact
archived score CSV after each run. Existing external jobs are not interrupted;
balanced order mitigates but does not eliminate host contention. See
`measurements/timing-v2/` for this subsequent timing experiment. The unrelated
checkout's Java jobs also finished during v2, so it too is unsuitable for a
precise headline estimate. No outside process was stopped or reconfigured.

`measurements/stable-v3/` repeats the retained contenders twice in forward and
reverse order after those Java jobs finish. Each row below is the total process
time for four repetitions of the same complete 150-battle workload (600 battle
executions per implementation). This 3,000-execution comparison is the accepted
local measurement, not a claim of constant speedup for every opponent/load:

| Implementation | Seconds | Speed vs original |
| --- | ---: | ---: |
| Original cold JVM per block | 43.608804 | 1.000x |
| War group count + energy lookup, cold JVM | 39.830170 | 1.095x |
| Persistent JVM, original engine classes | 31.395037 | 1.389x |
| Persistent JVM + both War changes | 22.180900 | 1.966x |
| Persistent JVM + War changes + INT87 scan | 21.139418 | 2.063x |

The adopted combination uses about 51.53% less wall time on this workload.
INT87 adds a small ~4.70% reduction relative to persistent-JVM + War changes,
not an independent 2x gain. All four matched traversals favor adding the scan.
Isolated group, speed and scan trials are retained in timing-v2; their noisy
absolute differences are not presented as precise separate causal estimates.
The local SerialGC/heap/compiler preset showed no reliable gain in that noisy
trial and was not adopted. Tier-1-only compilation was unpromising/slower and
not adopted. Default Java 8/JVM settings remain in use for the accepted lane.

## Isolated implementations

* `war/group-count`: replace per-check stream/filter/distinct allocation with
  a bounded direct scan. Keep exact group-name value equality, null handling,
  live/non-Zombie filtering and termination timing.
* `war/speed-lookup`: precompute the original floating-point speed formula for
  all 65,536 unsigned energies, retaining out-of-range fallback. The random draw
  is still performed even for zero or maximum speed. Cached entries depend only
  on energy, not mutable warrior memory or instructions.
* `war/combined`: both War changes, as a separate classpath overlay.
* `int87`: scan current bytes directly only for exact supported memory classes
  and a freshly verified fully readable, non-20-bit-wrapping segment. Preserve
  16-bit offset wrapping, scan direction, first match, ordered writes, faults
  and listener callbacks. No memory, opcode or match results are cached. Other
  cases fall back to the original implementation.
* `runtime/SerialBatchMain`: reuse JVM/JIT infrastructure but construct fresh
  Options, Competition, repository, listeners, seeded iterator and Wars for
  each original block. Synchronously await actual score saving. No progress bar
  in this headless research lane. Never reuse mutable battle state or scores.

The memory fast path was built alongside a normalized-original source control;
the base JAR is never overwritten. Build manifests record exact source/class
identities. `runtime/research-batch.mjs` snapshots its runtime and every input,
retains original settings, writes only new paths, and labels results schema-v2
research rather than pretending they are original cold-JVM results.

## Correctness evidence

Root reviewed the implementation diffs, runtime lifecycle and validation code.
No actionable correctness findings in those reviewed changes.

`validation/run-2026-09-30T23-01-19-392Z/manifest.json`: original JAR,
source-control and INT87 emit 39 byte-identical semantic fixture lines, SHA256
`1b0bbf13929db60c33033e8d41b176223592b7ac827b37f7bc96f0e9c5716d9f`.
Coverage includes register state, whole-memory digests, ordered accesses and
writes, first matches, read short-circuiting, partial faults, exhausted charges,
segment/physical wrap, self-modified code/immediates and overwrite-before-rescan.

`war/edge-fixture-results.json`: original plus all three War overlays each pass
65,536 energy values, eight outside-domain values, 37 group-count cases, 37
termination checks and 14 exactly-one-RNG-draw tests. Common energy-vector hash:
`28d78bb6fa2e6ceff0deed8f00dd56514ccafc0cd122a1e19736cc943397dd3a`.

The complete 2,500-battle original confirmation panel was replayed under
`replay-panel1-m050/` in 52.373 seconds. `audit-derived.mjs replay` validated
all 50 blocks against original-engine archived raw CSVs, exact files, names,
seeds and counts. All matched. This is an additional 2,500 distinct scenarios,
not a timing comparison against the older concurrently loaded original run.
The successful replay audit is retained at
`../../experiments/codex-goal-20261001/accelerated-screens/replay-equivalence.json`.
The alternative `replay-panel1-m050-war/` is only prepared, not executed, and
must not be cited as additional evidence.

## Deferred work / stop boundary

Do not turn this into an engine rewrite. Primitive-address APIs throughout the
decoder/REP implementation and typed event dispatch could improve hot loops,
but require substantially broader permission/fault/listener validation. Arena
initialization occupies a small sampled share and a fresh arena remains required.
Mutable-memory match/instruction caches are deliberately not introduced.

Installed standalone JRE and JDK are the same HotSpot 8u504 build; changing the
global Java installation is unnecessary. Local JVM-option trials are confined
to child processes. A new Java-version port, pooling/resetting Wars, parallel
score reductions and dynamic scheduler changes are deferred unless measurements
show enough additional payoff to justify their validation costs.

The bounded acceleration work is complete. `resume-research.mjs` automatically
passed the replay gate, preserved the existing screen manifests and launched
the original research: five bootstrap arms (2,500 battles) and two
conditional-camper arms (400 battles), using at most two independent serial
JVMs. Output is under `../../experiments/codex-goal-20261001/accelerated-screens/`.
New positive screens still need fresh matched holdouts and final confirmation
using the unchanged original engine. No new champion has been established by
this infrastructure work, and the original objective is not complete.
