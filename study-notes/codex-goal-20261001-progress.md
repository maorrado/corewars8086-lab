# Continued survivor research, 2026-10-01

Objective remains a reproducible general-field improvement over BOTH exact
m049 and m050. No new champion established here yet. Original files/dirty
worktree are preserved; this session does not commit, push, or alter final/.

## Completed original-engine confirmation

c090, m049 and m050 each completed 5,000 battles on two fresh regrouped senior
panels and four disjoint engine-seed ranges. The existing jobs were not stopped
for acceleration. Audited totals: c090 0.651500004, m049 0.639266675,
m050 0.652100004. c090 minus m050 -0.000600000; approximate 50-cohort 95%
interval [-0.005454773, +0.004254773]. The prespecified gate fails.

## Infrastructure completed, original research resumed

Isolated persistent JVM + War group/speed changes + current-byte INT87 scan:
2.063x measured throughput on the balanced quiet-host fixture (43.608804 to
21.139418 seconds for 600 battle executions per implementation). Exact
score/telemetry integration, semantic edge tests and a full original 2,500-battle
panel replay passed. Original engine JAR/runner/settings and battle counts are
unchanged. See `tools/engine-acceleration-20261001/README.md`.

## Newly completed screens

Frozen bootstrap protocol: same 25 senior triples, one previously unused seed,
500 battles per arm, matching COD_pair names, exact input/runtime snapshots.

| Arm | Team points/battle | Delta vs m050 | Status |
| --- | ---: | ---: | --- |
| m050 control | 0.647000000 | — | Control |
| c090 control | 0.641333330 | -0.005666670 | Control |
| Entry-address LEA in A | 0.667666662 | +0.020666662 | Advance to fresh holdout |
| Remove B jump/unused padding | 0.637666664 | -0.009333336 | Reject |
| Both changes | 0.680333330 | +0.033333330 | Advance to fresh holdout |

The last row's +5.15% relative score is a **selected screen result**, not a
confirmed improvement. The original screen gate advances positive mean against
both c090 and m050; independent testing against m049 and m050 follows, with new
roster/seeds and multiplicity-aware confidence intervals. Do not pool the screen
into that holdout or rename either candidate a champion beforehand.

Conditional-camper B: 200 battles/arm, four predefined senior triples and two
new seeds. Candidate 0.330000000 vs m050 0.491666670, both seed deltas negative.
Rejected, no wider claim beyond the screen. No reason to spend a broad holdout
on this version.

Distinct one-byte STOSB imp B: 500 battles/arm, 25 panel-2 senior triples and one
fresh seed. Candidate 0.400666668 vs m050 0.644666666, paired delta -0.243999998,
22/25 cohorts negative. Rejected. Results in the candidate's RESULTS.md and
`experiments/codex-goal-20261001/accelerated-stosb-imp/`.

## Completed fresh bootstrap holdout

Fresh matched holdout for `entry_lea` and `both` against exact m049/m050 is now
complete and audited through the validated fast lane. Protocol and full frozen
inputs: `candidates/generated/codex-goal-20261001/bootstrap-holdout/frozen/`.
Manifest SHA-256:
`199c261970f36c1850100875fb20cac14935cd81a749fa55e081463bdecc253a`.
One new grouping of all 62 senior teams, 25 triples, two unused seed ranges,
2,500 battles per arm: 10,000 executions total. A conservative 99% interval
gate for four comparisons is fixed in advance; no old screen-result pooling.
Outputs: `experiments/codex-goal-20261001/accelerated-bootstrap-holdout/`.
All 200 blocks / 10,000 executions passed the integrity audit. Team points per
battle: entry_lea 0.697466670, both 0.698000000, m049 0.691333339,
m050 0.703400004. Against m050, entry_lea delta -0.005933334 (99% cohort
interval [-0.022226783, +0.010360114]); both delta -0.005400004 (interval
[-0.022660984, +0.011860976]). Both seed deltas are negative for both candidates
against m050. Neither candidate passes the predeclared gate; the selected
screen leads are rejected, not promoted. Both candidates' small positive means
against m049 also have intervals spanning zero. Full result/audit:
`experiments/codex-goal-20261001/accelerated-bootstrap-holdout/analysis.json`.

## B shift-quantizer follow-on: completed, negative

Authored and reviewed a separate layout-preserving B quantizer fusion on exact
m050: MOV CX,3C08h / SHR AX,CL in place of MOV AL,AH / XOR AH,AH / MOV CH,3Ch,
plus one skipped CC byte to retain downstream offsets. Hypothesis: save one
startup opcode without changing spatial quantization or the 17-byte worker.
The unchanged original Cpu passed 65,536 inputs; original Warrior passed 79
legal-offset inert traces with identical post-bootstrap state and one opcode
saved. The 1,000-execution paired field screen nevertheless failed:
variant 0.661999998, m050 0.663333332, delta -0.001333334. Descriptive 95%
cohort interval [-0.014268196,+0.011601528]. Rejected, no holdout.
Source/binary/protocol/test evidence and results are under
`candidates/generated/codex-goal-20261001/shift-quantizer/RESULTS.md`.

