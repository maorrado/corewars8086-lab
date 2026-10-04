# Independent audit of the user-pasted Claude synthesis

The two submitted assembly files reproduce the user's pasted code, ignoring
only comments and whitespace. They were assembled independently in this checkout
and match Claude's `arena-100-2026-09-30/synthesis/build/SynthA` and `SynthB`
byte-for-byte:

| Binary | Bytes | SHA-256 |
| --- | ---: | --- |
| SubmittedA | 207 | `3875482b4d57a8d29f474215ed9dd41249bc17c46b1a662c4906554b5d859b9c` |
| SubmittedB | 115 | `99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b` |

## Read-only code review

No findings.

The complete diff against exact m050 was inspected under the requested
`review-agent` procedure. A adds ten bootstrap instructions (counting `9B 9B`
as one NRG instruction); both files replace `mov sp,di; add sp,imm16` with
`lea sp,[di+imm16]`. The 17-byte worker suffixes are byte-identical to m050,
and all template copy counts remain unchanged. Both programs fit the 256-byte
limit. LEA is supported by the actual engine and sets the intended 16-bit SP.
The removed ADD's flags are not consumed by a conditional operation before the
worker overwrites them. The detour saves/restores live AX and SI on the initial
private stack; downstream initialization resets DI and DX. ES is the arena and
DF is clear at INT86. The bomb writes 256 bytes starting 1,726 bytes after A's
load address; an exhaustive 65,536-offset circular-address check found no overlap
with A's own 207-byte initial image. This does not prove absence of collisions
with another warrior or future moving copies; those are measured strategy risks.

References inspected: engine `Cpu.java` LEA, NRG, INT86 and `stosdw` handlers;
`IndirectAddressingDecoder.java`; `AbstractRealModeMemory.java`; and
`Warrior.initializeCpuState`. No candidate changes were made during this audit.

## Audit of Claude's existing evidence

Files under `C:/Users/ronyr/codeguru-work/corewars8086-lab/experiments/`:

| Result file | Score/battle | Battles |
| --- | ---: | ---: |
| `arena100-synth-fullscreen.json` | 0.6814666712 | 2,500 |
| `m049control-all2025.json` | 0.6674000056 | 2,500 |
| `m050-all2025.json` | 0.6722666728 | 2,500 |
| `arena100-synth-holdout.json` | 0.6741333368 | 2,500 |

The three screen results use matching opponent/Zombie inputs and seeds
`all-001` and `all-002`. The claimed screen improvement is a real observed
result: +2.1077% relative to m049 and +1.3685% relative to m050.
Archived input binaries, config hashes and score files were audited directly.

The claimed fresh +1.0% / +0.3% comparison uses the synthesis's
`holdout-fresh-201/202` result against the OLD screen controls. No m049/m050
results on those same fresh seeds were found in either checkout. Those numbers
therefore do not constitute a matched fresh validation.

`arena100-synth-tournament.json` has 300 battles per pairing, with one fixed
two-team filler pairing per reference. Its quoted +5.9% / +11.4% uses the
symmetric difference divided by the mean of both scores. The ordinary relative
gains are +6.1303% / +12.0776%. These are score differences, not win rates;
the reported 9 wins are nine 50-battle aggregate comparisons.

Adjacent original seed strings hash to adjacent Java integer seeds. Their
50-battle ranges overlap by 49 war seeds; separate group-permutation RNGs mean
these are not 49 identical battles. The new field and duel seed ranges have
been verified mutually disjoint. Approximate intervals remain sensitivity
checks, with only four fresh seed blocks.

## Frozen independent experiment

`manifest.json` freezes the exact source, 160 input binaries, engine, runner,
configuration and seed hashes before any run. All solo tests use the same
candidate name (`COD_pair`), all 75 published 2025 teams in 25 triples, and the
same four Zombies. Each Java runner uses one thread and `--parallel=false`.

- Screen reproduction: 2,500 battles per version on the original seed strings.
- Fresh confirmation: 5,000 battles per version on four prespecified new seed
  strings, without changing the candidate after seeing results.
- Direct duels: 1,000 battles per reference across four different new seeds and
  both name/load-order orientations, with Zombies and no filler teams.

This uses the published 2025 online-stage field, not the unavailable complete
historical final. New seeds do not constitute new opponents.

Reproduction from the repository root:

```powershell
node official-benchmark.mjs candidates/generated/claude-synthesis-audit-20260930/screen-submitted.json
# Repeat for screen-m049, screen-m050, fresh-submitted, fresh-m049, fresh-m050,
# and each of the four duel configs in this directory.
node candidates/generated/claude-synthesis-audit-20260930/analyze.mjs all
```

Independent run results are in `experiments/claude-synthesis-audit-20260930/`.
## Completed independent results

| Phase | Battles per version | Submitted synthesis | m049 | m050 |
| --- | ---: | ---: | ---: | ---: |
| Original-screen reproduction | 2,500 | 0.681466671 | 0.667400009 | 0.672266671 |
| Four new matched seeds | 5,000 | 0.671533337 | 0.671766674 | 0.675966674 |

The original screen reproduces to floating-point accumulation precision.
On the prespecified fresh phase the synthesis is approximately tied with m049
(delta −0.000233337 points/battle), and below m050 by −0.004433337
points/battle (about −0.656% relative). The synthesis-minus-m050 differences
on the four seed batches are −0.004133344, −0.005733334, −0.002933334 and
−0.004933336: all four are negative. The descriptive four-seed mean interval
is [−0.006333943, −0.002532731]; the separate 25-cohort sensitivity interval
is [−0.011899118, +0.003032444]. The former concerns randomness on this fixed
field; the latter illustrates uncertainty across opponent compositions.

Thus the original positive score was real, but the claimed fresh broad-field
advantage over both controls did not reproduce. This is not evidence that the
candidate loses every matchup, and it does not establish universal inferiority.
The direct duels and all additional candidates below have also completed.

The screen analyzer validated 150 run records and 1,969 hashes. The fresh
analyzer validated 300 run records and 3,769 hashes, including actual completed
battle counts from stdout, retained score files and per-run input copies.

### Fresh direct duels

Each reference was tested over four new seeds, 125 battles per seed and two
name/order orientations, totaling 1,000 battles per reference. These have only
the synthesis and the reference team, plus the four Zombies: no 2025 filler
teams. They are not a reproduction of Claude's narrow four-team tournament or
its quoted percentages.

| Reference | Battles | Synthesis points/100 battles | Reference points/100 battles |
| --- | ---: | ---: | ---: |
| m049 | 1,000 | 56.083334 | 43.916660 |
| m050 | 1,000 | 51.933324 | 48.066655 |

Synthesis-minus-reference differences are +0.121666734 points/battle against
m049 and +0.038666688 against m050. The four-seed t intervals are respectively
[0.086276147, 0.157057321] and [0.011551867, 0.065781509]. Each of the four
seed-averaged differences is positive against each reference; both orientation
aggregate means are positive too. These are scoring advantages, not measured
win-rate percentages. They establish observed matchup strength under this
duel protocol, not broad-field superiority.

The final `analyze.mjs all` validation covered all ten main result files,
466 run records, 24,500 battles and 5,697 checked hashes. Maximum raw integer
score error was 0.000040 and maximum warrior/team summation error was 0.000031.
Combined with the 20,000 extra-arm battles and 6,750 separately documented
joint battles, the independent verification executed 51,250 battles in total.
The main and extras validation reports share baseline results; do not count
those reused controls twice.

## Additional candidates requested during the audit

Four descriptions from Claude reduce to three distinct historically tested
pairs. Independent assembly matched every referenced binary byte-for-byte:

| Local arm | Claude label | A/B bytes | Old screen score |
| --- | --- | ---: | ---: |
| `bomb-nrg` | c041 = c036 | 209 / 117 | 0.67926667 |
| `lea-only` | c090 | 187 / 115 | 0.67900000 |
| `bomb-no-nrg-no-pad` | c039 v4 actually tested | 205 / 117 | 0.67886667 |
| `bomb-no-nrg` | Literal description of c039, retaining padding | 207 / 117 | Not present in the cited result |

c041/c036 A retain MOV/ADD stack setup and therefore are not identical to
synthesis A. c039 v4 removes both the two NRG bytes and the two skipped padding
bytes; the user's quoted description mentioned only the NRG removal. Both
interpretations are included to avoid silently testing a different code.

`extras-manifest.json` freezes these sources/binaries and four additional
5,000-battle configurations using the same fresh seeds, cohort triples, group
name and frozen references. Controls are reused without rerunning or changing
their inputs. All extra 17-byte worker suffixes are identical to m050.
Use `node candidates/generated/claude-synthesis-audit-20260930/extras-analyze.mjs`
to validate all four completed extra runs. No candidate has been promoted to `final/`.

