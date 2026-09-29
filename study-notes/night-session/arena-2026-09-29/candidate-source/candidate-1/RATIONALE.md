# Candidate 1 — Multi-anchor rotation (RotAnchor A/B)

## Assigned direction

The champion (m049 "Chimera"/"Phoenix") re-enters each new replication band
through a single 2-byte `FF 1F` (`call far [bx]`) anchor, written fresh
each cycle at a perfectly predictable fixed stride: `chain[i] = chain[0] -
i*0x3C00` (A) / `i*0x4400` (B). If that specific 2-byte address is
corrupted by any external write before the warrior's own `call far [bx]`
reaches it, the warrior dies instantly — confirmed as the dominant (~60%)
death cluster in last night's telemetry analysis. My assignment: build a
warrior that maintains 2-3 anchors at different band offsets, rotating
which one is used each cycle, so a single corrupted anchor doesn't
guarantee death.

## What I built

`RotAnchorA.asm` / `RotAnchorB.asm`: byte-identical to `final/ChimeraA.asm`
/ `ChimeraB.asm` except for one substantive change inside the hot
`worker:` replication loop, plus the bookkeeping that change requires.

Instead of always stepping to the next band by a single fixed stride
(`sub [bx],bp` with `bp` constant for the whole battle), `worker:` now
alternates `bp` between two different values every cycle via one
self-inverting instruction: `xor bp,dx` (2 bytes), placed immediately
before the existing `sub [bx],bp`. `DX` is already a stable, per-warrior
constant used elsewhere in the loop (`sub sp,dx`) and never modified
inside `worker:`, so the toggle costs zero new registers and zero new
bootstrap setup. Because XOR is its own inverse, `bp` cleanly alternates
between its original value and `original xor dx` forever, with no drift —
by construction, not by the kind of runtime luck a `sub`/`add` pair would
need to cancel exactly.

The practical effect: the sequence of band addresses the chain visits is
no longer a single arithmetic progression with one fixed period. An
external actor whose writes land on a fixed offset or fixed period
relative to "the previous anchor" (whether by design or by coincidence of
its own scan pattern) is far less likely to consistently line up with
"the next anchor," because there no longer is a single next-anchor
offset — it alternates between two. This is the cheapest possible
instrument I could find that is still genuinely a multi-offset,
per-cycle-rotating scheme: one instruction, no added register pressure,
no DI involvement at all.

### Byte-length bookkeeping (why this isn't just "add one instruction")

`worker:` grows from 17 to 19 bytes with the new instruction. A previous
experiment documented in `GROUNDING.md` (the "DEC DI ablation") found that
`worker:`'s exact byte length is tightly coupled to a hardcoded 9-word
(18-byte) copy count used in three places — shrinking `worker:` by even
one byte without adjusting the copy count caused 100% deterministic death
at a fixed round, with no crash/exception, just total value collapse. I
verified by hand (not assumed) that all three copy-count sites needed a
matching +1-word bump to preserve the original 1-spare-byte margin exactly:
- `captured_init:`/`phoenix_init:`'s `rep movsw` that saves `worker:`'s
  template into the private stack (`mov cx,9` -> `mov cx,10` in both
  places, both A and B).
- `phoenix_pointer_ready:`'s first-entry copy count. A used `mov cx,8`
  (bumped to `9`); B already used `mov cx,9` for this site in the
  champion, which — verified by hand — already covers the new 19-byte
  `worker:` with the same spare-byte margin, so it is intentionally left
  unchanged.
- `worker:`'s own steady-state copy count (`mov cl,9` -> `mov cl,10`, both
  A and B, since `worker:`'s body is shared/identical in both).

## A real bug I hit and fixed before shipping

