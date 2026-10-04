# Codex research archive and current code map

This index preserves Codex's research through 2026-10-04, including unsuccessful
experiments. Claude's independently committed research is integrated alongside it
under `agent2/`; the code catalog is `../../strong-codes/README.md`.
The active final reference is zchain3, not the historical m049/m050 pair.

## Read first

1. `../../README.md`, the consolidated 2025 rules and engine facts/opcodes.
2. `../../study-notes/README.md`, with the Zoom transcript and frame ledger.
3. `../../strong-codes/README.md` and `../../final/README.md` for current status.
4. Claude's latest mixed-field result:
   `../../agent2/day2/leaders/CONFIRM-RESULTS.md`.
5. The session reports below. A selected screen is not fresh confirmation, a
   duel is not a tournament, and no finite field establishes universal dominance.

## Preserved Codex sessions

| Session under `.arena/` | Outcome and scope |
|---|---|
| `v6-cooperative-20261003` | V6 Guard search with strategy-card agents, source manifests, rejected variants, frozen plans and results. Two fresh holdouts totaling 6000 battles per pair support a 0.798 percent relative gain over original V6, with reported tradeoffs. Read `FINAL-REPORT.md` and `best/README.md`. |
| `ppppp-comparison-20261004` | Friend PPPPP pair was byte-identical to combo_zrl03. Independent paired 2025-field comparison against Guard and V6nohunt; no universal-ranking claim. |
| `claude-kphl-check-20261004` | Exact Claude KPHL pair and independent alpha/beta comparisons, confidence intervals, duel results and cold-driver checks. |
| `kphl-joint-leagues-20261004` | All three modern pairs included in balanced 1000-battle leagues against the published 2025 pool and archived 2024 senior finalists. The 2025 pool is not verified final-stage code. |
| `kphl-joint-2024-2000-20261004` | Fresh 2000-battle 15-team 2024-input league; all teams had nearly equal exposure. Lagrange led this draw. |
| `kphl-2024-pool-z2025-2000-20261004` | Same 15 teams and cohort seed strings, but the four 2025 Zombies replaced the six 2024 Zombies. Guard led this draw. Changed Zombie count can change RNG consumption, so identical seed strings do not prove identical placements. |
| `kphl-defense-20261004` | Bootstrap camouflage, alias/geometry/cell screens and fresh paired confirmation. The adapted hunter reverses the KPHLGuard win; not a robust-defense promotion. Read `adaptive-counter/report.json` as well as the earlier narrow positive report. |

These names preserve the original experiment IDs. The session files remain at
their original repository paths to retain links from plans and result manifests.
The legacy source/config/result research from September and early October is
also included in the publication catalog, rather than silently treated as new
evidence. Sources under `candidates/generated/` include invalid and rejected
drafts; consult their provenance notes before assembling a submission.

## What is included and excluded

`catalog.json` lists the selected research artifacts with bytes and SHA256 hashes.
It covers sources, protocols, candidate identity files, configs, compact results,
analyzers, and manageable raw score/telemetry CSVs. Existing tracked research is
retained; Claude's research is preserved by the branch integration.

Duplicate per-job copies of warrior/Zombie inputs, runtime manifests, compiled
classes, installation environments, bulk logs and media caches are not promoted
to research evidence. Large raw files excluded by the catalog remain local and
are listed explicitly; nothing was deleted to make Git status look clean.
The mutable simulator `scores.csv` and unrelated pre-existing edits are not part
of this publication commit.

The catalog generator also scans selected text for recognizable credential
patterns; no credential value is printed. This is a heuristic check, not proof
that every possible secret format is absent.

## Reproduction and relocation

Assemble catalog pairs with `node agent2/tools/nasm-node.cjs OUTPUT A.asm B.asm`.
`tools/check-strong-codes.mjs` verifies the recorded binary hashes and active
final reference. The archive validation does not run a new performance search.
Source hashes in the strong-code manifest normalize CRLF to LF. The research
archive catalog hashes raw file bytes; clone without automatic line-ending
conversion to compare those hashes directly.
`node study-notes/codex-research-20261004/verify-publication.mjs` checks every
cataloged artifact against its recorded hash and the code catalog identities.

Historic benchmark scripts/configs retain original absolute machine paths and
references to the isolated `corewars8086-agent2` checkout. Install Java8, build
the deterministic engine and batch driver, and deliberately relocate those
paths before using them on another machine. Use new plan IDs for altered inputs;
do not reuse an old cache identity after editing the runner or a binary.

Benchmarks use the unmodified deterministic v6 JAR hash recorded in results.
Keep game rules, round cap, Zombie pack, survivor counts and scoring unchanged
when validating a performance improvement. Repeat a sample with cold `java -jar`
to check driver semantics. Replays and reused-seed followups are not additional
independent holdouts.

The code catalog separates measured candidates, the committed final reference,
historical references and rejected defenses. It is not a forecast of the unknown
2026 competition or a promise that a single pair beats every possible opponent.
