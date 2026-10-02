# Competition-oriented comparison — m049, m050, and XOR-B

This study uses the deterministic official v6 engine in four-team battles.
The opponent pool is the 75 locally available published 2025 *online*
survivor pairs (adult and young), with the published 2025 live Zombies.
It is a competition-oriented proxy, **not** a replay of the 2025 final or
a forecast of the unpublished 2026 field/Zombies.

## Does the one-byte m050 XOR-B change help overall?

The only binary change is in Survivor B's pointer update:
`sub [bx],bp` -> `xor [bx],bp`. The m050 A binary is identical in both
arms (SHA-256 `0268ce4f...`). B is `06b5a1ff...` in original m050 and
`fb66036e...` in XOR-B. All binaries remain 189/117 bytes. Both arms
used the same candidate name, engine JAR, four Zombies, opponent binaries,
cohort placement, and battle seed within each paired run.

The 75 opponent pairs were divided into 25 trios in four separately
shuffled partitions; every team appeared once per partition. Each trio
had 100 battles per candidate, giving 10,000 paired four-team battles
per candidate. Claude's targeted code was not in this primary field.

| Partition | m050 score/battle | XOR-B score/battle | XOR-B minus m050 |
| --- | ---: | ---: | ---: |
| 1 | 0.631467 | 0.615500 | -0.015967 |
| 2 | 0.656733 | 0.636267 | -0.020467 |
| 3 | 0.673867 | 0.645933 | -0.027933 |
| 4 | 0.696133 | 0.666067 | -0.030067 |
| **Pooled** | **0.664550** | **0.640942** | **-0.023608** |

The relative score loss is about 3.55%. An approximate 95% t interval
over the four partition means is [-0.034028,-0.013188]. An interval over
the 100 cohort differences is [-0.041518,-0.005699]. Both describe
uncertainty from reshuffling/seed variation *conditional on the same 75
teams*, not uncertainty about new 2026 strategies. All four partitions
were negative. The change is therefore **worse for the realistic broad
2025-online proxy**, despite its large conditional gain against Claude's
counter. Do not promote XOR-B to `final/`.

As a secondary aggregate-block ranking check, m050 ranked first or tied
first against the same three opponents in 95/100 cohort blocks, while
XOR-B did so in 92/100. Mean block ranks were 1.06 and 1.10 respectively.
These are ranks of each 100-battle cohort aggregate, not literal ranks in
the historical or future final.

Reproduction files: `generate-m050-xorb-competition-proxy.mjs`,
`analyze-m050-xorb-competition-proxy.mjs`,
`config-m050-xorb-competition-proxy-part-*.json`, and the result manifests
under `experiments/smart-counter-2026-09-30/xorb-competition-proxy/`.

The 75-team pool includes 13 young-division teams. A separate
**senior-only decision gate** used exactly the same 62-team/50-cohort/
two-seed panel as the m049-vs-m050 comparison below, with 10,000 paired
battles per candidate. Its scores were m049 0.628067, original m050
0.646567, and XOR-B 0.612092. XOR-B minus m050 was -0.040600 on the
first seed and -0.028350 on the second; combined -0.034475, an approximate
95% interval [-0.059797,-0.009153] over 50 cohort means. XOR-B was below
m050 in 38/50 cohort means. Thus the negative conclusion is stronger in
the more relevant adult-track proxy. The exact hashes, paired runs and
calculations are in
`experiments/m049-m050-realistic-20260930/comparison-with-xorb.json`.

## m049 versus m050

The separately generated fresh senior-only comparison used all 62
published 2025 adult pairs in each of two panels of 25 four-team cohorts;
13 pairs necessarily recur to fill 75 opponent slots per panel. Each
cohort was run for 100 battles on two independent new seeds for each
candidate (10,000 paired battles per candidate). m049 and m050 had the
same candidate name, opponent binaries/order, Zombies, and deterministic
v6 engine. All run-record binary hashes were checked against the exact
m049 and m050 binaries, not the mutable `final/` paths.

| Seed | m049 score/battle | m050 score/battle | m050 minus m049 |
| --- | ---: | ---: | ---: |
| 1 | 0.632717 | 0.652083 | +0.019367 |
| 2 | 0.623417 | 0.641050 | +0.017633 |
| **Combined** | **0.628067** | **0.646567** | **+0.018500** |

The combined relative gain is about 2.95%. An approximate 95% interval,
computed over 50 cohort means (averaging the two seeds within each cohort),
is [+0.005369,+0.031631]. Both seeds and both cohort panels favored m050.
This supports retaining m050 rather than reverting to m049 for a broad
2025-online-senior proxy; it does not establish the winner of a future
final with changed Zombies and competitors.

Historical m050 promotion evidence also favored it by +0.005422
score/battle over 15,000 paired battles, but its published block-level
confidence interval reused the same 25 opponent trios across seeds.
Grouping by those trios widens the approximate 95% interval to
[-0.00669,+0.01754], so the new independent cohort/seed comparison is
important confirmation rather than an assertion that every field favors
m050.

Reproduction and raw manifests:
`experiments/m049-m050-realistic-20260930/comparison-two-seeds.json` and
the neighboring per-candidate JSON records.

## Decision for the currently available competition proxy

Keep **original m050** as the baseline. It beats m049 on the fresh
senior-only panel and beats XOR-B both there and across four broad 2025
online-field partitions. XOR-B remains a targeted anti-counter research
variant, not a general champion. This recommendation must be revisited
when the 2026 rules, opponent submissions and Zombies are known.
