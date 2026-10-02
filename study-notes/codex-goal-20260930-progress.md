# Goal research checkpoint — 2026-09-30

Goal: find a warrior pair that beats both fixed m049 and m050 in broad four-team competition, not just a targeted duel. All work is outside `final/`. The available 2025 field is 75 published online-stage survivor pairs plus the online-stage Zombies; the historical final's new Zombies and complete field are not in this repository.

Immutable controls used here:

- m049 A `106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973`; B `7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77`.
- m050 A `0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44`; B `06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782`.

## Completed experiments

| Family | Tune result | Fresh field result | Decision |
| --- | --- | --- | --- |
| Swap m050 pair to B+A | 0.707667 vs A+B 0.647667 (500 each) | 0.629333 vs A+B 0.657800 (2,500 each; new seeds and regrouped 75 teams), delta -0.028467, descriptive 25-cohort CI [-0.054871,-0.002062] | Rejected: tune overfit |
| Use A+A | 0.631333 vs A+B 0.647667 (500 each) | Not run | Rejected at screen |
| Use B+B | 0.511333 vs A+B 0.647667 (500 each) | Not run | Rejected at screen |
| Captured-Zombie two-INT86 bomb | 0.685333 vs m050 0.683000 (500 each) | 0.688133 vs m050 0.681733 (2,500 each), but candidate names differed and the old paired CI is invalid | Unproven; no promotion |
| Captured-Zombie antipodal INT86 bomb | Selected 500-battle screen 0.719667 vs m050 0.685667, with unequal candidate names | Corrected same-name, fresh 2,500-battle holdout: 0.652133 vs m050 0.658533, delta -0.006400, 25-cohort CI [-0.013590,+0.000790] | Rejected; no proven gain |
| m050 B `XOR SP,DX` | 0.687000 vs m050 0.647667 (500 each) | Completed same-name fresh 2,500-battle holdout: 0.651467 vs m050 0.657800, delta -0.006333, 25-cohort CI [-0.038145,+0.025478] | Rejected; tune gain did not reproduce |
| m050 phase placement `ADD AH,imm8` → `XOR AH,imm8` | Same-name paired 500-battle screens: A main 0.638667, A captured 0.615333, B main 0.647667; m050 control 0.647667 | Not run | No isolated gain; B is an exact aggregate tie |
| Shorten A worker-copy `MOV CL,9` → `MOV CL,8` | Same-name paired 500-battle field screen: 0.666000 vs m050 0.683000; 25-cohort descriptive CI on delta [-0.041314,+0.007314] | Not run | Rejected at screen; 20-battle smoke overfit |
| Shorten B startup+worker copy counts 9→8 | Same-name paired 500-battle field screen: 0.685333 vs m050 0.683000; delta +0.002333, 25-cohort CI [-0.018768,+0.023435] | Fresh, regrouped, same-name 2,500-battle/arm holdout: 0.671133 vs m050 0.671333; delta -0.000200, descriptive 25-cohort CI [-0.017628,+0.017228] | Rejected: apparent screen gain did not reproduce |
| Captured-Zombie `survey8` arena scan before second INT86 | Same-name paired 500-battle field screen: 0.644000 vs m050 0.672333; delta -0.028333, 25-cohort CI [-0.050561,-0.006106] | Not run | Rejected at screen |
| Captured-Zombie `post_anchor_mem` delayed INT86 | Corrected same-name paired 500-battle field screen: 0.653667 vs m050 0.660333; delta -0.006667, 25-cohort CI [-0.028332,+0.014999] | Not run | No improvement signal; original unequal-name configs invalid for paired comparison |
| New relocated hunter/INT86 pair | 20-battle smoke: 0.050000; one-battle trace found self-write/collision failures even after guard revision | Not run | Rejected before broad field screen |
| `LES DI,[BX]` bootstrap compression | Strict code review found no implementation defect. Same-name 500-battle field screen: A-only 0.652333, B-only 0.649333, both 0.657667 vs m050 0.657000; A+B delta +0.000667, 25-cohort CI [-0.016588,+0.017922] | Not run | No meaningful improvement signal; do not promote |
| B private-stack gap `0280h`→`0284h` | Strict code review found no defect; matched 20-battle structural smoke tied m050 exactly at 0.675000 | Same-name paired 500-battle field screen: 0.650000 vs m050 0.657000, delta -0.007000, 25-cohort CI [-0.017541,+0.003541] | Rejected; no broad-field improvement signal |
| Private-template near-hopper pair, no `FF 1F` anchor | 20-battle matched smoke: 0.050000 vs m050 0.450000; A scored zero. One-battle trace found moving-body/tail corruption, while inert opponents left both alive past 22,000 rounds. RET-pad backup delayed B death but did not save the team | Not run | Rejected before broad field screen; no intrinsic startup bug, but poor competitive resilience |
| Direct-copy Phoenix without a separate `FF 1F` anchor | v1 20-battle smoke: 0.050000, A zero; reviewer found legal-load self-overlap of initial `REP MOVSW`; one-battle trace also found later foreign corruption of moving worker. v2 moves main phases to A `40h` and B `64h` (all-load self-overlap guard) but same-seed 20-battle smoke scored only 0.075000 | Not run | Both versions rejected before broad field screen; v2 fixes correctness, not competitive resilience |
| m050 B `ADD [BX],BP` | Historical paired 500 field: 0.593333 vs m050 0.660667 | Not rerun | Existing negative result, no duplicate |

Review-agent skill audits found no actionable code defects in the m049→m050 diff or pair/XOR-SP candidate changes. Two protocol defects were found and corrected: two seeds of the same 2025 opponent trio are now clustered before calculating the 25-cohort interval; architecture candidate/control names are now matched because the engine sorts filenames before randomized loading. Older architecture paired intervals are not valid evidence.

## Currently running / queued

- The interrupted `XOR AH,imm8` screens were completed with the validated missing-block-only resume helper. All three are now classified above. Results are under `experiments/codex-goal-20260930/resume/`; no further phase variant is prioritized without a new interaction hypothesis.
- `survey8` is a 240-byte A captured-Zombie code path that scans eight sampled arena bytes before its second INT86 bomb. Its paired screen is complete and negative as listed above; no holdout is warranted. See `candidates/generated/codex-goal-20260930/architecture/README.md`.
- Exact 18-byte worker-copy variants of m050 A or B were screened. The initially positive B field screen was checked on two fresh seeds with regrouped opponents and one engine thread per arm. It tied the control within noise and was rejected. Shortening the copy changes both timing and STOSW anchor geometry. See `candidates/generated/codex-goal-20260930/independent-a-worker-cl8/` and `independent-b-exact-worker-copy/`. For the B holdout, only `holdout-control-v3.json` and `holdout-variant-v3.json` are valid; earlier nested-path draft configs were not run.
- `post_anchor_mem` was screened only after the named review agent identified unequal candidate names in the older prepared configs. The corrected `COD_pair` pair and results are listed above. Its `PUSH CS; POP ES` makes an early arena write at an address later written by `CALL FAR`; that timing caveat remains, and the overall screen is negative.

No new champion has been established yet. Do not promote to `final/` on a tune result, a single seed, or an interval that includes zero.
