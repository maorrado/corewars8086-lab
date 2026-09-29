# New_Best regression: mechanistic diagnosis and timing-fix search (2026-09-29)

## Verification

`New_Best1`/`New_Best2` supplied by the user (via local Downloads folder,
not fabricated or reconstructed). Hashes verified exact match before any
test:

| | SHA-256 | Size |
|---|---|---|
| New_Best1 | `81ca1a63b58475f77b8e6934e8340bdfef48fce54434a2d15e4735da2b2342fc` | 117 bytes (matches promotion-record metadata) |
| New_Best2 | `4480aef28714010549a86c7fd8f0022f7f63687aac46a887d35937762a2c65a3` | 171 bytes (matches promotion-record metadata) |

Not committed to the research branch (received privately from the user for
local testing only; only hashes/metadata and my test results are saved).

## Independent confirmation of the New_Best regression

Built a direct-counter test (8 cohorts from the all-2025 field, each cohort
= New_Best + 2 real 2025 opponents, 4 seeds `newbest-direct-8801..8804`,
50 battles/cohort/seed = 1600 battles/candidate). Not a byte-identical
reproduction of Codex's original 8 contexts (that config was not preserved
anywhere in the repo — only its aggregate result was), but same scale and
same real adversary.

| | m049 | m050 |
|---|---|---|
| Score vs New_Best-containing field | 0.44499 | 0.42436 |
| Paired (n=32) | — | 9 wins / 19 losses / 4 ties |
| Mean diff (m050−m049) | — | **-0.0206, 95% CI [-0.0328, -0.0085]** |

Confirms Codex's finding independently: m050 regresses against the real
New_Best files. Direction matches Codex's report; magnitude differs (my
test design differs from theirs).

## Mechanistic diagnosis: exact first-divergence point

Used a custom two-tier debug-trace instrumentation added to
`repos/corewars8086-6.0.0-debug-trace/` (patch below):
- Light filter (`-Ddivtrace.warriors=...`): per-battle winner list
  (`WARENDTRACE`) and death events (`DEATHTRACE`), cheap enough to run
  across all 50 battles of a seed to find a divergent one.
- Heavy filter (`-Ddivtrace.heavy.warriors=...`, gated by
  `-Ddivtrace.heavy.warIndex=N`): full per-round IP/DI/SP/ES/BX
  (`PRETURN`/`POSTOPCODE1`) plus `INT87` (ES, DI, found-offset) and
  `CALLFAR` (from/target CS:IP) events, scoped to exactly one targeted
  battle to keep output manageable (~130K lines vs. ~4M for all 50).

Scanned cohort `all-v1-08-newbest`, seed `newbest-direct-8802` (the largest
single-run regression found, m049=0.4433 vs m050=0.35). Battle index 1
(same seed, same opponent set) diverges cleanly: m049 wins
(`COD_m049_nb1` survives to round 200000), m050 loses entirely
(`zom20b, New_Best1` win; both m050 warriors die).

**Exact first divergence** (warrior1/A of each candidate, identical
opponents, identical seed):

```
m050: DIVTRACE round=11 name=COD_m050_nb1 event=INT87 ES=1000 DI=0000 foundAtDiff=4F8F ax=F9EB dx=CCCC
m049: DIVTRACE round=12 name=COD_m049_nb1 event=INT87 ES=1000 DI=0000 foundAtDiff=4F8F ax=F9EB dx=CCCC
```

Both find the identical signature at the identical offset (`foundAtDiff=4F8F`,
same `ax`/`dx`) — the search itself is unaffected. But **m050's `INT87`
fires at round 11, exactly one round before m049's round 12** — confirming
the user's point: the engine advances by whole-opcode turns
(`War.nextRound()` calls `warrior.nextOpcode()` once per living warrior per
round; see `War.java:113-136`), so removing `xor di,di` (a real opcode that
consumes a turn, even though it doesn't change DI's *value* — DI is already
0 at cold boot per `Warrior.java:initializeCpuState`) shifts every
subsequent instruction, for the rest of the battle, by exactly one round
relative to m049. This is confirmed to persist: the first `CALLFAR` (the
Phoenix anchor) fires at round 57 for m050 vs. round 58 for m049, and stays
offset by exactly 1 for as long as both traces were compared.

