# Candidate 8 — "Bastion": Two-phase build-then-fight

## Assigned direction

Instead of committing immediately to the champion's fast single-chain
replication, spend the first replication cycle laying down defensive
filler across a wider swath of nearby territory *before* committing to
the real replication chain — trading initial speed for area denial and
a wider defensive footprint early.

## What I built

Two warriors, `COD_arena8_A.asm` (209 bytes assembled) and
`COD_arena8_B.asm` (137 bytes assembled), both well under the 256-byte
final-stage limit. Both are the champion's (`ChimeraA`/`ChimeraB`, m049)
exact, proven Phoenix far-call replication mechanism — cold-boot
self-positioning, `INT 87h` zombie-recognition, band-quantized
replication-target math, `phoenix_init`/`worker` tail — left **entirely
byte-for-byte unchanged**, with exactly one addition inserted into the
cold-boot path of each:

```asm
; --- build phase: spray FF1Fh anchors across 4 bands, one-time ---
mov di, si
add di, FILLBASE      ; FILLBASE = 0x900
mov ax, 01FFFh        ; FF 1F little-endian: the champion's own
mov cl, 4              ; call-far-anchor byte pattern
.fill:
    stosw
    add di, FILLSTRIDE  ; FILLSTRIDE = 0x300
    dec cl
    jnz .fill
; --- end build phase ---
```

