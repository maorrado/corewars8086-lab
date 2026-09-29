# Candidate 2 — Split-team specialization without shared-memory communication

## Assignment

Direction: build A as a pure, minimal, fast self-replicator (no INT87h
self-search, no coordination overhead) and B as an independent, aggressive
INT86h/INT87h attacker that starts fighting immediately without waiting for
or reading anything from A. Neither warrior depends on the other's state.

## What I built

### SplitReplicatorA.asm (25 bytes)

A's entire job is to copy itself forward through the arena, over and over,
as cheaply as possible. No shared memory, no INT87h, no far-call/pointer-
cell trampoline.

Mechanism: `start:` runs once (4 instructions: `push cs`/`pop es` to point
ES at the arena segment, since MOVSW's destination segment is hardwired to
ES regardless of DS — a structural requirement of the only bulk-write
instruction available, not team coordination; then `mov si,ax` / `add si,
worker-start` to seed SI at this copy's `worker:` label, using AX's free
self-position value instead of an IP-discovery trick). `worker:` then
computes the destination (`SI+STEP`), copies itself there via `rep movsw`,
and jumps into the fresh copy via a **register**, not a memory-resident
pointer. That's the core idea: the champion's Phoenix/Chimera lineage
writes a 2-byte executable anchor (`FF 1F`, `call far [bx]`) to memory and
trusts it — if an opponent's write lands on those exact 2 bytes between the
write and the call, it's instant death (confirmed as the dominant,
precisely-diagnosed death mode for that whole lineage, per tonight's
grounding notes). A register can never be corrupted by another warrior's
memory write, so `jmp si` structurally cannot suffer that exact failure.

### SplitAttackerB.asm (62 bytes)

B fires its weapons immediately, with zero setup beyond what's mechanically
required, then falls into the same minimal replication loop as A (its own
independent copy, own STEP, own registers) for survival redundancy for the
rest of the battle.

- **INT86h x2** (blind bomb, 2 charges, fixed by the engine): writes a
  256-byte repeating pattern to two disjoint arena bands computed from B's
  own load offset (`SI+0x2000`, `SI+0xA000`) — reusing the champion's
  general "derive a target band from your own position" technique, not its
  specific tuned constants (those were already exhaustively swept and
  rejected per the grounding doc).
- **INT87h x1** (search-and-patch, 1 charge): searches for `EB F9 CC CC`.
  This isn't a guess — I hex-dumped all four live 2025 zombie files
  (`official-2025/zombies-live/zom20{a,b,c,d}`) and confirmed this exact
  4-byte sequence repeats literally inside `zom20b` and `zom20d`. On a
  match it patches to `CC CC CC CC`, erasing the distinctive short-jump
  head that makes that signature capturable — cheap area denial, at zero
  extra instruction cost beyond the call itself. I deliberately did not
  build the champion's fixed-cell zombie-capture-and-redirect machinery
  (writing an absolute rendezvous address, `FF 26`-style indirect jump,
  etc.) because (a) it requires several extra bootstrap instructions for a
  payoff that doesn't add to score directly (zombies never score even when
  captured, confirmed by reading `War.java`), and (b) it's the kind of
  "smart per-instance infrastructure" the grounding doc's rejected-
  directions list already showed losing to timing cost 4/4 times in a
  different but structurally similar context (scout/executor).

Both A and B's replication tail use identical bare register bookkeeping —
no ES reads, no memory-resident state either warrior depends on the other
to have written. If A dies, B's registers and code are untouched and vice
versa.

## A real bug I found and fixed (worth recording)

My first draft of the replication loop computed the destination in DI,
copied via `rep movsw`, then did `mov si,di` / `jmp si` — assuming DI still
pointed at the destination's start after the copy. It doesn't: I verified
directly in `Cpu.java`'s `movsw()` (lines 1741-1751) that **every single
`movsw` iteration unconditionally does `SI+=diff; DI+=diff`** (diff=±2
depending on the direction flag), including every iteration inside a `REP`.
So after copying `WLEN` words, DI has already advanced `WLEN*2` bytes past
the destination's start — jumping through it lands in whatever
uninitialized/unrelated bytes happen to sit right after the fresh copy,
which crashed 100% of the time in an initial smoke test (team score
exactly 0.000000 across 12/12 battles). The fix: save the destination
start in BX (untouched by `movsw`) *before* the copy, and jump through the
saved value afterward. This is also, I now realize, part of *why* the
champion's own design stores its jump target in a memory cell before the
copy loop runs rather than relying on a post-loop register — it's sidestepping
this exact trap, just via memory instead of a spare register.

## Diagnosing the real result