**Where it costs m050 the battle**: `COD_m050_nb1` dies at round 19775
(`reason=memory exception`, `IP=C0A6`), with the death-site byte dump
showing `29 D4 29 2F` at the IP — the `worker:` body's `sub sp,dx; sub
[bx],bp` sequence. This is the same "2-byte anchor is the single point of
failure" mechanism documented in prior sessions (`FF 1F` anchor
corruption), except **the round-shift changes exactly when in the battle
this vulnerable moment occurs relative to New_Best's ongoing attack** — in
this specific battle, m050's shifted timing puts its critical moment in a
window where New_Best has already started corrupting relevant memory,
while m049's one-round-later timing (in the identical battle, same
opponents, same seed) avoids it.

**Conclusion on mechanism**: the user's hypothesis is correct and now
directly confirmed at the instruction/round level, not just argued from
engine semantics. `xor di,di`'s removal is not free — it does not change
final register values, but it does consume a turn, and removing it
shifts m050's entire timeline by exactly one round relative to m049 for
the rest of every battle.

## Timing-shift fix search: does direction matter?

Hypothesis: if the regression is specifically about being *earlier* than
m049, shifting to be *later* (or restoring exact parity) might dodge it
while possibly keeping some benefit. Built `m050-plus1`: m050's DI-removal
kept (for whatever mechanism drives the general-field benefit), but two
`NOP`s inserted after the `int87h`/`cld` sequence (after INT87h's own
timing, only shifting what follows), making the net opcode-count exactly
**+1 relative to m049** (m050 alone is -1; +2 nops = net +1). Assembled to
189/117 bytes (identical to m049's sizes).

| Test | m049 baseline | m050 (-1 round) | m050-plus1 (+1 round) |
|---|---|---|---|
| All-2025 field (n=50) | — | **+0.0069, CI [+0.0017,+0.0121]** (significant improvement) | -0.0015, CI [-0.0141,+0.0110] (no effect, crosses zero) |
| vs. New_Best (n=32) | — | **-0.0206, CI [-0.0328,-0.0085]** (significant regression) | **-0.0124, CI [-0.0246,-0.0002]** (still regresses, though smaller and barely significant) |

**Conclusion: timing-shift direction does not solve this.** m050-plus1
loses the general-field benefit entirely (CI crosses zero — the benefit is
specific to the exact -1 direction, not a general "any timing change
helps" effect) but *still* regresses against New_Best, just by a smaller
margin. New_Best's sensitivity is not specifically about "earlier than
m049" — it appears to be a broader sensitivity to any deviation from
m049's exact reference timing, which makes sense given New_Best was built
specifically to attack this code family's initialization sequence.

**This closes the timing-adjustment avenue for a simple fix.** No
single-opcode timing shift (tested in both directions) preserves the
general improvement while avoiding the New_Best regression. A real fix, if
one exists, would need to be structurally different — e.g., keeping m049's
exact timing on the code path New_Best's attack is timing-sensitive to
(the INT87h/anchor sequence) while finding the DI-removal-style
improvement's actual benefit elsewhere, which was not identified in this
session (the benefit's exact causal mechanism — why being 1 round earlier
specifically helps against the general field — was not further isolated
beyond "it is a real, measured, reproducible effect distinct from a
generic timing-sensitivity").

## Debug-trace instrumentation patch

Applied to `repos/corewars8086-6.0.0-debug-trace/src/main/java/il/co/codeguru/corewars8086/`:
- `cpu/Cpu.java`: added static trace-tag fields (`traceCurrentWarriorName`,
  `traceCurrentRound`, `traceWarriorFilter` light filter driven by
  `-Ddivtrace.warriors`, `traceHeavyWarriorFilter`/`traceHeavyWarIndex`
  heavy filter driven by `-Ddivtrace.heavy.warriors`/`-Ddivtrace.heavy.warIndex`);
  instrumented `int87()` (logs ES/DI/found-offset) and the indirect
  `CALL FAR [mem]` handler (logs from/target CS:IP).
- `war/War.java`: `nextRound()` logs `PRETURN`/`POSTOPCODE1` (CS/IP/DI/SP,
  plus ES/BX on PRETURN) for heavy-filtered warriors.
- `cli/HeadlessCompetitionRunner.java`: `onWarStart()` arms/disarms the
  heavy filter based on `warCounter` vs. `traceHeavyWarIndex`; `onWarEnd()`
  logs `WARENDTRACE` (round, winners) when the light filter is non-empty;
  `onWarriorDeath()` filter generalized from a hardcoded `"ChimeraA"`
  prefix to the same property-driven filter.

Not copied into this research branch (it's a modification to a vendored
engine copy under `repos/`, which is excluded from uploads per the
existing exclusion rules — same treatment as the original
`corewars8086-6.0.0-debug-trace` build from the first night session).
Reproducible by reapplying the same edits described above to a fresh copy
of `repos/corewars8086-6.0.0-deterministic/`.

## Files

- `configs/config-m049-vs-newbest.json`, `config-m050-vs-newbest.json`,
  `config-m050plus1-vs-newbest.json`, `config-m050plus1-all2025.json`
- `results/m049-vs-newbest.json`, `m050-vs-newbest.json`,
  `m050plus1-vs-newbest.json`, `m050plus1-all2025.json` (compacted)
- `candidate-source/ChimeraA-m050-plus1.asm`, `ChimeraB-m050-plus1.asm`
