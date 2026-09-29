# Arena grounding — CodeGuru Xtreme 2025 / CoreWars8086 engine facts

Read this before writing any code. These are verified facts from tonight's
research (debug-trace instrumentation, direct source reading of
`repos/corewars8086-6.0.0/src/main/java/il/co/codeguru/corewars8086/`), not
assumptions. Re-verify anything you rely on heavily by reading the source
yourself — don't just trust this document blindly.

## Hard constraints

- **Byte budget: 256 bytes per warrior, no signature, for final-stage
  eligibility.** Online-stage allows 512 bytes with a signature byte every
  N bytes (irrelevant for this arena — build for final-stage rules).
- **A team is exactly 2 warriors** (A and B). `official-benchmark.mjs`
  requires `candidate.warriors` to have exactly 2 entries.
- **The `0x26` (`ES:` segment override) prefix is UNIMPLEMENTED in this
  engine.** `Cpu.java` throws `UnimplementedOpcodeException` unconditionally
  for opcode `0x26`. No `[es:xxx]`-style operand works, ever. The only way
  to touch the ES-addressed segment is through instructions with an
  *implicit* ES operand: `STOSB`/`STOSW`/`MOVSB`/`MOVSW` (destination
  `ES:DI`) and `INT 87h` (`ES:DI`-based search). To read shared memory you
  must copy the segment value into `DS` (for `LODSB`/`LODSW`, which use
  `DS:SI`) via a general register, not address `ES:` directly.
- **`AAA` (ASCII-adjust) and DAA (`0x27`) are unimplemented** — same
  exception class. Avoid these opcodes entirely.

## Register/memory init at cold boot (`Warrior.java:initializeCpuState`)

- `AX = loadOffset` (your own arena offset — free self-position info).
- `BX = CX = DX = SI = DI = BP = 0`.
- `DS = CS = your own load segment` — but this is the SAME segment for
  every warrior in the war (`ARENA_SEGMENT = 0x1000` fixed). The entire
  64KB arena is one shared flat segment; you can read/write anywhere in
  it via plain `DS:SI`/`DS:DI` addressing with no segment tricks, as long
  as the target offset is within your `read`/`write` access region (see
  below).
- `ES = your team's group-shared-memory segment` — 1024 bytes, ONE region
  shared between your A and B (allocated once per team in
  `War.java:loadWarriorGroup`, both warriors get the same segment value).
  This is a genuinely proven, working cooperative-comm channel (m049
  itself uses it via `PTR_CELL`/`FAR_SEG`).
- `SS:SP` = your own private 2048-byte stack. Private per-warrior, not
  shared with your teammate.
- Flags = 0. Energy = 0. `bomb1Count` (INT86h charges) = 2. `bomb2Count`
  (INT87h charges) = 1.

## Access control (`RestrictedAccessRealModeMemory` / `Warrior.java:52-85`)

Read/write allowed in: your own private stack region, the ENTIRE arena
segment (`0x0000`-`0xFFFF` offset, same segment for everyone), and your
team's shared-memory region. Execute allowed ONLY in the arena segment.
Attempting to execute code loaded into the shared-memory segment or your
own stack segment throws a `MemoryException` (fatal).

**Execute blind spot**: `CS = 0xFFC` (a specific segment value used by the
existing Chimera "Phoenix" far-call mechanism) has linear-address offsets
`[0, 0x3F]` and `[0xFFC0, 0xFFFF]` that are unreachable for *execution*
(though writable). Historically-confirmed: `HRZ_Registered_Winners2` died
in real 2025 finals data trying to execute at `0xFFC0` for exactly this
reason. If you use segment-aliasing tricks, watch for this.

## Turn order and timing — THE SINGLE MOST IMPORTANT FACT TONIGHT

`War.nextRound()` (`War.java:113-156`) calls each living warrior's
`nextOpcode()` **exactly once per round**, in load order (your A runs
before your B, since A is listed first). **Every single opcode — including
ones that don't change any value, like `xor di,di` when DI is already
0 — consumes exactly one round.** This engine has NO concept of variable
instruction cost; one opcode = one turn, always.

