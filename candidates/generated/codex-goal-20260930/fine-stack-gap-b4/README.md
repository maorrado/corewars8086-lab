# Fine stack-gap B +4 — research candidate only

This variant pairs unmodified m050 A with B whose Phoenix bootstrap uses
`add sp, 00284h` instead of `00280h`. The hypothesis is that moving B's
far-call stack-write front by one four-byte call frame may change the timing
of `FF 1F` anchor overlap without changing the worker or paying a recurring
instruction cost. The prior coarse gap sweep used multiples of `0080h`; it
did not test this fine phase. That sweep also overfit, so this is unproven.

Expected binary-only change: at B offset `0052h`, immediate low byte `80`
becomes `84` in `81 C4 80 02` -> `81 C4 84 02`. The encoded length, initial
Phoenix band, far pointer, `AL=0A2h`, worker bytes, and per-round instruction
count should be unchanged. A is the exact m050 binary. Risk: the stack/carpet
alignment is tightly coupled to the far-call chain; this may instead cause
early death or a broad-field regression. Run the paired 20-battle smoke first,
then only if structurally sound consider a larger matched-name field screen.

The browser-backed NASM assembler built `B.asm` as 117 bytes. Its SHA-256 is
`c3812250aa5fff1784f0988c9a2dee337613ae3461f8e36bbdc96524b32bf883`;
the exact m050 B baseline is
`06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782`.
A byte-for-byte comparison found just offset `0052h` (`80` -> `84`). The
NASM listing and manifest are in
`build/codex-goal-20260930/fine-stack-gap-b4/`.

`smoke-control.json` and `smoke-variant.json` use the same `COD_pair` candidate
name, opponents, Zombies, seed, and battle count. They are prepared but not
run by this candidate setup. No `final/` file is changed.
