# Broad-strength research continuation — 2026-10-01

Objective: produce a survivor pair that reproducibly outperforms **both** exact
m049 and m050 in broad four-team competition. A targeted-duel improvement alone
does not satisfy the goal. This continues the saved 2026-09-30 research rather
than restarting already rejected sweeps. No promotion, commit or push is part of
this continuation's testing step.

## Current authoritative state

- Active branch: `codex/optimize-2025-survivors`; the existing dirty worktree is
  preserved. `final/` and `build/final/` already contain m050 before this work.
- Exact m049 hashes: A `106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973`,
  B `7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77`.
- Exact m050 hashes: A `0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44`,
  B `06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782`.
- The latest independent synthesis audit found a small positive c090/LEA-only
  signal on four fresh seeds, but the same existing opponent triples. Its
  cohort-sensitivity interval included zero. It is a lead, not a new champion.
- Claude's synthesis and c041 bomb variants did not outperform m050 on that
  fresh broad field. A pure-duel synthesis advantage is a separate result.
- A different Claude checkout has an unrelated live `bigcheck` benchmark.
  Do not stop, reuse or alter that process. This suite uses separate paths.

## Work lanes

1. `lea-confirmation/`: preregistered matched comparison of frozen c090, m049,
   and m050 with newly regrouped senior opponents and fresh seeds. Each arm
   must run on the same names, engine, opponents, placements and seeds. Judge
   both paired comparisons, not a new score against old fixed baselines.
2. `bootstrap-designs/`: a small mechanistically motivated family building on
   the LEA-only lead. Root reviews every source change before score screening;
   any screen winner requires separate untouched validation.
3. `conditional-camper-screen/`: test the previously authored but untested
   tiny arena-loop B architecture with exact m050 A. This is not expected to
   win by assumption; it tests a genuinely different survival/offense split.

Available local concurrency is four agents including the coordinator, not
100 simultaneous agents. The tiered design/build/test/independent-validation
intent of the supplied arena prompt is retained without pretending that its
Claude-specific commands or previous benchmark numbers are authoritative here.

## Read-only review-agent result: c090 versus m050

**No findings.** Both complete sources, the m050 diffs, assembled worker tails,
exact binary hashes, and official v6 `Cpu.java`'s `8D` dispatch were inspected.
`MOV SP,DI; ADD SP,imm16` becomes `LEA SP,[DI+imm16]` in A's shared initializer
and B's initializer. This computes the same 16-bit SP and saves one turn per
initializer. LEA does not reproduce ADD's arithmetic flags, but no affected
control path consumes those flags before subsequent flag-changing instructions.
The 17-byte moving worker and copy counts are unchanged; labels resolve in
the assembled source, and executable paths skip the retained `CC` padding.

Residual risk: changed timing and initial image offsets can change competitive
interactions. Mechanical correctness does not establish a performance gain.
This review is complete; any later modifications require their own review.

## Evidence rules

- The available 2025 archive is the published online-stage field. These are
  v6 competition proxies, not a complete replay of the historical final.
- Fresh seeds and regroupings are not unseen opponents. A subsequent different
  opponent population or synthetic-strategy stress test is separate evidence.
- Metric: surviving-warrior points per battle, never mislabeled as win rate.
- Report attempted candidates and negative results; do not pick an advantageous
  seed, stop early on a favorable interim score, or promote from a screen.
- Frozen configs and manifests are not edited after their runs begin. If a
  protocol error is found, preserve invalid results and author a distinct fix.
- Nothing under `final/` is changed during these research lanes.

No new champion is established by the creation of this checkpoint.
