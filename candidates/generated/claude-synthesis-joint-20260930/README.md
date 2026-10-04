# Exact synthesis + m049 + m050 joint verification

This tests the user's narrower claim that the exact 207/115-byte synthesis
performs better when both reference teams are present in the same battle.
It is separate from solo-field generality testing.

## Frozen protocol

- All three contenders appear in every battle, with one published 2025 team.
- All 75 available published teams occur equally often as the fourth team.
- Three fresh, disjoint seed ranges; 10 battles per opponent/seed block.
- Three cyclic mappings of contenders to COD_A / COD_B / COD_C and input order.
- 2,250 battles per mapping, 6,750 overall; one engine thread, parallel=false.
- Same four published Zombies, exact original candidate/reference binaries.
- Manifest SHA-256: `c4873d8c2cd552ad8b50770696a01710b699dd8922593bca67c594f8638d67da`.

This is not a replay of the complete historical 2025 final. It deliberately
puts all three contenders together in every battle; it does not represent
uniformly sampled four-team subsets from an unrestricted 78-team tournament.
The three cyclic mappings balance individual contender slots but do not test
all six permutations.

## Reproduction and validation

Run `node official-benchmark.mjs` with each of `orientation-1.json`,
`orientation-2.json` and `orientation-3.json` from this directory (relative
to the repository root). Then run:

```powershell
node candidates/generated/claude-synthesis-joint-20260930/analyze.mjs all
```

The analyzer verifies frozen configurations, source and copied-binary hashes,
engine and command identity, actual started/completed battle counts, retained
CSV/run records, and point conservation. It attributes scores by each mapping's
actual binary identity. Three-seed intervals are conditional on this fixed
field and mapping set; cohort intervals are descriptive. Scores are points per
battle, not win rates.

## Completed results

All three mappings completed: 675 blocks, 6,750 battles. The analyzer verified
all actual started/completed battle counts and 8,100 archived binary inputs.
Maximum raw integer-score conservation error was 0.0000017, maximum warrior/team
sum error was 0.0000011, and 103 battles awarded no points. Independent
recomputation of the result JSONs reproduced the scores and binary mappings.

| Aggregation | Synthesis points/battle | m049 | m050 |
| --- | ---: | ---: | ---: |
| All 6,750 battles | 0.315649390 | 0.313372495 | 0.313705827 |
| Fresh seed 1, all mappings | 0.317684666 | 0.307979905 | 0.308450805 |
| Fresh seed 2, all mappings | 0.326223290 | 0.309526995 | 0.315470909 |
| Fresh seed 3, all mappings | 0.303040213 | 0.322610584 | 0.317195767 |
| Mapping 1, all seeds | 0.333578843 | 0.298870904 | 0.319479374 |
| Mapping 2, all seeds | 0.324190485 | 0.330815884 | 0.298896303 |
| Mapping 3, all seeds | 0.289178841 | 0.310430695 | 0.322741804 |

The synthesis has the highest pooled observed score, but its mean advantage is
only +0.002276895 points/battle over m049 and +0.001943563 over m050. It is ahead
of both controls in 2/3 seed aggregates, 1/3 mapping aggregates and 3/9
seed-by-mapping aggregates. These are aggregate score comparisons, not battle
win counts. The rank reversals are much larger than the small pooled advantage.

For synthesis minus m049, the three-seed conditional 95% t interval is
[-0.045519210, +0.050073000], with descriptive cohort interval
[-0.000564556, +0.005118346]. Against m050 these are
[-0.032742210, +0.036629336] and [-0.001437376, +0.005324501]. All include zero.
Only three independent seed batches were used; treating all battles or all
seed-by-mapping cells as independent would overstate certainty.

Conclusion: the narrower claim has an observed positive pooled result under
these joint conditions, but stable superiority is **not established**. It
does not reverse the independently observed solo-field disadvantage of this
exact synthesis versus m050, or establish general tournament superiority.

No contender source or `final/` file was changed for this verification.

The already completed solo-field comparison is documented in
`../claude-synthesis-audit-20260930/README.md`.