My first version used `xor bp,ax` (AX = 0x1FFF, already stable and free)
as the toggle, reasoning it was the cheapest available delta source. It
assembled cleanly and ran without crashing, but scored catastrophically
low on a same-cohort smoke test: **0.0625 team-per-battle vs. the
champion's 0.78 on the identical 4 cohorts** — worse than almost losing
every fight. I did not ship on that result; I used a subagent to trace
the exact 8086 semantics rather than guess. Root cause: `0x1FFF`'s low
byte is `0xFF`, so XORing it into `bp` and then subtracting `bp` from
`[bx]` shifts `[bx]`'s low byte by `-0xFF ≡ +1 (mod 256)` every time the
alternate stride fires — drifting the chain's low byte away from the
fixed `0xA2` pattern the champion's band-quantization/self-recognition
logic depends on, permanently, cycle after cycle. This isn't the same bug
as the previously-documented "decoy" DI-arithmetic crash (that was
diagnosed as unstable `DI` arithmetic; this is a stable-but-wrong `BP`
XOR delta with a nonzero low byte) — same general lesson (the champion's
`xxA2` low-byte invariant is load-bearing and fragile, consistent with
`GROUNDING.md`'s separately-documented "AL-value sweep... ALL variants
crashed" rejection) but a genuinely different mechanism, worth recording
as its own data point. The fix: switch the delta source to `DX`, whose
low byte is `0x00` for both A (`0x3800`) and B (`0x4000`), so the toggle
only ever perturbs `bp`'s high byte and never touches the fragile low
byte at all. Re-tested on the same 4-cohort smoke set after the fix:
0.625 team-per-battle — back in a competitive range, no crash.

## Alternatives considered and rejected within this direction

1. **Redundant anchor write in `worker:` via DI-offset arithmetic**
   (write the anchor at two nearby addresses each cycle, `di-8` and the
   real position). This is essentially what the already-tried "decoy"
   direction did and it crashed twice, root-caused to unstable DI
   arithmetic. I did not attempt a variant of this — the register census
   I did on `worker:` (every one of AX/BX/CX/DX/SI/DI/BP is already live
   and precious at every point in the loop) shows any second address
   write needs either new DI arithmetic (the proven-crashy path) or a
   second full register's worth of state, which isn't available without
   real bootstrap cost. Rejected before implementation, not after a
   failed test.
2. **Two independent pointer cells (`[bx]`/`[bx+4]`) advanced by the same
   stride, alternating which one is called through.** Rejected: this
   drifts toward the explicitly-rejected "dual-chain" idea (one CS:IP
   can't run two independent chains), and even the weaker "write to two
   cells, call through one" version needs a second `sub`/`mov`/`stosw`
   triplet in the hot loop — 6+ instructions per cycle, far over budget
   given the grounding doc's own measured cost data (a 24-instruction
   bootstrap-path insert cost -0.11; a hot-loop insert that runs every
   single cycle for the whole battle is a strictly worse trade).
3. **Bootstrap-only pre-seeding of a second anchor** (write two anchors
   once at cold boot, no per-cycle rotation). Cheaper and safer, but does
   not satisfy "rotating which one is used each replication cycle" — it
   only protects the very first cycle, not the whole battle. Rejected as
   not actually answering the assigned direction, even though it would
   have been the lower-risk choice.
4. **`xor bp,cx` using a bootstrap-stashed `CH` delta byte** (to get a
   larger, more deliberately-chosen stride difference than what `DX`
   happens to provide for free). Investigated in detail: this depends on
   `CX` being *exactly* `0x0000` in the narrow window between `rep movsw`
   finishing and `mov cl,10` resetting it, every single cycle, for the
   entire battle, with no margin for error if that invariant is ever
   perturbed by something I haven't traced. Given the AX regression I'd
   just hit from a superficially-similar "this register looks free and
   stable" assumption, and the AL-sweep precedent's "reasons not fully
   understood," I chose the provably-simpler `DX` option over the
   cleverer-but-less-verifiable one, accepting a smaller second stride
   (`0x0400`) in exchange for not depending on an invariant I could not
   fully verify held forever.

## Honest assessment

**Strengths**: genuinely sidesteps the documented single-point-of-failure
shape — the champion's anchor sequence is one arithmetic progression, this
warrior's is a 2-interleaved one, at a cost of exactly one 2-byte
instruction per replication cycle (the cheapest change I could find that
still qualifies as real per-cycle rotation) plus a fully-verified,
non-guessed byte-length/copy-count adjustment. Ran clean across 48
smoke-test battles (12 distinct cohorts) with no crashes and no
degenerate all-zero pattern, then a full 2500-battle run on the exact
all-2025 field used for every other comparison tonight.

**Weaknesses**: the safe delta (`DX`, low byte `0x00`) I ended up shipping
gives a smaller stride difference than I'd originally intended with the
AX-based version. Because each warrior's own already-live `DX` happens to
sit exactly `0x400` below its own primary stride (`0x3C00`/`0x3800` for A,
`0x4400`/`0x4000` for B), both warriors alternate with the *same* second
stride value, `0x400` — a real but modest ~15-17x difference in
magnitude from their primary stride, not the more dramatic split I'd
originally computed with a dedicated constant (see rejected alternative
4). That more deliberate, larger, still-low-byte-safe delta was
investigated but not shipped, since I couldn't fully verify its safety
margin under the same scrutiny the AX bug demanded, and I prioritized
shipping something provably correct over something more aggressive but
less certain. This is a genuinely novel mechanism, not merely a parameter
retune of the champion, per the grounding doc's own framing that novelty
sidestepping the documented failure mode is valuable even if it doesn't
yet match the champion's raw efficiency.

## Final score vs. baseline

Full run: `config-arena-candidate1-all2025.json` (identical `cohorts`/
`zombies` to `config-subenc2-all2025.json`, 25 cohorts x 50 battles x 2
seeds = 2500 battles), output at
`experiments/arena-candidate1-all2025.json`. Ran clean end-to-end, exit
code 0, no exceptions in any of the 50 per-cohort/seed sub-runs.

| | team-per-battle | warrior1 | warrior2 |
|---|---:|---:|---:|
| **RotAnchor (candidate-1)** | **0.5750** | 0.2689 | 0.3061 |
| m049 champion (baseline) | 0.6674 | 0.3196 | 0.3478 |
| delta | **-0.0924** (-13.8%) | -0.0507 | -0.0417 |

So: a real, clean, non-crashing warrior implementing genuine per-cycle
multi-anchor rotation, but it underperforms the champion by about 14% on
this field — in the same direction (a net loss) as several other
tried-and-rejected directions documented in `GROUNDING.md` (`bomb86` at
0.6308 vs 0.6658, the gap-380 stack-tune at a reversed-sign holdout
result), though notably **RotAnchor is the one candidate in that
already-tried list that doesn't crash, wasn't rejected for overfitting,
and represents a structurally different replication-address pattern
rather than a retuned parameter** — consistent with the grounding doc's
explicit framing that novelty sidestepping the documented single-point-
of-failure shape is worth reporting even without yet beating the
champion's raw efficiency. My best guess at why it costs score rather
than gaining it: the champion's `xxA2`-low-byte-fixed, single-stride
chain is apparently already tuned (by whatever process produced m049) to
interact well with the specific opponent field's own write/scan patterns
and the self-recognition/zombie-capture constants built around that fixed
pattern; alternating the stride doesn't just add robustness against
corruption, it also perturbs whatever positional regularities the rest of
the design (band-quantization math in `start:`, the `INT 87h`
self-recognition signature) was implicitly counting on, and on this field
that cost outweighs the robustness benefit. I did not have time/budget
within this task to run the controlled ablation that would separate "cost
from the 2-extra-bytes-per-cycle timing tax" from "cost from disrupting
positional regularity" — that would be the natural next experiment.
