# LEA-only confirmation plan

This is a new, preregistered comparison of the exact c090/LEA-only pair against both exact m049 and m050 pairs. It uses new results for every arm. No previous result is a control, and no candidate source is changed.

## Inputs and design

The two c090 binary hashes are `e5a2681fe8a7d6a3af8cb5cedbe528f8629c39cb35fd12576b1d884612aa7a07` (A, 187 bytes) and `99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b` (B, 115 bytes). Their provenance is the frozen synthesis extras manifest. The m049 and m050 pairs come from the linked original frozen synthesis audit manifest.

The roster is the same verified set of 62 adult/senior 2025 teams in all four `m049-m050-realistic-20260930` m049/m050 configurations. All 124 opponent binaries and all four live Zombies must match the prior frozen input manifest. Two new panel salts and four new battle seeds were drawn once with `node:crypto.randomBytes` before confirmation battles. Panel construction never reads result files.

Each independently salted panel contains 25 triples. Every senior team appears at least once; 13 distinct randomly selected teams appear a second time. A deterministic SHA-256 counter stream drives Fisher-Yates shuffles using rejection-sampled integers without modulo bias. The 75 slots are reshuffled until all triples contain three distinct teams. The manifest records salts, algorithm version, rejection attempts, repeated teams, exposure counts and exact cohorts. Two distinct 50-battle engine seed ranges are assigned to each panel; all four ranges must be disjoint from one another and from prior synthesis, joint and realistic-audit seed ranges.

Each of three arms has two configurations: 25 cohorts × 2 seeds × 50 battles = 2,500 per panel, or **5,000 per arm**. Total execution is 15,000 battles. Every arm uses `COD_pair`, identical panel membership/order and seeds, one Java thread, `parallel=false`, and no telemetry. This is a candidate plus three field teams; the candidate pairs are tested separately with matched conditions.

Generation refuses pre-existing manifests, configurations, build directories or result/run directories. It makes exclusive, read-only copies of all three contender pairs under this suite's `build/` subtree. Every current input, copied input, engine, runner, reference, configuration, plan and randomization file is hashed. Results and archived run files stay under this suite. The analyzer is intentionally not part of the immutable authoring hash set, so a documented validator bug can be repaired without changing the experimental plan.

## Prespecified analysis and decision

The primary measure is team points per battle. A paired observation is the difference between two matching **50-battle aggregates**, not 50 independent observed battle outcomes. For c090 minus each reference, pool all 100 paired blocks with equal weight, average the two seeds within each of 50 distinct panel/cohort IDs, and report a two-sided 95% Student-t interval on those 50 cohort means (49 degrees of freedom). Also report both panel directions and all four panel/seed directions. The panel/seed means are descriptive checks, not four replications of identical cohorts.

The prespecified survival gate requires, against **both** references: positive pooled mean; positive lower bound of the cohort interval; positive mean in each panel; and positive mean in every panel/seed slice. Report each condition explicitly. A non-pass is a non-pass for this plan; do not select a favorable seed or panel, add battles adaptively, or rescue it by pooling old outcomes. Requiring success against both references answers the conjunction; do not reinterpret either individual comparison as proof of a broader population claim.

The 50 cohort clusters reuse a fixed 62-team pool, including deliberate repeats; they are not 50 independent samples of the entire possible opponent population. The cohort interval is an approximate, conditional sensitivity measure. Two randomized panels reduce reliance on one grouping but do not establish universal superiority. Even a pass justifies considering a separately preregistered 2024 transfer or genuinely new opponent pool. It does not authorize final replacement, commits or claims about the historical final.

## Review and run

From the repository root, review the scripts and inspect the write-free plan first:

```powershell
node candidates/generated/codex-goal-20261001/lea-confirmation/generate.mjs --plan
```

After review, freeze the artifacts once:

```powershell
node candidates/generated/codex-goal-20261001/lea-confirmation/generate.mjs
```

The six configuration paths are `panel-1-c090.json`, `panel-1-m049.json`, `panel-1-m050.json`, `panel-2-c090.json`, `panel-2-m049.json`, and `panel-2-m050.json`, all in this directory. Run each through the existing `official-benchmark.mjs`, respecting the machine's other active work:

```powershell
node official-benchmark.mjs candidates/generated/codex-goal-20261001/lea-confirmation/panel-1-c090.json
```

Repeat that command for the other five configurations. Once all six finish:

```powershell
node candidates/generated/codex-goal-20261001/lea-confirmation/analyze.mjs
```

The analyzer prints JSON to stdout and does not write or alter results. No benchmark is launched by the generator or analyzer.
