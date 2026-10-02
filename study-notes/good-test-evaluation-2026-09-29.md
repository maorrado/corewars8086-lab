# Good_Test evaluation — 2026-09-29

## Decision

`Good_Test1`/`Good_Test2` are **not** stronger general replacements for Chimera m049 or m050. They are useful as a specialized counter-style opponent, because they win strongly against a few 2025 cohorts, but their large regressions across most of the field reproduce on a fresh holdout.

No file under `final/` was changed by this evaluation.

## Inputs

| Pair | Warrior | Bytes | SHA-256 |
|---|---:|---:|---|
| Good_Test | 1 | 213 | `1490503d6bb108d0e6e0c751fdc3ef2c34c81c70c8eb647f27a49510a9cf8e23` |
| Good_Test | 2 | 173 | `3a0f7a2a13dc4e284b226a6b5f33f67cff738656de355977039c418ba170e385` |
| m049 | A | 189 | `106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973` |
| m049 | B | 117 | `7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77` |
| m050 | A | 189 | `0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44` |
| m050 | B | 117 | `06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782` |

## Protocol

1. Primary all-field test: 25 three-opponent cohorts from the 2025 field, four fresh seeds, 100 battles per run: 10,000 battles for each tested pair.
2. Fresh holdout: all opponents regrouped after a deterministic rotation, two unseen seeds, 100 battles per run: 5,000 battles for each tested pair.
3. Joint adversarial test: Good_Test, m049, m050, and the original New_Best pair in the same four-team battles, four seeds and 500 battles per seed: 2,000 battles.
4. Paired comparisons use identical cohort/seed runs and a Student-t 95% confidence interval over run clusters.

## Results

### Primary all-field test

| Pair | Total | Warrior 1 | Warrior 2 |
|---|---:|---:|---:|
| Good_Test | 0.552167 | 0.293467 | 0.258700 |
| m049 | 0.662800 | 0.322000 | 0.340800 |
| m050 | **0.671483** | 0.326400 | 0.345083 |

Good_Test minus m050: **-0.119317**, 95% CI `[-0.149637, -0.088997]`, 15 wins / 0 ties / 85 losses across 100 paired clusters.

Good_Test minus m049: **-0.110633**, 95% CI `[-0.140008, -0.081259]`, 22 wins / 0 ties / 78 losses.

### Fresh regrouped holdout

| Pair | Total | Warrior 1 | Warrior 2 |
|---|---:|---:|---:|
| Good_Test | 0.532700 | 0.290300 | 0.242400 |
| m049 | 0.659800 | 0.315250 | 0.344550 |
| m050 | **0.660867** | 0.313517 | 0.347350 |

Good_Test minus m050: **-0.128167**, 95% CI `[-0.167573, -0.088760]`, 7 wins / 1 tie / 42 losses across 50 paired clusters.

Good_Test minus m049: **-0.127100**, 95% CI `[-0.166156, -0.088044]`, 8 wins / 1 tie / 41 losses.

Pooled across both protocols: Good_Test minus m050 = **-0.122267** over 15,000 battles, cluster 95% CI approximately `[-0.146117, -0.098416]`.

### Joint four-team test

| Rank | Pair | Score per battle |
|---:|---|---:|
| 1 | m050 | **0.287027** |
| 2 | m049 | 0.248744 |
| 3 | New_Best | 0.239393 |
| 4 | Good_Test | 0.224336 |

Good_Test warrior split in the joint run: warrior 1 = `0.140077`, warrior 2 = `0.084259`. Its second warrior is the main weakness in this adversarial mixture.

## Where Good_Test is strong and weak

Best primary cohorts relative to m050:

| Cohort | Opponents | Difference |
|---|---|---:|
| all-v1-09 | HDS_GoldenLamed, HDS_TRY, TOM_Code_Killer | +0.177500 |
| all-v1-07 | GSA_VanLavan, AML_ByteReapers, GGN_OpcodeHunter | +0.105417 |
| all-v1-03 | IND_cgx123123, IND_stuxnet, HRZ_Ctrl_Alt_Elite | +0.100833 |
| all-v1-10 | GSA_callfart, HRZ_PowerRangers, SZR_BrvazimAlSteroidim | +0.055833 |

Worst primary cohorts relative to m050:

| Cohort | Opponents | Difference |
|---|---|---:|
| all-v1-02 | HDS_NRI, GSA_GhostBytes_0x, HRZ_Grindo_Holics | -0.482500 |
| all-v1-11 | GSA_ShmuelTurtles, RZL_YANDE, HDS_IWDIA_nachalo | -0.395000 |
| all-v1-16 | WAN_OnlyCode, TOM_AND_JERRY, HRZ_Thingies | -0.260000 |
| all-v1-17 | TOM_tson_el_akod, HRZ_L, GSA_B33 | -0.237500 |
| all-v1-06 | TOM_The_Crushers, HRZ_The_almogooners, BZV_SKYENT | -0.233750 |

## Static code findings

- Good_Test1 contains one `INT 87h`, two `REP MOVSW` sequences, and three `CALL FAR [BX]` byte patterns. It contains no `INT 86h` and no NRG signature.
- Good_Test2 contains two `INT 87h`, two `REP MOVSW` sequences, and three `CALL FAR [BX]` byte patterns. It also contains no `INT 86h` and no NRG signature.
- The opening `INT 87h` in Good_Test1 searches for bytes `0E 07 0E 17` and supplies replacement bytes `FF 26 17 4A`. Good_Test2 writes its captured-entry offset to `[4A17h]`. Together these implement a targeted redirect/capture path against code containing that common segment-setup signature.
- Good_Test1 then reads a pointer from `[7A00h]` and patches several nearby fields before entering a Phoenix-style replication chain. Its tail includes an arena scan and a `CCCC` write path. With binaries alone and no symbols, the exact intended invariant at `[7A00h]` cannot be proven, but the mechanism is clearly more target-dependent than Chimera's compact general Phoenix loop.
- This explains the benchmark shape: large wins against a small set of compatible structures, but severe losses when the searched/patched structure is absent or the extra work delays the replication chain.

## Recommendation

Keep m050 as the strongest measured research baseline and keep m049 as the checked-in conservative champion until promotion policy is resolved. Add Good_Test to the counter/holdout opponent library, especially its strong cohorts and redirect signature, but do not promote it as m051.

Machine-readable results are in `experiments/good-test-evaluation/summary.json`; raw runs and paired analyses are in the same directory.
