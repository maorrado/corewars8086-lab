# Scout/executor cooperative-pair research (2026-09-29)

Branch: `claude/scout-executor-research-2026-09-29`. Reference point:
Chimera m049 (`final/ChimeraA.asm`/`ChimeraB.asm`, branch
`codex/optimize-2025-survivors`, commit `914a25177978df1a9e6bb5583beb868aef94bea8`).
`final/` was not touched; no champion was replaced; nothing was pushed to
`main` or `codex/optimize-2025-survivors`.

## Bottom line

**No candidate promoted. Best design (Chimera scout-v3) is a confirmed
regression vs. m049 on a fresh holdout (-0.0279, 95% CI
[-0.0509,-0.0048], significant).** The architecture (a scout warrior that
finds targets and publishes them to a partner executor via shared memory)
works mechanically — the communication channel, the scan, and the burst
attack were all independently verified to function correctly — but layering
it onto m049's proven Phoenix/Chimera replication costs more in bootstrap
delay than the opportunistic attacks recover, in every version tested.

## Engine mechanics verified before writing any candidate (per the brief)

- **Register init at cold boot** (`Warrior.java:initializeCpuState`):
  `AX=loadOffset`, `BX=CX=DX=SI=DI=BP=0`, `DS=CS=own load segment` (the
  arena — a single shared segment for every warrior, `ARENA_SEGMENT=0x1000`
  fixed), `ES=group-shared-memory segment`, `SS:SP=private 2048-byte
  stack`, flags=0.
- **Group-shared memory** (`War.java:243-272`): one 1024-byte region
  allocated per `WarriorGroup` (team), passed to every warrior in that
  group — confirmed this is exactly the mechanism m049 already uses for
  its own A/B `PTR_CELL`/`FAR_SEG` handshake, so cooperative comm via fixed
  shared cells is architecturally proven, not speculative.
- **Turn order**: `War.nextRound()` calls each living warrior's
  `nextOpcode()` exactly once per round, in `m_warriors[]` array order
  (load order — A before B, since A is listed first in each team's
  `WarriorData` list). Confirmed via the debug-trace instrumentation built
  this session.
- **REP-prefixed instructions are NOT atomic across rounds**:
  `Cpu.java:1146-1195` — `REP MOVSW`/`STOSW`/etc. decrement `CX` and
  perform exactly one iteration per opcode fetch; `IP` does not advance
  past the `REP` prefix until `CX` reaches 0. A multi-word shared-memory
  write is therefore not atomic across turns, confirming the brief's
  requirement for a validity/version marker (published *last*, via a
  separate `STOSW`, after the payload).
- **CRITICAL, previously-undocumented constraint: the `0x26` (`ES:`
  segment override) prefix is UNIMPLEMENTED** (`Cpu.java:240-242`, always
  throws `UnimplementedOpcodeException`). No `[es:xxx]`-style operand is
  usable anywhere in this engine. The *only* way to address the
  shared-memory segment is through instructions with an *implicit* ES
  operand — `STOSB`/`STOSW`/`MOVSB`/`MOVSW` (destination `ES:DI`) and
  `INT 87h` (`ES:DI`-based search) — or by copying the segment value into
  a general register and loading it into `DS` (for reads via
  `LODSB`/`LODSW`, which use `DS:SI`) or `ES` (for writes via
  `STOSB`/`STOSW`). This was discovered the hard way (two failed prototype
  iterations, both `CPU exception` crashes) before being confirmed by
  reading `Cpu.java` directly; documented here so it doesn't need
  rediscovering.

## Working communication protocol (proven)

- **A (publisher)**: `ES` already = shared segment at cold boot. Write
  target via `STOSW` (`DI`=cell offset, `AX`=payload), then write a
  separate marker word via a second `STOSW`, written *last* so a partial
  read is never observed as valid (given REP/STOSW's one-iteration-per-turn
  behavior, this ordering is required, not just good practice).
