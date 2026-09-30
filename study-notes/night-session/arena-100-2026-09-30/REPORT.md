# Arena-100: 105-agent design competition to beat m049 and m050 (2026-09-30)

Branch: `claude/scout-executor-research-2026-09-29`. Reference baselines:
m049 (`final/ChimeraA.asm`/`ChimeraB.asm`, screen score `0.6674000056`) and
m050 (`candidates/generated/chimera-m050/`, screen score `0.6722666728`,
established earlier tonight as the actually-strongest of the pre-existing
reference warriors). `final/` was not touched throughout.

## Bottom line

**Winner: a synthesis of two independently-discovered improvements,
grafted onto the m050 base.** Beats BOTH m049 and m050 on the primary
screen metric (all-2025 real-field, 2500 battles) on TWO independent
seed pairs, AND wins a direct 6-seed tournament against both. This is
the first result across two full nights of research that wins on both
axes simultaneously without trading one off against the other.

| Metric | Seed set 1 | Seed set 2 (independent) |
|---|---|---|
| Screen vs m049 | +2.11% | +2.43% |
| Screen vs m050 | +1.37% | +1.69% |
| Tournament vs m049 | +5.9% | (not re-run on seed2) |
| Tournament vs m050 | +11.4% | (not re-run on seed2) |

Source: `candidate-source/synthesis/SynthA.asm` / `SynthB.asm` (207/115
bytes).

## Process

User instruction: use the `/arena` skill pattern at genuine scale
(~100 agents), each building a competing warrior design from a shared
grounding document, using real self-review and iterative build-test-
refine (no literal `/ralph-loop`/`/code-review` plugin invocation --
both were checked and found architecturally mismatched to this task:
`ralph-loop` is a session-level stop-hook, not something a subagent can
install on itself; `code-review` is hardwired to GitHub PRs, and this
project has none).

Built `GROUNDING.md` (in this directory) capturing everything learned
across the prior night's research: every engine fact, four distinct
documented bug classes (register persistence across `call far [bx]`
generations, byte-length/copy-count coupling, filler-byte-padding-at-a-
jump-target, and "safe doesn't mean helpful"), and the precise success
bar (beat m050's `0.6722666728` on the full 2500-battle screen, not a
narrow or partial test).

15 distinct architectural directions were defined (`arena-100.mjs`, this
directory) with 7 agents each (105 total): redundant-instruction hunting,
stride-toggle schedule variations, anchor-mechanism alternatives,
self-healing anchors, active-B-defense, INT86h-bomb usage, minimal
replicators, novel INT87h uses, zombie-recruitment focus, multi-anchor
designs, from-scratch architectures, turn-order robustness, landmine
avoidance, energy-awareness, and arena-position tuning. Ran via the
`Workflow` tool (`workflows/arena-100.mjs`): a two-phase pipeline —
phase 1 fans out all 105, each doing a full design-build-smoke-test-
fast-partial-screen cycle; phase 2 takes the best-per-direction plus top
overall runners-up (a 25-candidate shortlist) and runs the FULL
2500-battle official screen on each.

## Results: 4 of 25 shortlisted candidates beat both baselines on the first full screen

| Candidate | Direction | Full screen | vs m049 | vs m050 |
|---|---|---|---|---|
| c041-int86-bomb | int86-bomb | 0.6793 | +1.78% | +1.04% |
| c036-int86-bomb | int86-bomb | 0.6793 | +1.78% | +1.04% |
| c090-landmine-avoidance | landmine-avoidance | 0.6790 | +1.74% | +1.00% |
| c039-int86-bomb | int86-bomb | 0.6789 | +1.72% | +0.98% |

