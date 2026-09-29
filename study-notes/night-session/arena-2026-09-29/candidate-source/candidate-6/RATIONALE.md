# Candidate 6 — Minimal-footprint pure replicator, no combat

## What I built

`ReplicatorA.asm` / `ReplicatorB.asm` — a plain near-jump self-copying "imp"
replicator, **26 bytes each** (vs. the champion's 189/117 bytes), with
**zero** combat or searching mechanisms of any kind: no `INT86h`, no
`INT87h`, no zombie capture/interaction, no self-recognition signature, no
opponent detection of any kind.

Mechanism (identical in A and B, differing only in a `STRIDE` constant so
the two don't walk in lockstep):

1. **One-time init** (`start:`, runs exactly once, never revisited):
   `ES` is pointed at the arena segment (cold-boot `ES` defaults to the
   team's *shared-memory* segment, which is not execute-accessible, so
   this is required before any `MOVSW`/`STOSW` can write code that will
   ever run). `SI` is set from `AX` (the free self-location value the
   engine hands every warrior at boot) to point at `loop:`, and `DI` is
   set to `SI + STRIDE` as the first copy target.
2. **Steady-state loop** (`loop:`, 14 bytes / 7 words — this is the *only*
   thing copied each generation): `REP MOVSW` copies those 7 words from
   `[DS:SI]` to `[ES:DI]`, then `SI`/`DI` are re-derived from the just-
   written target and the next target, and a bare `JMP SI` (register-
   indirect near jump, `FF E6`, 2 bytes) hands execution straight into the
   freshly written copy. No far call, no segment aliasing, no shared-
   memory coordination cell, no re-derivation from `AX` after generation
   0 — every register the next generation needs is already correct in
   the CPU state carried across the jump.

I confirmed from the engine source (`Warrior.java`, `RestrictedAccessRealModeMemory.java`,
`RealModeAddress.java`) that execute access is granted for the *entire*
arena segment and nothing else — not the private stack segment, not the
shared-memory segment. That means the champion's `FAR_SEG=0xFFC`
far-call/segment-aliasing trick isn't solving a real addressing
restriction; a same-segment near jump is sufficient. Dropping it removes
the single largest chunk of the champion's mechanism (the whole
`push ss/pop es` bootstrap-copy-to-stack dance, the `PTR_CELL` shared-
memory pointer cell, the `FAR_SEG` ES-aliasing) for free.

## What I rejected within this direction

- **Any self/opponent-recognition check before jumping into a freshly
  written copy** (e.g. verifying the copy landed intact before trusting
  it). This is exactly the class of thing the champion's `INT87h`
  signature check does, and the assigned direction was "no searching
  whatsoever" — adding a verify-before-jump step would blur that line
  even though it doesn't involve bombing or zombie capture. I kept the
  design honest to "zero awareness of anything outside my own body."
- **Copying the whole `start:`+`loop:` block every generation** (like the
  champion's `rep movsw`-of-9-words bootstrap pattern) instead of only
  `loop:`. Since `start:`'s one-time setup never needs to run again once
  `ES`/`SI`/`DI` are correct in a live copy's registers, copying it every
  generation would be pure waste — more bytes moved, more rounds spent,
  for no behavioral benefit. Rejected in favor of copying only the
  minimal steady-state unit.
- **`REP MOVSB` in bytes instead of `REP MOVSW` in words**: same round
  cost per unit copied in this engine (one iteration per round either
  way, confirmed from `Cpu.java`'s `REP` handling), but word-copies halve
  the number of `CX` iterations for the same byte count, so `MOVSW` was
  strictly better here with no tradeoff.
- **Larger `STRIDE` values (tried 512/576) to spread generations out
  more, on the theory that a sparser footprint might reduce collision
  odds with other warriors' activity.** This actually exposed a real bug
  I had to fix: `STRIDE` values above 127 force NASM's `add di,STRIDE`
  into a 4-byte-immediate encoding instead of 3-byte, which silently
  changes `loop:`'s true byte length without changing the hand-picked
  `WORDS` constant — the result was **a 15-byte block being described as
  7 words (14 bytes)**, truncating the copied `JMP SI` at the end of
  every single generation. Caught this via the assembled `.lst` listing
  before it shipped (see per-file comments warning about it). After
  fixing, I re-tested moderate stride values (48/64 vs. 96/112) on small
  samples; the difference was within noise, consistent with the
  reasoning that stride mainly controls how fast the execution point
  walks across the arena, not how exposed each generation's fixed,
  small vulnerability window is. Settled on 96/112 (safely inside the
  3-byte encoding range, comfortably larger than the 26-byte body, and
  empirically no worse than smaller values).

## Verification before shipping

Because early smoke-test scores were very low (and briefly, before the
`STRIDE`-encoding bug fix, `w1=0.000000` in 10/10 battles), I did not
assume "pure replication just loses" without ruling out a code bug first:

- **Read the assembled `.lst` listing after every change** to verify the
  actual byte layout matches the `WORDS`/`STRIDE` constants exactly
  (this is what caught the bug above).
- **Ran the warrior pair alone in the arena with zero opponents and zero
  zombies** via `inspect-arena.mjs`, stepping to round 3900+. It survived
  indefinitely with sane register state (`ES` correctly pinned to the
  arena segment throughout, `SI`/`DI`/`IP` all self-consistent, no
  exception). This proves the replication logic itself is correct.
- **Pulled per-warrior telemetry** (`--telemetryFile`, deterministic
  engine) from mixed battles and confirmed deaths are "CPU exception" /
  "memory exception" at varied, plausible rounds (hundreds to low
  thousands), not an instant deterministic crash — consistent with
  external overwrite collisions from other warriors' independent
  activity in the same shared 64KB arena, not a code defect.

## Final result

Full `config-subenc2-all2025.json` field (25 cohorts x 2 seeds x 50
battles = 2500 battles), `cohorts`/`zombies` unchanged from the template:

- **Candidate 6 (this pure replicator): team = 0.0203 per battle**
  (`warrior1PerBattle` 0.0103, `warrior2PerBattle` 0.0101 — the two
  warriors contributed almost identically despite the different `STRIDE`
  constants, so the phase offset didn't meaningfully favor one over the
  other). Per-50-battle-run scores ranged from 0.0 to 0.183, median 0.02;
  29 of 50 cohort/seed runs had at least some nonzero score, 21 scored
  exactly zero across all 50 battles in that run.
- **Champion (m049, `experiments/m049control-all2025.json`, same field):
  team = 0.6674 per battle.** For calibration, m049's own per-50-battle
  run scores never dropped to exactly 0 anywhere in the field (range
  0.12-0.96) — meaning in every single cohort/seed combination, at least
  some of its warriors survived at least some battles. My candidate
  scoring exactly 0.0 in 21 of 50 run-groups is a materially different
  (weaker) failure pattern than "loses more often," it's closer to
  "usually doesn't survive at all" against a meaningful fraction of the
  field.
- **Candidate 6 scores about 3% of the champion's team score on the
  identical field.**

## Honest assessment

**Strengths:**
- Genuinely minimal: 26 bytes per warrior (52 bytes total for the pair)
  vs. the champion's 306 bytes combined — about 17% of the footprint.
- Structurally simpler mechanism: no segment aliasing, no shared-memory
  coordination, no signature/self-recognition logic, no far calls. Easy
  to fully verify by hand (which is how I caught the `STRIDE`-encoding
  bug before it shipped).
- Does not share the champion's documented single-point-of-failure shape
  in the same way — there's no 2-byte anchor cell in shared memory that a
  stray write can corrupt independently of the code itself — though see
  below, it turns out to have an even more exposed failure surface of
  its own.
- A clean, honest empirical data point for the arena's design-space
  question: it directly tests "does skipping all bootstrap/combat
  overhead and spending every instruction on raw replication speed win
  through sheer replication count" — and the answer, at this field and
  this scoring rule, is a clear and unambiguous no.

**Weaknesses (the important finding):**
- Because engine scoring is pure survival-to-battle-end (confirmed from
  `War.java:updateScores` — `1/numSurvivorsAlive` split among warriors
  still alive and non-zombie at the end, nothing about replication count,
  territory, or cells written), a strategy that "wins" by cranking
  replication speed doesn't actually connect to the scoring function at
  all unless it also improves survival. My design has literally zero
  mechanism to detect or resist being overwritten, and unlike the
  champion, no verification step before trusting a jump target — so any
  single opponent (or zombie) instruction landing on the ~20-round
  window between writing a fresh copy and having fully used it is fatal,
  with no recovery path. In a shared arena this dense (my team plus 3
  opponent teams plus 4 zombies, all executing every round), that window
  gets hit very often, very early.
- The core bet behind this assigned direction — "every combat/searching
  instruction costs real bootstrap-path time, so cutting all of it should
  win on sheer replication speed" — undersells how much of the
  champion's non-replication code is actually *defensive* rather than
  offensive. Re-reading `final/ChimeraA.asm`/`ChimeraB.asm` with this
  result in hand, the `INT87h` self-recognition call isn't really "combat
  overhead" in the sense of attacking opponents — it's closer to a
  cheap, targeted self-repair/zombie-recruitment step that happens to
  reuse the same opcode as bombing. Stripping it didn't just remove
  offense, it removed the champion's only source of resilience, and
  resilience turned out to matter far more than raw replication speed
  under this pure-survival scoring rule.
- This is a legitimate and useful negative result for the arena's overall
  question, not just a weak submission: it empirically rules out "go
  faster and smaller, skip everything else" as a winning strategy on
  this field, and pins the reason on the scoring rule itself (survival,
  not output) rather than on any fixable implementation detail — the
  solo isolation test rules out a code bug, and the telemetry rules out
  an instant/deterministic failure mode.

## Files

- `ReplicatorA.asm`, `ReplicatorB.asm` — final warrior sources (26 bytes
  assembled, each).
- `build/` — assembled binaries + NASM listings + `manifest.json` (SHA-256
  hashes) from the last `assemble.mjs` run.
- Full-field results: `experiments/arena-candidate6-all2025.json`
  (raw run data, run via `config-arena-candidate6-all2025.json` at the
  repo root, a copy of `config-subenc2-all2025.json` with only
  `experimentId`/`outputPath`/`runDirectory`/`candidate` changed,
  `cohorts`/`zombies` byte-identical to the template — verified
  programmatically before running).
