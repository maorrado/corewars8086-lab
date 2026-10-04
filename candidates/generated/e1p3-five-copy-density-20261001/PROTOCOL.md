# Five-copy e1p3 density stress

Status: pre-registered local research design. It is not a forecast of 2026 and
does not change the official 2025 pool.

## Question

How do exact m049, m050, the user-pasted exact e1p3 pair, and e1p3 with only
the B-worker XOR-B change score when the opponent pool contains five distinct
entries running byte-identical e1p3 binaries? This fills a gap in the earlier
five-entrant stress test, which intentionally mixed several different codes.

## Population and sampling

The 75 opposing public entrants and four Zombies are copied from the already
reviewed 2025 online-stage source manifest. Five new names (`CF01_e1p3` through
`CF05_e1p3`) each point to the exact same e1p3 A/B bytes. They are distinct
entrants, not deduplicated; no cooperation is assumed. In every generated war,
the evaluated candidate is forced into the battle and exactly three opponents
are sampled from the resulting 80-entry pool.

The number K of e1p3 copies among the three opponents follows the exact
hypergeometric probabilities `C(5,K) C(75,3-K) / C(80,3)`. Ten independent
cohort blocks are used for each K=0,1,2,3. Clone subsets are balanced exactly
within each stratum (K=1: each clone twice; K=2/3: each possible subset once).
Public teams are sampled without replacement within each cohort. Each cohort
has a fresh, unique 10-war Java seed range shared by all candidate arms and
both candidate-name orientations. Two orientations are one paired cohort,
not two independent observations. Every arm receives 800 battles; total
budget is 3,200 battles. All four-team battles, standard round limits/scoring,
original deterministic-v6 JAR, and no gameplay overlays are retained.

## Measures and limitations

Primary outputs are candidate team points per appearance separately by K,
the naturally weighted five-copy score, and paired changes in the candidate
advantage relative to the K=0 pool. Use cohort-cluster t intervals with n=10
clusters/stratum; present them as nominal descriptive intervals only. The
study is a sensitivity analysis on a fixed 2025 public pool, not a random draw
from unknown 2026 submissions, a universal immunity test, or a final-promotion
gate. e1p3-XORB is included as a targeted research arm despite its exploratory
general-field cost; report that tradeoff without hiding it.

Freeze before running. Preserve all partial outputs on failure; never redraw
entropy, overwrite results, touch `final/`, switch branches, commit, or push.
