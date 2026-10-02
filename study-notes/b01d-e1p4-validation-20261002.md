# b01d vs e1p4 — independent 2025-field validation

## Result

Claude's b01d pair was independently assembled and tested against exact e1p4
on the complete 75-team official 2025 roster. The preregistered primary
comparison supports a small but measurable improvement in this 2025-field
average. The gain is concentrated in the three matchups named in the supplied
report; outside those contexts the estimate is effectively zero. This does
not establish that b01d is a generally stronger or future-proof champion.

## Frozen design and integrity

- 16 fresh panel seeds, each with a new random partition of all 75 teams into
  25 cohorts of 3 opponents. Each cohort runs 50 four-team battles with the
  competition's 4 zombies.
- Same panel seed, cohorts, and execution order randomization for all four
  arms: exact e1p4 control, A-decoy only, B-band-shift only, and combined b01d.
- 20,000 candidate battles per arm; 80,000 total; 64 frozen config files and
  1,600 cohort result blocks. A previous interrupted/partial serial attempt
  used the same frozen design but its 11 partial result files were not used;
  final analysis uses only the separately completed 64-config parallel run.
- Original deterministic engine JAR SHA-256:
  `31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d`.
- Frozen parallel manifest SHA-256:
  `ae395a714b73f2997620e72900c5ad03a996920120b73436fc01cdeb4d068c23`.
- e1p4 A/B: 187/115 bytes, hashes
  `99192c673e5af394ed8194932b52b4f18f092804384f38d1bb2828b189c76b93` /
  `d307b92097ac68ce6073adc1e34917b2f51c0c396235c918dfc913cee7393354`.
- b01d A/B: 192/115 bytes, hashes
  `775080226ca8f9e9a5aac584094c9066bd2c55365ee8cea1e18db26440d9315e` /
  `884b4d52e4ef1e57db85c88083d0a8667a6bd252a25728da7f5fdedefa6f33c7`.
- Analyzer verified all 64 result files, battle counts, engine hash, panel
  pairing, every staged opponent/zombie input hash, and source/binary hashes.

## Primary comparison

The primary statistic is paired panel mean, n=16 (not treating individual
battles as independent):

| Arm | Points / battle | Total points / 20,000 battles |
| --- | ---: | ---: |
| e1p4 | 0.678567 | 13,571.333 |
| A decoy only | 0.681375 | 13,627.500 |
| B band shift only | 0.683129 | 13,662.583 |
| b01d combined | 0.685988 | 13,719.750 |

Combined b01d minus e1p4 is **+0.007421 points/battle**, or **+0.742 points
per 100 battles** (about +1.09% relative to e1p4's mean). Paired-panel
`t(15)=3.20`, 95% CI **[+0.248, +1.236] points per 100 battles**; b01d led in
13/16 panels. This is smaller than Claude's reported +0.90 and independently
supports a modest 2025-field uplift.

## What the components indicate

- A decoy alone: **+0.281 / 100 battles**, `t(15)=2.58`, 95% CI
  **[+0.049, +0.513]**.
- B band shift alone: **+0.456 / 100**, `t(15)=1.69`, 95% CI
  **[-0.121, +1.033]**; its all-field effect is not conclusive by itself.
- Combined b01d vs A-decoy alone: **+0.461 / 100**, CI
  **[-0.085, +1.008]**; not conclusive that the B shift adds to A alone.
- Combined b01d vs B-shift alone: **+0.286 / 100**, CI
  **[+0.068, +0.503]**.
- Additive interaction (difference-in-differences): **+0.005 / 100**, CI
  **[-0.202, +0.212]**; no measurable synergy between the changes.

## Matchup concentration

Exploratory context contrasts versus e1p4 (unadjusted for the multiple context
checks):

- HLS_EmoMutants: b01d **+9.14 points / 100 context battles**, 95% CI
  **[+5.01, +13.26]** (800 matched battles).
- Either named HRZ target: **+5.18 / 100**, CI **[+3.25, +7.11]**
  (1,550 matched battles).
- Any of the three claimed targets: **+6.41 / 100**, CI **[+4.65, +8.17]**
  (2,350 matched battles).
- No claimed target present: **-0.019 / 100**, CI **[-0.582, +0.544]**
  (17,650 matched battles).

Thus the overall 0.742/100-field gain is largely explained by the specified
HLS/HRZ matchups. There is no detectable uplift outside them in this test, but
the interval there still allows a small positive or negative effect.

## Decision

The claim “b01d scores better than e1p4 across the official 2025 field” is
supported by this independent fresh-seed test, with a smaller effect than the
reported +0.90. The stronger claim “b01d is broadly better against new or
different opponents” is not established. Keep it as a research candidate; do
not replace `final/` on this evidence alone. Before a promotion decision, run a
fresh different-year/population confirmation and a direct confirmation against
the exact m049/m050 references.

Full result files, frozen configs, logs, hashes, and analyzer output are under
`experiments/b01d-e1p4-validation-20261002-parallel/`. The 11 partial first-run
files are retained separately under `experiments/b01d-e1p4-validation-20261002/`
and excluded from all reported statistics. No commit, push, or edit to `final/`
was made by this validation.
