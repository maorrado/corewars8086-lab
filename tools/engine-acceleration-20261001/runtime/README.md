# Isolated persistent research lane

These tools do not modify the original engine JAR, `official-benchmark.mjs`, any source benchmark config, or their output paths. They are an optional research lane, not final original-engine validation.

## Wrapper

Compile (repository-root PowerShell; compilation only):

```powershell
& tools/temurin8-jdk/jdk8u504-b01/bin/javac.exe -source 8 -target 8 -cp repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar -d tools/engine-acceleration-20261001/runtime/classes tools/engine-acceleration-20261001/runtime/SerialBatchMain.java
```

`SerialBatchMain` consumes a UTF-8 NUL-delimited file: header `CW8086-SERIAL-BATCH-V1`, decimal job count, then each job's ID, argument count and original engine argument strings, followed by a final NUL. This supports spaces, backslashes and Unicode without shell escaping. `batch-format.mjs` writes this from `{ "jobs": [{ "id": "job-1", "args": ["--headless", "..."] }] }` and refuses an existing destination.

```powershell
node tools/engine-acceleration-20261001/runtime/batch-format.mjs jobs.json new-jobs.nul
& tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe -cp 'tools/engine-acceleration-20261001/runtime/classes;repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar' SerialBatchMain new-jobs.nul
```

Each job constructs a fresh Options parser, Options, Competition, WarriorRepository and listeners. It calls the unchanged synchronous `runCompetition`, and emits `BATCH_V1_DONE <id> <completed-wars> <elapsed-nanoseconds>` only after that call returns, including its score-file save. Callbacks preserve original telemetry formatting and semantics; the progress bar is omitted. Fresh repositories prevent score accumulation across jobs. A persistent JVM deliberately retains JIT/code caches.

Jobs must be serial (`--threads 1 --parallel=false`) and headless, use staged dot-free survivor filenames, existing input/output-parent directories, and new score/telemetry files. Failed jobs abort the batch; nothing is deleted or retried automatically.

## Existing-config adapter

Preparation never launches Java. It requires an original config explicitly specifying `threads: 1` and `parallel: false`; parallel configs are rejected rather than silently reinterpreted. It preserves the original cohort-major/seed-minor iteration, names, battle counts, team copy order and Zombie copy order.

```powershell
node tools/engine-acceleration-20261001/runtime/research-batch.mjs prepare path/to/config.json path/to/NEW-research-output
```

Optional class overlays (in classpath order) and selected experimental JVM flags are explicit:

```powershell
node tools/engine-acceleration-20261001/runtime/research-batch.mjs prepare path/to/config.json path/to/NEW-research-output --overlay tools/engine-acceleration-20261001/int87/classes --overlay tools/engine-acceleration-20261001/war/combined/classes --jvm-option -XX:+UseSerialGC
```

The new directory contains the byte-exact source config, derived config with isolated output paths, all staged block inputs, snapshots of the base JAR and wrapper/overlay classes, authoring sources, NUL job manifest, execution plan and plan SHA-256. Overlapping overlay classes are rejected. The plan records the full original config, original and archived file hashes, Java executable identity, staged Zombie directory order and exact command. Prepared directories must not be moved or edited.

Only after review/equivalence validation, execute explicitly:

```powershell
node tools/engine-acceleration-20261001/runtime/research-batch.mjs run path/to/NEW-research-output
```

This launches one JVM, validates frozen inputs before and after, checks actual stdout start/completion counts for every job, parses exact score identities, validates warrior/team sums and integer no-award deficits, then writes each `run.json` and a schema-v2 `result.json`. Original-shaped candidate/scores/aggregate fields remain available, but actual batch command, per-job engine arguments, base engine/config hashes and research provenance distinguish these records from cold official results. Output files are never overwritten; partial failures retain logs and completed blocks and require a newly prepared directory for a retry.

Per-job `elapsedSeconds` measures the wrapper's in-JVM job, not process startup/shutdown. `researchExecution.processElapsedSeconds` measures the entire child process. Do not mix these timing denominators. Java executable hashing is not a complete installed-JRE attestation. Zombie enumeration remains the base engine's platform-dependent unsorted behavior; the adapter does not sort it or change rules to achieve determinism.

## Existing timing evidence

`summarize-history.mjs` reads only named completed historical results and prints their elapsed-time distributions. Its old-run timings cannot isolate startup/JIT cost. `RuntimeEnvelopeProbe.java` is a separate startup/class-loading measurement aid, not a game benchmark. The parent `../run-plan.mjs` owns paired forward/reverse cold-JVM options, exact-score/telemetry equivalence, and timing experiments; this directory intentionally does not duplicate that sweep.