After the fix, the mechanism is byte-verified correct (I hand-decoded the
assembled binaries against my source, instruction for instruction) and
**provably stable in isolation**: I ran A head-to-head against a completely
inert dummy warrior (`jmp short start`, no zombies) using a debug-trace
build of the engine (`repos/corewars8086-6.0.0-debug-trace/`,
`-Ddivtrace.warriors=...`) for 5 battles at the 200,000-round cap — A
survived every single one with zero death events. So the replication logic
itself is sound.

Against the real 2025 field, though, A dies in every smoke-test battle I
ran (12/12), at wildly varying rounds (20 to 4942) and varying causes ("CPU
exception" / "memory exception" roughly evenly split) — using the same
debug-trace tooling, `DEATHTRACE` dumps show A's death IP consistently
landing inside or adjacent to unrelated/foreign byte patterns (not my own
code), and the exact byte-offset-from-load-address at death has no
consistent relationship to A's own STEP constant across battles. Both
facts point to combat kills (opponents/zombies overwriting wherever A's
single execution thread currently sits), not a self-inflicted bug: a
deterministic logic error in my own address arithmetic would reproduce at
the same relative offset every time, and it does not.

This is the honest, structural cost of "pure minimal, zero redundancy": A
has exactly one live execution thread and abandons every previous copy the
moment it jumps forward, so it never has more than an ~18-byte window of
code protecting its one and only life at any moment. I considered adding
defensive redundancy (leaving multiple coexisting live copies) but
confirmed by reading the telemetry schema that "alive" is a property of
the single Warrior execution context, not a count of code-copies sitting
in the arena — so more copies lying around inertly would not have actually
increased survival odds, only cost more bootstrap/loop instructions for no
real benefit. I did not find a cheap, principled lever (STEP/WLEN tuning)
with good evidence of moving the needle, given death rounds are broadly
spread across the whole battle length rather than clustering near a fixed
early point I could specifically defend against.

## Final result

- **Assembled cleanly**, both warriors far under budget: A = 25 bytes
  (90% headroom), B = 62 bytes (76% headroom).
- **Ran clean** on the full official 2500-battle all-2025 field
  (`config-arena2-all2025.json`, identical `cohorts`/`zombies` to
  `config-subenc2-all2025.json`, verified by direct JSON diff before the
  run) after the BX-save fix — no crashes, no assembler errors, exit code
  0, no exceptions outside normal in-battle combat deaths.
- **Team score: 0.058233 team-per-battle** (warrior1/A = 0.025233,
  warrior2/B = 0.033000), from 2500 battles, using the exact same
  deterministic engine jar (verified by matching SHA-256,
  `2209b1646a168d...`) as the champion's own baseline run. The champion
  scores **0.6674** on this identical field
  (`experiments/m049control-all2025.json`) — my candidate reaches about
  **8.7%** of that.

## Honest assessment

**Strengths**: genuinely different failure-mode shape from the champion —
no memory-resident jump anchor to protect, so it cannot die to the
champion's single most common, precisely-diagnosed death cause. Both
warriors are extremely cheap (25 + 62 = 87 bytes total, vs. the champion's
189 + 117 = 306), leaving enormous byte and instruction-count headroom
that a more defensively-minded design in the same direction could spend.
B's weapon usage is grounded in verified facts (real zombie-file hex
dumps, actual `War.java` scoring-formula reading), not guesses. The design
cleanly satisfies the "no communication" mandate: neither warrior touches
the other's memory, reads shared state, or depends on the other's
survival.

**Weaknesses**: A's near-zero defensive posture means the champion's
proven approach — despite its own known single-point-of-failure — still
comes out ahead in raw survivability on this field, and by a wide margin:
0.058 vs. 0.667, about 8.7% of baseline. A's minimalism is real but
insufficient on its own; "cheap and hard to hit precisely" does not
substitute for "actually resistant to the volume of untargeted/area fire
a 75-team field with zombies collectively produces over thousands of
rounds." B's weapons-first-then-replicate approach consistently
outperformed A's pure-replication-only approach across the full run
(0.033 vs. 0.025 warrior-per-battle) — modest evidence that spending a
few charges on offense before falling into the same cheap loop is worth
more than skipping straight to replication, at least in this field. A
genuinely stronger version of this same direction would likely need to
spend *some* of A's large unused byte budget (231 of 256 bytes, 90%,
still untouched) on cheap defensive measures — e.g., a short redundant
landing check, or simply borrowing B's weapons-first pattern for A too —
without falling into the "smart-but-expensive bootstrap" trap the
grounding doc warns about. That tradeoff point is unexplored here and is
the most promising next step if this direction is revisited.