This was proven decisively tonight: removing one single `xor di,di`
instruction from a candidate (m050, a minimal variant of the current
champion) shifted every subsequent instruction's execution round by
exactly -1 relative to the original, for the entire rest of the battle
(confirmed via debug-trace: `INT87h` fired at round 11 instead of round
12, `CALLFAR` at round 57 instead of 58, etc.). This is not a rare edge
case — it is how the engine always works.

**Practical consequence for your design: every instruction you add to a
warrior's startup/bootstrap path has a real, measurable cost — even ONE
extra instruction measurably changes the outcome distribution.** Tonight's
data point: a single-instruction bootstrap-path insertion (a minimal
"check a value, maybe do something" block, ~9 instructions total, in the
CHEAPEST tested position) still cost -0.024 mean score vs. the baseline,
isolated. A ~24-instruction insert cost -0.11. **This means "smart"
behavior that requires meaningfully more code than the baseline in the hot
startup path is very likely to lose more from timing cost than it gains
from being smart — budget your added instruction count like it's
expensive, because it is.**

Additional non-atomicity fact: `REP`-prefixed string instructions
(`Cpu.java:1146-1195`) perform exactly ONE iteration per opcode fetch —
`CX` decrements once per round, `IP` doesn't advance past the `REP` prefix
until `CX` reaches 0. A multi-word write via `REP STOSW`/`REP MOVSW` is
NOT atomic across rounds; another warrior's turn can interleave mid-copy.
If you publish multi-word data to shared memory, write a validity marker
LAST (as its own separate instruction, after the payload) so a reader
never observes a half-written value as valid.

## INT 86h / INT 87h (`Cpu.java: int86()`/`int87()`)

- `INT 86h` ("heavy bomb"): 2 charges. Writes a fixed 256-byte pattern
  (`AX` repeated) to `ES:DI` onward. Destructive but blind (no search).
- `INT 87h` ("smart bomb"): 1 charge. Searches from `ES:DI` outward
  (direction set by the direction flag, `STD`/`CLD`) for a specific 4-byte
  pattern (`AX:DX`), and on the FIRST match, overwrites those exact 4
  bytes with `BX:CX`, then stops searching. **Critically: it does NOT
  report back where it found the match** — `DI` is unchanged after the
  call. You cannot use `INT87h` as a general-purpose "find an opponent and
  tell me where" scanner; it can only detect-and-patch a known signature,
  never report an unknown location.
- The current champion's own `INT87h` calls search for the 4-byte pattern
  `EB F9 CC CC`, which (verified by decoding) is literally its OWN
  encoded bootstrap immediate bytes (`mov ax,0F9EBh` / `mov dx,0CCCCh`) —
  this is a self/Zombie-recognition mechanism, already fully committed to
  a specific purpose. Don't assume you can repurpose an existing INT87h
  call for a different search without understanding what it currently
  does — verify first.

## Zombie mechanics (from `study-notes/README.md`, cross-referenced with source)

Zombies are pre-placed warriors that never score points themselves but can
be "captured" — redirected to join your replication chain — via writing
`FF 26` (a specific opcode pattern) to a location in their code. A
captured zombie that survives to battle-end does not add score directly,
but denies that space to opponents and (per tonight's telemetry analysis)
survives at ~3x the rate of an uncaptured zombie once captured (60.3% vs
19.3%) — capturing zombies is a proven-valuable but not yet
fully-exploited mechanic. Zombie speed multiplier and `int86`/`int87`
charge counts for zombies are configured externally
(`--zombieSpeed`), not something your code controls.

## Already-tried-and-rejected directions (don't re-invent these — check
`study-notes/night-session/` for full details if genuinely relevant, but
know these specific exact implementations already failed)

