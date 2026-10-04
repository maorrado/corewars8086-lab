# Day-2 round 2 brief: improve DET2 (2026-10-04)

Repository root `C:\Maor\CodeGuru\corewars8086-agent2` (bash `/c/Maor/CodeGuru/corewars8086-agent2`); run every command there.
Goal: raise DET2's score per battle on the plain 2025 field first, and in fields with strong teams, without losing elsewhere.
Work only on our own pair's design (placement, timing, zombie capture, startup, steps, replication structure).

## Base = DET2 (revision 2)
Sources `agent2/day2/q/revisions/rev2/A.asm` (214 B) and `B.asm` (233 B), copies with comments in `final/DET2A.asm`, `final/DET2B.asm`.
DET2 = rev1 (night best) + adaptive lattice: B checks at startup whether a V6-family team wrote [4A17h]; if so the whole team
uses FAR_SEG 0FFAh (lattice 42h), else 0FFBh (52h). Read: `final/README.md`, `agent2/night/BRIEF.md` ("How rev0 works",
"Verified engine facts"), `agent2/day2/leaders/CONFIRM-RESULTS.md`, and skim `agent2/night/FINDINGS.md` plus the round-1
agent notes in `agent2/day2/scratch/D1..D8` (tools there: D1/absim.mjs emulates our own streams; D4/att2.mjs attribution).
Good_Test V6 is friend-provided code; keep attribution comments.

## Known numbers
Fresh 2025-only check (8,000 battles each): DET2 0.768, rev1 0.759, V6nohunt 0.743, V6 0.738.
Confirmation field: DET2 2025 0.761, strong 0.702, 2024live 0.726, 1 leader 0.769, 2 leaders 0.762, 3 leaders 0.825.
DET2 trace on L2 (job 20261004162156551-COORD-trace-c360q, traceDir agent2/day2/q/scratch/_trace/day2TR-2153532dac-15f5c4dabe):
209 deaths; top killers T_zrl03 21, T_ah02 10 (the 32h-lattice Chimera line), then 2025 teams BitBenders 10, 3Plate_Benchers 9,
EmoMutants 8, LVS_FIT 7, Fishandpoultry 7. Self-caused: ourZombie 11, self-only 19, partner 7.
Round-1 near-misses on rev1 (not yet ported to DET2): MC2 (shared pointer cell 0300h; strong on zchain cohorts),
D3 S4 and D6 LATE (+0.01 hook-write reorders, conflict with DET2's B order).

## Rules
- Write ONLY in `agent2/day2/scratch/<YOUR_ID>/`. Never edit final/, strong-codes/, agent2/night/, agent2/day2/q internals, tools. No git.
- Never run bench/java yourself. Battles only through the queue:
  `node agent2/day2/q/submit.mjs --agent <ID> --kind screen --asmA <file> --asmB <file> --note "<change>"` (omit a side = DET2's),
  then `node agent2/day2/q/wait.mjs <jobId>` (PENDING -> call again). `--kind trace` = death attribution (omit both sides = DET2).
- Screen = candidate vs DET2 on field L2 (68 cohorts x 30 battles, paired): groups 2025 (30), strong (7), 2024live (6),
  leader1 (16), leader2 (6), leader3 (3). Noise: ALL half-width ~0.01; one battle = 0.033 in a cohort.
- Budget: at most 4 jobs per agent. Assemble locally first (<= 256 bytes each):
  `node agent2/tools/nasm-node.cjs agent2/day2/scratch/<ID>/build <files.asm>`; disassemble: `node agent2/tools/dis86.mjs <bin> [hexOff]`.
- Promising = ALL >= +0.008 AND group 2025 >= 0 AND no group below -0.03. Report honestly; a screen is not a confirmation.
