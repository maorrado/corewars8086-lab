# Cooperative Arena: maximize reproducible Good_Test V6 improvement

The user explicitly requested Arena, with this overriding adaptation: every
agent independently improves V6 as much as possible; whenever a real improvement
is verified, notify every agent and continue from that new baseline. Do not
eliminate productive researchers. Seek broad tournament strength, accepting
small matchup regressions when the net broad improvement is supported.

Project root: C:/Maor/CodeGuru/corewars8086-lab
Session root: C:/Maor/CodeGuru/corewars8086-lab/.arena/v6-cooperative-20261003
Read this task and your dealt Arena strategy card. All agents receive this exact
task; differences in reasoning are your card, not a narrower assigned objective.

## Sources and constraints

Read the root rules-2025-consolidated.md, engine-v6-facts.md,
engine-v6-opcodes.md, study-notes/good-test-v6/README.md and both files in
study-notes/good-test-v6/source/. Use official Cpu.java/War.java to settle engine
semantics as needed, not generic x86 assumptions. Source is in
repos/corewars8086-6.0.0-deterministic/src/main/java/.
The original V6 belongs to the user's friend. Preserve that provenance.
A = 221 bytes, SHA256 3fa67bed880413901ad618b4f7b248e5782d98de93318271ac540ad1690ca2b7
B = 202 bytes, SHA256 8579e2c2212d72a413a6daacfe3b91ceb72be648bfc085bfeed9430eeaf6657a
Original binaries: study-notes/good-test-v6/original-binaries/Good_Test_V6_1|2.
Each submitted warrior must be at most 256 bytes. Do not change game rules,
round cap, opcodes, Zombie speed or scoring to obtain an improvement.

Known screens: LEA-stack -0.0018; ptrimm -0.00513; scan6 -0.0004;
scan8 tied; B BP +/-2 materially worse. Correctly rebased constseg3 was
positive in screen/first holdout, negative in second fresh holdout: not proven.
Do not simply repeat these experiments under new names.

## Work isolation and tools

All writes, generated files and scratch MUST stay under the session root.
Use your own subdirectory named after your canonical agent task name.
Use apply_patch for authored source/script edits. Do not commit, push, edit
final/, or modify other agents' files. Do not interrupt unrelated running jobs.
No further subagents; all three slots are occupied by cooperating researchers.

For exact NASM assembly WITHOUT the browser/shared server:
node C:/Maor/CodeGuru/corewars8086-agent2/agent2/tools/nasm-node.cjs
  <your absolute build dir> <your A.asm> <your B.asm>
This uses the simulator's own NASM and checks the 256-byte bound.
Beware fixed internal offsets 88h/99h/B9h/39h/62h in reconstructed V6;
any code-size change MUST rebase them correctly (prefer labels), except when
deliberately maintaining original layout for a controlled timing experiment.

The coordinator exclusively runs expensive benchmark jobs. You may perform
small read-only diagnostics or assemble/smoke checks, but submit candidates to
the coordinator before starting battles. Avoid duplicates and shared outputs.
Benchmark engine is official deterministic v6, SAME candidate team name for
all arms, explicit SAME four-team cohorts/seeds for paired tests. Candidate
selection screens are exploratory, separate untouched holdouts confirm gains.

## Initial deliverables and continued search

Independently analyze the actual code, then implement an initial set of up to
six substantively motivated candidate pairs, with source and compiled binaries.
Do not restrict yourself to any suggestions from the coordinator. At least
one architectural idea is welcome if mechanically justified, but working code
matters more than speculation. Send the coordinator your first ready candidates
early instead of waiting for the whole set.
For each candidate give id, absolute A/B source and binary paths, hashes,
byte sizes, hypothesis and precise edits. Use an immutable candidates.json
manifest per batch and send its path. Explain expected failure modes.
Prefer contrasting alternatives over redundant tiny adjustments; combine
only after individual effects can be measured.

Read session shared-best.json whenever beginning a new batch. A screened win
is NOT a verified new baseline. Only adopt records with status 'confirmed',
which require fresh paired confirmation; retain the original V6 in comparisons.
When a confirmed update is broadcast, rebase useful ideas onto it, continue
searching independently, and explicitly preserve any older layout assumptions.
Also critically review others' promising candidates when the coordinator asks.
Report findings promptly via collaboration.send_message, including negative
results and mechanical bugs. Never fabricate or overstate battle statistics.

The objective is the largest demonstrated improvement over original V6 in a
diverse field, not a theoretical perfect warrior or a win only against m050.
Evidence must include exact hashes, contexts, battle counts, paired differences,
uncertainty, per-warrior scores and adversarial/population stress where useful.
Continue implementing promising follow-ups until the coordinator closes this
research session or the human changes the task. Do not idle after one batch;
if awaiting benchmark, analyze likely death paths or propose the next batch.
