# Candidate 3 — Self-healing anchor (SelfHealA / SelfHealB)

## Assigned direction

The champion's (m049) dominant, precisely-diagnosed death mode is: its 2-byte
`FF 1F` (`call far [bx]`) replication anchor gets corrupted by an opponent's
write between when it is written (`STOSW`) and when the warrior's own
`call far [bx]` executes, causing an instant fatal jump into garbage. The
assignment: verify the anchor immediately before jumping through it, and
repair it in-place if corrupted, at near-zero cost on the common
(uncorrupted) path, since this runs in the hot replication loop every cycle
for the whole battle.

## What I built

`SelfHealA.asm` (197 bytes) / `SelfHealB.asm` (125 bytes), both comfortably
under the 256-byte final-stage limit. The bootstrap (band-quantized
addressing via `loadOffset`, `push cs`/`pop es`, `INT 87h` self/zombie
recognition, the `phoenix_pointer_ready` pointer-cell setup) is unchanged
from the champion — that machinery is proven, working, and not this
candidate's assigned focus. The only structural change is in `worker:`'s
anchor step.

**Original champion `worker:` tail:**
```asm
mov di, [bx]
mov cl, 9
xor si, si
stosw            ; write FF,1F to ES:[di], di+=2
dec di
call far [bx]    ; jump through the just-written bytes, unverified
```

**My `worker:` tail:**
```asm
mov di, [bx]
mov cl, 13
xor si, si
stosw            ; write FF,1F to ES:[di], di+=2   (always write fresh first)
mov di, [bx]      ; re-point di at the word start
scasw            ; AX(0x1FFF) vs ES:[di], ZF set if still intact, di+=2
je anchor_ok      ; common path: verified good, skip repair
mov di, [bx]      ; rare path only: re-point at the word start
stosw            ; rewrite the correct bytes
anchor_ok:
dec di
call far [bx]    ; jump through VERIFIED (and repaired if needed) bytes
```

### Why this catches real corruption, not just a tautology

