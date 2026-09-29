# m050 re-verification report (2026-09-29)

Independent re-check of the m050 candidate after an initial single-fresh-seed
test wrongly concluded "no reproducible improvement, overfitting." That
conclusion was itself based on too small a sample (one 2500-battle draw) and
is retracted below.

## 1. Binary identity confirmed

All four binaries matched the exact hashes specified for this re-verification
before any test ran:

| | SHA-256 |
|---|---|
| m049 A (`build/final/ChimeraA`) | `106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973` |
| m049 B (`build/final/ChimeraB`) | `7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77` |
| m050 A (`build/m050-test/ChimeraA-m050`) | `0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44` |
| m050 B (`build/m050-test/ChimeraB-m050`) | `06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782` |

All tests below ran against these exact bytes.

## 2. Solo protocol — m049 alone vs. m050 alone against the full 2025 field

Same structure Codex used: 25 cohorts x 3 opponents = 75 teams, 4 zombies
(`zom20a-d`), 50 battles/cohort/seed. Four **independent, previously-unused**
seed-sets were run (2 seeds x 25 cohorts x 50 battles = 2500 battles each):

| Seed-set | Seeds | m050 W/L/T (n=50) | Mean diff (m050−m049) | 95% CI |
|---|---|---|---|---|
| original (my first test, retracted conclusion) | `fresh-verify-901/902` | 16/18/16 | +0.00007 | [-0.0115, +0.0117] |
| alpha | `reverify-alpha-001/002` | 24/9/17 | +0.0146 | **[+0.0046, +0.0246]** |
| beta | `reverify-beta-101/102` | 20/14/16 | +0.0058 | [-0.0040, +0.0156] |
| gamma | `reverify-gamma-201/202` | 20/12/18 | +0.0071 | [-0.0030, +0.0172] |
| **pooled (all 4 sets)** | — | **80/53/67 (n=200)** | **+0.0069** | **[+0.0017, +0.0121]** |

**Every individual set is directionally positive.** Only the first (my
original single test) had a CI crossing zero, and even that mean was
slightly positive, not negative. Pooled across all 200 cohort-seed units
(10,000 battles), the 95% CI is entirely above zero. **This is a real, small,
reproducible solo-play improvement, not overfitting** — my earlier
conclusion after one test was wrong; one 2500-battle draw was not enough
data to characterize a ~1% effect reliably.

Configs: `configs/config-{m049,m050}-reverify-{alpha,beta,gamma}.json`.
Results: `results/{m049,m050}-reverify-{alpha,beta,gamma}.json`.

## 3. Joint protocol — m049 and m050 together vs. paired 2025 opponents

Reproduced exactly as specified: each of the 25 original 3-opponent cohorts
split into its 3 possible opponent-pairs (`C(3,2)=3`), m049+m050+pair
(4 teams) fight together, 50 battles/pair, so every one of the 75 official
teams appears in exactly 100 battles (2 pairs x 50). Custom runner:
`joint-benchmark.mjs` (copied into this folder).

| Run | Seed | m050 W/L/T (n=75) | Mean diff | 95% CI |
|---|---|---|---|---|
| Codex (reported, not reproduced by me — no local access to their run) | `final-2025-joint-20260929` | 66/8/1 | +0.0816 | [+0.0647, +0.0986] |
| My seed1 | `reverify-joint-001` | 58/13/4 | +0.0575 | [+0.0409, +0.0741] |
| My seed1 **control (swapped names + load order)** | `reverify-joint-001` | 58/13/4 (identical) | +0.0575 (identical) | [+0.0409, +0.0741] (identical) |
| My seed2 | `reverify-joint-002` | 42/31/2 | +0.0239 | [+0.0077, +0.0402] |
| **Pooled (my seed1 + seed2)** | — | **100/44/6 (n=150)** | **+0.0407** | **[+0.0288, +0.0526]** |

**Load-order/naming control:** re-ran seed1 with candidate team names and
file-copy order swapped (`--swap` flag). Result was byte-for-byte identical
when compared by actual loaded binary identity (not by which label it wore):
58/13/4, mean +0.0575, same CI. **The advantage is not an artifact of team
name, load order, or which slot a warrior occupies.**