## Current continuation checkpoint

All new work here is complete and recorded; no owned Java battle process is
left running. After acceleration, 14,900 new research battle executions were
completed (bootstrap screens 2,500, camper 400, imp 1,000, bootstrap holdout
10,000, shift-quantizer 1,000), separately from infrastructure validation and
the previously running c090 confirmation. No new general champion emerged.

Next: use mechanistic death/anchor telemetry to motivate a different recurring
survival or offense mechanism, rather than extend failed screen leads or keep
optimizing startup timing without evidence. Preserve all negative outcomes;
new candidates still need fresh matched m049/m050 controls and general-field
holdout. Original goal remains active; acceleration success is not completion.

## Word-trigger continuation (supersedes the checkpoint above)

Designed a different recurring mechanism: change anchor low A2 to A3 and use
MOVSW as the wake-up trigger, fusing the old MOVSB/MOVSW/private-template prefix.
A coordinated 16-byte private worker saves three steady opcode invocations;
the attack-trail extent remains 1024 bytes. A skipped CC padding byte prevents
a newly introduced B bootstrap overlap at load 3400h. Sources remain 189/117
bytes, separately stored under `word-trigger/`; final/ is untouched.

Original-engine fixture: 119 offsets, 357 paired paths, 349 healthy five-
generation comparisons, eight reproduced baseline-unhealthy paths, zero new
failures on those cases. This is not an all-offset or hostile-game guarantee.

The full four-arm field screen completed and was audited: 2,000 additional
battle executions (500 each), all 75 published online-stage teams, fresh
grouping/seed. Exact m050 scored .645666670, WordA-only .483999999,
WordB-only .556333332, both .645666667. Both is effectively tied; mixed pairs
are worse. None advances under the predeclared screen gate. See
`candidates/generated/codex-goal-20261001/word-trigger/RESULTS.md` and
`experiments/codex-goal-20261001/accelerated-word-trigger/analysis.json`.

Total new post-acceleration research executions now 16,900, excluding validation
and pre-existing confirmation jobs. No owned screen process remains running.
A separate original-engine death observer is being prepared under the same
candidate's `diagnostic/`; it must reproduce the archived 50-battle scores and
telemetry exactly before interpretation. This replay is diagnostics, not a new
holdout. Another checkout's Java process was observed and left untouched.

Next: finish the observer's provenance/replay checks, use actual register and
instruction state to diagnose the recurring memory deaths, then design a
different broadly useful change. Do not promote an inert speedup or treat a
selected/targeted match as proof of general superiority. The goal remains active.

The diagnostic replay is now complete: 50/50 original wars and exact raw score
and telemetry equality, execution SHA `9739aacfdfcdebf5ed0c8271e5de9a1d8cb02f120fd9be3d843ec846a228a38c`.
30 of 31 observed memory deaths in this selected cohort have an intact private
worker but a damaged arena anchor `FF A5 disp16` that decodes as a near indirect
jump through an out-of-bounds private-stack address. This is not a REP overrun;
the corrupting writer has not been traced. See `word-trigger/diagnostic/FINDINGS.md`.
Next-source authoring explores shorter steady dwell while retaining the original
worker, explicitly treating attack coverage as a tradeoff. No new screen for
that next family has been frozen or launched yet.

Latest continuation state: root has no owned Java process running. The design
agent `/root/verify_requested_comparison` is authoring only the bounded
`shorter-dwell/` proposal and checking prior duplicates. It is not authorized
to assemble, draw seeds, freeze a screen or launch battles at this stage; root
must inspect its delivered source first. Root rechecked the original JAR,
runner and both final source hashes: all match this turn's starting identities.
The word-trigger screen and 50-war replay are complete, not pending work.

## Shorter-dwell screen: completed and rejected

Four one-byte-DX variants shortened the steady far-call burst to 512/256 bytes,
in B only or both. Original-JAR fixture passed 714 paired paths (119 offsets,
698 healthy, 16 reproduced baseline-unhealthy, zero new failures), evidence
SHA `22f8d7341e57c38ea1ba282506a806635ec531f804fa322ce7a0ac3f9cf8a04b`.
All five field arms completed serially in session 70135 (now exited 0). The
frozen new 75-team shuffle/seed manifest is
`4a6ed9ce480098cf78e812d6e42659a232e86472fc03379e99eba08e0bf3eabd`.
All 2,500 executions passed integrity audit, analysis SHA
`12fb5f7f656a1ef266fb979a729cc42309bb22c4647204fbaa39ee1a6143cc99`.
Scores: m050 .695333334; both512 .439999999; B512 .567; both256 .326000002;
B256 .565666666. All deltas and descriptive cohort intervals are negative.
No selected arm, no holdout, no final promotion. More details in
`shorter-dwell/RESULTS.md`. Post-acceleration research total is now 19,400
executions, excluding the 50-war diagnostic and infrastructure validation.