All three int86-bomb winners independently rediscovered the same core
mechanism: a prior-night finding (`candidates/generated/arena-2026-09-29/candidate-5/EnergyA.asm`)
of a single, one-time INT86h "heavy bomb" detour (offset `own_addr+0x600`,
`FF1F` anchor-pattern payload, A-only, fired once before
`jmp short phoenix_init`, never touching the hot `worker:` loop), stacked
onto m050's already-improved bootstrap rather than m049's original. c041
additionally includes one honest `NRG` opcode (`db 9Bh,9Bh`) immediately
before the bomb fires — a genuine, separate +1 energy increment (verified
against `Cpu.java`'s actual NRG handler, which only increments
`m_state.energy`, unrelated to INT86h's own gating by `bomb1Count`) that
gives c041/c036 a small, real edge over c039 (which lacks it).

c090-landmine-avoidance found a different, fully orthogonal optimization:
fusing `mov sp,di` + `add sp,imm` into a single `lea sp,[di+imm]` inside
`phoenix_pointer_ready:`, saving one instruction/round in the one-time
bootstrap, verified safe against all four documented bug classes and via
the actual NASM `.lst` listing (not hand-counted).

## Synthesis: grafting c041 + c090 together

Both changes sit in non-overlapping code regions (c041's detour is in
`start:`, before the jump to `phoenix_init:`; c090's fusion is inside
`phoenix_pointer_ready:`, after it) and neither touches `worker:` or any
copy-count constant, so they combined cleanly with no new interaction
risk. Result: **0.6815** on the original screen seeds (+2.11%/+1.37%),
STRICTLY better than either source change alone — confirming the two
mechanisms are genuinely additive, not redundant.

## A real verification gap was found and closed: 3 of 25 shortlisted candidates never actually finished

When asked to re-check completeness, discovered the `fullScreenResults`
array returned by the workflow only had 22 entries, not 25. The missing
three (`c011-toggle-schedule`, `c022-self-healing-anchor`,
`c029-active-b-defense`) had all been force-terminated mid-run (hit their
verification agent's own turn/time budget) and resolved to a placeholder
`fullScreenScore: -1`, which the ranking logic correctly excluded — but
this was never surfaced or explained in the top-level summary, and could
easily have hidden a real winner.

Investigated all three directly:
- **c022-self-healing-anchor** is the single most important catch: it had
  the HIGHEST fast-partial-screen score of all 105 candidates (0.6933,
  well above both reference baselines) -- but its actual full-screen
  result (recovered from a background process its own agent had left
  running, which completed independently after the agent's turn ended)
  is **0.6341, a clear LOSS to both m049 (-4.98%) and m050 (-5.67%)**.
  This is the sharpest demonstration yet of this project's standing
  "smoke/partial tests can mislead" warning -- the best-looking partial
  result of the entire 105-candidate run was actually one of the worst
  on the metric that actually matters.
- **c029-active-b-defense**: re-run from scratch (0.6262, -6.17%/-6.85%
  -- a clear loss, not a hidden winner).
- **c011-toggle-schedule**: re-run from scratch (0.6670, -0.06%/-0.78%
  -- essentially tied with m049, clearly below m050, not a winner).

None of the three incomplete candidates turned out to be a missed
winner, but the process gap itself (a workflow returning a summary that
implied full coverage when 3/25 silently never completed) is a real
methodology lesson for any future large-scale workflow: **always
reconcile the returned result count against the expected count, and
treat any placeholder/sentinel value (`-1`, `null`) as "unknown," not
"loses," before trusting a "top N" ranking.**

## A second, harder-won lesson: single-seed screen results are not reliable enough to trust alone

Challenged (correctly) on whether one 2500-battle screen run, even
though large, constitutes sufficient verification given everything this
whole research effort has already learned about seed-to-seed variance
(the crowded 3-way-test flip-flop, the tournament filler-rotation
confound, the earlier holdout-seed margin compression from 1.37% down to
0.28%). Built a genuinely independent second seed pair
(`all2-verify-101`/`102`, never used in any prior tuning decision) and
re-ran all 4 original screen-winners plus the synthesis through it.

**Result: c039-int86-bomb FLIPPED from a clear win (+1.72%/+0.98%) to a
clear LOSS (-0.73%/-1.45%) on the second seed pair.** This is exactly
the failure mode the challenge was worried about, caught in real time,
not a hypothetical. c039 is the one int86-bomb variant lacking the extra
NRG energy increment c041/c036 have -- consistent with it sitting right
at the edge of the margin that NRG alone seems to provide.

The other three held up cleanly on the second seed pair, none reversing
direction:

| Candidate | Seed 1 | Seed 2 |
|---|---|---|
| synthesis | +2.11%/+1.37% | +2.43%/+1.69% (strengthened) |
| c041 | +1.78%/+1.04% | +1.46%/+0.72% |
| c036 | +1.78%/+1.04% | +1.46%/+0.72% |
| c090 | +1.74%/+1.00% | +3.34%/+2.59% (strengthened) |
| c039 | +1.72%/+0.98% | **-0.73%/-1.45% (REVERSED)** |

**Standing bar going forward for this project: no screen result should
be reported as a real finding without confirmation on at least 2
independent seed pairs, holding the same direction.** A single
2500-battle run, however large, is not sufficient on its own -- this was
demonstrated concretely, not just argued abstractly.

## Three additional candidates spot-checked for completeness

Beyond the 25-candidate shortlist, checked whether the shortlist-
selection logic (best-per-direction + top-10-overall-runners-up) might
have silently dropped a genuine winner from a direction whose per-
direction leader was otherwise weak. Spot-checked three architecturally
distinct candidates scoring 0.64-0.67 on the fast partial screen but
never full-screen-verified: `c034-active-b-defense` (0.6337,
-5.05%/-5.74%, clear loss), `c066-multi-anchor` (0.6465, -3.13%/-3.83%,
clear loss), `c093-energy-aware` (0.6696, +0.33%/-0.40%, a near-miss
that beats m049 but not m050). None was a missed winner, giving
reasonable (not exhaustive) confidence nothing major was silently
dropped by the shortlist cutoff.

## Final verified result

The synthesis (`SynthA.asm`/`SynthB.asm`) is the strongest result
found: beats both m049 and m050 on the screen across two independent
seed pairs (margins growing, not shrinking, on the second), and wins a
full 6-seed tournament against both. `final/` was not modified; pushing
and any `m051` promotion decision is left to the user.

## Files

- `GROUNDING.md` -- the shared grounding document given to all 105 agents
- `arena-100.mjs` -- the Workflow script that ran the fan-out and shortlist verification
- `candidate-source/synthesis/` -- the final synthesized SynthA.asm/SynthB.asm
- `candidate-source/` -- the four individual winning/near-winning candidates (c041, c036, c090, c039) before synthesis
- `configs/` -- reproduction configs for every full-screen and seed2 verification run referenced above
- `results/` -- compacted JSON results for every run referenced above, including the negative/reversed ones (c022, c029, c011, c039-seed2, c034, c066, c093)
