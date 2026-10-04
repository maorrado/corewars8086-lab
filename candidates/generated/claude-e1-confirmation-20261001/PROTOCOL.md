# Independent c090/e1 confirmation against both exact controls

This is the first of the user's ordered tasks: comprehensive independent confirmation. Improving a leader and hardening baselines against Claude-family entrants are later tasks, not extra arms or adaptive extensions of this suite. Authoring this protocol does not freeze randomness, launch battles, or modify final files.

## Exact contenders and provenance

Four arms: immutable m049, immutable m050, exact c090, and exact e1. All use the same `COD_pair` name and A/B orientation. This removes the previous experiment's differing candidate labels. e1 is the 184/115-byte pair, not our different 185-byte entry-LEA A variant.

Controls originate from the local frozen bootstrap-holdout copies. c090 originates from the known local `build/claude-synthesis-audit-20260930/extras/LeaA/B`. The external Claude source/binaries are read-only provenance: root's reviewed source-snapshot script saves local copies, independently assembles the four c090/e1 sources, and writes `provenance.json`. No external file is a live battle input. The generator requires the explicitly reviewed provenance SHA-256, `status=PASS`, source snapshot records, independent assembly manifest, all listed file hashes, and these exact binary hashes before entropy:

| Arm | A SHA-256 | B SHA-256 |
| --- | --- | --- |
| m049 | `106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973` | `7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77` |
| m050 | `0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44` | `06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782` |
| c090 | `e5a2681fe8a7d6a3af8cb5cedbe528f8629c39cb35fd12576b1d884612aa7a07` | `99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b` |
| e1 | `9447b5add61d6f18bff2708adfd2038c3eb1a9008dd9cf03df5c046eff4a4349` | `99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b` |

## Fresh sampling schedule

The fixed field comprises all 75 public 2025 online-stage teams (62 senior, 13 youth) and four frozen Zombies, hash-bound through the latest reviewed coverage-dwell manifest. This is not a claimed reconstruction of the historical final.

Draw eight independent unbiased permutations of the ASCII-name-sorted 75-team roster, each with its own 32-byte crypto salt. Partition each into 25 triples. Within each partition every team appears exactly once; no selected repeats or outcome-based exclusions. Fisher-Yates uses a SHA-256 counter stream and rejection-sampled uint32 indices.

Each partition receives two separately crypto-generated seed strings, each covering 25 wars. All 16 strings and their Java-hash-derived 25-war ranges must be globally distinct/nonoverlapping. Also exclude all 29 ranges inherited from the latest coverage-dwell freeze and the four 50-war ranges for Claude's `gen-oct1-001/002` and `hold-oct1-001/002`. The previous adjacent seeds overlapped 49/50 wars; this suite does not repeat that design. Old ranges may overlap each other, but no new range may intersect any of them.

Use the same seeds, triple order, names, Zombies, and settings for all arms within a partition. Counts are `8 partitions × 2 seeds × 25 triples × 25 battles = 10,000 per arm`, or 40,000 scored battles total. Because the native runner has a global seed list per config, emit **32 configs**, one per partition/arm, each containing only that partition's two seeds and 1,250 battles. Do not apply all 16 seeds to all eight partitions.

Freeze is explicit and exclusive. Claim a new `frozen/` directory before drawing eight salts and sixteen 12-byte seed suffixes, then persist `randomness.json` before checking collisions. Collision/interruption attempts remain visible and cannot be overwritten or automatically redrawn. Preflight/verification draw no entropy and read no battle outcomes. All source, binary, roster, engine/runtime and config hashes are retained without duplicating historical result trees.

## Runtime and preregistered original-engine replay

Run native configs using the reviewed isolated persistent serial adapter, one thread, `parallel=false`, no telemetry and no extra JVM options. Accelerated runs use exactly the reviewed `int87/classes` and `war/combined/classes` overlays plus the frozen original JAR. Keep each config's output in a new directory; do not modify its frozen input file.