Next design: `coverage-dwell/` combines 256-byte trails with odd-page BP
strides, increasing the orbit from 64 to 256 anchors. Pure byte-set enumeration
shows complete spatial coverage instead of the fixed-BP short-trail holes,
but fourfold worker-transition overhead remains a cost. The agent's generator
and README are authored only and await root source review; no assembly or
battle result exists yet. No owned Java process remains running. The original
broad-strength goal remains active and unachieved.

## Coverage-dwell: original-engine orbit validation passed

Root reviewed the generator, generated four component sources and assembled
both pairs. All predicted hashes matched exactly, with only the two intended
BP/DX immediate-byte substitutions per component; the private worker is intact.
Root authored and reviewed `coverage-dwell/CoverageFixture.java` and its
hash-bound launcher, then ran against the unchanged original JAR (no overlays).
Validation SHA `ccabf89291e1ea0210c30198f341791f78666c92edbcf21d69af2495b30b65a2`:
119 load offsets, 714 paired paths, 698 healthy comparisons through 258 anchor
entries, 16 reproduced known baseline-unhealthy comparisons, zero new failures.
It verifies the full 256-anchor orbit, private worker bytes, pointer/register
recurrence and predicted timing. This is an isolated mechanism test, not a
competitive improvement or all-offset guarantee.

Assembly session 5554 and validation session 96506 both completed exit 0.
The next bounded screen is being authored: exact m050 and two paired designs,
500 battles per arm, fresh all-75-team grouping/seed and fixed same-name inputs.
It is not frozen or launched yet. Another checkout's 8-thread Java process was
observed and left untouched; our next screen will run serially. No final edits
or promotion. Original broad-improvement goal remains active and unachieved.

The coverage-dwell screen subsequently finished all 1,500 battles in serial
session 72848, exit 0. Root reviewed the complete generator/protocol/analyzer
before the one-time freeze; no actionable findings. Frozen manifest SHA
`89fc3f6af02bee8f5f90bd822c82cbb32622c0aa81d23485ff18f3eb014db541`,
new seed range -872829954..-872829935, 28 prior ranges excluded. All three
500-battle arms and 75 blocks passed the complete raw-input/result/runtime
audit. Analysis SHA `58370466ab4a9b582908d602d9ce4504ad5ead6ddbf3f072601c0dacc37c480c`
at `coverage-dwell/screen/analysis.json`.
Exact m050 scored .675666662, lower-strides .479666666, upper-strides .480666667.
Paired deltas -.195999996 and -.194999995, descriptive 95% cohort intervals
[-.291410720,-.100589272] and [-.292465242,-.097534748]. Both rejected; no
holdout or promotion. Full ideal spatial support did not recover strength;
the cause of the competitive loss is not established by the inert geometry.
Post-acceleration research total: 20,900 executions (plus separate diagnostic
and infrastructure validation). No owned JVM remains running.

User then requested an account of Claude's better-candidate claims. Root
reread the completed synthesis/extras and c090 confirmation records, directly
recomputed old fresh-run aggregates, and is checking whether Claude has newer
artifacts beyond those already independently tested. c090 had a genuine small
positive matched result on the first 75-team panel; the later regrouped
62-senior-team confirmation was effectively tied/slightly negative vs m050.
Do not characterize this as proof c090 is universally worse or deny its
earlier positive result. Synthesis/c041 showed negative fresh broad-field
deltas vs m050; synthesis had positive direct-duel results. Next research
priority remains understanding recurring-anchor interference through writer
telemetry, or evaluating a genuinely new independently reproducible lead,
not repeating rejected short-dwell variants. Original goal still active.

### New Claude evidence found during user's status question

The earlier summary of Claude candidates was incomplete/outdated. Read-only
inspection of the other checkout's
`study-notes/night-session/CHECKPOINT-original-task-2026-10-01.md` identified
new e1 and additional c090 results. The completed `experiments/part-hold-oct1-*.json`
files there report 20,000 battles / 400 blocks each: e1 .67170000195,
c090 .67180416950, m050 .66320416915, m049 .65645833675. Root independently
summed per-run team scores, checked counts/config hashes, and verified identical
cohort/seed/Zombie schedules across all four configs. This is metadata and
arithmetic verification, NOT a full original-engine or raw-CSV validation.
Their runner is a separate Java25 fast engine, not our validated overlays;
contender names differ (`Part_e1`, `Part_c090`, etc.) and the two adjacent seed
strings are not yet audited for range independence. Do not treat its 16
partition/seed cells as automatically independent or announce a new champion.

Exact e1 A is 184 bytes, SHA
`9447b5add61d6f18bff2708adfd2038c3eb1a9008dd9cf03df5c046eff4a4349`;
B is the known c090 115-byte `99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b`.
Its startup uses `ADD AX,zombie_entry-start; MOV [05D13h],AX`, unlike our
185-byte EntryLeaA (`2b7c71677831d5a78458519b20b2dbaddbb304b477ca828a90d2ff34c3adf052`).
It is not the previously rejected exact binary. Earlier c090 near-tie and
bootstrap results must not be used to dismiss these new observations.

