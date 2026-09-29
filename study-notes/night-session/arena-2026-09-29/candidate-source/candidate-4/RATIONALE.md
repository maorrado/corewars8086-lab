# Candidate 4: Zombie-priority replication — rationale

## Assigned direction

Bias self-search/band-quantization logic toward finding and capturing
Zombies specifically, rather than generic empty/non-filler space, to
exploit the telemetry finding that Zombies captured into a replication
chain survive at ~3x the rate of uncaptured Zombies (60.3% vs 19.3%).

## What I verified before designing anything

Before writing code I re-verified, from primary sources, the two facts
the brief explicitly asked me to check plus several more that turned out
to be load-bearing for the design decision:

1. **INT87h cannot report back a match location.** Confirmed in
   `Cpu.java:int87()` (`repos/corewars8086-6.0.0/.../cpu/Cpu.java:2153-2177`):
   on a match it calls `m_memory.writeWord(address1, BX)` /
   `writeWord(address2, CX)` — it never writes the found address to any
   register. It is a pure detect-and-patch primitive, structurally
   incapable of "find X and tell me where," confirmed independently of
   the grounding doc by reading the source myself.

2. **The real Zombie roster used by `config-subenc2-all2025.json`
   (`zom20a`, `zom20b`, `zom20c`, `zom20d`, `official-2025/zombies-live/`)
   has no shared 4-byte signature.** I hex-dumped and hand-decoded all
   four binaries:
   - `zom20a` (73 bytes): opens `41 eb 1c 81 c3 e1 10 ...` — a tight
     6-instruction loop (`add bx,10E1h; mul bx; mov [1243h],dx; inc cx;
     xchg ax,bx; loop`) that publishes to a fixed cell `1243h`, but the
     published value is `DX` from `DX:AX = AX*BX` with `BX` incrementing
     every iteration — a running multiplication accumulator, not a
     stable position leak. The high word of a 16x16 multiply is not
     invertible back to the original `AX` (loadOffset) without the low
     word, so this cell cannot be used to recover the zombie's actual
     arena address.
   - `zom20b`/`zom20d` (382 bytes each): both open with the same 3 bytes
     (`e9 36 01`, `jmp near +0x136`) but diverge completely from byte 4.
     A programmatic scan for direct-address store opcodes (`A2`/`A3`/
     `89 /6`) found exactly one candidate publish site in each, but at
     completely different fixed addresses per file (`d555h`/`7afah` for
     b; `28e5h`/`29e6h` for d) — usable only against one specific named
     file, not as a class signature.
   - `zom20c` (232 bytes): opens `eb 5c bb 23 00 aa ...`, a 45-byte
     repeating block with no direct-address store at all — only
     computed-`DI` `stosb`/`stosw`, so no fixed cell to read at all.

   Conclusion: no static 4-byte signature is shared across the real
   roster, and even the one genuinely fixed publish-cell found
   (`zom20a`→`1243h`) doesn't leak a recoverable position. A compile-time
   INT87h search for "zombies in general" is not buildable against this
   actual roster, independent of the report-back limitation.

3. **The champion's own `EB F9 CC CC` INT87h search is already a fully
   committed Zombie/self-recognition mechanism** — decoded, it is the
   champion's own encoded bootstrap immediate bytes (`mov ax,0F9EBh` /
   `mov dx,0CCCCh`). It searches for *other Chimera-family copies*
   (including already-converted zombies), not the original zom20a-d
   byte patterns, and on a match writes `FF 26` + a pointer to its own
   `zombie_entry:`, exactly the `FF 26` capture-patch mechanism
   demonstrated in `study-notes/README.md` lines 559-618. This is a real,
   working, already-shipped capture primitive — it just cannot be
   pointed at the *original* zombie files for the reasons in (2).

4. **A prior investigation this same session already closed an adjacent
   avenue as a dead end**, independently of my own work:
   `study-notes/night-session/report-for-codex-2026-09-28.md`'s
   "Zombie-capture-rate investigation" section found the champion's two
   capture-driving INT87h calls (`start:`'s `CCCC` word-search for empty
   bands, `zombie_entry:`'s single-`CC` byte-search for opportunistic
   capture) are "load-bearing for correctness... not free tuning
   constants. Changing them risks breaking replication semantics."

