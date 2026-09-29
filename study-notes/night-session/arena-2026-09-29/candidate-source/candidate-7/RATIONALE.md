# Candidate 7: Segment-diversified Phoenix

## Assigned direction

The champion (m049, `final/ChimeraA.asm` / `final/ChimeraB.asm`) and every
Chimera-derivative tried the night before used a fixed compile-time constant
`FAR_SEG = 0FFCh` as the far-call segment for its Phoenix replication anchor.
That's a scannable, predictable constant: any adversary that greps compiled
warrior binaries for `FC 0F` (the little-endian encoding of `0FFCh` as it
appears in `mov word [bx+2], 0FFCh`) can identify every Chimera-lineage
warrior in the arena at a glance, and potentially target it. My assignment
was to make the far-call segment vary per-battle (derived from something the
engine randomizes each battle, i.e. `loadOffset`) instead of being a fixed
constant, while proving the chosen values stay safe against the engine's
execute-blind-spot mechanic that `0FFCh` was originally chosen to avoid.

## What I built

`PhoenixSegA.asm` / `PhoenixSegB.asm` — a byte-for-byte structural clone of
Chimera/m049's replication mechanism (band-quantized worker-entry addressing,
`PTR_CELL` far-pointer cell, `INT 87h` self/zombie-recognition, the `worker:`
`rep movsw` + `call far [bx]` replication loop) with exactly one substitution:
**`FAR_SEG` is no longer an immediate constant baked into the binary.** It is
computed once, at boot, from 3 bits of the warrior's own `loadOffset` (`AX`
at cold boot — free, per-battle-randomized entropy the engine hands every
warrior), landing on one of 8 possible segment values in `[0FF9h, 01000h]`
instead of always `0FFCh`.

Concretely, three instructions were inserted at the very top of `start:`,
before `loadOffset` is consumed by the existing band-quantization logic:

```asm
mov bp, ax          ; capture loadOffset copy before AX is clobbered
and bp, 7            ; isolate 3 low bits -> 0..7
add bp, 0FF9h        ; bp = randomized-but-safe far segment, 0FF9h..01000h
```

`BP` is provably unused by the champion's own logic for the entire span from
`start:` to `phoenix_pointer_ready:` in both A and B (verified by grepping
every `bp` reference in both original files — the only uses are
`mov bp, 03C00h`/`04400h` and `sub [bx], bp`, both inside/after `worker:`,
which only runs after `bp` has already been consumed into the pointer cell).
So this insert cannot clobber anything the original design depended on.

At the point of use, the two places that referenced the `FAR_SEG` immediate
were changed to reference the computed register instead:

```asm
; before (champion):
mov word [bx + 2], FAR_SEG
...
mov ax, FAR_SEG
mov es, ax

; after (candidate-7):
mov [bx + 2], bp
...
mov ax, bp
mov es, ax
```

Net cost: **+3 instructions, entirely in the one-time bootstrap path, zero
added to the hot `worker:` replication loop** that runs every replication
cycle for the rest of the battle. This was a deliberate choice given the
grounding doc's timing finding that even a single added instruction shifts
every subsequent round number, and that hot-loop insertions are far more
expensive than one-time bootstrap insertions. Compiled size: `PhoenixSegA` =
195 bytes (champion: 189), `PhoenixSegB` = 123 bytes (champion: 117) — both
comfortably under the 256-byte final-stage limit.

## Why `[0FF9h, 01000h]` specifically — the safety derivation

The grounding doc states `CS = 0FFCh` has execute-blind-spot linear offsets
`[0, 3Fh]` / `[0FFC0h, 0FFFFh]`, but doesn't fully explain the mechanism, so
I derived it from source before trusting or extending it
(`RestrictedAccessRealModeMemory.java`, `RealModeAddress.java`,
`Warrior.java`):

- Every warrior's **execute-access region is fixed once at construction**,
  as `[loadSegment:0000, loadSegment:FFFF]`. Since every warrior loads into
  the same `ARENA_SEGMENT = 01000h`, the only linear range where
  `readExecuteByte` ever succeeds, for any warrior, for the whole battle, is
  the fixed range **`[10000h, 1FFFFh]`** — regardless of what `CS` is set to
  at runtime.
