# Smart-counter research checkpoint — 2026-09-30

All experiments below use the local deterministic official v6 judge and the
unmodified m049/m050 binaries noted in the JSON run manifests. The working
`final/` tree was not changed by this study.

## Friend's Good_Test signature hardening

- Source: `candidates/generated/good-test-signature-hardening/Good_Test1.asm`
  and `Good_Test2.asm`; binaries in `build/good-test-signature-hardening/`.
- The only code transformation reorders `push cs; pop ss; mov bx,imm16` to
  `mov bx,imm16; push cs; pop ss` at one initializer in each warrior. Binary
  sizes remain 213/173 bytes. Assembling the published `db` sources reproduced
  the tested hashes `18fc008a...` and `fc4c368f...` exactly.
- In 1,600 targeted battles against a controlled New_Best-derived exact
  signature counter, mean score rose from 0.340469 to 0.708542 per battle.
  All 32 paired runs improved; mean paired delta +0.368073, approximate 95% CI
  [+0.332927, +0.403219]. This is not an all-field improvement claim.
- A smaller regular-field screen gave the exact same aggregate score (0.566042)
  before and after hardening. The original Downloads binaries were untouched.

## Smart opponent baseline

- User-pasted source: `candidates/generated/smart-counter-2026-09-30/SmartA.asm`
  and `SmartB.asm`, compiled to 191/119 bytes. The changed worker instruction
  `xor bp,dx` alternates replication steps; the code does not contain an
  opponent-reading adaptive branch.
- Fresh 2,500-battle 2025 field: Smart 0.588933 vs m050 0.686200, paired
  delta -0.097267, CI [-0.151586, -0.042947].
- Direct two-team duel vs m049 and m050 combined, 1,000 battles: Smart 0.617167.
  This two-team benchmark is diagnostic; the 2025 final uses four teams.
- Four-team suite with m049, m050 and seven third-party choices, 700 battles:
  Smart 0.178041, m049 0.275548, m050 0.329813. New_Best alone as the fourth
  team yielded Smart about 0.16 across two 50-battle seeds.

## Mechanism ablations and candidates

| Variant | Two-team duel score | 2025 field score | Other four-team score |
|---|---:|---:|---:|
| Smart original | 0.617167 / 1000 | 0.588933 / 2500 | 0.178041 / 700 |
| `mov bp,bp` in both workers, same byte length and opcode count | 0.470833 / 1000 | 0.664267 / 2500 | 0.238772 / 700 |
| 9-word copy with original XOR workers | not tested | not tested | 0.053150 / 700 (invalid/truncated worker) |
| Fixed step only in A | 0.564667 / 500 | 0.572333 / 500 screen | not tested |
| Fixed step only in B | 0.453333 / 500 | 0.599333 / 500 screen | not tested |
| `add bp,dx` in A, original XOR in B | 0.685833 / 400 tune | 0.603333 / 500 screen | fresh holdout pending |
| `sub bp,dx` in A, original XOR in B | 0.699167 / 400 tune | 0.567333 / 500 screen | rejected for no field gain |
| m050 A + Smart B | 0.488000 / 500 vs Smart | not yet tested | not tested |
| m050 A + B using INT87 to overwrite `xor bp,dx; sub [bx],bp` | 0.457333 / 500 vs Smart | 0.473000 / 500 screen | rejected |

The tune-set two-team Smart control with 100 battles x two seeds x two
opponents scored 0.598750. Screen-field controls with ten cohorts x two seeds
x 25 battles scored Smart 0.570000 and m050 0.660667. Different test sizes or
cohorts in the table must not be treated as paired comparisons.

Fresh holdouts underway: `config-smart-holdout-field-{smart,add-a,m050}.json`
and `config-smart-holdout-duel-add-a.json`. Promotion to `final/` is prohibited
until a candidate beats m050 on independent four-team field evidence while
retaining its counter advantage, with no material new weakness.

### First independent holdout result

On 25 regrouped 2025 cohorts x two new seeds x 50 battles (2,500 battles),
`add bp,dx` in Smart A with Smart B unchanged scored 0.613333 versus 0.569733
for the original Smart code. The 50 paired cohort-seed differences average
+0.043600 with approximate 95% CI [+0.021857, +0.065343], 34 positive, 12
negative, four tied. This independently verifies a general-field improvement
to the Smart code. The opponent teams are mostly the same 2025 population,
but cohort groupings and random seeds are new. The holdout m050 baseline and
fresh duel tests are still in progress.