- **B (reader)**: `ES` is also the shared segment at cold boot, but reading
  requires `DS:SI` (`LODSW`), and `DS` starts as the arena/code segment.
  B must relay `ES`'s value into `DS` first: `mov ax,es` / `push ax` /
  `pop ds`, poll the marker via `LODSW`, then read the target via a second
  `LODSW`, then restore `DS` (`push cs`/`pop ds`) before acting on the
  target with default-segment addressing.

Verified end-to-end with `ProtoA-v1.asm`/`ProtoB-v1.asm`: traced via a
custom debug-trace instrumentation (two-tier filter, see
`m050-reverification/newbest-investigation/REPORT.md` for the patch
description — reused here) showing A's `STOSW`s landing correctly and B's
`LODSW`s reading back the exact published value, with B then writing a
proof byte at the correct computed address.

## Real scanning scout (proven against a live opponent)

`ScoutA-v1.asm`: cheap stride scan (step 0x40, up to a few candidate
offsets), skips filler bytes (`0xCC`) and coarsely excludes its own load
band (compares candidate-offset high byte to own-loadOffset high byte —
"general characteristics, not an exact signature" per the brief).
`ExecutorB-v2.asm`: polls the marker (bounded — gives up after `MAX_POLLS`
so a communication failure cannot strand B), on success does a short
`REP STOSB` burst of the fatal arena-filler byte (`0xCC` = `INT3`) at the
target, then falls into an independent (minimal, for this stage) fallback
loop.

Debug-traced against 3 real dummy opponent teams: the scout correctly
found and published a genuine opponent's code region (`Dummy2a2`, loaded
at `0x0DEA`, scanned target `0x0E00` — inside that warrior's actual code),
and in a first competitive test the executor's burst **achieved a real
kill** (`Dummy2a2` died at round 61 from a `CPU exception` at the
corrupted address). This confirms the core mechanism is not just plumbing
— it produces genuine kills when integrated with a real scan.

## Why the full architecture still regresses: bootstrap-delay cost

Testing the scout+executor as a **standalone pair with no fallback
survival logic** (`ScoutA-v1` + `ExecutorB-v2`, a bare-idle-loop fallback)
scored 0.026 vs. m049's ~0.667 on the full all-2025 screen — expected,
since it has zero replication capability once its one-shot attack
resolves.