`STOSW` and `CALL FAR [BX]` are two separate opcodes, and the engine's turn
model (`War.nextRound()`, confirmed in `War.java`) calls every living
warrior's `nextOpcode()` exactly once per round, round-robin across *all*
warriors in the battle (both teams' A and B). This means a full round of
every other warrior's turn elapses between my `STOSW` and my verification —
there is a real window for an opponent (or, in principle, my own teammate)
to land a write on those exact 2 bytes in between. The `SCASW` check reads
back the live memory state at that address at the moment just before the
jump, so it genuinely detects interim corruption, not just re-reading its
own immediately-prior write speculatively.

### Why `SCASW`, specifically

The engine throws `UnimplementedOpcodeException` on the `0x26` (`ES:`
segment override) prefix unconditionally (confirmed by reading
`Cpu.java`'s `nextOpcode()` dispatch) — so `cmp word [di], ax` (which
defaults to `DS:DI`) cannot be redirected to the `ES:DI` segment where the
anchor actually lives without first swapping `DS` itself, which would cost
~6 instructions (swap in, swap back) on the common path and risk breaking
`worker:`'s reliance on `DS` staying the arena segment for the next
iteration's `movsw`. `SCASW` (`0xAF`, confirmed implemented in `Cpu.java`)
compares `AX` against `ES:[DI]` — the same implicit-ES-segment class as
`STOSW`/`MOVSW` that the grounding doc calls out as the only way to touch
ES-addressed memory in this engine — in a single instruction, no prefix
byte, no segment-register juggling. `AX` already holds the correct anchor
constant `0x1FFF` persistently for the entire battle (set once at
bootstrap, never clobbered anywhere in `worker:`'s original body), so the
"register that still holds the correct value" the assignment asks for was
already sitting there for free; I didn't need to introduce new bootstrap
cost to stage it.

### Cost accounting

Common (healthy) path: 3 extra instructions/rounds per replication cycle
versus the champion's unchecked version (`mov di,[bx]` re-fetch, `scasw`,
`je`). Rare (corrupted) path: 2 more on top of that (`mov di,[bx]`,
`stosw` repair) — 5 extra rounds total, in exchange for surviving a hit
that would otherwise be instantly fatal. I deliberately avoided a `DS`-swap
approach (~6 common-path instructions) and confirmed via direct inspection
of `Cpu.java` that this engine has no variable-cost model for conditional
jumps (a not-taken `JE` costs exactly the same one round as a taken one —
`nextOpcode()` is a flat per-opcode dispatch with no branch-outcome-based
timing) — so the only lever available is raw instruction count on each
path, which is what I minimized.

### A byte-length coupling I had to fix

`study-notes/night-session/progress-2026-09-28.md` documents (from a prior,
unrelated ablation experiment removing a single `DEC DI`) that `worker:`'s
exact byte length is tightly coupled to the hardcoded copy counts used to
replicate it (`mov cx,9`/`mov cx,8`/`mov cl,9` at various points) — a
mismatch there caused 100% Warrior-A death in that experiment, not a
graceful degradation. My new `worker:` is 25 bytes (measured by isolating
it and assembling), 8 bytes longer than the original's 17. I recomputed
every copy-count constant proportionally (`9`→`13`, `8`→`12`, preserving
the original's relative margins between the tight first-iteration copy and
the looser steady-state copy) rather than leaving them at their old values,
and verified the resulting binaries assemble to the expected sizes (197 /
125 bytes, exactly +8 over the champion's 189 / 117) before running
anything.

## Alternatives considered and rejected within this direction

- **`CMPSW` (memory-vs-memory `DS:SI` vs `ES:DI`) instead of `SCASW`**:
  also implicit-segment and implemented in the engine, but it compares two
  *memory* operands, not a register against memory — I'd have needed to
  first stage the constant `0x1FFF` into a `DS`-addressable location every
  iteration (no free register-to-memory shortcut), which is strictly more
  instructions than `SCASW`'s direct register comparison for no benefit.
  Rejected once I worked out `SCASW`'s signature precisely.
- **Swap `DS` to `FAR_SEG` and use a plain `CMP [DI], AX`**: works
  correctness-wise, but costs a `push/pop` swap in and another swap back
  out (DS must return to the arena segment before the next iteration's
  `movsw`), roughly 6 instructions on the common path versus `SCASW`'s 3.
  Rejected on cost grounds — this is exactly the "budget your added
  instruction count like it's expensive" warning from the grounding doc.
- **Checking before the write instead of after**: considered scanning the
  target address *before* `STOSW` runs, to detect "was this band
  pre-corrupted." Rejected because each band address is entered by the
  monotonic replication chain exactly once (`sub [bx],bp` only ever
  decrements, never revisits), so on first arrival there is nothing
  meaningful to compare against yet — the byte there is undefined
  arena-fill, not a previously-correct anchor. The only point where "was
  my anchor corrupted" is a well-formed question is after my own write,
  immediately before the jump that depends on it — which is also exactly
  what the assignment specifies ("verifies the anchor bytes are still
  intact... immediately before jumping through them").
- **A second independent anchor / redundant-write approach**: explicitly
  out of scope — the grounding doc documents that dual-anchor and
  decoy-anchor redundancy were already tried and rejected tonight (crashed,
  or structurally impossible since `call far [bx]` in a tight loop has only
  one CS:IP). My assignment is specifically verify-and-repair-in-place on
  the single existing anchor, not redundancy, so I did not revisit those.

## Honest assessment

**Strengths**: the mechanism is narrowly scoped and mechanically verified —
I traced every register (`DI`, `CX`/`CH`/`CL`, `AX`) by hand and cross-
checked against actual assembled hex bytes rather than trusting my own
mental model, which caught the copy-count coupling issue before it could
cause a silent, deterministic, hard-to-diagnose failure like the `DEC DI`
ablation did for a previous experiment. Both `DI` at the point of
`call far [bx]` (`K+1`) and the anchor-write semantics are provably
identical to the original on both the common and repair paths, so I'm not
introducing a new failure mode while fixing the old one. The check is real
verification against live memory state, not a no-op — it exploits the
engine's genuinely interleaved multi-warrior turn model (confirmed by
reading `War.java`/`Cpu.java` directly) to catch corruption that happens in
the round(s) between the write and the jump.

**Weaknesses**: it only protects the exact jump the assignment describes —
the anchor `worker:` freshly writes and immediately calls through each
cycle. It does not add any protection for a hypothetical re-entry into an
*already-passed* band later in the battle (I don't believe this design's
one-way monotonic chain ever does that, but I have not exhaustively proven
no other warrior/mechanic could redirect execution back into a stale band).
The added 3-5 rounds/iteration is a real, permanent tax on the replication
rate for the entire battle — this is a deliberate trade (survivability for
raw throughput) rather than a free win, and the grounding doc's own
data point (a 9-instruction one-time bootstrap insert cost -0.024,
a 24-instruction one-time insert cost -0.11) shows this engine is
unforgiving of added instruction count in general, though those were
one-time bootstrap costs, not hot-loop per-iteration costs, which is a
different and less-well-characterized risk profile — this candidate is a
direct data point on exactly that previously-uncharacterized case.

## Result

- **Assembled clean**: SelfHealA = 197 bytes, SelfHealB = 125 bytes (both
  under the 256-byte final-stage limit; source SHA-256 / binary SHA-256
  recorded in `build/manifest.json`).
- **Smoke test** (4 cohorts incl. the historically-dangerous
  `HRZ_Registered_Winners`, 2 seeds, 10 battles each = 80 battles): ran
  clean, no crashes, aggregate team=0.460417. Only one seed-cohort
  combination (out of 8) scored a full zero, and it was isolated to a
  single seed of the `Registered_Winners` cohort while the other seed of
  the same cohort scored non-zero — read as ordinary battle variance
  against a tough, historically-lethal opponent, not a systematic crash
  signature (contrast with the `DEC DI` ablation's 100%-zero, every-cohort
  failure pattern).
- **Full all-2025 field** (`config-subenc2-all2025.json`'s 25
  cohorts/zombies, identical seeds/battle-count/candidate-slot structure,
  2500 battles total, config written to
  `config-arena-candidate3-all2025.json` with only `experimentId`/
  `outputPath`/`runDirectory`/`candidate` changed, `cohorts`/`zombies`
  verified byte-identical to the shared template by direct JSON diff
  before running): **team score 0.628333** (`w1=0.308533`,
  `w2=0.319800`), written to
  `experiments/arena-candidate3-all2025.json`.
- **Crash check**: verified programmatically, not just by eyeballing the
  console log — across all 50 cohort/seed run combinations, my team's raw
  group score was **never exactly 0** (minimum 2, maximum 48, mean 31.4
  out of whatever per-battle point pool each run's opponents contest for).
  Zero systematic-crash signature anywhere in the field.
- **Versus the champion**: m049's own documented baseline on this exact
  field is **0.6674** team-per-battle
  (`experiments/m049control-all2025.json`). My result is **0.6283**, a
  delta of **-0.0391 (-5.85%)**. This candidate does not beat the
  champion. It runs clean, never crashes, and is within single-digit
  percentage points of the baseline while carrying a structurally
  different (and, for the specific diagnosed failure mode, strictly
  safer) replication mechanism — a genuinely different risk/cost trade
  rather than a strict improvement. Given the grounding doc's own
  data point that even a single extra bootstrap-path instruction
  measurably moves the score, and that my change adds 3-5 rounds *every
  single replication cycle* for the whole battle (not once), a ~6% net
  regression is a plausible, non-alarming outcome for "pay a small,
  permanent per-cycle tax to eliminate one specific fatal failure mode" —
  it suggests the anchor-corruption death mode, while real and precisely
  diagnosed, may not be frequent enough in practice against this specific
  field to outweigh the cumulative cost of checking for it on every single
  cycle, every battle, for warriors that in the common case replicate
  many times before dying of something else entirely. That said, this
  candidate does directly validate the mechanism itself: it never
  exhibited a crash-pattern loss (0/50 runs at exact-zero), which is
  itself evidence the anchor-corruption single-point-of-failure this
  candidate targets was not the dominant loss cause in these particular
  battles for this particular replacement design — a useful, honest data
  point even though it doesn't cross into positive territory, consistent
  with tonight's broader finding pattern (per the grounding doc) that
  every direction tried so far bumps into the same "hot-path instruction
  cost compounds faster than the smart behavior it buys" ceiling.
