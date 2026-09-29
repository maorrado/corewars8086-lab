# CoreWars8086 / CodeGuru Xtreme — night session report (2026-09-28)

Audience: another AI agent (Codex) picking up this research. This is a
technical handoff, not a narrative — read it as ground truth for what was
tested, what the results were, and what is still open.

Repo: `github.com/maorrado/corewars8086-lab`, branch
`codex/optimize-2025-survivors` (untouched — see "What was NOT touched").
Local working copy: `C:\Users\ronyr\codeguru-work\corewars8086-lab`.
Current promoted champion: **m049** (`final/ChimeraA.asm` + `final/ChimeraB.asm`,
189 + 117 bytes), promoted at commit `914a2517`.

## Bottom line

**No candidate beat m049 tonight.** Two full search phases were run:

1. A structural "new candidate family" phase (dual-anchor, dual-chain,
   bomb86, decoy, AL-value sweep, and several parameter sweeps) — all
   either crashed, underperformed, or reversed sign on a fresh holdout
   (overfitting).
2. A second phase, explicitly scoped by the user to **small, non-structural
   improvements to m049 itself** (not new candidates) — opcode
   re-encoding and a zombie-capture-rate investigation. Both are described
   in detail below. Result: one candidate (`subenc2`) confirmed **completely
   safe but perfectly neutral** — zero regression, zero improvement,
   verified three independent ways including the actual official holdout
   that promoted m049.

`final/` was never modified. Nothing was pushed to `main` or
`codex/optimize-2025-survivors`. Earlier findings (phase 1 above) were
already pushed to a separate branch `claude/night-research-2026-09-28`
(commit `6480868a`) with prior explicit user approval; the newer material
below (phase 2, this report) has not yet been pushed anywhere.

## Engine / tooling setup (for reproducibility)

- Official Java engine source: `repos/corewars8086-6.0.0/` (unmodified,
  vendored for reference).
- Deterministic build used for all testing: `repos/corewars8086-6.0.0-deterministic/`
  — diff vs. official is limited to seeding `CompetitionIterator` and
  honoring a configured output filename; `Cpu.java`/`War.java`/scoring
  logic is byte-identical to official (verified by diff).
- Portable JDK 8 (`tools/temurin8-jdk/`) and portable Maven
  (`tools/apache-maven-3.9.16/`) are vendored in-repo; no system install
  needed. Built jar:
  `repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar`.
- Test harness: `official-benchmark.mjs <config.json>` (positional arg,
  not `--config`). Config schema: `{experimentId, outputPath, runDirectory,
  battles, threads, seeds[], candidate:{name, warriors:[pathA,pathB]},
  cohorts:[{id, opponents:[{name, warriors:[...]}]}], zombies:[...]}`.
  Output written to `experiments/<experimentId>.json` with per-run
  `scores.groups` (raw points per team, divide by `battles` for
  per-battle rate) and a top-level `aggregate.teamPerBattle`.

## Phase 2 in detail — the "small improvement" search

### Candidate: opcode re-encoding (`subenc` / `subenc2`)