The matching m050 holdout finished at 0.658000 per battle, so the Smart-to-m050
deficit fell from 0.088267 to 0.044667 (approximately 49% of the gap closed).
Add-A still trails m050 in this field sample: paired delta -0.044667, CI
[-0.085841, -0.003493]. It is a research candidate, not the general champion.
The captured-Zombie INT87 retargeting of m050 A to the alternate-step signature
scored 0.428000 in a 500-battle direct-duel screen; fair control and field
screen are pending, so no defensive improvement is established.

### Additional independent confirmation for Add-A

Across four fresh direct-duel seeds against m049 and m050 (2,000 battles),
Add-A scored 0.697333 versus 0.579917 for the original Smart team. All eight
paired opponent-seed blocks improved; mean paired delta +0.117417, approximate
CI [+0.107848, +0.126985]. A separate four-team 700-battle suite with m049,
m050 and seven different fourth teams scored Add-A 0.245112 versus original
Smart 0.178041: paired delta +0.067071, CI [+0.035690, +0.098453], 13/14
blocks positive. Together with the fresh 2025 field result above, this is a
Pareto improvement over the user-pasted Smart team across all three tested
evaluation styles. It is not a general-field improvement over m050.

### Defense search checkpoint

Retargeting m050's captured-Zombie INT87 to the Smart worker signature improved
the 500-battle duel screen from 0.317000 to 0.428000 but reduced the matching
500-battle 2025 field screen from 0.660667 to 0.610667. Retargeting main A or
main B's first INT87 likewise caused large field regressions; none was promoted.
Mixing m050 A with Smart B reached 0.488000 in duel but only 0.580667 in field.
One-byte phase shifts of m050 A or B did not materially improve the duel.

The first unmodified-int87 structural screen candidate is m050 with only A's
`mov bp,03C00h` changed to `mov bp,03400h`: 0.456000 in a 250-battle duel
screen versus Smart, and 0.675667 in a 500-battle 2025 field screen. A second
candidate with `mov bp,03800h` scored 0.462667 duel / 0.662333 field. The
matching m050 control was 0.317000 duel / 0.660667 field, although the
duel screen used twice as many control battles as candidate battles. Fresh,
same-size, paired field and duel holdouts are underway for control and both
candidates. Neither is yet verified as a new champion.

### A-step defense holdout — rejected

The 2,500-battle independent field holdout overturned the small-screen
result. On 50 paired cohort/seed blocks, m050 scored 0.674600, A-BP=3400
scored 0.626000 (delta -0.048600, approximate 95% CI
[-0.074410, -0.022790], 14/34/2 wins/losses/ties), and A-BP=3800 scored
0.646067 (delta -0.028533, CI [-0.056707, -0.000360], 16/30/4). Both
candidate changes are rejected; the targeted duel holdout was stopped because
the general-field regression is already decisive. The small-screen apparent
gain was sampling/selection noise, not a verified general improvement.

### Second independent Smart-step holdout

A new 2,500-battle 2025 field run used fresh seeds on the same 25 regrouped
cohorts. Original Smart scored 0.569200, Add-A 0.587600, Add-Both 0.583400,
and m050 0.667200. Add-A beat original Smart by +0.018400 on 50 paired
blocks, but this run alone was not statistically decisive (approximate CI
[-0.008450, +0.045250]). Across the first and second independent field
holdouts together, Add-A's average gain over original Smart is +0.031000
per battle, closing about one-third of Smart's original m050 gap, not the
~49% suggested by the first holdout alone. Add-Both did not beat Add-A in
the fresh field (difference -0.004200, CI [-0.027653, +0.019253]).

In a fresh 2,000-battle paired duel versus m049/m050, Add-Both scored
0.692666 versus Add-A 0.675000: +0.017667 across eight opponent/seed
blocks, approximate CI [+0.003891, +0.031442]. Thus Add-Both is a
targeted-duel improvement but **not** a verified general-field improvement.

The Add-A + Smart-B phase=0x30 variant was checked on the same second fresh
field and duel holdouts. Its field score was 0.594067 versus Add-A 0.587600
(paired delta +0.006467, CI [-0.009788, +0.022721]); this is the second
positive field sample but neither sample independently establishes a gain.
In the new 2,000-battle direct duel it scored 0.720750 versus Add-A 0.675000,
paired delta +0.045750, CI [+0.023470, +0.068030], 8/8 blocks positive.
Across the two independent field samples combined, it improves original
Smart by roughly +0.0401 score/battle, closing about 43% of the original
Smart-to-m050 deficit. It still trails m050 in the 2025 field and is not
promoted to `final/`.

### Carry/rotation step screen — rejected