This writes the literal `FF 1F` anchor byte pair (same bytes the
champion's own replication mechanism uses for `call far [bx]`) at four
evenly-spaced offsets spanning `own_load_offset + 0x900` through
`+0x1200`, in the shared arena segment (`ES = CS` at this point, set
earlier via `push cs / pop es`, confirmed unmodified by the preceding
`INT 87h` call by reading the engine's `int87()` Java source directly —
it only reads `ES`, never writes it). The loop runs once, before the
quantized replication-target `AX` is computed, and deliberately never
touches `SI` (which must stay equal to the pristine load offset for the
`rep movsw` copy of the `worker:` snippet later in `phoenix_init`) —
this was the exact mistake I caught and fixed during development (see
"Bug caught during build" below).

After the filler loop, control falls through unchanged into the
champion's own `phoenix_init` → `worker` replication loop. The hot
replication loop itself is **not touched at all** — the filler cost is
paid exactly once, at boot, per the direction's framing ("first
replication cycle... before actually committing to the real
replication chain").

### Cost accounting (honest, per GROUNDING's timing model)

Every opcode is one round, no exceptions. The inserted block is:
- 4 one-time setup/loop-control instructions (`mov di,si` /
  `add di,FILLBASE` / `mov ax,01FFFh` / `mov cl,4`)
- 4 loop iterations × 4 instructions each (`stosw` / `add di,FILLSTRIDE`
  / `dec cl` / `jnz`) = 16 rounds

**Total: 20 extra rounds spent before the real replication chain even
starts**, on both A and B. GROUNDING documents that a ~24-instruction
bootstrap insert (comparable in scale) cost -0.11 mean score in
isolated testing, and even a single extra instruction is measurable.
This is a genuine, non-trivial bet, not a free addition — I went in
expecting a real chance this loses to pure speed, per the assignment's
own framing.

### Bug caught during build

My first draft computed the quantized replication `AX` value, then
tried to `push ax` / spray filler / `pop ax` / `mov si, ax`. This was
wrong: it clobbered `SI` with the *quantized band value* instead of
the pristine load offset, which would have made the later
`rep movsw` in `phoenix_init` copy the `worker:` bytes from a garbage
address into the daughter warrior — likely a silent corruption or
crash in the replication chain. I caught this by re-reading the
champion's source side-by-side line-by-line and noticing `SI` and `AX`
serve two independent purposes (source pointer for the `worker:` copy,
vs. quantized far-call target) that must not collide. Fixed by moving
the filler loop to run *before* the quantized-AX computation, so it
only needs `AX`/`CL`/`DI` as scratch and never reads or writes `SI`.
This is exactly the kind of DI/SI-register-interaction risk GROUNDING
flagged from the rejected "decoy" attempt, and reinforces why it
matters to verify register lifetimes precisely rather than pattern-match
against the original source.

## Alternatives considered within this direction, and why rejected

1. **Wider spray (8+ bands instead of 4).** Rejected: doubling loop
   trip count doubles the one-time cost (40 rounds instead of 20) for
   uncertain marginal denial value. GROUNDING's data point suggests
   cost scales with instruction count while payoff is unproven —
   a smaller first bet is the more defensible test of the idea.
2. **Filler in the zombie-revival path (`zombie_entry` in A) too.**
   Rejected for this iteration: that path only executes when this code
   is running as a captured zombie (a rarer event than cold boot),
   so duplicating the filler block there would add byte budget and
   instruction-count risk for a lower-frequency payoff. Left
   `zombie_entry` byte-for-byte identical to the champion. A candidate
   for a follow-up iteration if the core idea shows promise.
3. **Unrolled filler writes instead of a loop** (4x straight-line
   `mov di,imm`/`stosw` pairs with literal offsets, no `dec`/`jnz`).
   Considered because it removes loop-control overhead (`dec`/`jnz`
   per iteration). Rejected: the unrolled form needs 4x
   `mov di,imm16` (3 bytes each) instead of one loop-invariant
   `add di,FILLSTRIDE` (a smaller immediate), so it likely costs
   about the same or more in both bytes and rounds for no clear
   benefit, and the loop form is simpler to reason about correctly.
4. **Sweeping `FILLBASE`/`FILLSTRIDE` placement values.** Not
   attempted. GROUNDING documents 122 prior micro-mutations
   (phase/spatial parameter sweeps on the champion itself) that found
   no holdout-surviving improvement — spending this run's budget on a
   single honest test of the *mechanism* (does one-time build-then-fight
   pay for itself at all) seemed more informative than a parameter
   sweep before knowing whether the direction has any signal.
5. **Dual/multi-chain replication to maintain the filler AND a live
   defensive chain concurrently.** Not attempted — GROUNDING explicitly
   documents this as already tried and structurally rejected (`call far
   [bx]` has only one CS:IP; can't maintain two independent chains).
   My design instead treats the filler purely as one-time inert
   territory marking, never re-visited or defended by a second chain.

## Result

Team score: **0.648467** team-per-battle over 2500 battles (25 cohorts
x 2 seeds x 50 battles), same field (`config-subenc2-all2025.json`
cohorts/zombies) as the champion's control run.
`warrior1PerBattle=0.311233`, `warrior2PerBattle=0.337233`.
Full results: `experiments/arena-candidate8-all2025.json`. Ran clean —
exit code 0, all 50 cohort-seed runs completed, zero crashes, and
manual inspection of every per-run log line confirms no zero-score
entries anywhere in the field.

Champion baseline (m049, same field, `experiments/m049control-all2025.json`):
**0.6674** team-per-battle (w1=0.3196, w2=0.3478) over the same 2500
battles.

**Delta: -0.018933 team-per-battle (-2.8% relative) vs. the champion.**

Smoke test (10 battles, 2 cohorts, seed `all-001`, run before the full
benchmark): ran clean, no crashes, no zero scores — w1=0.25, w2=0.45,
team=0.70 (too small a sample to be meaningful on its own, but
confirmed structural soundness before committing to the full run).

## Honest assessment

**The build-then-fight tradeoff, as implemented here, loses to pure
speed.** The 20 one-time rounds spent spraying 4 filler anchors before
committing to the real replication chain cost more than they returned
in area denial, on this field, against these 2025 opponents. This
tracks closely with GROUNDING's own isolated data point (~24-instruction
insert costing -0.11 mean score) — my 20-round insert (8 setup + 16
loop-body instructions) cost about -0.019, noticeably smaller in
magnitude than that isolated data point, which itself suggests either
(a) my placement/insertion point was less costly than the ones
GROUNDING measured, or (b) some of the filler did provide partial
offsetting value that a same-sized "dumb" insert wouldn't have — I
can't distinguish these from a single aggregate score alone, and did
not have budget in this pass to run an ablation (e.g. same 20-round
delay with no filler writes at all, to isolate "cost of delay" from
"value of filler") that would separate the two cleanly. That ablation
is the natural next step if this direction is revisited.

Rank-wise, this candidate's 0.648 sits below the champion's 0.667 but
is not a catastrophic regression — it is in the same performance tier,
unlike the "bomb86" rejected direction (0.6308) or the scout+executor
direction (regressions from -0.017 to -0.037, per GROUNDING) which
both also underperformed the champion by comparable-or-larger margins.
This suggests the one-time-bootstrap-cost framing generally struggles
to beat a mechanism this finely tuned, regardless of what the added
bootstrap code tries to do — the champion's specific 189/117-byte
Phoenix implementation appears to sit near a local timing optimum that
extra instructions anywhere in the hot bootstrap path tend to disturb,
almost independent of what those instructions are for.

### Strengths (mechanism-level, independent of final score)

- Genuinely different failure-mode shape from the champion lineage:
  the filler anchors are inert (never `call far`'d into by this
  warrior itself), so they don't introduce a new single-point-of-failure
  the way the champion's own live 2-byte anchor does — losing a filler
  word to an opponent's overwrite costs nothing to this warrior's own
  survival, unlike the champion's live anchor which is fatal if
  clobbered at the wrong instant.
- Zero changes to the hot replication loop — all novel risk is
  concentrated in a one-time, auditable bootstrap block, not compounding
  per-cycle the way a hot-loop change would (this was a deliberate
  design constraint after reading about the rejected "decoy" attempt's
  hot-loop DI-instability crash).
- Reuses the champion's exact proven anchor byte pattern (`FF 1F`) for
  the filler itself, so if a future design wanted to make the filler
  "live" (e.g. having a later cycle jump into a surviving filler word
  as a fallback anchor), the byte-level groundwork is already
  compatible — not attempted here, out of scope for this iteration,
  but noted as a possible next step.

### Weaknesses

- 20 rounds of pure overhead before either warrior does anything the
  champion doesn't also do, in an engine GROUNDING proved is sensitive
  to single-instruction timing shifts. This is the central risk the
  assignment asked me to test honestly.
- The filler is genuinely inert this iteration — it denies space
  passively (an opponent might waste effort on it, or it might sit
  in unused territory doing nothing) but this warrior never checks
  whether any filler word was useful, matched anything, or should
  inform later behavior. It is pure area-denial, not adaptive.
- Placement (`FILLBASE`/`FILLSTRIDE`) was chosen once, by reasoning
  about proximity to own territory, not tuned empirically — the
  achieved score reflects one specific placement choice, not a
  ceiling on the direction.