- **Dual-anchor / dual-chain replication**: crashed (`w1=0.0`) or is
  structurally impossible (`call far [bx]` in a tight loop has only one
  CS:IP — can't maintain two independent replication chains at once).
- **`bomb86` (spend both INT86h charges early)**: fixed the crash but
  underperformed the baseline (`0.6308` vs `0.6658`).
- **`decoy` (redundant anchor written via DI-offset juggling in the hot
  replication loop)**: crashed both attempts; root cause (confirmed
  tonight via live debug-trace) is `DI` arithmetic instability
  (`sub di,8`/`add di,6` sequence interacting badly with the replication
  loop's own DI usage) — NOT simply a copy-count/byte-length mismatch as
  initially suspected. If you attempt redundant-anchor-style redundancy,
  do NOT copy this exact DI-juggling approach; if you touch the hot
  replication loop (`worker:`-equivalent) at all, remember it executes
  every single replication cycle, so even a tiny per-iteration cost
  compounds across the whole battle — very different risk profile than a
  one-time bootstrap cost.
- **AL-value sweep on the champion's band-quantization constant**: ALL
  variants crashed with a deterministic death round, for reasons not
  fully understood (empirically rejected, 6/6, even values that should
  theoretically be safe by the execute-blind-spot logic above).
- **Scout+executor cooperative pair** (A scans for a target, publishes to
  shared memory, B reads and attacks): the mechanism WORKS (proven — a
  real kill was achieved in a controlled test) but every tested
  integration onto the existing champion's bootstrap regressed on fresh
  holdout, from -0.017 to -0.037, across 4 iterations including a
  bug-fixed version and two independent size/position-minimization
  attempts. The floor for "layer smart targeting onto the existing
  champion's proven replication as a one-time bootstrap check" has been
  found and does not cross into positive territory.
- **122 additional one-line/one-constant micro-mutations** (phase and
  spatial parameters) documented in
  `experiments/post-m048-micro-search-2026-09-27.json` — none reproduced
  a holdout-surviving improvement.

## The current champion, for reference (READ, do not copy verbatim —
you're trying to find something BETTER, and this is graded relative to it)

`final/ChimeraA.asm` (189 bytes) / `final/ChimeraB.asm` (117 bytes) — a
"Phoenix" far-call self-replicating pair using band-quantized addressing
and a 2-byte `FF 1F` (`call far [bx]`) anchor written fresh at each
replication step. Full source is in that directory — read it, understand
it, but your job is to find a genuinely better mechanism or a genuinely
better refinement, not to make a cosmetic variant.

**Known weakness of the champion (and everything derived from it
tonight)**: the 2-byte anchor is a single point of failure — if an
opponent's write happens to land on those exact 2 bytes at the exact
moment before the `call far [bx]` executes, the warrior dies instantly
(memory exception, jumping into garbage). This is the dominant, precisely
diagnosed death mode for the entire Chimera/Phoenix lineage, confirmed via
debug-trace multiple times tonight (against New_Best, against dummy
opponents, in isolation tests). Any genuinely novel replication mechanism
that doesn't share this exact single-point-of-failure shape is worth
trying even if it can't yet match the champion's raw efficiency — novelty
that sidesteps this failure mode is valuable data even if it initially
scores lower.

## Tools available to you

- `node assemble.mjs <output-dir> <input1.asm> [input2.asm ...]` — NASM
  assembler via a local browser-driven service (already running on
  `127.0.0.1:8123`, don't start a new one). Outputs raw binaries + a
  manifest with SHA-256 hashes.
- `node official-benchmark.mjs <config.json>` — runs your candidate
  against a configured opponent field using the real deterministic Java
  engine (`repos/corewars8086-6.0.0-deterministic/`). Config schema:
  `{experimentId, outputPath, runDirectory, battles, threads, seeds[],
  candidate:{name, warriors:[pathA,pathB]}, cohorts:[{id,
  opponents:[{name,warriors:[p1,p2]}]}], zombies:[...]}`. Use
  `config-subenc2-all2025.json` at the repo root as a ready-made
  25-cohort/75-team all-2025 field template — copy it, change
  `experimentId`/`outputPath`/`runDirectory`/`candidate` only, keep
  `cohorts`/`zombies` identical for a fair comparison against everyone
  else's results and against `m049control-all2025.json`.
- Portable JDK/Maven are vendored under `tools/` if you need to rebuild
  the engine (you shouldn't need to for this task).

## Your task

Design and build ONE complete, working warrior pair (A + B) implementing
a genuinely different strategic idea than anything in the
already-tried-and-rejected list above. Assemble it. Smoke-test it (a
handful of battles, comboSize matching a real field, checking for crashes
/ zero scores). Then run it through the SAME all-2025 field
(`config-subenc2-all2025.json`'s cohorts/zombies, 2500 battles) used for
every comparison tonight, and report your team score alongside a short
rationale: what you tried, why, what you rejected, and what your honest
assessment of its strengths/weaknesses is. You will not be tournamented
against the other 7 candidates yet — that happens in a later phase, after
everyone reports back.