All three independently-seeded joint runs (Codex's + my two) are positive
and statistically significant, though effect size varies noticeably by seed
(+0.024 to +0.082). The joint-protocol effect is substantially larger than
the solo-protocol effect (~4-6x), consistent with m049/m050 differing mainly
in early-game robustness that matters more when directly contested for the
same territory against two live opponents simultaneously, rather than in
raw survival against one opponent-cohort at a time.

Configs: `configs/config-joint-m049-m050{,-seed2}.json`.
Results: `results/m049-vs-m050-joint{,-swap,-seed2}.json`.

## 4. New_Best adversarial matchup — BLOCKED, not run

Could not test. `New_Best1`/`New_Best2` binaries do not exist anywhere in
this local working copy — searched the entire repo (excluding
`node_modules`) for any small file matching the specified hashes
(`81ca1a63...342fc`, `4480aef2...2c65a3`); zero matches. Only their **hashes
and attack metadata** are recorded, in `experiments/m049-promotion-2026-09-27.json`
(from the original m048->m049 promotion) and referenced in `final-report.md`:
size 117/171 bytes, attack signature `0E 17 BB 00` -> `FF 26 17 4A`
(`PUSH CS;POP SS;MOV BX,...` replaced with `JMP word [0x4A17]`). No source,
no compiled bytes, no generation script for these two files exists locally.

This is a genuine external blocker: Codex evidently has access to the actual
`New_Best1`/`New_Best2` binaries (they ran a fresh 1,600-battle test against
them) and I do not. I did not fabricate or reconstruct approximate versions
from the partial metadata, since testing against a guess would produce
meaningless or actively misleading results for a champion-lineage decision.
**Codex's reported result stands as the only evidence on this axis**:
m049=0.471458, m050=0.417000, m049 better in 29/32 units — i.e. m050
regresses against this specific adversarial candidate even though it
improves generally against the 2025 field.

## 5. Answers to the specific questions asked

**Does m050's general improvement reproduce on new seeds?**
Yes. Pooled over 4 independent solo seed-sets (200 units, 10,000 battles),
mean +0.0069 with 95% CI entirely above zero. The earlier single-test
"overfitting" conclusion was wrong — it was one unlucky draw, not the
ground truth.

**Does the joint-run result survive swapping names and load order?**
Yes, exactly. Re-run with `--swap` reproduced the identical result
(58/13/4, +0.0575) when tracked by actual binary identity. Not an artifact.

**Is m049 still the safer choice because of New_Best?**
On the only evidence available (Codex's report, which I could not
independently reproduce locally), yes — m050 loses to New_Best in 29/32
units where m048->m049's entire purpose was specifically to fix a
signature New_Best exploits. Promoting m050 without confirming it doesn't
reopen or worsen that specific weakness would be reckless given that
history. This needs independent reproduction before it can be trusted as
strongly as the solo/joint results above (which I did reproduce myself).

**Is there a way to keep m050's advantage without the New_Best regression?**
Not yet determined — I have not diagnosed *why* m050 loses to New_Best.
The `xor di,di` removal changes `DI`'s value going into `start:`'s
`INT 87h` call only in a byte-identical-timing sense (DI=0 either way at
cold boot, confirmed via `Warrior.java:initializeCpuState`), so the New_Best
regression is not obviously explained by the documented change alone — it
may interact with New_Best's specific `FF 26 17 4A` redirect in a way that
needs debug-trace instrumentation to pin down (same technique used earlier
this session for the original Chimera anchor-death diagnosis). This is the
natural next step if New_Best binaries become available locally, or if
Codex can share the actual death mechanism/trace.

**Which code would you submit right now if forced to choose one?**
**m049.** m050 shows a small, real, reproducible general improvement
(~0.7% solo, ~4% joint) against the current field, but the only adversarial
test against a candidate specifically designed to attack this code family
(New_Best, the same one that forced the m048->m049 change) shows m050
losing 29/32 — and that adversarial robustness is exactly the property the
m048->m049 promotion was built to protect. A ~1-4% general gain is not
worth reopening a known, previously-patched attack surface without first
confirming m050 doesn't regress against it. **`final/` was not touched.**
No promotion recommended until New_Best is independently re-tested against
the exact m050 binaries above.

## Reproduction

All configs and results in `configs/` and `results/` use `official-benchmark.mjs`
(solo protocol) or `joint-benchmark.mjs` (joint protocol, included in this
folder) against the deterministic engine jar
(`repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar`).
m050 source: `candidate-source/ChimeraA-m050.asm`, `ChimeraB-m050.asm`.
Build manifest with source+binary hashes: `build/m050-test-manifest.json`.