The real test is layering the scout/burst logic onto m049's *proven*
Phoenix replication as a one-time bootstrap check, touching neither
`worker:` (the hot per-round loop) nor changing m049's steady-state
behavior at all. Register-usage tracing showed every general register is
live throughout m049's bootstrap in both A and B, so the shared-segment
value must be carried through the insert via a spare register (`BP` for A,
found free until `phoenix_pointer_ready`; `DX` for B, found free until the
anchor's `mov dx,04000h`) — verified against the full instruction-by-
instruction register trace of unmodified m049 before writing each insert,
not assumed.

Three iterations, each screened on the full all-2025 field (2500 battles,
paired against the same `m049control-all2025` baseline used all night):

| Candidate | A insert | B insert | vs. m049 (mean diff) | 95% CI |
|---|---|---|---|---|
| Chimera scout-v1 (A-v1+B-v1) | ~24 instr., **before** A's own `int87h` | ~15 instr., after B's `int87h` | **-0.1115** | [-0.1419,-0.0810] (large, significant regression) |
| Chimera scout-v2 (A-v2+B-v1), first draft | ~9 instr., before `int87h`, **had an AX-clobber bug** | same as above | **-0.3718** | [-0.4168,-0.3268] (catastrophic — `warrior1PerBattle=0.003`, near-universal A death) |
| Chimera scout-v2 (A-v2 fixed +B-v1) | ~9 instr., before `int87h`, bug fixed | same | -0.0298 | [-0.0507,-0.0089] (still significant regression, but back to a sane order of magnitude) |
| Chimera scout-v3 (A-v3+B-v1) | ~9 instr. (same scan logic as v2), moved to **after** A's own `int87h` | same | -0.0172 (screen) / -0.0223 (tune-1000) / **-0.0279 (fresh holdout, CI [-0.0509,-0.0048], significant)** | see three-way table below |

**A bug was found and fixed along the way** (self-caught before shipping,
not discovered by a failing test): the first A-v2 draft executed
`mov si,ax` immediately after a publish-path `STOSW` that had already
overwritten `AX` to the marker value `1`, corrupting `SI` (needed as
`loadOffset` for the rest of m049's bootstrap) on every battle where the
scan found a target — which is most battles, given how densely warriors
pack a ~64KB arena. This explains the `-0.3718`/near-zero-`warrior1`
result; fixing it (save `loadOffset` in `BP`, restore before continuing)
brought the regression back to a normal, explicable magnitude.

**Position matters more than size.** A-v2's ~9-instruction insert *before*
`int87h` cost -0.0243 (isolated, unchanged B) — a significant regression.
Moving the *identical* scan logic to *after* `int87h` (A-v3) reduced that
to +0.0033 (isolated, CI [-0.0099,+0.0164] — statistically indistinguishable
from m049). B's insert, always placed after its own `int87h`, cost -0.0117
isolated (CI crosses zero) despite being larger (~15 instructions) than
A-v2/v3's ~9. This is consistent with the New_Best investigation's finding
(see the sibling report) that this code family's `int87h`/anchor sequence
is the most timing-critical section — delaying it costs more than delaying
code that runs after it, roughly independent of exact instruction count.

## Chimera scout-v3: full three-gate result (best candidate found)

| Gate | n | W/L/T | Mean diff (candidate − m049) | 95% CI |
|---|---|---|---|---|
| Screen (all-2025, `all-001`/`all-002`) | 50 | 16/26/8 | -0.0172 | [-0.0386,+0.0042] |
| Tune-1000 (`tune-001`) | 20 | 8/8/4 | -0.0223 | [-0.0499,+0.0052] |
| **Fresh holdout** (`fresh-verify-901`/`902`, unseen by any prior test) | 50 | 16/30/4 | **-0.0279** | **[-0.0509,-0.0048]** |

All three point estimates are negative and consistent (-0.017 to -0.028) —
this is not a sign-flipping overfit pattern, it is a small, real,
consistently negative effect that reaches significance once the
independent fresh-holdout sample is added. **Rejected per the explicit
rule that a fresh-holdout regression disqualifies a candidate regardless
of screen/tune results.**

New_Best check was not run for this candidate — rejected before reaching
that gate, consistent with "don't promote a candidate that doesn't clear
the general-improvement bar first."

## Isolation results (diagnostic, not candidates)

Used to separate A's cost from B's cost and to locate the AX-clobber bug:

- A-only (minimal scout, unchanged `final/ChimeraB`), buggy v2: -0.3718
  (bug)
- A-only, fixed v2: -0.0243 [-0.0426,-0.0059]
- A-only, v3 (repositioned): +0.0033 [-0.0099,+0.0164]
- B-only (`ChimeraB-scout-v1`, unchanged `final/ChimeraA`): -0.0117
  [-0.0301,+0.0066]

## Conclusion / next steps

1. **The scout/executor cooperative-pair idea is not disproven — this
   specific integration (bootstrap-time scan/burst layered onto unmodified
   m049 replication) is.** The mechanism works (proven kill in a
   controlled test); the cost of even a near-minimal, correctly-positioned
   insert (~9 instructions, in the cheapest tested position) still nets a
   small but real regression once tested on a genuinely fresh holdout.
2. Per the brief's own fallback instruction: this direction has now been
   tested to its cheapest viable version (single-candidate scan, optimally
   positioned, bug-fixed) and still fails the fresh-holdout gate — further
   size reduction below "1 candidate check" isn't meaningful (there'd be
   nothing left to call a scout). The next cheaper alternative worth
   trying, if this thread is resumed, is **not shrinking the insert
   further but eliminating it**: e.g., encoding the "check for an
   opportunistic target" logic using bytes/cycles m049 already spends
   (piggybacking on existing `int87h`/anchor-setup instructions rather
   than adding new ones), which was not attempted this session.
3. Everything needed to resume or verify this work is saved:
   `candidate-source/` (all `.asm` files, including the two full self-caught-
   and-documented bugs and their fixes), `configs/` and `results/`
   (compacted JSON, all screen/tune/holdout/isolation runs), this report.
