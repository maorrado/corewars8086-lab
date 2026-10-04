# Anchor-free direct-copy Phoenix (experimental)

The m049 instrumented telemetry on Claude's research branch found that most
deaths occur after entering the Phoenix segment and cluster near the two-byte
`FF 1F` band anchor. This pair tests a different replication topology: copy
the complete worker to the next band via `REP MOVSW`, then `CALL FAR [BX]`
directly into its first byte. It does not create or execute an `FF 1F` anchor.
The private stack remains `SS`; `SP` is reset to `07F0h` before every far
call, so the repeated call-return records cannot underflow that stack.

The worker is designed to be exactly 16 bytes, and every first and subsequent
copy uses eight words. The source contains a NASM-time assertion for this.
Warrior A keeps m050's Zombie B/D capture and the captured process also uses
the direct-copy topology. Warrior B uses the same direct-copy worker with a
different phase/step/pointer cell. The main startup search signature and
replacement are unchanged from m050.

This is a *mechanical hypothesis*, not a measured improvement. It trades
the old recursive anchor/call behavior for direct copies, so both scoring and
attack coverage may drop despite fewer anchor-specific deaths. Before any
promotion, assemble both sources (256-byte limit), verify direct worker bytes
and engine opcode support, run a single-battle trace to verify liveness and
memory safety, then a same-name paired field screen and fresh holdout against
exact m049 and m050. Do not use an old differently named control as paired
evidence. No `final/` file is changed by this research.

Static build was completed using this repository's browser-backed NASM
wrapper. A is 175 bytes (SHA-256
`25df2cc2e511ed361b7659656a484f73c4ec953d4c8ae4d1d63114f8f91f19c0`),
B is 105 bytes (SHA-256
`04ca29cc99b1284760892868227fcb76fe41a261b76491ab7cf70f29978c87bd`).
Listings and a manifest are in `build/codex-goal-20260930-telemetry-direction/`.
Both listings show the worker as 16 contiguous bytes, exactly matching the
eight-word copies. All smoke input paths were verified to exist.

The original m049 night telemetry and engine audit are on the existing
`claude/scout-executor-research-2026-09-29` Git branch at
`study-notes/night-session/progress-2026-09-28.md`. This local candidate
was not present in the historical dual-anchor, gardener, or direct-scout
sweeps; it eliminates the anchor instead of retuning or repairing it.

## v1 smoke and trace: rejected

The official deterministic 20-battle smoke scored only **0.050000 team**
(A 0, B 0.05), so v1 is not competitive. The run is saved at
`experiments/codex-goal-20260930/telemetry-direction/direct-copy-smoke.json`.
An independent one-battle replay using Claude's existing debug-trace JAR,
with the same seed and staged binaries, found:

- A, load `69F0`, entered direct-copied code and died at round **314**,
  `CS:IP=0FFC:8CB3`, CPU exception. At round 312 its expected
  `MOV SP,07F0h` bytes had become `BC C8 86`, setting `SP=86C8`;
  round 313 executed mutated `00 10`, and round 314 hit `CC`.
- B, load `CE14`, died at round **1222**, `CS:IP=0FFC:74AF`, CPU exception.
  It was partway through its `REP MOVSW` (`CX=4`); the live worker bytes
  were no longer the copied 16-byte worker and started with a repeating
  `AB 52 A5 A5 ...` stream. The exact writer of the changed bytes was not
  identified. These observed war-0 deaths show later arena-code corruption,
  **not** an initial own-bootstrap copy overlap in this particular battle.

Review separately found a deterministic initial-overlap defect in v1 for
legal loads. A at load `0FC9` executes the bootstrap `REP MOVSW` at arena
`1061` (source offset `98h`), while its first destination
`0FFC:10A2` aliases arena `1062`, the `A5` byte of that very instruction.
The next `REP` iteration refetches corrupted code. B at load `340F` has the
same geometry: bootstrap `REP MOVSW` at arena `3461` (source offset `52h`),
destination `0FFC:34A2` aliases `3462`. The 20-battle smoke did not hit
these exact load alignments, but the source and segment arithmetic prove the
failure mode. This is a correctness defect, not a statistical score effect.

## v2 controlled overlap guard: assembled, untested

`direct-copy-v2-a.asm` changes only A's main phase `10h` to `40h`;
`direct-copy-v2-b.asm` changes only B's main phase `34h` to `64h`, preserving
their original `24h` phase separation. The captured-Zombie phase remains
`54h`. Because the quantizer's remainder is at most 59 high-byte units,
these new main phases put the initial copy more than 1 KB ahead of the
warrior's loaded source or far away after address wrap. Thus the first
direct copy cannot overwrite its own source or bootstrap instruction for
any legal load offset. This does **not** prevent later enemy/ally arena
writes from corrupting a moving worker, the actual deaths observed in war 0.

v2 assembled successfully at 175/105 bytes. A SHA-256 is
`a2edb62f458363a042797f2bda644f7f39160cdac1b11abaf3069e4c70ea245f`;
B SHA-256 is
`a1168b17ac25a6ff3fa25b238ce1a2c5c8f25a1ab3cc30e8ec604fc89e3ae2c8`.
Listings and manifest are under `build/codex-goal-20260930-telemetry-direction-v2/`.
No v2 battle has been run; its expected competitive weakness remains open.