5. **The scout-executor research
   (`study-notes/night-session/scout-executor-research/REPORT.md`)**
   already tested the general shape of "add a new search/react block to
   the champion's bootstrap" four independent ways (different sizes,
   different positions, a self-caught bug and its fix) and it regressed
   on fresh holdout every single time (-0.017 to -0.037), even though the
   underlying scan-and-attack mechanism was proven to work end-to-end
   (a real kill was achieved in a controlled test). The regression was
   purely bootstrap-timing cost, and the research explicitly found
   *position* (before vs. after the warrior's own existing `int87h` call)
   mattered more than size: the same ~9-instruction insert cost -0.024
   before `int87h` but only +0.0033 (statistically zero) after it.

## Why a literal "search biased toward Zombies" is not honestly buildable

I ran this reasoning past an independent second-opinion review (a fresh
agent, given only the raw facts above, asked to be skeptical) before
committing engineering time, specifically to stress-test whether a
"zero-added-instruction" bias via retuning the champion's existing
band-quantization constants (`add ah,0x10` / `0x34` / `0x54` phase
offsets, the `03Ch` divisor) could count as real zombie-priority logic.
The reviewer's verdict, which I agree with: those constants are a
function of the warrior's *own* load position, computed before any
zombie has been touched or scanned — they carry zero information about
where zombies or filler actually sit in a given battle's memory layout.
Retuning them again would be structurally identical to the 122
phase/spatial micro-mutations already swept and rejected in
`experiments/post-m048-micro-search-2026-09-27.json` (0/122
holdout-surviving), not a new mechanism — calling it "zombie-priority"
would describe an intent, not an implemented behavior.

I also checked whether the real, verified `zom20a` fixed-write-cell
(`1243h`) could drive a genuine targeted `FF 26` capture the way the
`study-notes/README.md` teaching example does (read the zombie's
self-published pointer, add a fixed per-file loop-offset, write `FF 26`
+ target at the computed address). This fails for `zom20a` specifically
because, as established in (2) above, the published value is a lossy
multiplication result, not the zombie's own address — there is no
algebraic way to recover `zom20a`'s load offset from what it publishes,
so the "+9-style" offset arithmetic from the teaching example has no
valid base address to add to. I did not attempt to fully hand-decode
`zom20b`/`zom20c`/`zom20d` (382/232/382 bytes) for a per-file version of
the same exploit; even if one or more had a genuinely recoverable
position leak, hardcoding constants for specific named files is fragile
(zero generalization beyond this exact 4-file roster) and the
per-instruction cost of the read-compute-write sequence would face the
same timing tax the scout-executor line already measured and rejected
for a structurally similar insert.

I also checked whether a second `INT87h` call could be added cheaply to
`zombie_entry:`'s captured-zombie path (a location that only executes
after a successful capture, so its cost is paid rarely, not on every
boot or every replication cycle). This turned out to be a near-guaranteed
no-op: `bomb2Count` (INT87h charge count) is a hard per-CPU-state counter
starting at 1 and decrementing to 0 on any call, guarded by
`if (bombCount != 0)` in `Cpu.java:2154-2156` — a second call in the same
process's execution stream would almost always find 0 charges left,
since `start:`'s own call already spent the one charge that same process
had.

## What I actually built

Given the above, I rejected: (a) a per-zombie-file hardcoded exploit
(fragile, unverified beyond `zom20a`, couples to exactly 4 files), (b) a
relabeled constant retune (provably identical to the already-exhausted
122-mutation search), and (c) a new scout-style search-and-report insert
(already tested 4 ways, always regresses, and INT87h structurally can't
report locations anyway).