Updated next priority: independently validate the exact e1 and c090 against
both controls on fresh, identical-name all-75-team regrouped conditions using
our verified lane and original-engine confirmation. Preserve new source/input
hashes before runs; no changes in Claude's checkout, no repeated constant sweep.
No owned battle process is running at this checkpoint; the evidence-reading
agent is finishing metadata checks only. Goal remains active, not complete.

## Ordered three-part task: independent confirmation, improve Claude, harden controls

User explicitly requested all three in this order. A finite test cannot provide
100% certainty about every future opponent; the operational target is a frozen,
independently reproduced broad-pool comparison followed by measured candidate
improvement and density-weighted counter resilience, not universal immunity.
The goal tool returned no current goal at the start of this turn; earlier prose
about an active goal is historical, not a claim about present tool state.

Current serial execution session: 68215 (started 2026-10-01, still running at
05:08 Asia/Jerusalem). It runs all 32 general configs, then all four panel-01
original-engine replays automatically, with checked exit codes. Do not restart
or stop it. Another checkout's Java jobs were observed and left untouched.

Frozen suite: candidates/generated/claude-e1-confirmation-20261001/frozen/manifest.json
SHA e1e25fbe3ad90726f3894cfd23438c4f2954b96ae1f13d1d55a9125910ecc596.
Provenance SHA f882f42bea0e77a6328580843a417d48e08e1668f1055da5accf5ed6974acddf.
Exact m049/m050/c090/e1, identical team name, 75 public 2025 teams, eight fresh
partitions, two disjoint seed ranges each: 10,000 battles per arm (40,000 total),
plus 5,000 original-JAR replay battles. No conclusions from partial scores.
Root reviewed all source/protocol/analyzer code before freeze and independently
assembled the two Claude candidates. Original-engine recurrence check passed:
119 offsets, 714 paired paths, zero new failures, five anchor states each.

Outputs: experiments/claude-e1-confirmation-20261001/{accelerated,original-replay}.
After all 32+4 complete, run the suite analyzer with the exact manifest hash.
It verifies source/input/runtime hashes, raw CSVs and original replay equality,
then uses eight partition-level paired observations. Advantage must clear both
controls; inconclusive and supported-inferior outcomes remain possible.

Parallel authoring (not execution): capture_mechanics is preparing an
observer-only original-engine synthesis-vs-m050 125-battle writer diagnostic;
design_population_stress is preparing a 75-public-plus-five-Claude-family
scenario and duels, including the older fixed-toggle counter. Both await root
read-only review before freeze/run. Research hypotheses are not new results.
Next after task 1: use complete broad results and writer attribution to choose
bounded bootstrap/communication/anchor hardening changes, compare general and
counter performance, then fresh holdout for a selected candidate. No final/
edits, promotion, commits, pushes, branch changes or existing-process stops.

At 05:20 local, 19/32 general configs have completed; serial session 68215 still
owns the remaining general configs and all original replays. Root completed
full read-only review of the finalized stress model/generator/analyzer/protocol
and both pure test suites plus preflight: no findings. Stress remains unfrozen.
It includes e1/c090/synthesis/fixed-toggle, 12,000 physical executions, nominal
descriptive cluster intervals and covariance-correct density changes.

Writer diagnostic compilation passed. Its first replay failed before any war:
an author guard required totalBattles<0, whereas the original Options default is
0. Failed source/classes/plan/output are preserved under diagnostic/. The author
is preparing a separate diagnostic-retry/ with that guard corrected and explicit
zombieSpeed=2; root will review the delta before compiling/replaying. No mechanism
claim is accepted from the failed run. The general suite was unaffected.

Source-mechanism research identified a bounded, not-yet-tested SS-to-BX relay:
MOV BX,SS; MOV ES,BX at template-copy start, then MOV DS,BX after REP instead of
PUSH SS; POP DS, with the existing MOV BX,cell restoring BX. It saves one startup
opcode but adds two bytes per initializer; layout and hostile interleaving are
not equivalent. Scoped searches found no exact earlier test. This is a candidate
design hypothesis for task 2 after task 1, not a measured improvement.

Correction: the long processes above have since finished. General accelerated
session 68215 completed all 32 configurations (40,000 battles); all four panel-01
no-overlay original-JAR replays completed all 5,000. The last original e1 panel
scored .6800666648. Root launched the reviewed analyzer with the exact frozen
hash at 08:48 UTC (session 64503); no partial conclusions were reported.

