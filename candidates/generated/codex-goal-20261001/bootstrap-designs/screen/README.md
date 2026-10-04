# Frozen bootstrap screen

Five arms: c090, exact m050, entry_lea, b_fallthrough, both. Hypotheses and
source designs were frozen and reviewed before this protocol. No c090
confirmation results were read to choose this screen.

Each arm uses 25 senior opponent triples from confirmation panel 1, 20 battles
per triple, the same new seed, COD_pair, one thread, parallel=false, and no
telemetry: 500 battles per arm, 2,500 total. The panel contains all 62 senior
teams and 13 repeated teams. The exact roster and order are preserved.

The seed bootstrap-screen-20261001-8138be98e5239be3512c477c was drawn once from node:crypto.randomBytes(12);
its Java hash range 228253997..228254016
is disjoint from all 21 prior ranges checked by the frozen
confirmation protocol. No outcomes were consulted. It is one new seed block,
not 500 independent randomized seed selections.

Candidate binaries remain in the reviewed bootstrap build and immutable
confirmation m050 snapshot. input-manifest.json pins every source/build
manifest, candidate and field binary, engine, Java executable, runner, roster
reference, configuration, this plan, and analyzer before execution. It embeds
the original source-to-build manifest. All paths resolve relative to this
screen directory. Nothing in the confirmation directory is edited.

The read-only analyzer validates those hashes and then compares each new arm
with BOTH freshly run c090 and m050 controls using 25 paired cohort differences.
A research arm advances only if both mean differences exceed 1e-8. Intervals
are descriptive Student-t summaries (df=24), not the selection gate. Repeated
teams, one seed and a fixed field limit inference. Positive screens require a
new matched holdout and make no champion or final-replacement claim. Do not
extend battles, choose favorable seeds, or pool previous scores.

Before any run, from the repository root:

```powershell
node candidates/generated/codex-goal-20261001/bootstrap-designs/screen/analyze.mjs --check-inputs
```

The root agent owns the resource queue. For each of c090, m050, entry_lea,
b_fallthrough and both, run its configuration through official-benchmark.mjs,
for example:

```powershell
node official-benchmark.mjs candidates/generated/codex-goal-20261001/bootstrap-designs/screen/c090.json
```

After all five finish:

```powershell
node candidates/generated/codex-goal-20261001/bootstrap-designs/screen/analyze.mjs
```

The analyzer prints JSON only and never launches battles or writes results.
freeze-inputs.mjs is a read-only one-time manifest snapshot helper; its stdout
was saved by apply_patch before execution. It refuses to re-freeze an existing
manifest or a screen with run/result directories. No Java was launched during
authoring.