Idea: some x86 opcodes have two valid encodings for the same operation
(e.g. `SUB r/m,r` = `0x29` vs `SUB r,r/m` = `0x2B`, both implemented
identically in `Cpu.java`'s `sub16()`; same for `0x89`/`0x8B` for `MOV`).
m049's `worker:` loop has `sub sp,dx` (`29 D4`) immediately followed by
`sub [bx],bp` (`29 2F`) — two instructions sharing the same leading byte,
a scannable two-instruction signature repeated at every band transition.
Re-encoding `sub sp,dx` as `2B E2` removes that repeated leading byte at
**zero cost**: same length (2 bytes), same semantics, same flags.

- `ChimeraA-subenc.asm` (`candidates/generated/chimera-opcode-diversify/`):
  only `worker:`'s `sub sp,dx` re-encoded (`29 D4` → `2B E2`). 189 bytes,
  SHA-256 `0c686f0732b7bcd741bb53d1a1166970880c1e6be6918234b1c8a6df8bbe156b`.
- `ChimeraA-subenc2.asm`: stacks a second re-encoding on top —
  `mov di,ax` (`89 C7`→`8B F8`) and `mov sp,di` (`89 FC`→`8B E7`) in
  `phoenix_pointer_ready:`, plus the same `sub sp,dx` fix. 189 bytes,
  SHA-256 `15b5f649907dfc6dc29b077fdd3116319e3cf59891d76798af49da471360a6ac`.
  In all tests, `ChimeraA-subenc2` was paired with the **unmodified**
  `final/ChimeraB` (B side was never touched).

Verification (paired comparison, tie threshold `|diff| < 1e-6` to filter
float summation noise — see "float noise" note below):

| Test | Battles | Result |
|---|---|---|
| Screen (200 battles) | 200 | tie |
| Tune validation (1000 battles) | 1000 | tie |
| All-2025 field (2500 battles) | 2500 | tie — `subenc`=`0.6674000072`, `subenc2`=`0.6674000072`, identical to m049's known all-2025 aggregate |
| **Fresh-seed verification** (2500 battles, seeds never used in any prior tune/holdout, prefix `fresh-verify-*`) | 2500 | **50/50 cohorts tied**, 0 wins/0 losses. Aggregate: m049=`0.667466673`, subenc2=`0.667466672`. Mean diff `-8e-10`, 95% CI `[-2.4e-9, +7.7e-10]` (crosses zero) |
| **Official holdout** (the exact 750-battle, 5-cohort × 3-seed holdout that promoted m049 — `config-holdout-m049.json`, seeds `holdout-001..003`, cohorts `holdout-v1-01..05`) | 750 | **15/15 cohorts tied.** Aggregate: m049=`0.593333336`, subenc2=`0.593333307`. Mean diff `-5.3e-9`, 95% CI `[-1.6e-8, +5.1e-9]` (crosses zero) |

Total: ~6950 battles across 5 independent test conditions, all confirming
exact tie. Config used for the holdout: `config-holdout-subenc2.json`
(identical to `config-holdout-m049.json` except candidate warriors/name).
Result files: `experiments/subenc-{screen,tune1000,all2025}.json`,
`experiments/subenc2-{all2025,freshseed}.json`, `experiments/holdout-subenc2.json`.

**Conclusion: `subenc2` is a confirmed-safe, zero-risk change with zero
measurable effect against the current field.** It removes a real,
identifiable repeated-opcode signature at no byte/behavior cost, but no
opponent in the tested pool exploits that signature, so it doesn't move
the score. Filed as a "ready if a future adversary targets this
signature" change, not as a promotion candidate (no improvement to show).

### Full-binary opcode signature scan (why no further `subenc`-style candidates exist)

Disassembled `build/final/ChimeraA` (189 bytes) and found all repeated
2-byte sequences across the whole binary (45 found). Categorized every one:

- **Shared `start:`/`zombie_entry:` normalization block** (band-quantization
  math, duplicated because both entry points need it): already
  signature-hardened in the m048→m049 transition; re-encoding here is
  expected to behave like `subenc2` — safe but neutral, since no
  documented adversarial candidate scans this region specifically.
- **The `FF 1F` triple** (`call far [bx]` anchor, appearing as the anchor
  itself twice plus once as a literal immediate `mov ax,01FFFh`): this
  **is** the replication mechanism, not a re-encodable signature — `FF 1F`
  is the only machine code for `call far [bx]`, no alternate encoding
  exists.
- **`F3 A5` (`rep movsw`) and `AB`/`4F` (`stosw`/`dec di`)**: single-byte
  opcodes with no alternate 8086 encoding.

**No further opcode-diversification candidates exist beyond `subenc`/`subenc2`.**
This axis is exhausted.

### Zombie-capture-rate investigation (dead end, documented for completeness)

From existing telemetry (`build/official-runs/telemetry-m049-all2025/merged.csv`,
24,000 rows / 8000 zombie rows from an earlier 2000-battle run): zombies
captured into the Phoenix chain (`CS==0xFFC` at battle end) survive at
**60.3%** (912/1513) vs. **19.3%** overall zombie survival rate (raw
capture rate 1513/8000 = 18.9%). This confirms the capture mechanism is
highly effective once triggered, but:

- The telemetry schema (`war, seed, endRound, endReason, winners, name,
  group, type, loadOffset, alive, deathRound, deathReason, cs, ip, ss, sp,
  ds, es, energy, bomb86, bomb87`) has no capture-timing/round field, so
  it's impossible to tell what drives capture success without adding new
  instrumentation (a structural change, out of scope for tonight per the
  user's explicit "no new candidates" instruction).
- The two `INT 87h` search patterns that drive capture — `start:`'s
  word-search for `CCCC` (`ax=0F9EBh, dx=0CCCCh, bx=026FFh, cx=05D13h`)
  and `zombie_entry:`'s byte-search for `CC` (`ax=0A5F3h, dx=01F06h,
  bl=0CCh`) — are load-bearing for correctness (word-search finds fresh
  empty bands, byte-search finds any single filler byte for opportunistic
  capture), not free tuning constants. Changing them risks breaking
  replication semantics, not a safe small tweak.

**No candidate was built from this angle.** Documented as a closed dead
end for tonight, not as "nothing more to find here ever" — a future
session with time to add capture-round instrumentation could reopen it.

## Float-noise methodology note

Naive `b>a`/`b<a` paired comparisons on doubles occasionally showed
spurious 1-battle "wins/losses" of order `1e-8` — pure floating-point
summation noise, not real differences (e.g. `0.73999992` vs `0.74`, same
value). All comparisons above use `Math.abs(diff) < 1e-6` as the tie
threshold, and additionally report the 95% CI on the mean diff (normal
approximation, since `paired-comparison.mjs`'s Student-t table throws for
`df<20`) to confirm zero is inside the interval, not just that the point
estimate rounds to zero.

## What was NOT touched / not done

- `final/ChimeraA.asm` / `final/ChimeraB.asm`: never modified (verified
  repeatedly via empty `git diff --stat final/`).
- No push to `main` or `codex/optimize-2025-survivors`.
- No new push at all tonight for phase-2 material (opcode-scan results,
  subenc2 holdout, this report) — only phase-1 material was pushed
  earlier, to `claude/night-research-2026-09-28`.
- No candidate promoted to `final/` — nothing beat m049, so there is
  nothing to promote.

## Open threads for a follow-up session

1. **Zombie-capture-timing instrumentation**: add a small debug-trace hook
   (similar to the existing `onWarriorDeath()` patch in
   `repos/corewars8086-6.0.0-debug-trace/`) that logs the round number and
   `CS` at the moment a zombie is captured (not just end-of-battle state).
   Could reveal whether capture rate itself (not post-capture survival) is
   improvable — genuinely unexplored, distinct from all prior rejected
   `dual-hook`/`split-thief`/`postcapture-bombs`/`mirror-breaker`/
   `capture-position` families documented in
   `experiments/post-m046-strategy-search-2026-09-26.json`.
2. Re-encoding the `start:`/`zombie_entry:` shared normalization block
   opcodes (expected neutral like `subenc2`, but not yet empirically
   confirmed) — low priority, same expected outcome as subenc2.
3. Everything in the phase-1 structural-candidate space remains open per
   the existing `experiments/post-m048-micro-search-2026-09-27.json` and
   `experiments/post-m049-adversarial-audit-2026-09-27.json` conclusions —
   122 micro-mutations and adversarial-defense variants already tried and
   rejected; a genuinely new mechanism (not a variant of Phoenix/Chimera
   far-call replication) is the main remaining unexplored space.

## File index (this session's new artifacts, not yet pushed)

- `candidates/generated/chimera-opcode-diversify/ChimeraA-subenc.asm`
- `candidates/generated/chimera-opcode-diversify/ChimeraA-subenc2.asm`
- `config-subenc-{screen,tune1000,all2025}.json`, `config-subenc2-{all2025,freshseed}.json`,
  `config-m049control-all2025.json`, `config-m049-freshseed.json`,
  `config-holdout-subenc2.json`
- `experiments/subenc-{screen,tune1000,all2025}.json`,
  `experiments/subenc2-{all2025,freshseed}.json`,
  `experiments/m049-freshseed.json`, `experiments/holdout-subenc2.json`
- This report: `study-notes/night-session/report-for-codex-2026-09-28.md`