The writer-attribution replay and independently reviewed summarizer both passed:
125 wars, 1,000 births, 650 total deaths, 108 watched m050-B deaths, exact raw
score CSV equality. Summary SHA
`5587c8f265a5e8d3ba3819202255e8a91231ccb6c700ffc7d7cad9c95ca8f9b4`. In these
108, 82 were CPU exceptions and 26 memory exceptions. Zero matched the specific
FF A5 indirect-jump signature. Among 82 CPU exceptions, 67 had CS=FFC and IP
exactly current anchor pointer+4, consistent with failure while executing
copied bytes at that site, not the older generalized FF-A5 diagnosis. Of the
108 current-anchor snapshots, 66 had an opposing survivor as last recorded
high-byte modifier, 31 the partner, 3 self, 2 Zombie and 6 no recorded change.
These are last modifications, not proof of causal killer. Self/partner writes
can produce A4/A5 byte values and opponents can replace anchor high bytes, so
last-byte state and CPU IP matter. Full limitations/examples are in
`diagnostic-summary/summary.json`.

2026-10-01 continuation after user noted communication failure: initial three
requested tasks remain active. User added an explicit check of Claude e1p3 and
asked to continue the existing research. e1p3's claimed branch build folder is
not present in this checkout or any indexed workspace file; no fetch/branch
switch was done. The two pasted ASM sources were saved in the isolated
`candidates/generated/claude-e1p3-check-20261001/` area and assembled twice
against the local `127.0.0.1:8123/page.html` NASM page via local Chrome CDP.
Both assemblies reproduced: A=187 bytes, SHA256
`caced989dd55b98a749d5dc3a2d20d533e14013affb08b84572c9f76f1a05117`; B=115
bytes, SHA256 `99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b`.
An initial assembly's output was valid but its temporary-Chrome cleanup returned
EPERM; cleanup code was fixed and an independent second build exited 0 with
matching hashes. Do not describe unavailable claimed branch binaries as verified.

Screening e1p3 on the same frozen eight 2025 online-stage panels/seeds used for
the m049/m050/e1/c090 confirmation: 8 x 1,250 = 10,000 accelerated original-
engine battles. It reuses the prior screen and is exploratory, not fresh holdout.
Generator and analyzer are in the isolated candidate folder. A bounded
mechanism-isolation screen is also running on the same exact inputs: relay-A,
relay-B, and relay-both. Proposed change uses MOV BX,SS / MOV ES,BX and later
MOV DS,BX in the relevant initialization path; all changed source counts are
asserted, A/B assembled sizes and hashes are frozen, and CPU source confirms
engine handlers for opcodes 8C/8E. 24 configs = 30,000 additional battles.

2026-10-01 e1p3 verification completed: exact frozen holdout manifest SHA
62d1a4b5dce3091883ab79269b985c58cf5ed8b905afc357712c7aed46df7a8f; 30,000
accelerated deterministic-v6 battles, no overlays; eight fresh randomized
panel units, same fixed 75 published online-stage teams and four Zombies.
Integrity verification passed for every source/config/seed/cohort/result. Scores
per candidate appearance: m049 .65618333, m050 .66195000, e1p3 .66625000.
Familywise-conservative paired panel CI: e1p3-m049 +.01006667
[+.00153337,+.01859996] (higher under this population/protocol); e1p3-m050
+ .00430000 [-.00435654,+.01295654] (inconclusive). Thus Claude's latest pasted
e1p3 is supported over m049 in this holdout, but has NOT been shown better than
m050. It is not a historical-final-roster or unseen-opponent test. Analysis:
experiments/claude-e1p3-holdout-20261001/analysis.json.

Mechanism-isolation relay screen completed: 24 configs / 30,000 battles on the
reused screen panels; relay-A was lower than e1p3 by .01623333 (nominal CI
[-.02414884,-.00831783]); relay-B - .00390000 (CI [-.00804123,+.00024123]);
relay-AB - .00640000 (CI [-.01474012,+.00194012]). No relay is promoted; B/AB
are inconclusive with point estimates against the change. Exploratory screen:
experiments/claude-e1p3-relay-screen-20261001/analysis.json.

Family stress completed and the complete 668-config / 12,000-battle integrity
analyzer passed. This was an explicitly hypothetical mixed five-entrant family
(two e1, one c090, one synthesis, one fixed-toggle), not five copies of one
counter, not a forecast, and it did NOT contain latest e1p3. Weighted expected
scores: m049 .69407190, m050 .70744970, c090 .70879024, e1 .71275948. E1-m050
was +.00530977 with descriptive interval [-.01365787,+.02427742], inconclusive.
Duels showed m049 and m050 both lose against the fixed-toggle entrant (net
-.1642 and -.1567), while m050 vs synthesis was - .0350 (CI crosses zero) and
vs c090 -.0717 (CI below zero). This confirms specific counter vulnerabilities,
not universal susceptibility or broad-population superiority. Full audited
output: candidates/generated/claude-family-stress-20261001/analysis.json.

Next bounded direction: screen neighboring NOP/timing variants of e1p3 (around
the supplied three-NOP placement) against the already-frozen 2025 screen, then
only take a finalist to an independently seeded holdout. Keep m049/m050 as
controls; do not alter final/. No candidate has been promoted, committed, or
pushed. Existing unrelated dirty checkout changes, including final/ files,
were present and preserved; this continuation did not edit them.

