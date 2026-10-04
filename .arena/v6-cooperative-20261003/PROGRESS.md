# Cooperative V6 Arena — live research checkpoint

## Objective and scope

Improve the original friend's V6 pair for general competition scoring. Three
researchers work concurrently on distinct variants; only independently confirmed
score gains become a broadcast shared baseline. Original authorship is retained.
`final/`, other checkout jobs, and unrelated dirty files are untouched.

The exact assembly/hash checks and official-engine isolated smoke tests distinguish
mechanical validity from competitive value. All scores below are exploratory,
unless explicitly marked otherwise. Paired units are seeded opponent cohorts,
not individual warriors or CSV score totals.

## Completed explorations

- Official persistent-versus-cold driver control: four scores identical; identical
  V6 arms tie. Sixteen battles per engine, not a performance proof.
- Initial gap/copy/stride screens: 200 battles per arm. Best provisional signal
  is B startup stack gap `0400h` instead of `0600h`.
- B `0400h` independent refined exploration: 1,000 battles each, score 748.25
  versus 737.58333 original; paired mean difference +0.010667, confidence interval
  crosses zero. This is NOT a confirmed improvement or a baseline revision.
- Bootstrap-direct A: +0.010000 in one 200-battle screen, unconfirmed. Direct B,
  energy-prefix integrations, and spatial stride changes did not improve there.
- Scanner exclusion fixes: three variants exactly tie the original in a fresh
  200-battle screen. A deliberately constructed friendly-fire case proves a real
  mechanical weakness, but 25 targeted natural replays showed no scanner writes.
  Do not extrapolate prevalence or score benefit from the constructed case.
- Replacing recursive paint with far jumps: -0.535000 mean score in 200 paired
  battles. Large reduction in executed opcodes did not yield a stronger warrior.

## Exploration and confirmation history

`plans/promising-refine.json` completed one common 1,000-battle exploration per arm:
original, B gaps 0100/0300/0400/0500, zero startup gaps, direct A, direct A + B0400.
Original scored729.66667, B0400 scored730.0. Earlier advantage did not convincingly
replicate (paired interval[-0.037485,+0.038152]). The other six variants scored lower.

- Wave4:13 further candidates,200 battles each. Recurring-paint reductions and
  translatedFFC replicas mostly regress materially. A-only equivalent-call
  camouflage exactly ties; B camouflage -0.0025 with interval crossing zero.
- Modern-reference exploration:400 battles per arm,10 modern opponents plus
  published2025 teammates. B0400, B0300, B0500, directA all score lower in this
  sample, though individual paired intervals cross zero.
- Wave5:512-byte startup INT86 bursts and the sentinel-pointer guard,200 battles
  each. B-only burst +0.0075 (unconfirmed); A-only and both bursts lower. Guard
  team score ties despite a small redistribution between warriors.
- Isolated CPU smoke originally omitted initial interrupt charges. This limits
  those logs' coverage of interrupt effects; full Competition scores are unaffected.
  Corrected helper initializes2/1 charges. Last burst/guard smokes pass with those
  charges. Old logs are preserved, not represented as full-game tests.

`plans/architectural-refine.json` completed: original733.16667, B-burst735,
pointerguard743, B0400 740.66667 in1,000 battles each. All remain exploratory there.

`confirmation-selection.json` froze pointerguard before fresh alpha/beta results.
Alpha is complete: original2154.16667, pointerguard2178.33333 in3,000 battles each;
75 paired contexts, mean+0.008056, CI[+0.002166,+0.013945], W29/T35/L11. Beta later
completed too; the final confirmed revision and status are recorded below.

Two worker threads are used while unrelated agent2 jobs continue untouched.
All three subagents' later turns were interrupted by automatic provider risk
filtering; their completed artifacts are preserved. Central benchmarks continue
in the main agent. Do not claim subagents are still generating candidates.

The prespecified procedure was to freeze ONE candidate before
fresh holdouts (3,000 + 3,000 paired battles). A confirmed gain requires both
holdouts positive and their pooled paired interval excluding zero. Also inspect
modern-rival and no-Zombie stress, then cold-CLI correctness for decisive scores.

## Completed round

Beta completed:+0.003389 (individual interval crosseszero). Pooled alpha/beta
+0.005722, CI[+0.001701,+0.009744],+0.798% relative score. ColdCLI scores and
reassembled hashes match. Modern/historical stress means positive but uncertain;
small no-Zombie mean negative with interval crossingzero. Full details in
`FINAL-REPORT.md` and `best/README.md`.

`shared-best.json` is revision1, confirmed V6 Guard. All three agents were sent the
update; their interrupted states were not represented as resumed work. Main
screened two exact-component combinations on this baseline; neither justified
replacement. This round has no active central benchmark jobs. Results, sources,
identities and independent reviews are preserved locally; no commit/push or
`final/` promotion. Next round should start from the confirmed guard and use fresh
holdouts. There is no claim the theoretical maximum improvement was found.
