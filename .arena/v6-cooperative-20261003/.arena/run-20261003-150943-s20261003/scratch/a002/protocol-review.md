# Independent benchmark review

The strongest currently refined pair is original A with B startup gap reduced from `0600h` to `0400h` (`a003_bstackshift`). It merits fresh confirmation after the planned common-context refinement finishes; it is not yet a replacement baseline. If one pair had to be chosen now, this would be my choice. The smaller-gap and direct-A candidates have noisier 200-battle support and should compete with it on the same new contexts before the selection is frozen.

I read the session protocol and all four requested completed result files. My reproducible audit is `review-results.cjs`, with exact checks and cohort effects preserved in `review-results.json`, in this directory. I also inspected the completed wave-2 summary and boot candidates' cohort differences. All writes for this review are confined to this directory; no battles or warrior edits were performed.

## Identity and normalization

The four requested results have 25 unique cohort/seed units per arm. Every normal partition covers all 75 published 2025 teams exactly once, grouped into 25 explicit three-opponent cohorts. Each arm is staged under `CAND`, with identical opponent names/order and seed strings within its own comparison. Screen units contain eight battles; refined units contain forty. All 4,500 staged warrior/Zombie files and every stored score CSV digest matched their frozen plan/source identities. There were no missing or duplicated contexts, unexpected opponents, or summary normalization mismatches. Engine JAR hash is `31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d`; persistent driver source hash is `32068d0d97e3f649788a40ccada2d5213719aa515c4832b73643e028a5069d8a` in all four results.

Team scores are sums of the two survivor shares, divided by battles played. They are not win rates. Tiny team-versus-survivor residuals, up to `0.000003` in a forty-battle unit, are consistent with the official Java float accumulation and CSV serialization. They do not affect the practical conclusions here.

Six arm/context rows in the a003 screen allocate seven total points across eight battles. This is permitted by official `War.nextRound` and `War.updateScores`: the entire round completes before the next termination check, and a battle with no living non-Zombie survivors awards no score. Aggregate CSVs do not expose the particular battle, so the all-dead explanation is source-supported rather than directly observed through telemetry. These are integral one-point deficits, not a reason to divide by seven or force scores to sum to eight. A cold CLI replay of such a context would be a useful additional driver check if performed by the coordinator.

Same-context controls are valid pairing even when changed code length or execution changes future placement rejection or random draw trajectories. The required identity is the prescribed input cohort/seed and rules, not a promise that all internal battle events remain identical.

## Statistical findings

All intervals below use the 25 paired cohort/seed means, sample standard error, and the proper `t(24)` critical value. They are exploratory intervals, not adjusted claims across candidate selection.

| Pair | Battles per arm | Team difference | 95% paired interval | A share difference | B share difference |
|---|---:|---:|---|---:|---:|
| B gap `0400h`, refined | 1,000 | +0.010667 | [-0.007529, +0.028862] | -0.018500 | +0.029167 |
| B gap `0400h`, initial screen | 200 | +0.021667 | [-0.024275, +0.067608] | -0.011667 | +0.033333 |
| B gap `0100h` | 200 | +0.012500 | [-0.045878, +0.070878] | +0.020833 | -0.008333 |
| Both gaps zero | 200 | +0.019167 | [-0.061195, +0.099529] | +0.020833 | -0.001667 |
| Direct initial A bootstrap, wave 2 | 200 | +0.010000 | [-0.036913, +0.056913] | +0.013333 | -0.003333 |

B gap `0400h` has the most persuasive current direction: cohort wins/ties/losses are 12/5/8 in refinement, and deleting any single refined cohort leaves a positive mean between +0.007986 and +0.014931. Its interval still crosses zero. The extra B share partly replaces A share, so per-survivor score is not itself a direct measurement of survival probability or an independent second improvement.

The zero-gap screen is particularly selection-sensitive: removing its largest favorable cohort reverses its mean to -0.001736. That favorable cohort is BRA/callfart/YANDE, +0.520833 over eight battles. It should not outrank B gap `0400h` merely because +0.019167 is greater than +0.010667 across different contexts.

Direct B bootstrap loses -0.030000 on wave 2 and direct-both loses -0.015833; both intervals cross zero. Direct-both and nearboot have identical team totals in every wave-2 cohort while their survivor allocation differs. The assembly and isolated CPU speedup therefore establish correct execution and earlier boot, not a demonstrated team improvement.

Odd scanner stride ties all 25 screened team and survivor aggregates. This does not establish scanner equivalence for other placements or captured-Zombie states. Copy-eight has +0.002500 with wide uncertainty; copy-seven and broader destination-stride alternatives give no reason for priority over the startup candidates.

## Context regressions and interpretation

B gap `0400h` loses -0.091667 in the refined cohort containing callfart/TRY/SKYENT; its next two worst cohorts lose -0.050000 each, containing YOY/Pixar_Lamps/AnotherBitInTheWall and EmoMutants/Hexellent/B33. Its three best cohorts each gain +0.075000 and contain LowKey_WBB/Code_Jokers4Life/anonymous, PowerRangers/TitanicSwimTeam/L, and TOMEX/YANDE/ATW_Solo.

Direct A bootstrap loses -0.250000 in the wave-2 fisherEXE/Ctrl_Alt_Elite/TheBytes cohort and -0.187500 in callfart/stuxnet/Underflow. Direct B also loses heavily in the latter cohort, -0.395833. Smaller gaps lose -0.250000 against TrojanByte/NRI/3Plate_Benchers in their own screen. These are four-team interaction results. Each listed opponent appears only once in that partition, so `--by-opponent` repeats the same cohort result under three names and cannot identify the responsible rival. Stress tests should use these as suggested contexts, without labeling any one team a proven counter.

## Next gate

1. Finish the already-planned common-context refinement of direct A, B gap `0100h`, zero gaps, B gap `0400h`, and any combination submitted before that comparison. Compare paired differences on that one plan; do not compare their separate raw screen scores.
2. Select one exact pair and record hashes before generating fresh holdout seeds. The present strongest fallback is A hash `3fa67bed880413901ad618b4f7b248e5782d98de93318271ac540ad1690ca2b7`, B hash `791d510eeb87cfd7cd44b466bd1cd171f2e7d050c44ed0f394dbbf46a9592316`, sizes 221/202 bytes.
3. Run the protocol's two separate untouched 3,000-battle paired confirmations against original V6, preserving cohort-seed units and reporting both individual holdouts. Require both positive and the pooled paired interval above zero before broadcasting a baseline. Keep selection/refinement data out of the confirmatory estimate.
4. Use exact Student quantiles for the confirmation unit count. `compare.mjs` uses a sparse lookup that rounds degrees of freedom upward, making intervals mildly too narrow between lookup entries; for 75 and 150 units the appropriate approximate critical values are 1.99254 and 1.97591. The existing 25-unit results use the right lookup entry.
5. Check the chosen decisive result against cold CLI output and inspect modern-rival/no-Zombie stress as the protocol specifies. Keep historical-pool improvement distinct from claims about an unknown final field. If a holdout fails and another pair is selected, use a new untouched holdout; a failed holdout is training evidence thereafter.

Candidate selection across the many correlated screens creates a winner's curse. Fresh confirmation addresses this when the winner is frozen before seeing it. Repeatedly choosing another candidate until an ordinary 95% test passes still introduces multiplicity; acknowledge that process and use a prespecified error budget or stricter evidence threshold. No reviewed pair is currently confirmed, and the original friend-provided V6 remains the shared baseline.