2026-10-01 timing-neighbor screen and NOP=4 fresh holdout completed. The local
two-NOP/four-NOP timing screen had 16 configs / 20,000 exploratory battles on
reused frozen panels. Means per appearance: NOP2 .67269167, NOP4 .67618333,
e1p3 .67859167, m050 .66764167. NOP4 is +.00854167 vs m050 but -.00240833
vs e1p3 on this selected screen; no inference from these reused seeds.

NOP4 was preselected for a distinct entropy freeze (manifest SHA
2cf7fcd97b59c1fa137684ae7d0603bbb96b8cce9c69096f34333a2e489d000b) and 32
config / 40,000-battle independent-seed holdout versus m049, m050 and exact
e1p3. Seed ranges were disjoint from the earlier holdouts and prior studies;
all configurations used the exact deterministic v6 JAR, no gameplay overlays.
Verification passed for all frozen input/result hashes, panel pairings, and
execution identities. Means: m049 .65641667, m050 .66540333, e1p3 .66996167,
NOP4 .66936167. NOP4-m049 +.01294500, conservative familywise CI
[+.00637237,+.01951763] (higher on this population); NOP4-m050 +.00395833,
CI [-.00435171,+.01226838] (inconclusive); NOP4-e1p3 -.00060000,
CI [-.00389039,+.00269039] (inconclusive). NOP4 does not establish a win over
m050 or e1p3, so do not promote. Analysis:
experiments/claude-e1p3-nop4-holdout-20261001/analysis.json.

Across both independent eight-panel holdouts, e1p3-vs-m050 pooled descriptive
delta is +.00442917 over 16 panel means; conservative CI using critical=3.5
[-.00165769,+.01051603], still inconclusive. e1p3-vs-m049 is +.01180583 with
CI [+.00560422,+.01800745]. This synthesis is a secondary summary across the
two independent fixed-roster holdouts; it does not make an m050 win claim.

No e1p3 relay or NOP neighbor has beaten m050 with fresh measured support.
The hypothesized five-entry counter family remains a mixed stress scenario;
latest e1p3 itself was not in that stress suite. The older tested XOR-B response
was conditional (better at K=1/2, worse at K=0/3) and its natural weighted score
was below m050; not a robust upgrade. Next focus is a distinct survival/offense
mechanism, informed by actual anchor-death telemetry. `final/` stays unpromoted;
the pre-existing dirty `final/` working-tree edits were not changed by this
continuation.

## User-supplied e1p3 and third independent broad holdout

The user supplied a newer e1p3 A/B pair and asked for an independent check
against m049/m050, then continuation of the survivor/counter research. The
claimed branch build folder is absent in this checkout, so the exact pasted
sources were reassembled locally rather than trusting branch claims. Independent
assembly was repeatable: A=187 bytes, SHA-256
`caced989dd55b98a749d5dc3a2d20d533e14013affb08b84572c9f76f1a05117`; B=115
bytes, SHA-256 `99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b`.

To resolve the still-inconclusive e1p3-vs-m050 result, a third fresh holdout was
frozen before execution with manifest SHA
`d207610e068bbf2f418c36f5702e18a8ee22017db89c125f1319af3f62486d92`. It used
24 serial original deterministic-v6 no-overlay configs, 30,000 complete battles,
eight fresh independently salted panels, and the fixed 75 public 2025 online
teams (62 senior, 13 youth) plus four Zombies. Seeds and cohort schedules were
checked disjoint from both previous e1p3 holdouts and the recorded seed registry.
Every config, input hash, 50-run panel, battle count, and engine identity passed
verification.

Third holdout points per candidate appearance: m049 `.648266666`, m050
`.665191665`, e1p3 `.669958332`. Predeclared paired-panel results: e1p3-m049
`+.021691666`, conservative familywise CI `[+.013536831,+.029846501]` (higher
under this protocol); e1p3-m050 `+.004766667`, CI `[-.002596077,+.012129411]`
(inconclusive). Thus the user-pasted e1p3 clearly beats m049 on this fixed
population, but the third fresh holdout alone still does not prove it beats
m050.

Secondary pooled summary across all three independent holdouts (24 panel-level
paired observations, conservatively using critical value 3.5): e1p3-m049
`+.015101111`, CI `[+.008979710,+.021222512]`; e1p3-m050 `+.004541668`, CI
`[-.000317102,+.009400437]`. All three e1p3-vs-m050 holdout point estimates
were positive and near `+.0045`, but the conservative pooled interval still
barely crosses zero. The pooled summary is explicitly secondary because the
third holdout followed review of the first two; do not claim certainty or a
proven m050 defeat. Files: `experiments/claude-e1p3-third-holdout-20261001/`
and `experiments/claude-e1p3-pooled-confirmations-20261001/analysis.json`.

The separate exact `CALL FAR [BX+SI]` recoding screen was also completed on
reused exploratory panels and rejected: it lost to its own e1p3 control by
`.006658333` (nominal CI `[-.012213976,-.001102690]`) and to m050 by `.016908333`.
Do not promote it or conflate it with e1p3.