Seven same-size operator substitutions in the Smart worker were assembled
and tested on a 500-battle 2025 field screen. With Add-A as the starting
point where applicable, A=ADC/B=XOR scored 0.388333, A=SBB/B=XOR 0.434333,
A=ADD/B=ADC 0.504500, A=ADD/B=SBB 0.521000, A=ROR/B=XOR 0.337333,
A=ADD/B=ROR 0.491667, and A=ADC/B=ADC 0.252000. The matching Add-A screen
scored 0.603333. None merited a larger duel or holdout. Using CPU carry as
a cost-free 'adaptive' input was mechanically legal but harmful in this
architecture.

### Reverse hybrid — rejected

Pairing Smart Add-A Warrior A with unmodified m050 Warrior B (the inverse
of the prior m050-A/Smart-B test) scored 0.429667 in a 500-battle direct
duel against original Smart, versus 0.317000 for m050 control, but only
0.610667 in the matching 500-battle 2025 field screen versus m050's
0.660667. The hybrid again trades general-field strength for counter
resistance and is not a promotion candidate.

### New Claude fixed-bit-toggle code received from user

The user supplied a revised Smart pair whose only source differences from
the earlier Smart code are `mov cx,11`/`mov cl,11` instead of 10, and
`xor bp,02000h` instead of `xor bp,dx` in each worker. The source diff was
checked against the original pair. Both files assembled within the 256-byte
limit, to 193/121 bytes, and are saved under
`candidates/generated/claude-fixed-toggle-2026-09-30/`.

On a new, paired 2,500-battle 2025 field with 50 cohort/seed blocks,
Claude's pair scored 0.646300 versus original Smart 0.570667, our
Add-A+phase30 0.612867, and m050 0.673200. Paired differences were
+0.075633 versus Smart (approximate 95% CI [+0.048291,+0.102976]),
+0.033433 versus Add-A+phase30 (CI [+0.006149,+0.060717]), and -0.026900
versus m050 (CI [-0.059415,+0.005615]). This independently supports a
small measured m050 gap close to Claude's reported ~2.4 percentage points,
but does not prove equivalence or superiority. A second fresh field set and
direct duels are reported below. `final/` remains unchanged by this study.

A second independent 2,500-battle field recheck changed the size of the
estimated m050 gap: Claude scored 0.626400 versus m050 0.671667, paired
delta -0.045267, CI [-0.072949,-0.017585]. Across both field sets
(5,000 battles each), the raw mean scores are 0.636350 for Claude and
0.672433 for m050: a roughly 0.036083 gap. Thus the first ~0.027 gap was
not stable enough to describe the general deficit as definitively 2.4%.
The new code still substantially improves original Smart. In a fresh
2,000-battle direct duel against m049 and m050, Claude scored 0.585667;
this is a diagnostic two-team setting, not the 2025 four-team final.

A nine-mask same-size sweep of the worker's `xor bp,imm16` tested masks
`0800`, `1000`, `1800`, `2000`, `2800`, `3000`, `5000`, `6000`, and `7000`
on a 500-battle screen. `0800` looked best at 0.640333 versus Claude's
`2000` at 0.602333, but an independent 2,500-battle field reversed the
ranking: `0800` scored 0.622800 versus `2000` 0.634533, paired -0.011733,
CI [-0.037726,+0.014259]. The apparent screen winner was overfitting and
was rejected; no mask sweep candidate was promoted.

### One-opcode m050 B-pointer defense

Replacing only m050 B's `sub [bx],bp` with `xor [bx],bp` preserves source
length and startup INT87 timing. The 117-byte B binaries differ in exactly
one byte, at offset `0x69`: `0x29` to `0x31`. Against original Smart and
Add-A on a fresh
2,000-battle paired direct duel, m050 scored 0.304083 and the variant
0.482000: +0.177917, approximate CI [+0.153720,+0.202113], all eight
opponent/seed blocks positive. Against the new Claude fixed-toggle pair on
another fresh 1,000-battle direct duel, m050 scored 0.405334 and the variant
0.552167: +0.146833, CI [+0.135613,+0.158053], all four seeds positive.
This is broad direct counter resistance, not a single exact-signature hack.

However, on a fresh 2,500-battle 2025 four-team field without the Smart
family, the variant scored 0.659067 versus m050 0.669333: -0.010267,
CI [-0.037710,+0.017177]. This is not a verified general-field gain.
A four-team mixed field inserting the new Claude pair as one of the three
opponents scored 0.442300 for the variant versus 0.351960 for m050 across
2,500 fresh battles: paired +0.090340, CI [+0.073767,+0.106913], with 47
positive and three negative cohort/seed blocks. A second mixed-field set
with new seeds and a different 2025-team replacement pattern reproduced
the advantage: m050 0.367220 versus XOR-B 0.431320 over 2,500 battles,
paired +0.064100, CI [+0.046246,+0.081954], 43/50 blocks positive.
Across both mixed sets the mean gain is +0.077220 score/battle. A separate
1,250-battle name-control reran XOR-B with m050's candidate name; 24/25
paired blocks had exactly the same score and the remaining block differed
by only about 4e-8, ruling out meaningful name/order bias.