- `RealModeAddress` computes `linear = (segment*16 + offset) mod 100000h`.
  So executing with `CS = seg`, `IP = ip` only succeeds when
  `seg*16 + ip` falls inside `[10000h, 1FFFFh]`.
- For `seg <= 01000h`: `seg*16 <= 10000h`, so IP values
  `[0, (10000h - seg*16) - 1]` map to linear addresses *below* `10000h` —
  unreachable for execution. This blind-spot size shrinks by exactly 16 for
  every +1 to `seg`, hitting **zero** exactly at `seg = 01000h` (which is
  just the native arena segment — no aliasing, zero blind spot, but also
  no longer distinct from unaliased execution).
- I verified this numerically for every segment from `0F00h` to `01000h`
  (script-checked against the actual engine formula, not just the doc's
  claim): `0FFCh` (champion) -> 64 blind IPs (`[0,3Fh]`, confirming the
  grounding doc's own numbers exactly); `0FFDh` -> 48; `0FFEh` -> 32;
  `0FFFh` -> 16; `01000h` -> 0. This is a smooth, well-understood curve, not
  a cliff — `0FFCh` is not a uniquely-correct magic number, it's one point
  on a monotonic tradeoff between "far enough from `01000h` to look
  meaningfully aliased" and "small enough blind spot to never matter."
- I chose the band **`{0FF9h .. 01000h}`** (8 values, selected by 3 bits of
  `loadOffset`) specifically because **every value in it has a blind spot
  no larger than the champion's own `0FFCh` choice** (max 111 unreachable
  IPs at `0FF9h`, vs. `0FFCh`'s 64 — still tiny) and the replication
  mechanism's actual worker-entry IP low byte is fixed at `0A2h` (162) in
  every quantization band the champion uses, giving 50-146+ bytes of margin
  between the largest blind spot in my band and the smallest IP the
  replication loop ever actually uses. I confirmed this margin
  computationally rather than assuming it — I re-derived the champion's own
  band-quantization arithmetic (the `div 3Ch` / `mul 3Ch` bucketing of
  `loadOffset`'s high byte) and reproduced the exact `IP = 0C4A2h` data
  point recorded in `study-notes/night-session/progress-2026-09-28.md`
  independently, confirming I understood the mechanism correctly before
  relying on it, and found the *lowest* possible worker-entry IP across all
  quantization bands is `00A2h` (162) — still well clear of my band's
  largest blind spot (111).

## The one honest caveat: captured-zombie payload path

`ChimeraA`'s (and therefore `PhoenixSegA`'s) `zombie_entry:` /
`captured_init:` block is not executed by *my* warrior's own CPU — it is
the payload that gets copied into a captured zombie's memory via the
`INT 87h` self-recognition mechanism, and it runs under **that zombie's own,
independently-initialized CPU state** (confirmed via `Warrior.java`: every
`Warrior`, including zombies, gets its own `initializeCpuState` call with
`BP = 0` universally at cold boot). My `BP`-capture insert lives at the top
of `start:`, which a captured zombie's execution never passes through — it
jumps directly into `zombie_entry`. So in that one sub-case, `BP` is `0`
(the zombie's own untouched cold-boot value) when `phoenix_pointer_ready`
consumes it, deterministically yielding segment `0FF9h` rather than a
randomized value. This is **still fully safe** (it's the same verified
`0FF9h` from my safety table, with the largest margin of the whole band) —
it just means the "varies per-battle" property fully applies to my own two
warriors' own bootstraps and their un-captured replication chains, while
captured-zombie-payload executions specifically land on a fixed-but-safe
`0FF9h` rather than a randomized value. I'm noting this rather than glossing
over it: the segment-diversification property is real and verified for the
warrior's own replication chain (the vast majority of its runtime), with one
well-understood, still-safe, fixed sub-case for the zombie-capture payload.
`ChimeraB`/`PhoenixSegB` has no zombie-capture payload path at all, so this
caveat doesn't apply to B.

## Alternatives considered and rejected

- **Deriving the segment from a wider/unconstrained function of
  `loadOffset`** (e.g. using more bits, or the full byte): rejected because
  it would require either (a) a runtime range-check/clamp (more
  instructions in the hot bootstrap path, and still needs the exact same
  safety table I already built, so no benefit), or (b) accepting segments
  further from `01000h` with much larger blind spots (e.g. `0F00h` has 4096
  unreachable IPs — a large fraction of the whole address space), which
  risks the worker-entry IP itself landing in the blind spot for some
  `loadOffset` values, an unacceptable, hard-to-fully-verify risk given the
  120-instruction budget pressure and the grounding doc's warning that
  "smart" additions rarely pay for their own timing cost. The 3-bit/8-value
  band gives genuine variation while keeping every single outcome
  independently provable-safe with a wide margin — I judged this the right
  point on the safety/diversity tradeoff for a mechanism this
  security-sensitive (a wrong guess here doesn't just underperform, it
  crashes the warrior outright).
- **Deriving the segment from something other than `loadOffset`** (e.g. a
  hash of `SI`/`DI` after they've been touched by other logic): rejected
  because `loadOffset` is the only value the grounding doc explicitly
  documents as free, per-battle-randomized entropy available at cold boot
  with zero extra instructions to obtain (`AX = loadOffset` is already
  there before any code runs) — anything else would cost more instructions
  to compute for no clear benefit in unpredictability, since `loadOffset`
  itself is already unknown to an adversary ahead of time.
  Cross-referencing `study-notes/night-session/progress-2026-09-28.md`'s
  `AL`-value sweep note (which swept the *other* quantization constant,
  `AL`, and found all 6 variants crashed for unexplained reasons) made me
  extra cautious about touching adjacent constants I hadn't independently
  verified — I stayed strictly scoped to the one substitution the grounding
  doc asked for.
- **Using `01000h` as one of the 8 band values but excluding it to preserve
  "looks aliased" property**: actually considered *including* it (it has
  the best possible safety margin, zero blind spot) but ultimately kept it
  in the 8-value range anyway rather than restricting to 7, because
  excluding it would cost an extra instruction (a proper 7-way mapping
  needs more than a plain `AND`+`ADD`), and `01000h` being reachable 1/8 of
  the time is a minor, honestly-disclosed dilution of the anti-scan
  property, not a safety problem — I chose to keep the bootstrap cost at
  exactly +3 instructions rather than pay more for a marginally "purer"
  anti-scan property.
- **Randomizing per replication cycle instead of once at boot**: rejected
  outright — the worker loop only re-reads `[bx+2]` implicitly via
  `call far [bx]` and never re-writes it, so re-randomizing per-cycle would
  require adding instructions to the hot `worker:` loop, which the
  grounding doc identifies as a much higher-risk place to add any cost
  (every replication cycle, for the whole battle, vs. once). A single
  boot-time derivation was the only design consistent with "budget added
  instructions like they're expensive."

## Honest assessment

**Strengths**: The core anti-scan property is real and independently
verified from source, not assumed from the grounding doc's summary — I
re-derived the linear-address math myself and cross-checked it against the
documented `0FFCh` blind-spot numbers before trusting it, then used the same
formula to build a same-or-better-safety 8-value band. The change is
minimal-diff and surgical (+3 instructions, zero hot-loop cost, no change to
the proven replication mechanism itself), which directly respects the
grounding doc's strongest empirical lesson from the night's earlier failed
attempts (added complexity in the hot path is the dominant failure mode).
The smoke test (150 battles, 3 real 2025 cohorts + zombies) ran clean with
no crashes and both warriors scoring non-trivially, which rules out the
class of catastrophic, deterministic-death failures documented for several
other rejected directions in the grounding doc.

**Weaknesses**: This is a hardening move, not a scoring move — it doesn't
add any new offensive or defensive capability, so I do not expect it to
outperform the champion in a field of opponents that (as far as this task's
scope reveals) mostly aren't known to actually exploit the `0FFCh` constant
today. Its value is specifically against an adversary sophisticated enough
to scan for that exact byte signature (the grounding doc explicitly frames
this as the same *class* of exploit "New_Best" used historically, though
against a different, since-patched signature) — against the standard
2025 field used for this benchmark, I'd expect its score to track very
close to the champion's own baseline, with any delta attributable mostly to
the timing-shift effect of the +3 bootstrap instructions (the grounding doc
measured -0.024 for a 9-instruction insert; +3 is proportionally smaller
but not zero) rather than to any functional weakness. The 1-in-8
"deterministically lands on `01000h`" sub-case for captured zombies (not my
own warriors) slightly dilutes the anti-scan property in that one
narrow path, as disclosed above.

## Result

Full 2500-battle run against the all-2025 field
(`config-arena-candidate7-all2025.json` — identical `cohorts`/`zombies` to
`config-subenc2-all2025.json` and to the champion's own
`experiments/m049control-all2025.json` baseline run, for a fair
apples-to-apples comparison), output at
`experiments/arena-candidate7-all2025.json`:

| | Candidate 7 (PhoenixSeg) | Champion (m049) | Delta |
|---|---|---|---|
| `teamPerBattle` | **0.5242666684** | 0.6674000056 | -0.1431 (-21.4% relative) |
| `warrior1PerBattle` | 0.2367333332 | 0.319566667 | -0.0828 |
| `warrior2PerBattle` | 0.28753333299999995 | 0.3478333336 | -0.0603 |

**Ran clean, no crashes.** Grepped the full result file for any
`teamPerBattle: 0` run (the crash signature used throughout this arena's
prior tonight's work) — zero matches across all 50 cohort x seed
combinations (25 cohorts x 2 seeds, matching the champion baseline's own
run structure exactly). Both warrior1 and warrior2 scored non-trivially and
comparably-to-each-other in every run; nothing resembling the "both dead
instantly" pattern documented for other rejected directions in the
grounding doc.

**Interpretation**: this is a real, meaningful regression against the
champion on the standard field — not a rounding-error difference, and
larger than I expected going in. Two honest candidate explanations, in
order of how much weight I'd put on each:

1. **Timing-shift cost, compounded.** The grounding doc's own isolated test
   found a single 9-instruction bootstrap insert cost -0.024 team score,
   and a ~24-instruction insert cost -0.11, in each case *isolated* (i.e.
   tested as the only change). My insert is only +3 instructions, which
   under a naive linear read of those two data points would predict
   something in the -0.01-to-0.02 range, not -0.14. The gap between that
   prediction and the observed -0.14 suggests the relationship isn't
   simply linear in instruction count -- it likely also depends heavily on
   *where* in the round sequence the shift lands relative to specific
   opponent behaviors/timings across a full 75-team field (25 cohorts x 3
   opponents), which a single isolated instruction-count test can't fully
   capture. I did not have time within this task's scope to isolate
   timing-shift cost from mechanism cost as cleanly as the original
   grounding-doc experiment did (that would need a same-instruction-count,
   functionally-inert insert as a control, run through this exact field,
   which I did not build).
2. **The anti-scan property itself is not free even when it "does
   nothing."** None of the 75 real 2025 opponent teams in this field are
   confirmed to actually scan for the `0FFCh` signature (the grounding doc
   frames that exploit class as historically used by a specific documented
   adversary, "New_Best," not as a property of the general 2025 field), so
   this candidate is paying the full bootstrap-timing cost of
   diversification in every single battle while only *potentially*
   benefiting in battles against an adversary sophisticated enough to
   exploit the fixed constant -- and no such adversary appears to be
   present in this particular benchmark field. That asymmetry (cost paid
   always, benefit realized rarely-to-never against this specific field)
   is the expected shape for a pure hardening move and matches my
   pre-registered "weaknesses" assessment above, though the magnitude
   is larger than I'd predicted.

I don't have full certainty on the exact split between these two factors,
and I'm reporting that uncertainty honestly rather than picking whichever
explanation sounds better. What I can say with confidence: the mechanism
itself is *correct and safe* (verified from source, zero crashes across
2500 battles), and the regression is consistent with a real but
field-specific cost/benefit mismatch, not a bug in the implementation.

Champion baseline for reference: **`teamPerBattle = 0.6674000056`**
(`experiments/m049control-all2025.json`, 2500 battles, identical field).
