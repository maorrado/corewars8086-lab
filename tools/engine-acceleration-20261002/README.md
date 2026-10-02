# Runtime acceleration follow-up — 2026-10-02

For Git handover, only the source, runner, and compact plans/summaries are
preserved. Compiled classes and per-battle outputs stay local and can be
recreated; the rejected REP MOVSW path must not be treated as the accepted fast
profile.

This isolated follow-up tests one additional CPU hot-path optimization. It does
not edit the original deterministic JAR, engine sources, active benchmark
processes, or `final/`.

## Tested: special-case `REP MOVSW`

The CPU profile retained from the prior acceleration work attributed about
15.3% of sampled CPU frames to `opcodeFX`, so an isolated class overlay added a
dedicated `REP MOVSW` branch while preserving the original `movsw()` memory
access and one-opcode-per-round behavior. Source: `cpu/rep-movsw/src/.../Cpu.java`;
compiled Java 8 overlay class SHA-256:
`482D8937152151962A4EFB86F29F453D1AFE1F329464B7E41D2CA92262D346C0`.

Correctness gate passed on three archived complete fixtures (50 battles each),
in forward and reverse order: 900 battle executions total across original,
previously accelerated `batch-all`, and the new `batch-all-rep` implementation.
Every run's full score CSV matched its archived byte-for-byte; every run's
telemetry CSV matched the original baseline byte-for-byte. Original engine JAR
SHA-256 remained `31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d`.

## Timing result: reject the new branch

Balanced forward/reverse totals for the same 300-battle workload:

| Implementation | Seconds | Relative to baseline |
| --- | ---: | ---: |
| Original JAR, cold JVM per fixture | 79.179038 | 1.000x |
| Existing persistent JVM + War + INT87 overlays (`batch-all`) | 40.008914 | 1.979x |
| Same plus dedicated `REP MOVSW` path | 43.785375 | 1.808x |

The extra path was about 9.4% slower than `batch-all` on this paired test. It is
therefore retained only as a rejected experiment; do not use it in the fast
profile. This does not invalidate the earlier accepted quiet-host 600-battle
measurement (2.063x, see `../engine-acceleration-20261001/README.md`); the
current short run is a separate, noisier confirmation.

A second balanced run omitted telemetry from all implementations (same three
fixtures/order, 300 battles each): baseline 78.991367 s, `batch-all`
43.049789 s, and `batch-all-rep` 46.036774 s. This reduces the estimated
regression to 6.9%, but still does not support adopting the REP branch. All
score files again matched the archived outputs exactly.

## Reproduction

```powershell
node tools/engine-acceleration-20261002/run-plan.mjs rep-movsw-20261002 baseline,batch-all,batch-all-rep 1 validate
```

All logs, staged immutable fixtures, per-run outputs and the summary are kept in
`measurements/rep-movsw-20261002/` (full telemetry validation) and
`measurements/rep-movsw-timing-20261002/` (timing without telemetry). The
runner refuses to overwrite an existing experiment directory.

## Current usable optimization

Use the existing isolated batch runtime and class overlays under
`tools/engine-acceleration-20261001/`: they preserve fresh battle state while
reusing one JVM/JIT across archived benchmark blocks. The accepted prior
measurement reduced elapsed time from 43.608804 s to 21.139418 s for 600
complete battle executions (about 51.53% less wall time). Keep the official
engine/JAR and `final/` unchanged; this is a research/benchmark lane, not an
official-engine replacement.