The variant is a strong counter-present defender;
its score without that counter did not establish a general-field gain, so
no `final/` promotion is justified yet.

A same-size B-BP sweep (`3400`, `3800`, `3c00`, `4000`, `4400`, `4800`,
`4c00`, `5000`, `5400`) was screened over 500 2025-field battles each.
The original XOR-B value `4400` remained best at 0.655000; every other
value scored between 0.575000 and 0.626333. No BP variant merited a larger
holdout.

Against the original `New_Best1/2` files from Downloads (not guessed
reconstructions) plus two 2025 opponents in each of eight four-team cohorts,
four new seeds x 50 battles gave 1,600 battles. m050 scored 0.428594,
XOR-B 0.481781: paired +0.053188 over 32 cohort/seed blocks, approximate
CI [+0.028690,+0.077685], 26 positive and six negative. Thus the one-byte
defense did not reopen the previously known New_Best weakness; it improved
this particular four-team test as well.

A second independent counter-free 2,500-battle 2025 field scored m050
0.651000 versus XOR-B 0.640467: paired -0.010533,
CI [-0.042154,+0.021087]. The two counter-free field sets thus agree
numerically on a ~0.0104 score/battle cost, but neither individually nor
pooled at this precision establishes a definite loss. The two Claude-mixed
sets average +0.07722. As a simple extrapolation, if roughly 12% or more
of otherwise comparable four-team matchups contain a Claude-like counter,
the observed weighted mean would favor XOR-B; this threshold depends on
the unknown opponent distribution and is not a universal guarantee.

A same-size `sbb [bx],bp` replacement in m050 B was screened as an
alternative carry-sensitive pointer update. It almost killed B outright:
B averaged 0.004500 over 500 2025-field battles, so that family was
rejected before larger tests. The one-byte carry perturbation apparently
breaks the pointer/copy alignment invariant.

### XOR-B decision validation with regrouped and historical opponents

The m050-vs-XOR-B comparison was rerun without changing either candidate:
identical candidate names and deterministic v6 JAR, fresh seeds, and 75
official 2025 teams reshuffled into 25 new three-opponent cohorts. In the
counter-free 2025 field (2,500 paired battles per candidate), m050 scored
0.662600 and XOR-B 0.650800, delta -0.011800. Treating the 25 cohorts as
the independent units gives an approximate 95% CI [-0.046120,+0.022520]
and 9/16/0 positive/negative/tied cohort differences. This is consistent
with the two earlier counter-free losses of about 0.0104, but does not
statistically establish the exact size of that cost.

When Claude's revised fixed-toggle team replaced one of the three
opponents in each regrouped cohort, using the same fresh battle seeds,
m050 scored 0.342367 and XOR-B 0.447727 over another 2,500 paired
battles. Delta +0.105360, cohort-cluster approximate 95% CI
[+0.084964,+0.125756], 24/1/0 cohort signs. The advantage is driven by
Warrior B (+0.131380), while Warrior A loses 0.026020.

For a genuinely different opponent set, 28 complete teams from the 2024
`03-live` archive were selected before running this transfer test. All
warrior binaries were <=256 bytes and none exactly matched a 2025-field
warrior hash. Across 14 cohorts and two new seeds (1,400 paired battles
per candidate), m050 scored 0.716429 versus XOR-B 0.672857, delta
-0.043571, cohort-cluster approximate 95% CI [-0.091369,+0.004227],
3/11/0 cohort signs. This is a warning about transfer, not a definitive
2026 forecast: 2024 teams were built for a different competition year and
their strength under the v6 rules has not been independently calibrated.

The only local official 2025 teams are the 75 already used in the earlier
holdouts. Reshuffling them with new seeds probes robustness to matchups
and randomness, **not** unseen-opponent generalization. The three new
comparisons confirm a strong conditional counter benefit and recurring
non-counter cost, not a universal m050 improvement. No `final/` promotion.
Reproduction: `generate-m050-xorb-decision-validation.mjs`,
`generate-m050-xorb-2024-transfer.mjs`, and
`analyze-m050-xorb-decision.mjs`; paired manifests and raw run records are
under `experiments/smart-counter-2026-09-30/xorb-decision/` and
`build/official-runs/smart-counter-2026-09-30/xorb-decision/`.
