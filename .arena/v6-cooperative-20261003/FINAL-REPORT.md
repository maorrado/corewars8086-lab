# Cooperative V6 Arena — completed experimental round

Outcome: **V6 Guard**, `a003_pointerguard`, is shared-best revision1. It has a
reproducible +0.798% primary score gain over the friend's original V6. This is the
strongest confirmed gain found in this round, not a proof of a global optimum.
Readable sources and exact binaries: `best/`; entrypoint:`best/README.md`.

Three strategy-card researchers were used, adapting Arena to the user's requested
cooperation rather than elimination. Main centrally scheduled every expensive
benchmark. Forty-seven modified pairs plus the original were scored, totaling
41,192 actually executed benchmark battles (including controls and cold repeats).
There were also25 observer replays and isolated CPU smoke instructions; those are
not counted as independent scored battles. See `inventory.json` and its generator.

## Evidence and interpretation

Choice was frozen in `confirmation-selection.json` before two untouched3,000
battle/version holdouts. Alpha:+0.008056; beta:+0.003389; pooled:+0.005722 with
95% interval[+0.001701,+0.009744]. All pairing uses identical team name, opponents,
load ordering and competition seeds; cohort/seed is the unit of uncertainty.
CSV rounding residuals and all-dead battles retain battle-count denominators.
The pooled original/New scores are4,301.50/4,335.83 over6,000 battles each.

Cold CLI checks match six full score CSV hashes, and delivered sources reassemble
to both scored hashes. No engine/opcode/rule/round-cap/scoring modification.
Other fields and no-Zombie results/tradeoffs are in `best/README.md`; none proves
universal dominance or predicts the unknown2026 field. No-Zombie mean is slightly
lower and its interval crosseszero. Do not turn that into a proven zero regression.

## What did not justify adoption

- Faster recursion-free copying greatly reduced instruction count but collapsed
  scoring; shorter recurring paint gaps, energy inserts, and FFC translation also
  generally regressed. Speed is not competitive strength by itself.
- B startup gap0400 had promising first exploration, then a nearly flat common
  refinement and weaker modern exploration. It was not broadcast as confirmed.
- Friendly-frame scanner exclusions solve a constructed mechanical defect but
  exactly tied in the field screen. Twenty-five targeted natural replays showed
  zero scanner writes; this does not estimate global frequency.
- B-only INT86 burst improved a short screen but only+0.001833 in refinement.
  A-only/both bursts were lower. No confirmed gain from the burst family.
- After confirmation, reused exact B-burst/B0400 components on V6 Guard. Both
  scored below the new baseline in a200-battle common screen:0.690000/0.707500
  versus Guard0.728333. Intervals crosszero; this is insufficient to claim they
  are definitively worse, but gives no basis to replace the confirmed baseline.

## Execution limitations and continuation

All three agents' later turns were interrupted by provider risk filtering.
Completed source/evidence artifacts were preserved. Main finished the confirmation,
stress and cold tests and sent all three a verified baseline notification. Their
errored status was not represented as continued source work or a completed100-agent
tournament. No new risky-source retries were used to bypass their interruptions.

There are no active central benchmark jobs from this round. Useful continuation:
read `shared-best.json`, `best/README.md`, `PROTOCOL.md`, agent notes under the dealt
run's `r0/`, and immutable candidate manifests. Start future variants from the
confirmed guard pair while retaining the original. Fresh candidate selection must
use new confirmation seeds, not recast this round's holdouts as untouched.
Agent notes predate final confirmation; the current shared-best record and this
report supersede their older "no confirmed gain" checkpoint statements.

Isolated CPU fixtures originally omitted2/1 interrupt charges; last burst/guard
smokes were corrected, full official Competition scores were never affected.
Old logs are preserved with their narrower scope. Binaries retain friend provenance.

Host was4cores/8logical,100% loaded with unrelated active jobs,32GiB RAM and ample
free memory. To mitigate own-run CPU starvation only owned Java process11324 was
raised Normal->AboveNormal, still2 workers. Observed CPU-time allocation rose
from roughly0.3 to1.9 CPU-seconds/second under load; this is not a controlled
whole-benchmark6x speedup claim. Priority expired on exit. Future session-local
`bench-priority.mjs` raises only its newly spawned Java children, caps workers at2,
records applied/fallback priority, and hashes that runner into cache identity.
The separate cold CLI matched after this scheduling-only change.

All research writes are in this session. `final/` and unrelated dirty files are
untouched; no commits, pushes or changes to other checkout runs were made.
