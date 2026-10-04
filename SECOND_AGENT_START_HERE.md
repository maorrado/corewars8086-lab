# Second-agent handover — CodeGuru Xtreme research

Current navigation update, 2026-10-04: the research branch described here has
been integrated into `codex/optimize-2025-survivors`. The current final reference
is zchain3; m049/m050 are historical catalog entries. Read `strong-codes/README.md`
and `study-notes/codex-research-20261004/README.md` before relying on the older
setup instructions below. Worktree isolation still applies: do not edit another
agent's active checkout or change its branch.

## Historical second-agent setup (2026-10-03)

The following describes the separate agent2 checkout, not instructions to switch
the primary checkout away from `codex/optimize-2025-survivors`.

This was a separate, clean worktree for the second agent on
`agent2/research-2026-10-03`, created from commit
`bca49e648b057b534c22e35e3480e51787423f26` of
`codex/optimize-2025-survivors`. Work **only in this directory and branch**.
The primary checkout at `C:\Maor\CodeGuru\corewars8086-lab` contains local
research files and belongs to the other agent; do not edit or clean it.

## Read before proposing or changing code

1. `README.md`, `rules-2025-consolidated.md`, `engine-v6-facts.md`, and
   `engine-v6-opcodes.md` for the competition and simulator contract.
2. `study-notes/README.md` and its 31-video ledger. Read the relevant
   transcripts and frame-by-frame evidence, not only the summary, before
   making a claim based on a Zoom lesson.
3. `final-report.md`, `optimization-2025-report.md`, `experiment-log.md`,
   `final/README.md`, and both `final/Chimera*.asm` files.
4. `study-notes/handover-inventory-20261002.md` for what has been curated,
   what remains local-only, and the locations of recent candidate/evidence
   packages. `candidates/generated/README.md` explains why raw ASM snapshots
   are **not** approved submissions.

## Research map and decision rule

- At this handover's original snapshot, `final/` was the committed Chimera m050 reference, not proof of a universally
  strongest 2026 submission. Its binary hashes and promotion evidence are in
  `final/README.md` and `experiments/m050-promotion-2026-09-28.json`. A known
  `New_Best` regression is documented there too.
- `candidates/generated/` holds experimental ASM, including b01d/e1p4 and
  `combo_zrl03`; `study-notes/good-test-v6/` holds the friend-provided V6 pair,
  exact reconstructed source, variants, and selected evidence.
- `experiments/` contains results and configs. Prefer frozen paired comparisons
  and fresh holdouts over selected screens. `tools/engine-acceleration-20261001/`
  is a research-only faster runner; verify semantics and use the original
  deterministic engine for a final claim.
- Seek a **general tournament improvement**, not only a counter to one known
  pair. Report exact A/B binary hashes, opponents/field, seeds, battle counts,
  paired uncertainty, and failure cases. Never promote a candidate to
  `final/` solely because it won a duel or one seed. Keep new work on this
  branch; hand back results as commits or a reviewable diff.

Some historical configs, raw run copies and scratch binaries in the primary
checkout are intentionally not committed. Do not assume a missing file here
means the corresponding experiment never happened; consult the inventory and
request the specific missing artifact when it is necessary.

## Local execution setup

The deterministic research-engine JAR was copied into this worktree at
`repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar`.
Its SHA-256 is `31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d`.
This compiled file is local-only; the engine source is in `repos/`.
`tools/temurin8-jre/` supplies Java. Old configs may contain absolute paths to
the primary checkout and must be regenerated or adjusted before running here.
The browser assembler additionally needs the simulator served at
`127.0.0.1:8123`, Chrome, and Playwright (`assemble.mjs` documents these).
Port 8123 is shared across worktrees: check whether a server is already running
before starting another.