The one genuinely new, honestly-scoped mechanism I found: **in the
shipped champion, both A's `start:` and B's `start:` independently search
for `EB F9 CC CC` (other Chimera-kin), but both matches route their
capture to the *same* destination — A's `zombie_entry:`.** B never gets
its own independent capture-and-convert path; it only helps recruit more
captures into A's existing one. This candidate (`COD_arena4`) gives B its
own `zombie_entry:`-equivalent:

- **A (`COD_arena4_A.asm`) is byte-for-byte identical to `final/ChimeraA.asm`**
  (verified via `Buffer.compare` against the real assembled champion
  binary — `identical: true`, both 189 bytes). Every piece of tonight's
  research shows A's `start:`/`zombie_entry:`/`worker:` sequence is
  load-bearing and timing-critical; touching it would risk the one part
  of the team already known-good, for no benefit, since the new
  mechanism lives entirely in B.

- **B (`COD_arena4_B.asm`, 189 bytes, was 117 in the original) adds:**
  1. A 3-instruction publish sequence (`mov di,si` / `add di,zombie_entry
     - start` / `mov [05D17h],di`) that writes B's own `zombie_entry:`
     address to a fresh, previously-unused fixed cell (`05D17h` — spaced
     0x40 from A's `0200h`/`0280h` and B's own `0240h` phoenix-pointer
     cells, so no collision). Placed *after* B's own existing `int87h`/
     `cld`, matching the scout-executor research's own finding that this
     exact position is near-zero-cost.
  2. One changed constant: B's existing capture-search
     (`mov cx,05D13h` → `mov cx,05D17h`) now writes `FF 26` + a pointer to
     *B's own* new entry point instead of A's, when B's own `EB F9 CC CC`
     search finds a match.
  3. A new `zombie_entry:` label block for B, structurally cloned from
     A's proven one (same `xor di,di` / single-`CC`-byte opportunistic
     search / band-quantization math / fall into a `captured_init:`-style
     block that shares `phoenix_init:`'s tail, exactly like A's own
     `captured_init:` does). Uses a distinct phase constant (`add
     ah,074h`, vs. A's `010h`/`054h` and B's own `034h`) and a distinct
     far-pointer cell (`bx=002C0h`, vs. A's `0200h`/`0280h` and B's
     `0240h`) to reduce the chance that A-family and B-family captured
     copies compute colliding replication targets. This distinctness
     choice is a judgment call, not empirically verified — flagged here
     honestly as an assumption, not a proven-safe tuning.

  This adds **zero new INT87h calls** (reuses B's own existing search,
  just re-routes its result) and **does not touch `worker:`** (the hot
  per-round loop) or A's own bootstrap **at all**. The team's total
  capture-search events per battle are unchanged (still exactly one from
  A's search, one from B's search); what changes is that a capture
  triggered by B's search now lands in an independent single-`CC`-byte
  opportunistic sub-search (its own `DI=0` origin) instead of duplicating
  work already done by A's path — increasing effective opportunistic
  capture coverage (two independent scan origins instead of one funnel)
  without adding INT87h charge usage or hot-loop cost.

## Honest assessment