Next action: test whether applying the previously measured counter-resistant
one-byte B-worker `XOR [BX],BP` change to e1p3 preserves its broad score and
counter benefit; then use a frozen population-density study with five copies of
the fixed-toggle family to evaluate m049/m050 and only a preselected promising
defense. All remain research-only until broad-field improvement is reproducible.
No commit, push, branch switch, or `final/` modification was performed by this
continuation; existing dirty user files were preserved.

## e1p3 + XOR-B exploratory screen (continued 2026-10-01)

The frozen 8-arm screen completed all 4,000 battles successfully. Manifest
SHA-256: `2bec0789b932f52ad0a06676fa882a94862030af73920d733c9254f7ef7d39b9`.
The candidate changes only the B worker's one-byte `sub [bx],bp` to
`xor [bx],bp`; A is byte-identical to the pasted e1p3 A. Analysis and integrity
checks completed with `analyze-screen.mjs`; full cohort results are in
`experiments/e1p3-xorb-screen-20261001/analysis.json`.

Exploratory points per appearance:

| Scenario | m050 | m050-XORB | e1p3 | e1p3-XORB |
|---|---:|---:|---:|---:|
| 75-entry 2025 field | `.6870` | `.6500` | `.6763` | `.6460` |
| one fixed-toggle counter present | `.4023` | `.4500` | `.3697` | `.4285` |

Paired by 25 shared cohorts, e1p3-XORB vs e1p3 was `-.030333` in the field
(nominal 95% CI `[-.075338,+.014671]`, 10 positive / 14 negative / 1 tie) and
`+.058833` with the fixed-toggle present (nominal CI `[+.011467,+.106199]`,
19 positive / 5 negative / 1 tie). m050-XORB vs m050 was `-.037000` in the
field (nominal CI `[-.083292,+.009292]`) and `+.047667` against the counter
(nominal CI `[+.010450,+.084883]`). The screens are exploratory, not fresh
holdouts; do not use them as formal general-performance evidence. They show a
clear tradeoff in point estimates: XOR is more resilient in the tested
counter-present scenario but costly in the mixed field. Reject e1p3-XORB as a
general replacement; retain e1p3 itself for further independent confirmation
against m050 and retain XOR only as a possible density-dependent research arm.

No branch/remote/final changes were made.

## Five-identical-e1p3 entrant density stress (completed)

Following the mixed-family stress, prepared a separate hypothetical sensitivity
study with exactly five distinct entrant names carrying byte-identical copies
of the user-pasted e1p3 pair. Candidate controls are m049 and m050; e1p3 itself
and e1p3-XORB are included as research arms. K=0..3 is sampled from the exact
hypergeometric distribution for choosing three opponents out of 80. Each K
stratum has ten cohorts with balanced clone subsets, fresh non-overlapping
10-war Java seed ranges, and both candidate-name orientations. 3,200 battles
total; fixed 75-entry 2025 online-stage pool; original deterministic-v6 JAR;
no overlays. This is explicitly not a prediction that five teams will enter.

Pure scheduling tests passed. Frozen manifest SHA
`84e8b08637f8f7e29f719a9791a6a11589872a2ab0185c48069b500b94b429ba`; the input
verification passed before and after all 320 configurations/3,200 wars. Source,
build mappings, all candidate and clone binary hashes, engine, runner, public
pool, Zombies, configs, and all 189 previous seed ranges checked. Results use
the original deterministic-v6 JAR with no overlays.

Statistical correction: the frozen draft analyzer used t(df=19), which is too
small for ten cohort clusters/stratum. It was not used for inference. The separate
post-freeze `analyze-corrected.mjs` and `analyze-paired.mjs` preserve the frozen
run/source files and use t(df=9)=2.262157. Corrected outputs:
`experiments/e1p3-five-copy-density-20261001/analysis-corrected.json` and
`paired-comparisons.json`.

Nominal paired weighted results (points per candidate appearance): e1p3-m050
`+.0182845`, 95% descriptive CI `[-.0040998,+.0406688]`; e1p3-m049 `+.0187810`,
CI `[-.0333025,+.0708645]`; e1p3-XORB-m050 `+.0490830`, CI
`[-.0236238,+.1217897]`. None is conclusive. e1p3's K=0 advantage over m050 was
`+.0300` `[+.00645,+.05355]`, but at the common K=1 stratum it was `-.03808`
`[-.10468,+.02851]`; its natural-weighted point advantage remains positive but
uncertain. e1p3-XORB was strongly negative at K=3 (`-.09463`, nominal CI
`[-.12561,-.06365]`), though K=3 has only `.012%` conditional probability.
The density changes the e1p3-m050 advantage by `-.01172` (CI
`[-.02372,+.00029]`), suggesting erosion rather than proof of a loss.

This hypothetical density test does not prove e1p3 beats m050 generally or is
immune to repeated copies. Five entrants in the opponent pool still mean at most
three opponents can appear with the forced candidate in one four-team battle.
`final/`, branch, remote and commits were not changed by this continuation.

