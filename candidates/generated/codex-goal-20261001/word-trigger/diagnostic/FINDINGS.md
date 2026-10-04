# Accepted original-engine death replay

`run-replay.mjs` completed all 50 archived median-cohort battles. Both raw
scores and standard telemetry matched the original bytes exactly. The observer
only records state; it does not change warriors, memory, RNG, turns or engine
classes. Execution SHA-256:
`9739aacfdfcdebf5ed0c8271e5de9a1d8cb02f120fd9be3d843ec846a228a38c`.

Of 38 watched m050 deaths, 31 are memory exceptions. In **30**, the private
17-byte worker is intact, SI=0, CX=9, and CS=0FFCh. The current arena anchor is
`FF A5 disp16`, not the intended `FF 1F`. The real engine decodes this as
`JMP near [DI+disp16]`, using DS, which still denotes the private stack. The
bad memory read leaves IP exactly four bytes past the anchor. These are not
REP-copy overruns: no source-copy progress occurred at this point.

Example: war 4, B, round 617. Pointer=24A2h, DI=24A3h, IP=24A6h, DS=26C0h;
bytes `FF A5 22 FA` request a word at private offset 1EC5h, outside the 0800h
stack. Source-level decoding was checked against Cpu.java's FF group and
IndirectAddressingDecoder mode 2 / r-m 5. `analyze-deaths.mjs` reconstructs all
30 addresses from accepted JSONL and validates its execution hash linkage.

The remaining memory death has corrupted CS=CCCCh; seven deaths are CPU
exceptions. These may have different mechanisms. The observer does not record
the writer that damaged each byte, so no specific opponent is blamed. This
duration-selected three-opponent cohort must not be extrapolated to the whole
75-team field.

Research implication: merely speeding up the REP copy does not remove the
long-lived, two-byte arena anchor. A bounded next hypothesis is shorter dwell
on each anchor, with explicit measurement of the attack-coverage tradeoff and
matched full-field controls. No immunity or score improvement is established.
