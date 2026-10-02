# Repository handover inventory — 2026-10-02

This inventory distinguishes published research evidence from local scratch.
It is **not** a claim that every local file is in Git, nor that the current
`final/` pair is the strongest possible 2026 submission.

## Published reference points

- Active branch: `codex/optimize-2025-survivors`. `final/` holds Chimera m050
  (189/117 bytes); the exact source, binaries, manifest, broad-field promotion
  record, and a documented `New_Best` regression are committed. Read
  `final/README.md` and `experiments/m050-promotion-2026-09-28.json` together.
- The friend-provided Good_Test V6 binaries, byte-identical ASM reconstruction,
  valid experimental variants, and selected screen/holdout evidence are in
  `study-notes/good-test-v6/`. None of those V6 variants has a confirmed gain.
- The independent b01d/e1p4 evaluation has its eight ASM sources, generator and
  analyzer scripts, frozen manifest, 64 configs, 64 aggregate result files, and
  concise conclusion in `study-notes/b01d-e1p4-validation-20261002.md`.
  Its per-battle staging copies and logs are still local, not published.
- The accepted research-only engine acceleration source, validation tools, and
  compact timing summaries are in `tools/engine-acceleration-20261001/`; the
  rejected REP MOVSW follow-up is in `tools/engine-acceleration-20261002/`.
  Neither replaces the original deterministic engine used for official scores.
- `candidates/generated/combo-zrl03-evaluation/` contains the 195/122-byte
  `combo_zrl03` source pair. An independent reassembly matched the binary
  hashes in `experiments/combo-zrl03-b01d-holdout-20261002/summary.json`.
  That short 1,000-battle-per-arm holdout favored combo numerically by 0.004667
  points/battle, but its 95% interval crossed zero; it did not establish a
  winner over b01d. `combo_ah02` is retained as a research source, not a
  promoted champion.
- Remaining ASM source snapshots under `candidates/generated/` were archived
  separately without compiled outputs. `candidates/generated/README.md`
  explains why many are rejected or invalid research drafts, not submissions.
- Another 135 root-level `.mjs` experiment/generator/analyzer scripts were
  archived after syntax checking. They are historical research tools, not a
  supported command suite; inspect paths, write effects and assumptions before
  running one on another machine.

## Local-only material deliberately not bulk committed

| Group | Why it remains local | Next treatment |
|---|---|---|
| Root `config-*.json` files (roughly 726) | Generated experiment definitions, many with absolute machine paths | Select configs alongside a specific result and source package; do not import wholesale as current rules |
| `experiments/m050-search/` (about 55 MB in 291 JSON files) | Broad historical search, much of it selected-screen output | Build a compact family index, retain decisive holdouts and rejection evidence |
| Other `experiments/` runs, logs and copied inputs | Tens of thousands of regenerable per-run files | Retain locally; publish frozen config, hashes, aggregate result and analyzer for decisions |
| `build/` and generated candidate binaries/listings | Regenerable compilation and run staging | Keep exact promoted binaries only where source/hash evidence requires them |
| `candidates/generated/codex-goal-20261001/` and other large candidate directories | ASM snapshots are archived, but scripts remain intermingled with classes, CSV and temporary outputs | Curate supporting scripts and a result index before publishing |
| `tools/corewars8086-6.0.0/scores.csv` | Mutable local simulator output | Do not commit as a research result |

No local-only item was deleted. `benchmark.mjs` and `disassemble.mjs` show
working-tree line-ending differences but no content diff; they were left alone.
The changed `official-benchmark.mjs` was separately committed after syntax
checking because it supports cohorts with one to three opponents.

## Next-agent workflow

1. Start from the exact committed hashes and read `README.md`, the consolidated
   2025 rules, engine facts/opcodes, `final-report.md`, and the video-review
   ledger in `study-notes/README.md`. Treat notes and pasted claims as hypotheses
   until checked against the engine and fresh benchmark evidence.
2. Keep `final/` unchanged until a candidate beats the chosen reference on a
   prespecified broad field, a fresh holdout, and relevant counter stress.
   Compare exact binaries under paired seeds and report uncertainty. A narrow
   duel win alone does not determine the best tournament entry.
3. When curating more local experiments, package source + exact binary hashes +
   frozen config + compact result + analyzer + limitations. Do not commit whole
   `runs/` trees or compiled classes merely to make `git status` shorter.
   Absolute paths in old configs must be rewritten for another machine.

Current honest state: the published branch contains the selected artifacts
above, while substantial older local research remains uncurated. A clean Git
status is not yet achieved and should not be manufactured by deleting or
silently ignoring those files.