### Completed exact-extra confirmation

`node candidates/generated/claude-synthesis-audit-20260930/analyze.mjs extras-core`
validated the three exact historical extra arms plus all three references:
600 completed run records, 30,000 battles, 7,381 checked hashes. Maximum raw
integer-score conservation error was 0.000008; maximum warrior/team summation
error was 0.000009. The literal padded alternative completed subsequently.

| Version | Fresh battles | Points per 100 battles |
| --- | ---: | ---: |
| c090 / LEA-only | 5,000 | 67.900001 |
| m050 | 5,000 | 67.596667 |
| m049 | 5,000 | 67.176667 |
| Submitted synthesis | 5,000 | 67.153334 |
| c041 = c036 / bomb + NRG | 5,000 | 67.083334 |
| Literal c039 description, with padding retained | 5,000 | 67.040000 |
| c039 v4 / bomb without NRG or padding | 5,000 | 66.953334 |

c090 exceeds m050 by 0.003033332 points/battle (+0.44874% relative), and m049
by 0.007233332 (+1.07676% relative). Both differences are positive in each of
the four fresh seed batches. For c090 minus m050 the per-seed deltas are
0.003733330, 0.003999998, 0.000400000 and 0.004000000. The descriptive fixed-field
four-seed t interval is [0.000232700, 0.005833964]; the separate 25-cohort
sensitivity interval is [−0.001399558, 0.007466222]. Against m049 these intervals
are [0.000760043, 0.013706621] and [−0.002214585, 0.016681249], respectively.
An independent calculation from the raw result files reproduced these values.

This is positive replication evidence for a SMALL c090 advantage on this
published field, not proof of superiority against all possible opponents.
Extra-candidate comparisons are exploratory and unadjusted for multiple tests;
new seeds are not new opponents. No promotion was requested or performed.

c041/c036 are below m050 in all four fresh seed batches, with mean delta
−0.005133338 (−0.75941% relative). The exact c039 v4 is also below m050 in all
four, mean delta −0.006433338 (−0.95172% relative). Thus the claim that all
these candidates are generally stronger is not supported by this replication.

The completed full extras analyzer subsequently validated seven result files,
700 run records, 35,000 battles and 8,581 hashes (same maximum conservation
errors; 116 inferred zero-score battles). The literal padded no-NRG alternative
is below m050 in all four seed batches, mean delta −0.005566671 points/battle.
Thus neither interpretation of the c039 description reverses the conclusion.

## Follow-up claim received on 2026-10-01 (local time)

The user's new pasted c041 A/B and c090 A/B sources normalize exactly to the
already frozen `BombNrgA`, m050 B, `LeaA`, and `LeaB` sources. c036 is expressly
the same binary pair as c041, not a third distinct strategy.

Claude's new result files use `all2-verify-101` and `all2-verify-102`:

| Result in Claude's checkout | Score/battle | Battles |
| --- | ---: | ---: |
| `arena100-seed2-c041.json` | 0.6771333368 | 2,500 |
| `arena100-seed2-c036.json` | 0.6771333344 | 2,500 |
| `arena100-seed2-c090.json` | 0.6896666672 | 2,500 |
| `arena100-seed2-synth.json` | 0.6836000016 | 2,500 |

The claimed c041 +1.46%/+0.72% and c090 +3.34%/+2.59% are obtained by comparing
these NEW-seed scores with OLD `all-001/all-002` controls (m049 0.6674000056;
m050 0.6722666728). No controls on `all2-verify-101/102` were found at the time
of inspection. These observations are not a second matched victory against
the controls; the missing controls prevent that inference. They do not by
themselves establish either intentional deception or candidate inferiority.

The narrower claim that the synthesis wins with both m049 and m050 present
simultaneously was tested separately in
`../claude-synthesis-joint-20260930/`. It freezes three new seed strings and
three cyclic contender-name/order mappings, with all three contenders and
one of the 75 published opponents in every battle (6,750 battles total).
The earlier Claude tournament tested each reference separately with two
fixed filler teams, not all three contenders together. The completed joint
suite gave synthesis 0.315649390, m049 0.313372495 and m050 0.313705827
points/battle. This small pooled synthesis advantage reverses across seeds
and name/order mappings; both seed and cohort intervals include zero.
See the joint README for the complete results and limitations.
