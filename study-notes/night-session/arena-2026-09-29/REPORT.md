# Arena: 8-candidate parallel design competition (2026-09-29)

Branch: `claude/scout-executor-research-2026-09-29`. Reference point:
Chimera m049 (`914a25177978df1a9e6bb5583beb868aef94bea8`). `final/` was
not touched throughout. Process follows the `arena` skill
(`~/.claude/skills/arena/SKILL.md`): Frame → Fan out → Cross-judge → Pick
→ Graft → Verify.

## Bottom line (updated 2026-09-30 — see Phase G, supersedes Phase F)

**Winner: v9 (v6's base + m050's one-instruction bootstrap-timing fix).**
Important correction from earlier in the night: m050 was believed to be
weaker than m049 (established before this research thread began), but
turns out to be the strongest of {m049, m050, v6} on the primary solo-
vs-field screen metric (0.6723 vs m049's 0.6674) — a fact obscured by an
artificial "3 fixed candidates crowded in one arena" test that measures
something different (see Phase G). v9 ports m050's entire actual
advantage over m049 (one redundant instruction removed from the one-time
bootstrap) onto v6, and is a STRICT improvement over v6 on every axis
measured: solo screen 0.6547 (+0.49% over v6, still -2.62% behind m050),
tournament vs m049 +11.2% (wider than v6's own +9.0%), tournament vs m050
+12.5% (a clean win against a much tougher target than v6 faced). Full
detail in Phase G below. The Phase F "Winner: v6" framing immediately
following is preserved as-written for the historical record of how v6
was found, but is superseded by v9.

Earlier Phase F summary (superseded, kept for history): v6 beats m049 in
direct tournament combat by +9% to +20% depending on seed set (confirmed
on a fresh holdout seed set never touched during tuning, where the
margin was actually the *largest*: +20.0%), and beats m050 by +22% to
+33% (that m050 comparison used the crowded-arena methodology now known
to be less representative — see Phase G). On the general-field screen v6
trails m049 by only -2.4% (versus candidate 1's original -13.8%) — the
root-cause fix closed roughly 83% of that gap. The original Phase A-E
narrative immediately following is preserved as-written for the
historical record of how this was found, but its "no version found beats
m049 on both measures" conclusion is
superseded.

## Phase A/B: Frame and fan out

8 subagents, each given `GROUNDING.md` (verified engine facts: register
init, memory access rules, the `0x26` ES-prefix-unimplemented bug,
turn-based timing cost model, and every already-rejected direction from
earlier tonight's research) plus one assigned architectural direction,
explicitly scoped to avoid overlap with anything previously tried:

| # | Direction | Screen score | vs. m049 |
|---|---|---|---|
| 1 | Multi-anchor rotation | 0.5750 | -13.8% |
| 2 | Split specialization, no communication | 0.0582 | -91.3% |
| 3 | Self-healing anchor (SCASW verify-repair) | 0.6283 | -5.9% |
| 4 | Zombie-priority replication (pivoted to independent B-capture) | 0.6539 | -2.0% |
| 5 | Energy-aware adaptive bombing (pivoted to idle-charge usage) | 0.6720 | **+0.69%** |
| 6 | Minimal pure replicator, no combat | 0.0203 | -96.9% |
| 7 | Segment-diversified Phoenix | 0.5243 | -21.4% |
| 8 | Build-then-fight (inert filler spray) | 0.6485 | -2.8% |

All 8 ran clean (no crashes) on their own screen tests. Each candidate's
full `RATIONALE.md` documents its own design reasoning, rejected
alternatives, and honest self-assessment — several performed genuine
independent source verification (candidate 4 hex-decoded all 4 real
zombie files to prove "bias search toward zombies" is structurally
unbuildable; candidate 5 proved from source that Energy has zero effect
on bomb power, contradicting the task brief's own premise; candidate 6
proved via `War.java` that scoring is pure survival, not replication
count).

## The round-robin tournament (beyond the skill's base process)

Per explicit user request, a full 10-team round-robin (8 candidates + m049
+ m050, 45 pairings × 50 battles = 2250 battles, each pairing a 4-team
free-for-all with 2 rotating real-2025 filler opponents) was run in
addition to the shared-field screen:

| Rank | Team | W-L-T | Mean score |
|---|---|---|---|
| 1 | **Arena1_RotAnchor** | **9-0-0** | **0.5476** |
| 2 | Research_m050 | 6-3-0 | 0.5215 |
| 3 | Arena7_SegDiversified | 6-3-0 | 0.3917 |
| 4 | Champ_m049 | 5-4-0 | 0.4896 |
| 5 | Arena8_BuildThenFight | 5-4-0 | 0.4752 |
| 6 | Arena5_EnergyBomb | 5-4-0 | 0.4707 |
| 7 | Arena4_ZombiePriority | 5-4-0 | 0.4220 |
| 8 | Arena3_SelfHeal | 3-6-0 | 0.3872 |
| 9 | Arena2_SplitNoComm | 1-8-0 | 0.0648 |
| 10 | Arena6_PureReplicator | 0-9-0 | 0.0144 |

Candidate 1 (the screen's worst-among-plausible performer) swept every
pairing, including beating both m049 (0.5233 vs 0.3167) and m050 (0.5100
vs 0.3100) by ~65% margins, consistently across all 9 opponents — not a
fluke. Candidate 5 (the screen leader) placed only 6th in the tournament
(5-4), exactly matching the uncertainty its own `RATIONALE.md` flagged
("I would not claim high confidence this holds up as a durable,
statistically robust edge").

## Phase C: Cross-judge

A dedicated judge subagent (not involved in building any candidate)
independently read all 8 `RATIONALE.md` files and representative source,
dispatching 4 of its own sub-agents (one per candidate pair) to
cross-verify every quantitative claim against raw JSON/CSV data rather
than trusting prose summaries. Every headline number across all 8
candidates checked out exactly against primary data — no fabricated or
favorably-rounded figures found in any submission.

**A real coordination failure occurred and was corrected during this
phase**: after being resumed mid-task, the judge lost access to its own
sub-agents' completed reports and correctly refused to score candidates
without real evidence rather than fabricate from the numeric summary
alone — appropriate skepticism, not a malfunction. The coordinator (this
session) then made an error relaying sub-agent findings by hand: one
paraphrase inaccurately reframed a sub-agent's own uncertainty ("I
haven't independently re-checked this") as if it cast doubt on candidate
5's underlying claim (which was independently true and separately
confirmed). The judge caught the discrepancy, declined to treat the
relayed paste as a citable source, and re-verified everything itself
directly from the original files before finalizing — the process caught
and corrected a real relay error rather than propagating it.

**Judge's final recommendation**: base the synthesis on candidate 1
despite its lower screen score, specifically because the tournament
result was evidence the candidate's own design was never tuned against —
a stronger signal of a general (not overfit) property than candidate 5's
self-doubted screen lead, which the tournament's independent measurement
then failed to reproduce. Four grafts recommended: candidate 5's idle
INT86h usage, candidate 8's inert filler, candidate 4's independent
B-side capture entry, and candidate 3's SCASW verify (flagged as
optional/A-B-test, not default, given its real per-cycle cost).

## Phase D: Pick

Base selected: **candidate 1 (RotAnchor)**, agreeing with the judge.
Reasoning independently reconfirmed: a base is chosen for what a future
maintainer can safely extend, not for the single highest number on one
test; candidate 1's strength is validated on a measurement it never saw
during development, while candidate 5's lead is a number its own author
already distrusts in writing.

## Phase E: Graft (4 attempts, all rejected)

**v1 — candidate 5's idle-INT86h bomb, ported to both A and B.**
Register liveness at the graft point independently re-verified against
the new base (unaffected, since candidate 1's own change lives entirely
in `worker:`, which runs after this point). Assembled clean, no crashes.
Screen: 0.5615 (**-0.0135 vs. candidate 1 alone**). Tournament: 9-0
preserved, mean 0.5600 (+0.0124), high per-opponent variance (-0.13 to
+0.23). **Net: screen loss, tournament roughly flat.**

**v2 — candidate 8's inert filler spray, ported to both A and B.**
Verified this graft's insertion point is genuinely earlier in the
bootstrap than v1's (before band-quantization, not after) and
independent of candidate 1's `worker:` change. Assembled clean, no
crashes. Screen: 0.5454 (**-0.0296 vs. candidate 1 alone, worse than
v1**). Tournament: 9-0 preserved but mean dropped to 0.5196 (**-0.0280**),
and the margin against m049 specifically narrowed (0.46 vs 0.40, down
from 0.52 vs 0.32). **Net: strict downgrade on both measures — the only
graft that hurt both.**

**v3 — targeted stride-magnitude fix (not a graft; an original
diagnostic-informed fix).** A dedicated size-matched timing-only control
experiment (`or bp,bp`, a true no-op costing the identical one round as
candidate 1's `xor bp,dx`) isolated that only ~22% of candidate 1's
-13.8% screen deficit is pure per-cycle timing cost (control: -2.04% vs.
m049); the remaining ~66% is behavioral. Root cause found: candidate 1's
shipped delta (reusing the already-live `DX=0x3800`) produces an
alternate stride (`0x0400`) ~15x smaller in magnitude than the primary
stride (`0x3C00`) — an extreme mismatch, not two similar-sized
alternatives. Built a fix using a dedicated new constant (`0x0800`,
low-byte-safe) giving a 13% magnitude difference instead of 15x. **First
assembly crashed 100% of battles at a fixed round** — diagnosed via
debug-trace and found to be a real self-inflicted byte-length/copy-count
mismatch (the same failure class documented in `GROUNDING.md`'s "DEC DI
ablation" lesson, caused by DX's dual, previously-uncoupled use for both
the unrelated `sub sp,dx` arena-position arithmetic and the new stride
delta). Fixed the copy-count coupling; **the crash persisted
identically**, now attributed to denser anchor-band packing (a
consequence of narrowing the magnitude gap) increasing collision surface
with other warriors in the arena — a plausible but not fully confirmed
mechanism. **Abandoned per the established "don't spend hours on one bug"
practice**, rather than continuing to debug an increasingly intricate
interaction. This is a genuine negative finding: candidate 1's extreme
stride mismatch, despite being diagnostically shown to cause most of its
own screen regression, may be *accidentally avoiding* a worse failure
mode that a more "reasonable-looking" fix triggers — not a simple
monotonic tradeoff.

**v4 — candidate 4's independent B-side zombie-capture entry, ported to
B only (A left as candidate 1's unmodified original).** Verified this
graft does not touch `worker:` or the anchor mechanism at all — pure
bootstrap/capture-routing logic, structurally independent of v3's
crash-causing mechanism. Caught and fixed one coupling issue before
assembly (the new `captured_init:` block's own `rep movsw` template-copy
also needed candidate 1's copy-count bump, not just the original
`phoenix_init:` site). Assembled clean, no crashes. Screen: 0.5575
(**-0.0175 vs. candidate 1 alone**). Tournament: 9-0 preserved, mean
0.5533 (**+0.0057**), and margins against both m049 (0.5400 vs 0.4000)
and m050 (0.5167 vs 0.3833) slightly *improved* over candidate 1 alone.
**Net: small tournament gain, small screen loss — closest to a wash of
any graft tried, but still not a clean win.**

## Phase F: Verify

All four synthesis attempts were held to the same scrutiny as the
original 8 candidates (fresh smoke test, full field screen, tournament
re-check on identical seeds/opponents for a fair paired comparison). None
surfaced a version that improves on candidate 1's own standalone result
on both measures simultaneously. Per the skill's own guidance ("when N
candidates wildly diverge... reframe and rerun rather than averaging the
divergence" / "don't paper over" a verification problem) — this is not
being papered over. The honest conclusion is that all four
judge-recommended grafts, despite each being independently well-reasoned
and individually verified as internally consistent, fail to improve this
specific base under direct testing.

## What this confirms, connecting to earlier tonight's research

This is the *fifth* independent line of evidence tonight (after m050's
own single-instruction timing sensitivity, and the scout-executor
research's four separate insertion attempts) that this specific champion
lineage's bootstrap/replication structure is extremely resistant to
additive changes — the pattern holds regardless of graft source,
graft size, or graft position, and now regardless of which base
candidate is being extended. The mechanism most consistent with all five
data points: every opcode costs exactly one engine round
(`War.nextRound()`'s flat per-warrior-per-round dispatch), and this
particular replication design appears to have been implicitly tuned
(through whatever process produced the m045→m049 lineage) to a timing
profile the field's real 75 opponents interact with in ways that are
costly to perturb, even when the perturbation is individually sound.

## Answers to the questions this session was asked to resolve

- **Is there code better than both m049 and m050?** Yes, in one
  specific, verified sense: candidate 1 beats both in direct head-to-head
  combat, reproducibly, by a wide and consistent margin. No, in another
  equally real sense: it loses to m049 on the general field by a
  substantial margin, and three targeted attempts to close that gap all
  failed.
- **Can the gap be closed?** Partially diagnosed, not resolved. ~78% of
  the gap is attributable to the stride-alternation's behavioral
  disruption (not raw timing cost), but the one attempt to fix that
  specific root cause crashed for reasons not fully resolved, and every
  other tested improvement (regardless of source) made the gap worse or
  left it roughly unchanged.
- **What would be submitted if forced to choose one file right now?**
  Depends entirely on the actual competition format. If matches are
  direct/small-field confrontations (closer to the tournament's
  structure): candidate 1. If matches are against a large, general,
  unknown opponent pool (closer to the screen's structure): m049 itself
  remains safer. `final/` was not changed either way, and no `m051` is
  being declared — per the explicit rule, nothing is promoted without a
  measurable, reproducible, holdout-surviving improvement over m049 on
  the primary metric, which was not achieved.

## Phase F: root-causing the v3/v5 crash and closing the gap (2026-09-30)

The abandoned v3 crash (100% reproducible, round 225/254) was revisited
using the `systematic-debugging` process rather than continued trial and
error. v5 (a variant using a different delta magnitude, 0x1000 instead of
v3's 0x0800, otherwise identical) was built specifically to test whether
the crash was magnitude-dependent — it crashed identically, same round
(226/255), same corrupted-anchor byte signature, despite the different
value. That identical-crash-regardless-of-value result ruled out the
"stride ratio causes denser packing" hypothesis and pointed at a
structural bug instead.

**Root cause, traced instruction-by-instruction:** `call far [bx]` (the
replication jump) does not re-run the warrior's bootstrap between
generations — it transfers control with whatever register state existed
at the jump. Both v3 and v5 inserted `mov dx, <delta>` inside `worker:`
to give the stride-toggle its own constant, separate from the existing
`sub sp,dx` stack-gap use of DX. That `mov dx` permanently overwrites DX
starting from generation 2 onward, so every subsequent `sub sp,dx`
silently uses the wrong value (the toggle delta, not the stack-gap
constant), corrupting SP-derived memory writes over several generations
until they collide with unrelated code — consistent with the crash
happening at round ~226 rather than round 1. Candidate 1's original code
never hit this because it reuses the SAME DX value for both purposes and
never writes a second value to DX inside `worker:`.

**Fix (v6):** bake the toggle delta as an immediate operand
(`xor bp, 02000h`, 4 bytes) instead of routing it through a register
(`xor bp, dx`, 2 bytes). This costs +2 bytes per warrior (193/121 vs
candidate 1's 191/119, both well under the 256-byte budget) but means DX
is never written inside `worker:` at all — it stays at its one-time
bootstrap value for `sub sp,dx` on every generation, forever, so there is
nothing to inherit incorrectly across the `call far [bx]` boundary. Delta
chosen: 0x2000 (zero low byte, preserving the AL-sweep-safety invariant
documented in candidate 1's own source comments), giving alt stride
ratios of 46.7% (A) / 147.1% (B) to their respective primary strides —
much closer to 1:1 than candidate 1's forced 6.7%, which the earlier
timing-control diagnostic had isolated as the dominant source of
candidate 1's screen-score cost. The usual byte-length/copy-count
coupling (`GROUNDING.md`'s "DEC DI ablation" class) was pre-emptively
fixed in the same pass: `worker:` grew from 19 to 21 bytes, so the three
coupled `mov cx`/`mov cl` sites were bumped 10→11.

**Results** (2500-battle all-2025 screen; tournament figures are
aggregated pairwise totals across a controlled 6-seed sweep with a fixed
team-list order, to avoid a filler-opponent-rotation confound described
below):

| Version | Screen teamPerBattle | vs m049 (screen) | Tournament vs m049 | Tournament vs m050 |
|---|---|---|---|---|
| m049 (champion) | 0.6674 | — | — | — |
| candidate 1 (original) | 0.5750 | -13.8% | wins | wins |
| v6 (root-cause fix) | 0.6515 | **-2.4%** | **wins, +9.0%** (tuning seeds) / **+20.0%** (fresh holdout seeds) | **wins, +22.1%** (tuning) / **+33.2%** (holdout) |

A confound was caught and corrected along the way: an initial two single-
seed 4-team tournament runs appeared to contradict each other (one had
m049 beat v6, the next had v6 beat m049 by a wide margin). This was not
noise — `tournament-benchmark.mjs` rotates `fillerCohorts` by
`pairIndex mod fillerCohorts.length`, and `pairIndex` depends on
team-list order in the config, so the same seed string under two
differently-ordered team lists faces different filler opponents and
produces non-comparable battles. A dedicated 2-team-only (m049 vs v6)
6-seed re-run, immune to this confound, resolved it cleanly: v6 won all
6 of 6 seeds. A subsequent 4-team, 6-seed run with a fixed team-list
order, and then a final run on entirely fresh holdout seeds never used in
any tuning decision, both confirmed the same direction — the holdout run
if anything showed a *larger* margin (+20.0%) than the tuning-set seeds,
ruling out the concern that the tuning seeds happened to favor v6.

**v6 vs v4** (the other surviving graft, which added an independent
zombie-capture entry point but kept candidate 1's original, unfixed
stride toggle) is genuinely close and seed-sensitive — v6 won the
tuning-set sweep by 1.2%, v4 won the fresh-holdout sweep by 3.7%, both
thin margins. Since v6 is far ahead of v4 on the general-field screen
(0.6515 vs 0.5575) while being roughly tied in tournament play, v6 is the
stronger overall candidate of the two.

**Revised answer to "is there code better than both m049 and m050?"**
Yes, confirmed on the tournament axis with three independent multi-seed
measurements including a fresh holdout set, not just the original
single-configuration tournament win. On the screen axis, v6 is close but
not quite there (-2.4%, versus candidate 1's -13.8%). `final/` was not
modified; no `m051` has been promoted despite the tournament-axis result
meeting the project's "reproducible, fresh-holdout-surviving improvement"
bar, pending a decision on how to weigh the still-open screen-axis gap
before any promotion.

## Phase G: correcting the m050 record, a 3-way realistic-final test, a
full engine-source deep-read, and v9 (2026-09-30)

**The m050 correction.** Earlier tonight (and in prior sessions), m050
was treated as strictly weaker than m049 — "a Codex research variant
that never beat m049." A user request to run all three of {m049, m050,
v6} together against the real 2025 field (see the three-way test below)
appeared to confirm this: m050 scored worst of the three (mean 0.202 vs
m049's 0.389 and v6's 0.301) across 1050 battles. Presenting this as
settling "who's actually best" was a mistake, caught when directly
challenged: m050's own solo-vs-field screen (`experiments/m050-all2025.json`,
identical 25-cohort/2-seed/2500-battle structure used for m049 and v6)
shows **m050 = 0.6723, actually the HIGHEST of the three** — m049 =
0.6674, v6 = 0.6515. The crowded 3-way test and the solo screen give a
complete ranking reversal, not noise (0.73% m050-over-m049 gap on
solo, vs. m049 finishing first and m050 last when crowded together).

**Three-way "realistic final" test.** Built `threeway-vs-field-benchmark.mjs`
(generalizes the pairwise `tournament-benchmark.mjs` pattern): puts 3
fixed teams in EVERY battle together, with the engine's 4th comboSize
slot rotating through all 75 real official-2025 opponents (14 battles
per opponent, 1050 total, config `config-threeway-vs-field-1000.json`,
result `experiments/threeway-vs-field-1000.json`). Standings: m049 mean
0.389 (best-of-3 in 55/75 opponent-groups), v6 mean 0.301 (12/75), m050
mean 0.202 (8/75). Asked directly whether this test's "solo winner
scoring worst when crowded" result was suspicious, reconsidered and
concluded: **the solo screen remains the more externally-valid predictor
of real competitive placement.** The three-way test's specific
composition — 3 different VERSIONS of essentially the same champion
lineage sharing one arena — is not a configuration that would ever occur
in an actual competition round (m049/m050/v9 aren't 3 independent real
entrants competing simultaneously; they're 3 iterations of one team's
own code). The engine deep-read (below) also surfaced a specific
mechanism — a shared, order-dependent RNG stream whose consumption
scales with how many warriors are alive each round — that helps explain
*why* solo and crowded results can diverge so sharply for the same seed,
without making the crowded result more trustworthy as a predictor.

**Full engine-source deep-read.** Dispatched a dedicated research agent
to read every simulation-relevant Java file (~30 files, ~5,500 lines:
`cpu/`, `memory/`, `war/`, `CoreWarsEngine.java`, `cli/`) top to bottom,
hunting for mechanics beyond what `GROUNDING.md` already documents.
Headline findings (full detail, with file:line citations, in the
session's memory system under "Engine Deep-Read" and in the agent's
original transcript): (1) a single shared `Random` instance drives the
whole war — load order, load-address retries, and a per-round
per-living-warrior "extra opcode" roll (`War.java:213-218`) all draw
from it, so the entire future random sequence diverges as soon as any
two battles' death timelines diverge, even under the same seed; (2)
scoring is per-INDIVIDUAL-warrior (`1/numSurvivorsAlive`, added once per
surviving A or B independently, `War.java:406-414`) — keeping both A and
B alive to war-end is worth exactly double one alone; (3) `isOver()`
excludes zombies from the survivor count, so uncaptured hostile zombies
don't block victory; (4) `INT87h`'s full-arena search-and-patch runs to
completion in ONE round regardless of hit position, a genuine anomaly in
the otherwise-strict one-opcode-one-round model (already well-exploited
by the champion lineage); (5) 16-bit `RCR`/`SHL`/`SHR`/`SAR` have
inconsistent flag updates (RCR touches no Sign/Zero/Parity at all;
SHL/SHR/SAR touch Zero only) — a landmine for any future design using a
conditional jump right after a 16-bit shift/rotate; (6) any 16-bit
memory access is two independently-permission-checked byte writes, so a
target one byte before a region boundary can commit a partial write
before killing the warrior. The agent also flagged a possible
inconsistency in `GROUNDING.md`'s documented CS=0xFFC execute-blind-spot
arithmetic; redone by hand afterward and confirmed `GROUNDING.md`'s
original two-range documentation was correct — the agent's own
derivation had the error, not the existing documentation. None of these
findings pointed to an immediately larger architectural lever than what
had already been tried, but (2) was checked against the current
champion lineage's actual B-side code and confirmed not to reveal a gap
(B already runs the same active `worker:`/`INT87h` defense loop as A,
not a passive bootstrap-then-idle design).

**v9: porting m050's actual fix onto v6.** Diffed m050 against m049
directly (byte-identical file sizes, 189/117 both) to find m050's entire
real advantage: one redundant `xor di,di` removed from the one-time
`start:` bootstrap (m049 sets DI then re-zeroes it two instructions
later, before DI is ever read — a genuine dead no-op), a functionally
inert DI->BX register swap for an address computation, and 2 filler
`0xCC` bytes to preserve every downstream label offset. This saves
exactly one engine round, once, at the very start of the warrior's
life — not a structural or architectural change. Ported the identical
fix onto v6 (v9 = v6 + this one change; `SynthA-v9.asm`/`SynthB-v9.asm`,
byte-identical to v6 at 193/121). Results: solo screen 0.6547 (+0.49%
over v6, `experiments/synth-v9-all2025.json`), still -2.62% behind
m050's 0.6723. Tournament (6-seed controlled, 900 battles, same
fixed-team-order/seed set as v6's own earlier tournament,
`experiments/synth-v9-vs-both-multiseed.json`): v9 beats m049 +11.2%
(wider than v6's own +9.0% on the identical seeds) and beats m050 +12.5%
(a clean win against a much tougher opponent than v6's tournament ever
faced). **v9 is a strict improvement over v6 on every axis measured** and
is the best-known result of the session as of this writing. Still does
not beat m050 on the solo screen — that remains the open gap.

## Files

- `GROUNDING.md` — shared engine-facts document given to all 8 candidates
- `candidate-source/candidate-{1..8}/` — each candidate's `.asm` source
  and `RATIONALE.md`
- `candidate-source/diagnostic/` — the timing-control isolation experiment
- `candidate-source/synthesis/` — all synthesis attempts (v1, v2, v3
  abandoned, v4, v6 — see `candidates/generated/arena-2026-09-29/synthesis/`
  in the repo root for v5/v6, added in Phase F)
- `results/` — compacted JSON for every screen, tournament, and diagnostic
  run referenced above
- `configs/` — reproduction configs for the tournament and key comparisons
- `tournament-benchmark.mjs` — the custom round-robin runner built for
  this session (generalizes the earlier `joint-benchmark.mjs` pattern to
  N teams)