Before calling any advantage verified, replay **all four arms of panel-01** using the same frozen configs, original JAR, reviewed `SerialBatchMain` wrapper, and **no overlays**. That is 1,250 battles per arm, 5,000 replay battles. Panel-01 is chosen now, not after seeing results. The analyzer requires complete original runs and byte-identical per-block raw score CSVs and candidate/opponent/Zombie identities against the accelerated runs. These replays validate execution and are not extra statistical observations.

Default derived directories:

- Accelerated: `experiments/claude-e1-confirmation-20261001/accelerated/panel-NN-ARM/`
- Original replay: `experiments/claude-e1-confirmation-20261001/original-replay/panel-01-ARM/`

The analyzer can accept explicit alternative common roots but preserves the fixed partition/arm IDs and input config hashes. It requires every one of the 32 scored runs and four original replays to be complete before interpretation. It verifies runtime/overlay policy, successful exit, 50 blocks and 1,250 battles per config, exact engine seed arguments, and same-name binary identities. Existing read-only integrity readers verify plans, staged inputs, starts/ends, raw CSVs, parsing, per-run records and pairing. No partial-arm selection or numerical conclusion is emitted when evidence fails.

## Prespecified statistical question and gate

For each contrast, pair scores at the same partition/cohort/seed. Average its 50 block deltas within each partition, yielding **eight primary observations**. Each partition contains all 75 opponents, and all blocks are equally sized; the mean of these eight partition deltas equals the pooled points-per-battle difference. The primary uncertainty estimate is a two-sided 95% Student t interval across the eight partition means, df=7, critical value 2.3646242510102993. Do not treat 10,000 battles, 400 blocks, 200 cohorts, or 16 seed cells as independent primary observations.

Report all five contrasts: c090−m049, c090−m050, e1−m049, e1−m050, and e1−c090. Include pooled scores, all eight partition deltas, all sixteen seed-cell deltas, and cohort-mean sign/range sensitivity. The latter summaries diagnose dependence on groupings/seeds; they do not enlarge the primary sample size. Scores are team points per battle, not battle-win percentages; sign counts refer to aggregate comparison units.

A contrast is **SUPERIOR** when its pooled delta and 95% lower bound are strictly positive, **INFERIOR** when its 95% upper bound is strictly negative, and **INCONCLUSIVE** otherwise. A candidate qualifies as **verified advantage on this pool under this protocol** only when it is superior against **both** exact m049 and m050, and all original-engine replays agree exactly. If any control contrast is inferior, label the candidate **supported inferior to at least one control on this pool** and name the control(s). Otherwise label it **inconclusive under this protocol**. A negative observed mean alone remains inconclusive; none of these labels asserts universal superiority or inferiority. These are nominal per-contrast 95% intervals, not a multiplicity-adjusted simultaneous/familywise guarantee. Repeated use of the same finite public opponent pool limits external generalization despite fresh independent partition/seed draws.

No adaptive stopping, sample extension, changed gate, cherry-picked partition, old-result pooling, automatic final promotion, or mutation of a tested candidate is authorized. Complete and report this confirmation before moving to the user's next ordered research task. A c090/e1 head-to-head interval describes their difference; it does not override the requirement to beat both controls.

## Commands after root review

```powershell
node candidates/generated/claude-e1-confirmation-20261001/generate.mjs --preflight --inputs-sha256 <REVIEWED_PROVENANCE_SHA256>
node candidates/generated/claude-e1-confirmation-20261001/generate.mjs --freeze --inputs-sha256 <REVIEWED_PROVENANCE_SHA256>
node candidates/generated/claude-e1-confirmation-20261001/generate.mjs --verify --inputs-sha256 <REVIEWED_PROVENANCE_SHA256>
# Only after every scored run and original replay completes:
node candidates/generated/claude-e1-confirmation-20261001/analyze.mjs --manifest-sha256 <REVIEWED_FROZEN_MANIFEST_SHA256>
```

Optional analyzer roots: `--results-dir <PATH>` and `--replay-dir <PATH>`. The analyzer invokes only Node integrity readers, never the battle engine, and creates a new suite-local `analysis.json` with exclusive creation. It refuses to overwrite prior analysis. Root supplies reviewed hashes; neither expected hash is inferred from an unreviewed current artifact merely to bypass the gate.
