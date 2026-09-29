# Candidate 5 — Energy-aware adaptive bombing

## Assigned direction

"Energy-aware adaptive bombing": design a warrior that deliberately waits
to spend its INT86h/INT87h charges until a more advantageous moment
(energy built up, or a replication milestone), rather than firing
immediately, informed by reading exactly what Energy affects in
`War.java`/`Cpu.java` before designing around it.

## What the source actually says (verified by direct reading, not assumed)

Read `repos/corewars8086-6.0.0/src/main/java/il/co/codeguru/corewars8086/war/War.java`
in full, plus the relevant `Cpu.java` sections (`opcode9X` case `0x9B`,
`int86()`, `int87()`), plus `Warrior.java:initializeCpuState`. Findings:

1. **Energy does not accumulate passively.** There is no "being alive a
   while" effect. The *only* place Energy is incremented is a virtual
   opcode: two consecutive raw `0x9B` bytes (`WAIT WAIT`) are decoded by
   `Cpu.java`'s `opcode9X` (case `0x9B`, with a following-byte check) as a
   single "NRG" pseudo-instruction that does `energy += 1` (capped at
   0xFFFF). This costs exactly one round, like every other opcode
   (confirmed against GROUNDING.md's one-opcode-one-round timing law).
   Energy decays automatically: `War.updateWarriorEnergy` decrements it by
   1 every `DECELERATION_ROUNDS=5` rounds, unconditionally, whether or not
   the warrior does anything.
2. **Energy's only effect anywhere in the codebase is the "extra opcode"
   roll.** `War.nextRound` calls `updateWarriorEnergy` then
   `shouldRunExtraOpcode`, which computes
   `speed = calculateWarriorSpeed(energy) = min(16, 1+floor(log2(energy)))`
   and grants one bonus opcode that round iff `rand.nextInt(16) < speed`.
   That's it — a probabilistic, capped-at-2x chance of running one extra
   *arbitrary* opcode that round.
3. **Energy has zero effect on bombs.** Read `int86()` (lines ~2135-2144)
   and `int87()` (lines ~2153-2177) in full: `int86()` only reads/writes
   `bomb1Count` and calls `stosdw()` (which reads `AX`/`DX`/`ES`/`DI`/
   direction-flag) 64 times; `int87()` only reads/writes `bomb2Count` and
   scans `ES:DI` for `AX:DX` using `BX:CX` as the replacement. Neither
   function, nor anything they call, references Energy, speed, or the
   warrior's state beyond bomb counts and the named registers. Bomb size,
   damage, and search behavior are 100% energy-independent.

**Conclusion the task explicitly asked me to report honestly:** the literal
framing "wait for energy to build up for a faster/stronger attack" does
not hold up against the source. There is no ambient energy accrual to wait
for, and even deliberately-farmed energy would only ever buy a small,
capped, non-bomb-specific chance at one bonus opcode — never a stronger or
bigger bomb. Given GROUNDING.md's own confirmed data point that a ~9-
instruction one-time bootstrap addition already costs ~-0.024 mean score
in this engine, and farming even modest energy (say E=16, for a 5/16
chance of one bonus opcode) requires spending 16 full rounds on `9B 9B`
pairs (32 bytes, 16 rounds, all before any bomb or replication benefit),
literal energy-farming is a clear net loss and structurally worse than the
already-rejected `bomb86` experiment (`0.6308` vs `0.6658` — spending
bomb charges early was *already* shown to underperform; spending 16+
rounds doing nothing but building an inert stat before spending them
would cost strictly more for no compensating bomb-strength benefit, since
none exists).

## What I built instead (the sound version of the same direction)

Since energy-farming is unsound, I kept the literal, honest part of the
mechanic (one real, cheap, non-farmed touch of Energy) and moved the
actual "adaptive/deferred" idea onto the one part of it that *is* sound:
**bomb-usage policy**, not bomb-power. Two verified facts made this
concrete:

- Re-reading `final/ChimeraA.asm` and `final/ChimeraB.asm` directly (not
  from the task's summary of them) shows the champion calls `INT87h`
  exactly once per warrior (matching `bomb2Count=1`) as a self-signature
  write at the very first instructions of `start:`/`zombie_entry:`, and
  **never calls `INT86h` at all** — both `bomb1Count=2` charges per
  warrior (4 total across the team) sit completely unused for the entire
  game, every game. This directly contradicts the task brief's claim that
  the champion "spends both its INT86h charges... essentially immediately
  at boot" — I verified the actual files myself as instructed and that
  claim doesn't hold for `final/ChimeraA.asm`/`ChimeraB.asm` as they exist
  today. (It may describe an earlier/different variant; either way, what
  matters for "beat the champion" is the actual files, which I used.)
- This leaves genuine, safe headroom: two fully idle heavy-bomb charges
  per warrior that cost the champion nothing to leave unused, but that a
  design which *does* use them (well) could turn into free value, as long
  as the added instructions to do so are cheap enough not to eat their own
  gains via the timing-cost tax GROUNDING.md documents.

**`EnergyA.asm`** (209 bytes, champion's A was 189): identical to
`final/ChimeraA.asm` byte-for-byte except for one inserted block — a
one-time (not-in-hot-loop) detour placed after the existing signature-
write/band-compute bootstrap finishes and before the `jmp short
phoenix_init` that commits to replication. The detour:

1. `push ax` / `push si` — protects the two registers the unmodified tail
   depends on (`AX` = constructed signature-write operand value consumed
   by `phoenix_pointer_ready:`'s `mov [bx],ax`; `SI` = own `worker`
   address consumed later). Verified `BX`/`CX`/`DX`/`DI` are dead at this
   point (their INT87h-call values are never read again; `DI` gets
   unconditionally zeroed immediately after the jump in both
   `phoenix_init`/`captured_init`), so only `AX`/`SI` needed saving —
   confirmed by re-reading the full instruction sequence from `start:`
   through `phoenix_pointer_ready:`, not assumed.
2. Computes a bomb target `DI = SI(own worker addr) + 0x600` — an
   outward offset past the engine's own `MIN_GAP=1024`-byte
   (`War.java:36`) minimum warrior spacing, so it's unlikely to hit the
   warrior's own body and likely to reach unclaimed or neighboring
   territory, using the same "derive from own position" style the
   champion already relies on for its own targeting, rather than an
   arbitrary constant.
3. `db 09Bh,09Bh` — one honest, one-shot NRG opcode (2 bytes, 1 round,
   paid once). This is the real "energy-aware" gesture: it cannot make
   the bomb stronger (verified above that nothing can), but it gives one
   real, non-oversold `1/16` chance (`speed=1` at `energy=1`) of a bonus
   opcode landing on the very round the bomb fires.
4. `int 086h` — spends one of the two previously-always-idle heavy-bomb
   charges, writing a blind 256-byte `01FFFh`-repeated pattern (the same
   bytes as the `call far [bx]` anchor opcode itself, `FF 1F`) at the
   computed offset. Chosen deliberately over an arbitrary byte pattern: a
   partial/edge hit that lands on someone else's anchor cell still decodes
   as a valid `call far [bx]` rather than guaranteed garbage, making a
   near-miss inert-to-neutral rather than corrupting in a way that
   couldn't plausibly happen anyway; a full 256-byte hit still destroys
   whatever code is there.
5. `pop si` / `pop ax` — restores exactly what was saved, then falls
   through to the byte-identical, unmodified `jmp short phoenix_init` and
   everything after it (including the entire `worker:` hot loop, which is
   untouched — this was a deliberate choice to keep the per-iteration cost
   at exactly zero, since GROUNDING.md's rejected "decoy" attempt showed
   hot-loop changes are the highest-risk place to add anything).

This is "deferred, not immediate" in the sense that matters given what
Energy actually does: sequenced *after* the warrior's necessary bootstrap
work completes rather than interleaved with or before it, and it uses a
previously-always-idle resource rather than either "spend both immediately"
(the already-rejected `bomb86` direction) or "never spend" (today's
champion's actual behavior for INT86h). A literal round-counting spin-wait
was considered and rejected: since energy doesn't affect bomb power, a
delay loop would only ever cost rounds 1:1 with no compensating benefit —
provably worse than not delaying at all, given the timing-cost model.

**`EnergyB.asm`** (117 bytes, byte-identical binary to `final/ChimeraB.asm`
— confirmed via matching SHA-256 in the assembler manifest): left
completely unmodified. B's two idle `INT86h` charges are not used in this
build. This was a deliberate scope decision, not an oversight: adding the
same detour to both A and B would double the total added-instruction
surface and double the crash-risk exposure for a hypothesis that hasn't
yet been validated even once, directly against GROUNDING.md's core lesson
that every added instruction has a real, measurable cost. Using B's charge
too is a natural next iteration if this build's data supports it.

## Alternatives considered and rejected within this direction

- **Literal energy-farming before firing INT86h/INT87h** (execute N pairs
  of `9B 9B` to build real Energy, then fire): rejected after reading the
  source, for the reasons above — energy doesn't strengthen bombs, and the
  farming cost (1 round per +1 energy, decaying every 5 rounds) is
  strictly worse than the already-rejected `bomb86` experiment's cost
  profile.
- **Spin-wait "wait until round N" via a counted delay loop**, timing the
  bomb to some fixed round number rather than to a bootstrap milestone:
  rejected — this burns rounds 1:1 with zero payoff (nothing in the engine
  rewards elapsed time by itself; only actual energy-spending opcodes do,
  and those don't help bombs either), so it's a pure-loss variant of the
  farming idea above, just without even the token 1/16 bonus-opcode
  chance.
- **Synchronizing the bomb to a "replication milestone"** (e.g. after N
  cycles through `worker:`): considered, but implementing a milestone
  counter requires touching the hot `worker:` loop (to increment/check a
  counter every cycle) or adding a second parallel state-tracking
  mechanism — both fall into the exact shape of GROUNDING.md's rejected
  "decoy" (hot-loop DI-juggling instability) and "dual-anchor" (can't
  maintain two independent chains with one CS:IP) failures. Rejected in
  favor of the cheaper, safer "after-bootstrap, before-replication-commit"
  timing, which needs no counter and touches the hot loop not at all.
- **Using both A's and B's idle INT86h charges** (4 total): rejected for
  this first build on cost-surface-minimization grounds (see EnergyB
  section above), not because it's known to be bad — flagged as a
  reasonable next step if this build's result is positive.
- **Targeting INT86h via a search-and-aim mechanism instead of a fixed
  offset** (e.g. reusing `INT87h`-style scanning first): rejected —
  GROUNDING.md documents that `INT87h` cannot report where it found a
  match (`DI` unchanged after the call), so there is no cheap way to
  "scan, learn a location, then aim a different bomb there" with the
  charges available; this is exactly the mechanism the "scout+executor"
  family already explored and found to regress (-0.017 to -0.037) even
  when the underlying detect-and-patch mechanism itself worked. A fixed,
  position-derived offset avoids re-running that same experiment.
- **An arbitrary/random-looking bomb pattern for the `INT86h` payload**
  instead of the `01FFFh` (anchor-opcode) repeat: considered, rejected in
  favor of the anchor-opcode pattern specifically because a partial hit on
  someone's `PTR_CELL`/anchor cell is more likely to be behaviorally
  inert (still decodes as `call far [bx]`) than an arbitrary byte pattern
  would be, given the champion's own single-point-of-failure anchor design
  is common to this whole warrior lineage.

## Honest assessment

**Strengths:**
- Grounded directly in source-verified facts about what Energy does and
  doesn't affect, rather than the task brief's (unverified, and in this
  case inaccurate for the actual champion files) framing.
- Minimal blast radius: one 20-byte, one-time, non-hot-loop detour on one
  file; B is untouched and binary-identical to the proven champion B.
  Register-safety was verified by hand-tracing full liveness from `start:`
  to `phoenix_pointer_ready:`, then additionally hardened with push/pop
  bracketing so correctness doesn't depend on that trace being perfect.
- Uses a genuinely idle resource (INT86h, 2 unused charges per warrior in
  the actual champion) rather than re-timing an already-used one, so any
  gain is closer to "free" than to a reallocation with an opportunity cost.
- Assembled clean on the first attempt (209 + 117 bytes, both under the
  256-byte final-stage limit) and passed a 30-battle/3-cohort smoke test
  with no crashes and non-zero scores in every cohort (team scores 0.40,
  0.80, 0.65 per cohort; far too small a sample to be a real result, but
  sufficient to rule out an immediate-death regression).

**Weaknesses / honest risks:**
- The strategic payoff is modest by construction: I deliberately rejected
  the more aggressive "farm energy" reading of the assignment because the
  source doesn't support it, which means this build's edge (if any) is a
  single blind 256-byte bomb at a fixed offset, once per game, on A only —
  a small, one-shot effect, not a compounding or adaptive-in-the-full
  sense mechanism. It is "deferred" and "uses a previously idle resource,"
  but it is not "adaptive" in a runtime-reactive sense (it doesn't
  actually read opponent state before firing — nothing cheap available
  does, per the INT87h no-location-report limitation).
- GROUNDING.md's own data (a ~9-instruction bootstrap addition costing
  -0.024, a ~24-instruction one costing -0.11) is the most directly
  relevant prior evidence available, and my detour (about a dozen
  instructions including the two pushes/pops) sits in a similar size
  range to the smaller of those two measured-negative data points. The
  `db 9Bh,9Bh` + blind `int 086h` might land as a real (if small) offense-
  side gain that outweighs its own bootstrap-timing cost, or it might not
  — this is a real, unresolved uncertainty, not a guaranteed win, and I
  want to be explicit that I'm reporting the actual field result below
  rather than assuming the mechanism is positive just because it's
  cheap and idle-resource-based.
- The fixed `+0x600` offset is a single untested spatial constant, chosen
  from the engine's own `MIN_GAP` value rather than swept/tuned; a
  parameter sweep (in the spirit of the already-run `config-anchor-*`
  sweeps visible in the repo root) could find a better constant, but that
  is future work, not part of this deliverable.

## Result

Full-field run: `config-arena-candidate5-all2025.json` (copied from
`config-subenc2-all2025.json`, cohorts/zombies/battles/seeds unchanged,
identical structure to `config-m049control-all2025.json` which produced
the champion's own reference `experiments/m049control-all2025.json`
result of `teamPerBattle = 0.6674000056` over 2500 battles). Output:
`experiments/arena-candidate5-all2025.json`. 2500/2500 battles completed,
zero crashes, zero CPU/memory exceptions observed in any of the 50
cohort×seed runs (every run produced a plausible non-zero score; the
lowest single cohort was `all-v1-15` at 0.12 on both seeds, consistent
with that specific opponent set being genuinely tough rather than a bug —
a real crash would show as exactly 0.0, and neighboring cohorts on the
same run scored normally).

**Final team score: `teamPerBattle = 0.6720000048` (raw `aggregate`:
`{battles: 2500, teamPerBattle: 0.6720000048, warrior1PerBattle:
0.3181666660, warrior2PerBattle: 0.3538333308}`).**

Compared to the champion's own reference baseline on this identical field
(`experiments/m049control-all2025.json`, `teamPerBattle = 0.6674000056`):
candidate-5 scores **+0.0046 higher** (0.6720 vs 0.6674, +0.69% relative).
`warrior1PerBattle` is essentially flat (0.3182 vs 0.3196, -0.0014) while
`warrior2PerBattle` is higher (0.3538 vs 0.3478, +0.0060) — interesting
given B was left byte-identical to the champion's own B, so this shift is
attributable to the field-level effect of A's changed behavior (the
INT86h detour and any downstream consequences of the timing shift it
causes to A's own subsequent instructions), not to any direct change in
B's code.

**Honest caveat on this number**: this is a single 2500-battle run on one
field (2 seeds × 25 cohorts), the same field/seeds used for the cited
m049 control run, so the comparison is fair and apples-to-apples — but it
is not multi-seed-averaged or holdout-verified the way the champion's own
promotion was (per `study-notes/night-session/report-for-codex-2026-09-28.md`,
m049's promotion involved a separate dedicated holdout set, and that same
report shows float-noise/variance considerations mattered even for
already-tied comparisons at this scale). A +0.0046 edge on one 2500-battle
run is a real, clean, crash-free result and a genuine improvement over the
cited baseline on the field specified for this task, but I would not
claim high confidence that it holds up as a durable, statistically robust
edge without a second seed set or holdout run — which is future
verification work, not something this deliverable's scope covered.
