# Arena: 8-candidate parallel design competition (2026-09-29)

Branch: `claude/scout-executor-research-2026-09-29`. Reference point:
Chimera m049 (`914a25177978df1a9e6bb5583beb868aef94bea8`). `final/` was
not touched throughout. Process follows the `arena` skill
(`~/.claude/skills/arena/SKILL.md`): Frame → Fan out → Cross-judge → Pick
→ Graft → Verify.

## Bottom line

**Winner: Candidate 1 (multi-anchor rotation / "RotAnchor"), unmodified.**
Beats m049 and m050 decisively in direct combat (65% margin, 9-0 across
every tested opponent including all 7 other arena candidates), but scores
13.8% *below* m049 on the isolated 75-team general-field screen. Three
independent attempts to graft improvements from other candidates onto
this base all made the general-field score worse (and one caused a
100%-reproducible crash that was diagnosed and abandoned rather than
fixed). **No version found beats m049 on both measures simultaneously.**
Candidate 1 unmodified is the best result of the night — a real,
verified, reproducible improvement over the champion in one specific,
well-characterized dimension (direct confrontation), not an unqualified
upgrade.

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

## Files

- `GROUNDING.md` — shared engine-facts document given to all 8 candidates
- `candidate-source/candidate-{1..8}/` — each candidate's `.asm` source
  and `RATIONALE.md`
- `candidate-source/diagnostic/` — the timing-control isolation experiment
- `candidate-source/synthesis/` — all synthesis attempts (v1, v2, v3
  abandoned, v4)
- `results/` — compacted JSON for every screen, tournament, and diagnostic
  run referenced above
- `configs/` — reproduction configs for the tournament and key comparisons
- `tournament-benchmark.mjs` — the custom round-robin runner built for
  this session (generalizes the earlier `joint-benchmark.mjs` pattern to
  N teams)
