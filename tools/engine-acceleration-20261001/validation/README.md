# Engine acceleration semantic fixtures

`EngineDifferential.java` is a small standalone assertion/trace harness compiled against the pinned original fat JAR. It changes no engine file. It prints deterministic TSV including CPU state, observable write events, generic-memory access-order hashes, and whole-memory SHA-256 hashes. It is **not** a throughput benchmark.

Compile from repository root with the bundled JDK:

```powershell
& tools/temurin8-jdk/jdk8u504-b01/bin/javac.exe -encoding UTF-8 -cp repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar -d tools/engine-acceleration-20261001/validation/classes tools/engine-acceleration-20261001/validation/EngineDifferential.java
node tools/engine-acceleration-20261001/validation/run-units.mjs
```

The runner first verifies the original JAR hash and source-control Java sources (normalized line endings only), then runs original, source-control, and INT87 overlay sequentially. Overlay classes precede the JAR; the harness precedes both. Optional positional arguments replace the two default overlay directory names. Each execution creates a new validation-local `run-<timestamp>` directory and records source/class/JAR/runtime hashes plus stdout/stderr. Any assertion, stderr, incomplete run, Java/JS seed disagreement, or output difference fails. The first comparison is the source-recompiled control against the original binary, so source/JAR drift is not misattributed to optimization.

## Exact cases

- Same-segment 16-bit offset word wrap, distinct linear-carry sentinel, 20-bit physical wrap, inclusive region endpoints, reversed region behavior.
- Low-byte word commit before a denied high byte; listener sees the new value and original segment/offset in low-before-high order.
- Instruction-fetch offset wrap; separate data/execute permissions; IP advancement before fetch exceptions.
- Self-modified next opcode and changed immediate visible immediately on the same CPU instance.
- Generic-memory INT87 forward/backward full no-match scans: exactly 65,536 first-word calls and 131,072 data byte reads; first match; offset-wrap pattern; short-circuit access order and deliberate read exceptions.
- Exact native restricted-memory INT87 path: ES=1000, both DF directions, full no-match, multiple matches, and first matched patterns at FFFD/FFFE/FFFF; non-arena ES=3000; whole-memory digest and full CPU state.
- Native 20-bit-wrapped ES fallback, partial-readable first/second words, partial-write fault after three committed bytes, no bomb charge, unchanged DI/other charge, and repeated scan after an intervening memory overwrite using the same CPU/memory.
- Java seed parsing/hash plus signed-long increment compared with a JS UTF-16/BigInt implementation, including adjacent hash strings, numeric strings, 64-bit limits, overflow, and a surrogate pair.

## Required integration gate (owned by root harness)

Unit equivalence is necessary, not sufficient. Run original, source-recompiled control, and proposed overlays against the **same frozen archived real-opponent binaries**, names/load order, cohorts, seeds, battle counts and engine options. Use sequential one-thread execution and telemetry. Compare complete group and warrior score CSVs, not only candidate totals; compare every per-war/per-warrior telemetry field, including war seed, winner/order, load offset, end round/reason, death round/reason, final registers, energy and both bomb counters. Require complete run counts, identical input hashes and no dropped fields. Paths, timestamps, process timings and engine/class hashes are incidental metadata, not battle outcomes.

Use more than one archived warrior family and cohort, include both INT87-triggering and non-INT87 cases, and preserve one no-match-heavy case. A measured speed claim additionally needs isolated sequential repeats of identical workloads/JVM options; these semantic fixture timings must not be used for that claim. Existing frozen research screens remain unrun.