## User-requested e1p3 identity check and m050-XORB density extension

The code pasted in the latest user message is byte-identical to the e1p3
candidate already tested: source/build manifest maps A (187 bytes, SHA-256
`caced989dd55b98a749d5dc3a2d20d533e14013affb08b84572c9f76f1a05117`) and B
(115 bytes, SHA-256 `99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b`).
The requested `candidates/generated/microopt-2026-10-01/e1p3/build/` path is
not present on this checkout; I verified against the assembled sources and
artifacts under `candidates/generated/claude-e1p3-check-20261001/` instead.
Across three previously completed independent seed holdouts on the fixed
75-entry 2025 online field, e1p3's pooled point advantage is `.0151011` over
m049 with conservative CI `[.0089797,.0212225]`; versus m050 it is `.0045417`
with CI `[-.0003171,.0094004]`. Therefore Claude's broad-superiority claim is
supported against m049 in this benchmark, but remains unproven against m050.

To finish the missing targeted comparison, froze and completed a post-hoc
paired extension testing m050-XORB against standard m050 on the exact same
five-e1p3-copy density cohorts and seeds. Extension manifest SHA-256
`3c38b414da7af785136996380e5ec3514ee8266d3ffdd0f7dbed24988ad3c5dc`; all 80
configs / 800 battles completed on the pinned original deterministic-v6 JAR
with no overlays. The m050 controls were reused from the parent study, so this
is not a fresh independent holdout. Hypergeometric-weighted m050-XORB minus
m050 was `+.02491` points/appearance, descriptive 95% CI `[-.06600,+.11582]`.
By number of e1p3 opponents K=0..3: `+.01667` (CI `[-.09325,+.12659]`),
`+.06575` (`[+.00595,+.12555]`), `+.01258` (`[-.05324,+.07841]`), and
`-.04777` (`[-.07925,-.01630]`). This hints at improvement specifically at
K=1, but the weighted result is too uncertain to call a reliable hardening
win; K=3 is rare and negative. No candidate was promoted and `final/` remains
untouched.

Artifacts: `candidates/generated/e1p3-five-copy-density-20261001/xorb-extension/`
and `experiments/m050-xorb-e1p3-density-extension-20261001/analysis.json`.

Next action: because e1p3 has repeatedly beaten m049 but its small advantage
over m050 was unresolved, a fourth fresh-seed paired confirmation was frozen
before execution and completed. The submitted e1p3 source/binaries were
unchanged; the fourth-holdout manifest SHA is
`fe31dae224cfe91af150de881b4aa0d7da0473b1e06bafff8cea21e7fa9fadcf`. It ran
72 configs / 90,000 battles serially on the pinned original deterministic-v6
JAR with no overlays, using 24 new independently salted panels, 48 seed
ranges, and the fixed 75 online-stage entrants plus four Zombies. All input
hashes, run counts, engine identities, seed/cohort pairings, and panel
completeness checks passed.

Fourth holdout alone: m049 `.65814555`, m050 `.66519833`, e1p3 `.67295944`
points per appearance. Paired e1p3-m049 is `+.01481389` with conservative
familywise 95% CI `[+.01107024,+.01855754]`; e1p3-m050 is `+.00776111` with
CI `[+.00479507,+.01072715]`. This is strong evidence that the exact pasted
e1p3 beats both baselines on this fixed 2025 online-stage pool; it is not a
claim about unseen opponents or the official finals. Because this fourth
confirmation followed earlier looks, it is properly described as a
fresh-seed sequential confirmation, not a pristine first-look preregistration.

Secondary pooled check across all four independent fixed-field holdouts (48
panel-level paired observations, conservative critical value 3.5): e1p3-m049
`+.01495750`, CI `[+.01097063,+.01894437]`; e1p3-m050 `+.00615139`, CI
`[+.00288478,+.00941799]`. This agrees with the standalone fourth holdout,
while remaining secondary to it.

Targeted m050 hardening also completed: m050-XORB versus normal m050 in the
five-identical-e1p3 density extension was `+.02491063` hypergeometric-weighted
points per appearance, but its descriptive CI `[-.06599513,+.11581640]`
crosses zero. K=1 favored XOR-B, K=3 disfavored it; the extension reuses parent
controls and is post-hoc, not a fresh holdout. It therefore does not justify
replacing m050 with XOR-B. The evidence says e1p3 is a measured stronger
general-field candidate than m049/m050 in this benchmark, while no robust
e1p3-specific counter-hardening patch has been demonstrated yet.

Artifacts: `candidates/generated/claude-e1p3-check-20261001/` (the exact source,
fourth-holdout freeze/runner/analyzer) and
`experiments/claude-e1p3-fourth-holdout-20261001/analysis.json`;
`candidates/generated/e1p3-five-copy-density-20261001/xorb-extension/` and
`experiments/m050-xorb-e1p3-density-extension-20261001/analysis.json`.
No branch switch, commit, push, or edit to `final/` was made. Existing dirty
workspace edits, including `final/`, were preserved.