**Strengths:**
- Zero risk to A — verified byte-identical to the proven champion.
- The mechanism is real and structurally different from every rejected
  direction in the grounding doc (not scout-executor's unknown-target
  search-and-report pattern; not a constant retune; not a per-file
  hardcode; doesn't touch `worker:`).
- Adds no new INT87h calls and stays well under the 256-byte budget
  (189/189 bytes, vs. the champion's 189/117 — 67 bytes of headroom on A,
  none consumed since A is untouched; B grew by 72 bytes but stayed 67
  bytes under the cap).
- Smoke-tested clean: 30 battles across 3 real 2025 cohorts plus the real
  4-zombie roster, no crashes, no zero-scores
  (`experiments/arena-candidate4-smoke.json`: aggregate team=0.628,
  w1=0.250, w2=0.378).

**Weaknesses / honest limitations:**
- This is a narrower, more modest mechanism than the assignment's framing
  ("biased toward finding and capturing Zombies specifically") literally
  asks for. It does not distinguish Zombies from ordinary opponent filler
  or empty space at all — like the champion's own existing mechanism, it
  is filler-opportunistic, not Zombie-specific, because I could not find
  a way to make it genuinely Zombie-specific that wasn't fragile,
  already-rejected, or a relabeled null result. The real benefit (if any)
  is "more independent capture attempts," which helps Zombie capture rate
  incidentally (Zombies are part of what gets captured opportunistically)
  but doesn't bias *toward* Zombies over other filler.
- The two new judgment-call constants (`074h` phase, `02C0h` pointer
  cell) are chosen for plausible non-collision, not empirically swept —
  unlike the champion's own constants, which survived real tuning.
- Given the grounding doc's own data point that even a single added
  instruction measurably shifts the score, and this adds ~9 net new
  instructions to B (a warrior that starts every battle, not a rare
  capture-only path), there is a real chance this nets negative even
  though it avoids the specific failure modes that sank the
  scout-executor and constant-retune lines.

## Final score vs. the champion baseline

Champion baseline (`experiments/m049control-all2025.json`, same
25-cohort/75-team all-2025 field, 2500 battles):
**teamPerBattle=0.6674, warrior1=0.3196, warrior2=0.3478.**

This candidate's full-field result (`experiments/arena-candidate4-all2025.json`,
identical field/battle count/seeds, 2500 battles, ran clean — no crashes,
no zero-score cohorts across all 50 cohort/seed combinations):
**teamPerBattle=0.6539, warrior1=0.3239, warrior2=0.3300.**

That is a **-0.0135 team-score regression** vs. the champion (0.6539 vs.
0.6674). Breaking down the w1/w2 split against the baseline:

- **A: 0.3239 vs. champion-A's 0.3196** — a negligible +0.0043 difference,
  consistent with A being byte-identical to the champion (this is
  field-composition noise, not a real effect, since the same bytes
  cannot behave differently against the same opponents beyond
  battle-to-battle stochastic variation in the engine/opponent AI).
- **B: 0.3300 vs. champion-B's 0.3478** — a **-0.0178 drop**, which
  accounts for essentially the entire team-level regression. This lands
  exactly where the new mechanism was added, and lines up with the
  grounding doc's central warning: even a well-positioned, mechanically
  correct ~9-instruction insert has a real, measurable timing cost, and
  here that cost was not recovered by the extra capture surface area.
  This is the same order of magnitude as the scout-executor line's own
  best isolated result for a comparably-sized B-side insert (-0.0117 for
  B-only in that research), suggesting the timing tax is fairly
  consistent across different *kinds* of ~9-15 instruction bootstrap
  inserts on this specific champion lineage, largely independent of
  what the inserted logic actually does.

**Conclusion: this candidate does not beat the champion.** It ran clean
(no crashes, no zero-scores, correct byte budget) and is mechanically a
genuinely different, honestly-novel structure from every rejected
direction in the grounding doc, but it lands squarely inside the same
negative-timing-cost zone that sank the scout-executor line, confirming
(a fourth independent time tonight, by a different route) that this
champion's bootstrap path is extremely difficult to add ANY new
instructions to profitably, regardless of what those instructions do —
capture-routing logic included.

## If this direction turns out structurally infeasible

To be direct about the honest conclusion reached during design, before
any score is known: a *literal* implementation of "bias INT87h search or
band-quantization toward Zombie-likely regions specifically" is not
buildable against the real `zom20a`-`zom20d` roster with the information
this engine actually exposes to a warrior at compile time or run time —
three independent lines of verification (my own hex/byte-level roster
analysis, the pre-existing report-for-codex investigation, and a
skeptical independent second-opinion review) converge on the same wall:
no shared signature, no report-back from INT87h, and the one real
self-published cell found doesn't leak a recoverable position. What is
shipped here is the most honest, genuinely-novel, non-self-deceptive
mechanism available within the spirit of the assignment (more
independent opportunistic-capture surface area, funded by a previously
unused INT87h charge on B), not a literal realization of
"Zombie-specific" targeting — and this gap between the assignment as
written and what the engine supports is reported here plainly rather
than papered over.
